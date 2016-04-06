'use strict';

const rethinkDB = require('rethinkdb');
const protoDB = require('./protodb');

// https://github.com/websockets/ws/
const WebSocketServer = require('ws').Server;
const program = require('commander');

const common = require('./common');


program
  .version('0.0.1')
  .option('-p, --port <n>', 'Port for WebSocket', parseInt)
  .parse(process.argv);


class UserDB extends protoDB.ProtoDB {
  runDB () {

    // dictionary for variant of offset
    this.offsets = {
      'up': {'x': 0, 'y': -1},
      'down': {'x': 0, 'y': 1},
      'left': {'x': -1, 'y': 0},
      'right': {'x': 1, 'y': 0}
    };

    this.locationMap = [];

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

          this.startWebSocketServer();
          this.readChanges('startLocation', this.processChangesFromStartLocation.bind(this));
          this.readChanges('userPosition', this.processChangesFromUserPosition.bind(this));
        });
      });
  }

  processChangesFromStartLocation (err, cursor) {
    if (err) throw err;

    cursor.each( (err, res) => {
      if (err) throw err;

      let newType = res.new_val.type;
      let y = res.new_val.y;
      let x = res.new_val.x;

      if (res.old_val.type != newType) {
        if (this.webAPI) {
          const changeMap = {
            'changeMap': [
              {
                'startY': y,
                'startX': x,
                'length': 1,                //hack
                'type': 'vertical',         //hack
                'id': newType
              }
            ]
          };

          this.webAPI.wss.broadcast(changeMap);
        }

        this.locationMap[y][x] = newType;
        common.log(`Inserted element ${JSON.stringify(res.new_val)}`);
      }
    });
  }

  processChangesFromUserPosition (err, cursor) {
    if (err) throw err;

    cursor.each( (err, res) => {
      if (err) throw err;

      let resp = {'changePosition': {}};

      resp.changePosition.y = res.new_val.y;
      resp.changePosition.x = res.new_val.x;
      resp.changePosition.login = res.new_val.login;
      resp.changePosition.direction = res.new_val.direction;

      this.webAPI.wss.broadcast(resp);

      common.log(`Change user position ${JSON.stringify(res.new_val)}`);
    });
  }

  startWebSocketServer () {
    this.webAPI = new WebAPI(this);
  }

  /**
  * search start position for new user
  * @returns {{y: number, x: number}}
  */
  searchStartPosition () {
    for (let i = 0; i < this.locationMap.length; i++) {
      for (let ii = 0; ii < this.locationMap[i].length; ii++) {
        if (this.locationMap[i][ii] === 0) {
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

    if (newX >= 0 && newX < this.locationMap.length && newY >= 0 && newY < this.locationMap.length) {
      if (this.locationMap[newY][newX] === 0) {
        return {
        'y': newY,
        'x': newX,
        'direction': direction};
      }
    }
  }


  processUserActivity (message, ws) {
    rethinkDB
      .table('userPosition')
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
                  .table('userPosition')
                  .get(row.id)
                  .update({login: message.login, x: position.x, y: position.y, direction: message.direction})
                  .run(this.conn, function (err, res) {
                    if (err) throw  err;
                  });
              }
            } else {
              let resp = {
                allMap: this.locationMap,
                changePosition: {
                  x: position.x,
                  y: position.y,
                  login: message.login
                }
              };

              resp = JSON.stringify(resp);
              common.log(`Send: ${resp}`);
              ws.send(resp);
            }
        });
      });
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

    this.wss = new WebSocketServer({ port: program.port });

    this.wss.broadcast = (data) => {
      if (this.wss.clients.length) {
        data = JSON.stringify(data);
        common.log(`Send broadcast: ${data}`);
      }

      this.wss.clients.forEach(function each(client) {
        client.send(data);
      });
    };

    this.wss.on('connection', (ws) => {
      // increment id counter
      const thisId = ++this.clientId;
      // set up structure for this connection
      this.connPool[thisId] = {};

      // we accepted message from user!
      ws.on('message', (rawMessage) => {
        common.log(`Received: ${rawMessage}`);
        this.cdb.processUserActivity(JSON.parse(rawMessage), ws);
      });

      ws.on('close', () => {
        common.log(`Client disconnected: ${this.connPool[thisId]['login']}`);
        delete this.connPool[thisId];
      });

      ws.on('error', (e) => {
        common.log(`Client ${this.connPool[thisId]['login']} error: ${e.message}`);
      });
    });

    common.log('Web API started');
  }
}

if (require.main === module) {
  rethinkDB.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;

    const cdb = new UserDB(conn, 'labyrinth', ['userPosition']);
    cdb.initDB();
  });
}