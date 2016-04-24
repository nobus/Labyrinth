'use strict';

const rethinkDB = require('rethinkdb');
const protoDB = require('./protodb');
const common = require('./common');

const WebAPI = require('./WebAPI');


export class UserDB extends protoDB.ProtoDB {
  constructor (conn, dbName, tableList, dumpPeriod, port) {
    super(conn, dbName, tableList);

    // dictionary for variant of offset
    this.offsets = {
      'up': {'x': 0, 'y': -1},
      'down': {'x': 0, 'y': 1},
      'left': {'x': -1, 'y': 0},
      'right': {'x': 1, 'y': 0}
    };

    this.port = port;

    this.locationMap = [];

    this.dumpPeriod = dumpPeriod;
    this.userPositionCache = {};
  }

  runDB () {
    rethinkDB
      .table('startLocation', {readMode: 'outdated'})
      .run(this.conn, (err, cursor) => {
        if (err) throw err;

        cursor.toArray( (err, res) => {
          if (err) throw err;

          let i = 0;
          for (; i < res.length; i++) {
            let e = res[i];

            if (this.locationMap[e.y] === undefined) this.locationMap[e.y] = [];
            this.locationMap[e.y][e.x] = e.type;
          }

          common.log(`Map buffer is ready, ${i} elements.`);

          if (this.dumpPeriod) {
            this.startLocalMode();
          } else {
            this.startWebSocketServer();
            this.readChanges('userPosition', this.processChangesFromUserPosition.bind(this));
          }
        });
      });
  }

  startLocalMode() {
    common.log(`Start local mode, period of dump is ${this.dumpPeriod} sec`);

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

          common.log(`User position buffer is ready.`);

          this.startPeriodicalDumper();
          this.startWebSocketServer();
        });
      });
  }

  startPeriodicalDumper() {
    setInterval( () => {
      common.log(`Let's start the dump`);

      for (let login in this.userPositionCache) {
        let id = this.userPositionCache[login].id;
        let x = this.userPositionCache[login].x;
        let y = this.userPositionCache[login].y;
        let direction = this.userPositionCache[login].direction;

        rethinkDB
          .table('userPosition', {readMode: 'outdated'})
          .get(id)
          .update({login: login, x: x, y: y, direction: direction})
          .run(this.conn, function (err, res) {
            if (err) throw  err;
          });
      }
    }, this.dumpPeriod * 1000);
  }

  processChangesFromUserPosition (err, cursor) {
    if (err) throw err;

    cursor.each( (err, res) => {
      if (err) throw err;

      this.webAPI.sendChangePositionBroadcast(
        res.new_val.login,
        res.new_val.direction,
        res.new_val.x,
        res.new_val.y);
    });
  }

  startWebSocketServer () {
    this.webAPI = new WebAPI.WebAPI(this, this.port);
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

    const newY = curPosition.y + offset.y;
    const newX = curPosition.x + offset.x;

    if (newX >= 0 && newX < this.locationMap.length && newY >= 0 && newY < this.locationMap.length) {
      if (this.locationMap[newY][newX] === 0) {
        return {
        'y': newY,
        'x': newX,
        'direction': direction};
      }
    }
  }

  processUserActivity(message, ws) {
    if (this.dumpPeriod) {
      this.processUserActivityWithCache(message, ws);
    } else {
      this.processUserActivityWithoutCache(message, ws);
    }
  }

  processUserActivityWithCache(message, ws) {
    const login = message.login;
    const userElem = this.userPositionCache[login];

    let position = {x: userElem.x, y: userElem.y};

    if (message.direction) {
      position = this.getNewPosition(position, message.direction);

      if (position) {
        this.userPositionCache[login]['x'] = position.x;
        this.userPositionCache[login]['y'] = position.y;
        this.userPositionCache[login]['direction'] = position.direction;

        this.webAPI.sendChangePositionBroadcast(
          login,
          position.direction,
          position.x,
          position.y);
      }
    } else {
      WebAPI.WebAPI.sendInitialResponse(
        ws,
        message.login,
        this.locationMap,
        position.x,
        position.y);
    }
  }

  processUserActivityWithoutCache (message, ws) {
    rethinkDB
      .table('userPosition', {readMode: 'outdated'})
      .filter({login: message.login})
      .run(this.conn,  (err, cursor) => {
        if (err) throw err;

        cursor.next( (err, row) => {
            if (err) throw err;

            let position = {x: row.x, y: row.y};

            if (message.direction) {
              position = this.getNewPosition(position, message.direction);

              if (position) {
                rethinkDB
                  .table('userPosition', {readMode: 'outdated'})
                  .get(row.id)
                  .update({login: message.login, x: position.x, y: position.y, direction: message.direction})
                  .run(this.conn, function (err, res) {
                    if (err) throw  err;
                  });
              }
            } else {
              WebAPI.WebAPI.sendInitialResponse(
                ws,
                message.login,
                this.locationMap,
                position.x,
                position.y);
            }
        });
      });
  }
}