'use strict';

const util = require('util');
const rethinkDB = require('rethinkdb');
const log = require('./log');

const WebAPI = require('./WebAPI');


export class UserDB{
  constructor (conn, dbName, dumpPeriod, port, locationSize) {
    this.conn = conn;
    this.dbName = dbName;
    this.port = port;
    this.dumpPeriod = dumpPeriod;

    this.conn.use(this.dbName);

    // dictionary for variant of offset
    this.offsets = {
      'up': {'x': 0, 'y': -1},
      'down': {'x': 0, 'y': 1},
      'left': {'x': -1, 'y': 0},
      'right': {'x': 1, 'y': 0}
    };

    this.locationSize = locationSize;
    this.coordTransMutator = {
      'up': {'y': this.locationSize - 1},
      'down': {'y': 0},
      'left': {'x': this.locationSize - 1},
      'right': {'x': 0}
    };

    this.locationCache = {};
    this.userPositionCache = {};
    this.worldMapCache = {};

    // for broadcast response on location
    // {'location': position.location, 'client': client};
    this.clients = {};
  }

  run () {
    this.startLocalMode();
  }

  startLocalMode() {
    log.info(`Start local mode, period of dump is ${this.dumpPeriod} sec`);

    rethinkDB
      .table('userPosition', {readMode: 'outdated'})
      .run(this.conn, (err, cursor) => {
        if (err) throw  err;

        cursor.toArray( (err, res) => {
          if (err) throw  err;

          for (let i = 0; i < res.length; i++) {
            let e = res[i];
            this.userPositionCache[e.login] = e;
          }

          log.info(`User position cache is ready.`);

          // 1. We will be get worldMap table too.
          rethinkDB
            .table('worldMap', {readMode: 'outdated'})
            .run(this.conn, (err, cursor) => {
              if (err) throw err;

              cursor.toArray( (err, res) => {
                if (err) throw err;

                for (let i = 0; i < res.length; i++) {
                  let e = res[i];
                  this.worldMapCache[e.location_id] = e;
                }

                log.info(`World map cache is ready.`);

                this.startPeriodicalDumper();
                this.startWebSocketServer();
              });
            });
        });
      });
  }

  startPeriodicalDumper() {
    setInterval( () => {
      log.info(`Let's start the dump`);

      for (let login in this.userPositionCache) {
        let pos = {
          login: login,
          x: this.userPositionCache[login].x,
          y: this.userPositionCache[login].y,
          direction: this.userPositionCache[login].direction,
          location: this.userPositionCache[login].location
        };

        rethinkDB
          .table('userPosition', {readMode: 'outdated'})
          .get(this.userPositionCache[login].id)
          .update(pos)
          .run(this.conn, function (err) {
            if (err) throw  err;
          });
      }
    }, this.dumpPeriod * 1000);
  }

  startWebSocketServer () {
    this.webAPI = new WebAPI.WebAPI(this, this.port);
  }

  getNeighborLocation (location, direction) {
    return this.worldMapCache[location][direction];
  }

  /**
  *
  * @param curPosition {y, x} current user position
  * @param direction 'up', or 'down', or 'left', or 'right'
  * @returns {{y: *, x: *, direction: *}} new position and direction
  *          or undefined if block ahead
  * @constructor
  */
  getNewPosition(curPosition, direction) {
    const offset = this.offsets[direction];

    let newY = curPosition.y + offset.y;
    let newX = curPosition.x + offset.x;

    const curLocation = this.locationCache[curPosition.location];

    if (curLocation
      && newX >= 0
      && newX < this.locationSize
      && newY >= 0
      && newY < this.locationSize) {
        if (curLocation[newY]
          && curLocation[newX]
          && curLocation[newY][newX] >= 1) {
          return {
            'y': newY,
            'x': newX,
            'direction': direction};
        }
      } else {
        // We will be check neighbors of location in worldMap buffer.
        const neighbor = this.getNeighborLocation(curPosition.location, direction);

        if (neighbor) {
          const transMutator = this.coordTransMutator[direction];

          if (transMutator.x === undefined) {
            newX = curPosition.x;
          } else {
            newX = transMutator.x;
          }

          if (transMutator.y === undefined) {
            newY = curPosition.y;
          } else {
            newY = transMutator.y;
          }

          return {
            'location': neighbor,
            'y': newY,
            'x': newX,
            'direction': direction};
          }
        }
  }

  processUserActivity(message, client) {
    //console.log(util.inspect(client.send, true, 2, true));

    const login = message.login;
    const position = this.userPositionCache[login];

    if (message.direction) {
      let newPosition = this.getNewPosition(position, message.direction);

      if (newPosition) {
        this.userPositionCache[login]['x'] = newPosition.x;
        this.userPositionCache[login]['y'] = newPosition.y;
        this.userPositionCache[login]['direction'] = newPosition.direction;

        // If new Location - checkLocationCache()
        if (newPosition.location) {
          this.clients[login] = {'location': newPosition.location, 'client': client};

          this.userPositionCache[login]['location'] = newPosition.location;
          this.checkLocationCache(client, login, newPosition);
        } else {
          let clientList = [];

          for (let log in this.clients) {
            let loc = this.clients[log].location;

            if (loc === this.userPositionCache[login].location) {
              let clnt = this.clients[log].client;
              clientList.push(clnt);
              //console.log(util.inspect(clnt.send, true, 2, true));
            }
          }

          this.webAPI.sendChangePositionBroadcast(
            clientList,
            login,
            newPosition.direction,
            newPosition.x,
            newPosition.y);
        }
      }
    } else {
      this.clients[login] = {'location': position.location, 'client': client};

      this.checkLocationCache(client, login, position);
    }
  }

  checkLocationCache (client, login, position) {
    if (this.locationCache[position.location] === undefined) {
      this.loadLocation(client, login, position);
    } else {
      WebAPI.WebAPI.sendInitialResponse(
        client,
        login,
        this.locationCache[position.location],
        position.x,
        position.y);
    }

  }

  loadLocation (client, login, position) {
    rethinkDB
      .table(position.location, {readMode: 'outdated'})
      .run(this.conn, (err, cursor) => {
        if (err) throw err;

        this.locationCache[position.location] = [];
        cursor.toArray( (err, res) => {
          if (err) throw err;

          let i = 0;
          for (; i < res.length; i++) {
            let e = res[i];

            if (this.locationCache[position.location][e.y] === undefined) {
              this.locationCache[position.location][e.y] = [];
            }

            this.locationCache[position.location][e.y][e.x] = e.type;
          }

          log.info(`Location cache for ${position.location} is ready, ${i} elements.`);

          WebAPI.WebAPI.sendInitialResponse(
            client,
            login,
            this.locationCache[position.location],
            position.x,
            position.y);
        });
      });
  }
}