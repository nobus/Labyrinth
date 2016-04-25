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

  static getChangePosition(login, x, y, direction) {
    let ret = {};

    ret.login = login;
    ret.x = x;
    ret.y = y;

    if (direction) {
      ret.direction = direction;
    }

    return ret;
  }

  static sendInitialResponse(ws, login, locationMap, x, y) {
    let resp = {'changePosition': WebAPI.getChangePosition(login, x, y)};
    resp.allMap = locationMap;

    ws.send(JSON.stringify(resp));
  }

  sendChangePositionBroadcast(login, direction, x, y) {
    let resp = {'changePosition': WebAPI.getChangePosition(login, x, y, direction)};

    this.wss.broadcast(resp);
  }
}