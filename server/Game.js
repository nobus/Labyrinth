'use strict';

const util = require('util');
const rethinkDB = require('rethinkdb');
const log = require('./log');
const common = require('./common');
const idMapper = require('./idMapper');

const WebAPI = require('./WebAPI');
const customLocations = require('./worldGenerator/customLocations');


export class Game{
  constructor (conn, dbName, dumpPeriod, port, locationSize, cartographerPeriod) {
    this.conn = conn;
    this.dbName = dbName;
    this.port = port;
    this.dumpPeriod = dumpPeriod;
    this.cartographerPeriod = cartographerPeriod * 1000;
    this.idMapper = new idMapper.IdMapper();

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

    /**
     * Description of keys of this.userPositionCache:
     * {string} id inner ID of rethinkDB
     * {string} login
     * {boolean} online this flag is true if online, else false
     * {string } location ID of current location
     * {number} x vertical coord
     * {number} y horizontal coord
     * {string} direction may be left, right, up, down
     */
    this.userPositionCache = {};

    this.worldMapCache = {};

    // for broadcast response on location
    // {'location': position.location, 'client': client};
    this.clients = {};
    this.clientId = {};
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
                  this.worldMapCache[e.location] = e;
                }

                log.info(`World map cache is ready.`);

                this.startPeriodicalDumper();
                this.startCartographer();
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

  getLocationType (locationId) {
    return this.worldMapCache[locationId].locationType;
  }

  getLocationForChange () {
    const allLocations = Object.keys(this.locationCache);
    const onlineLocations = [];

    for (let login in this.userPositionCache) {
      if (this.userPositionCache[login].online === true) {
        const location = this.userPositionCache[login].location;

        if (onlineLocations.indexOf(location) === -1) {
          onlineLocations.push(location);
        }
      }
    }

    const res = allLocations.filter((e) => {if (onlineLocations.indexOf(e) === -1) return e});

    if (res) {
      return res[common.getRandomInt(0, res.length - 1)];
    }
  }

  startCartographer () {
    setInterval( () => {
      const locationId = this.getLocationForChange();

      if (locationId) {
        log.info(`Change the Location ${locationId}!`);

        this.locationCache[locationId].mutate();
      }
    }, this.cartographerPeriod);
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

    const curLocation = this.locationCache[curPosition.location].getLocationMap();

    if (curLocation.locationMap
      && newX >= 0
      && newX < this.locationSize
      && newY >= 0
      && newY < this.locationSize) {
        if (curLocation.locationMap[newY]) {
          const locationElem = curLocation.locationMap[newY][newX];

          if (this.idMapper.isNoBlock(locationElem)) {
            return {
              'y': newY,
              'x': newX,
              'direction': direction
            };
          } else  if (this.idMapper.isEntrance(locationElem) || this.idMapper.isExit(locationElem)) {
            if (this.idMapper.isEntrance(locationElem)) {
              // entrance to the dungeon's level
              direction = 'under';
            } else if (this.idMapper.isExit(locationElem)) {
              // exit from dungeon's level
              direction = 'over';
            }

            const neighbor = this.getNeighborLocation(curPosition.location, direction);
            if (neighbor) {
              return {
                'location': neighbor,
                'y': curPosition.y,
                'x': curPosition.x,
                'direction': direction
              };
            }
          }
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

  /**
   * Get list of WS clients which are in the location
   *
   * @location {string} location ID
   */
  getClientsForLocation (location) {
    let clientList = [];

    for (let log in this.clients) {
      let loc = this.clients[log].location;

      if (loc === location) {
        let clnt = this.clients[log].client;
        clientList.push(clnt);
      }
    }

    return clientList;
  }

  getLoginsForLocation (location) {
    const clientList = [];

    for (let login in this.clients) {
      if (this.clients[login].location === location) {
        clientList.push(login);
      }
    }

    return clientList;
  }

  getUserPosition (login) {
    const userPosition = this.userPositionCache[login];

    return {
      location: userPosition.location,
      x: userPosition.x,
      y: userPosition.y,
      direction: userPosition.direction
    };
  }

  processUserActivity(message, client, clientId) {
    const login = message.login;
    const position = this.userPositionCache[login];

    if (message.direction) {
      let newPosition = this.getNewPosition(position, message.direction);

      if (newPosition) {
        // change position
        this.userPositionCache[login]['x'] = newPosition.x;
        this.userPositionCache[login]['y'] = newPosition.y;
        this.userPositionCache[login]['direction'] = newPosition.direction;

        if (newPosition.location) {
          // If new Location - checkLocationCache()
          this.clients[login] = {
            'location': newPosition.location,
            'client': client
          };

          const oldLocation = this.userPositionCache[login]['location'];
          this.userPositionCache[login]['location'] = newPosition.location;
          this.checkLocationCache(client, login, oldLocation, newPosition);
        } else {
          // same location
          let clientList = this.getClientsForLocation(this.userPositionCache[login].location);

          this.webAPI.sendChangePositionBroadcast(
            clientList,
            login,
            newPosition.direction,
            newPosition.x,
            newPosition.y);
        }
      }
    } else if (message.command) {
      if (message.command === 'worldMap') {
        this.webAPI.sendWorldMap(client, this.worldMapCache, this.userPositionCache[login]['location']);
      }
    } else {
      // we have a new user connection
      this.clients[login] = {
        'location': position.location,
        'client': client
      };

      this.switchOnline(login, clientId);

      this.checkLocationCache(client, login, undefined, position);
    }
  }

  checkLocationCache (client, login, oldLocation, position) {
    if (this.locationCache[position.location] === undefined) {
      this.loadLocation(client, login, oldLocation, position);
    } else {
      this.sendInitLocationResponse(client, login, oldLocation, position);
    }

  }

  loadLocation (client, login, oldLocation, position) {
		const locationType = this.getLocationType(position.location);
    const location = new customLocations[locationType](
            this.conn,
            this.locationSize,
            position.location,
            undefined,
            this.idMapper);

    this.locationCache[position.location] = location;

		let loadPromise = new Promise ((resolve, reject) => {
		  this.locationCache[position.location].loadLocation(resolve, reject);
		});

		loadPromise
		  .then (
		      result => {
		        log.info(result);
            this.sendInitLocationResponse(client, login, oldLocation, position);
          })
      .catch (
          result => {
            log.error(result);
          }
      );
  }

  /**
   * Send the first initializing response
   * and other broadcast if it need
   *
   * @param {object} client this is client obect of current user session
   * @param {string} login this is login of current user
   * @param {string} oldLocation this is ID of old location or undefined
   * @param {object} position this is the object which contains information
            of coordinates and direction
   */
  sendInitLocationResponse (client, login, oldLocation, position) {
    if (oldLocation) {
      this.webAPI.sendRemoveUserBroadcast(
        this.getClientsForLocation(oldLocation),
        login);
    }

    const clientList = this.getLoginsForLocation(position.location);
    const anotherUsers = clientList.map(e => {
      // where e is login
      return {'login': e, 'position': this.getUserPosition(e)};
    });

    WebAPI.WebAPI.sendInitLocationResp(
      client,
      login,
      position.location,
      this.locationCache[position.location].getLocationMap(),
      position.x,
      position.y,
      position.direction,
      this.idMapper.getConf(),
      anotherUsers);

    const userPosition = {};
    userPosition.x = this.userPositionCache[login].x;
    userPosition.y = this.userPositionCache[login].y;
    userPosition.direction = this.userPositionCache[login].direction;

    this.webAPI.sendAddUserBroadcast(this.getClientsForLocation(position.location),
                                     login, userPosition);
  }

  /**
   * Switch to online the player's state.
   *
   * @param {string} login
   * @param {number} clientId number of client from WebAPI
   */
  switchOnline (login, clientId) {
    rethinkDB
      .table('userPosition', {readMode: 'outdated'})
      .get(this.userPositionCache[login].id)
      .update({'online': true})
      .run(this.conn, (err) => {
        if (err) throw  err;

        this.clientId[clientId] = login;
      });
  }

  /**
   * Switch to offline the player's state.
   * Send broadcast other clients about this.
   *
   * @param {number} clientId number of client from WebAPI
   */
  switchOffline (clientId) {
    const login = this.clientId[clientId];
    delete this.clients[login];

    // remove player from other clients
    const location = this.userPositionCache[login].location;
    this.webAPI.sendRemoveUserBroadcast(this.getClientsForLocation(location), login);

    rethinkDB
      .table('userPosition', {readMode: 'outdated'})
      .get(this.userPositionCache[login].id)
      .update({'online': false})
      .run(this.conn, (err) => {
        if (err) throw  err;

        delete this.clientId[clientId];
      });
  }
}
