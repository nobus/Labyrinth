'use strict';

const rethinkDB = require('rethinkdb');
const protoDB = require('./protodb');

// https://github.com/websockets/ws/
const WebSocketServer = require('ws').Server;
const program = require('commander');

const common = require('./common');
const metrics = require('./metrics');


program
  .version('0.0.1')
  .option('-p, --port <n>', 'Port for WebSocket', parseInt)
  .option('-l, --local', 'Location in the one worker')
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
          this.readChanges('userPosition', this.processChangesFromUserPosition.bind(this));
        });
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
    });
  }

  startWebSocketServer () {
    this.webAPI = new WebAPI(this);
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
              let resp = {
                allMap: this.locationMap,
                changePosition: {
                  x: position.x,
                  y: position.y,
                  login: message.login
                }
              };

              ws.send(JSON.stringify(resp));
            }
        });
      });
  }
}

class WebAPI {
  constructor (cdb) {
    this.cdb = cdb;
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
      }

      this.wss.clients.forEach(function each(client) {
        client.send(data);
      });
    };

    this.wss.on('connection', (ws) => {
      // increment id counter
      const thisId = ++this.clientId;

      // we accepted message from user!
      ws.on('message', (rawMessage) => {
        this.cdb.processUserActivity(JSON.parse(rawMessage), ws);
      });

      ws.on('close', () => {
        common.log(`Client disconnected: ${thisId}`);
      });

      ws.on('error', (e) => {
        common.log(`Client ${thisId} error: ${e.message}`);
      });
    });

    common.log('Web API started');
  }
}

if (require.main === module) {
  const m = new metrics.Metrics(5000);
  m.runMeasures();

  rethinkDB.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;

    const cdb = new UserDB(conn, 'labyrinth', ['userPosition']);
    cdb.initDB();
  });
}