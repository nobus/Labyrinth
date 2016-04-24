'use strict';

// https://github.com/websockets/ws/
const WebSocketServer = require('ws').Server;

const common = require('./common');


export class WebAPI {
  constructor (cdb, port) {
    this.cdb = cdb;
    this.clientId = 0;
    this.wss = new WebSocketServer({ port: port });

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

  sendInitialResponse(ws, login, locationMap, x, y) {
    let resp = {
      allMap: locationMap,
      changePosition: {
        x: x,
        y: y,
        login: login
      }
    };

    ws.send(JSON.stringify(resp));
  }

  sendChangePositionBroadcast(login, direction, x, y) {
    let resp = {'changePosition': {}};

    resp.changePosition.y = y;
    resp.changePosition.x = x;
    resp.changePosition.login = login;
    resp.changePosition.direction = direction;

    this.wss.broadcast(resp);
  }
}
