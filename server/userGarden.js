'use strict';

const rethinkDB = require('rethinkdb');
const labyrinthDB = require('./labyrinthdb');

// https://github.com/websockets/ws/
const WebSocketServer = require('ws').Server;

/**
 *
 * @param message
 */
function log(message) {
  console.log(`${Date.now() / 1000}: ${message}`);
}

class UserDB extends labyrinthDB.LabyrinthDB {
  runDB () {
    this.locationMap = [];
    const _this = this;

    rethinkDB
      .table('startLocation', {readMode: 'outdated'})
      .run(this.conn, function(err, cursor) {
        if (err) throw err;

        cursor.toArray(function (err, res) {
          if (err) throw err;

          let i =0;
          for (; i < res.length; i++) {
            let e = res[i];

            if (_this.locationMap[e.y] === undefined) _this.locationMap[e.y] = [];
            _this.locationMap[e.y][e.x] = e.type;
          }

          log(`Map buffer is ready, ${i} elements.`);

          _this.startWebSocketServer();
          _this.readChanges();
        });
      });
  }

  readChanges () {
    const _this = this;

    rethinkDB
      .table('startLocation', {readMode: 'outdated'})
      .changes()
      .run(this.conn, function(err, cursor) {
        if (err) throw err;

        cursor.each(function(err, res) {
          if (err) throw err;

          if (res.old_val.type != res.new_val.type) {
            _this.locationMap[res.new_val.y][res.new_val.x] = res.new_val.type;
            log(`Inserted element ${JSON.stringify(res.new_val)}`);
          }
        });
      });
  }

  startWebSocketServer () {
    this.webAPI = new WebAPI(this);
  }
}

class WebAPI {
  constructor (cdb) {
    this.cdb = cdb;
    this.connPool = {};
    this.clientId = 0;

    // dictionary for variant of offset
    this.offsets = {
      'up': {'x': 0, 'y': -1},
      'down': {'x': 0, 'y': 1},
      'left': {'x': -1, 'y': 0},
      'right': {'x': 1, 'y': 0}
    };

    this.wss = new WebSocketServer({ port: 8081 });

    const _this = this;

    this.wss.broadcast = function broadcast(data) {
      if (_this.wss.clients.length) {
        data = JSON.stringify(data);
        log(`Send broadcast: ${data}`);
      }

      _this.wss.clients.forEach(function each(client) {
        client.send(data);
      });
    };

    this.wss.on('connection', function(ws) {
      // increment id counter
      const thisId = ++_this.clientId;
      // set up structure for this connection
      _this.connPool[thisId] = {};

      // we accept message from user!
      ws.on('message', function(rawMessage) {
        log(`Received: ${rawMessage}`);

        const message = JSON.parse(rawMessage);
        _this.connPool[thisId]['login'] = message.login;

        if (message.direction && 'position' in _this.connPool[thisId]) {
          // user would like changes his position and he has old position
          const new_position = _this.getNewPosition(_this.connPool[thisId]['position'], message.direction);

          if (new_position) {
            _this.connPool[thisId]['position'] = new_position;

            let resp = {'changePosition': new_position};
            resp.changePosition.login = message.login;

            _this.wss.broadcast(resp);
          }
        } else {
          /**
          * user would like changes his position and he has not old position
          * because is connecting at server just now
          */
          log(`New user!! ${message.login} ${thisId}`);

          const position = _this.searchStartPosition();
          _this.connPool[thisId]['position'] = position;

          let resp = {
            allMap: _this.cdb.locationMap,
            changePosition: {
              x: position.x,
              y: position.y,
              login: message.login
            }
          };

          resp = JSON.stringify(resp);

          log(`Send: ${resp}`);
          ws.send(resp);
        }
      });

      ws.on('close', this.close(thisId));

      ws.on('error', function(e) {
        log(`Client ${_this.connPool[thisId]['login']} error: ${e.message}`);
      });
    });

    log('Web API started');
  }

  close (userId) {
    log(`Client disconnected: ${this.connPool[userId]['login']}`);
    delete this.connPool[thisId];
  }

  /**
  * search start position for new user
  * @returns {{y: number, x: number}}
  */
  searchStartPosition () {
    for (let i = 0; i < this.cdb.locationMap.length; i++) {
      for (let ii = 0; ii < this.cdb.locationMap[i].length; ii++) {
        if (this.cdb.locationMap[i][ii] === 0) {
          return {'y': i, 'x': ii};
        }
      }
    }
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

    if (newX >= 0 && newX < this.cdb.locationMap.length && newY >= 0 && newY < this.cdb.locationMap.length) {
      if (this.cdb.locationMap[newY][newX] === 0) {
        return {
        'y': newY,
        'x': newX,
        'direction': direction};
      }
    }
  }
}

if (require.main === module) {
  rethinkDB.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;

    const cdb = new UserDB(conn, 'labyrinth', ['userPosition']);
    cdb.initDB();
  });
}