'use strict';

// https://github.com/websockets/ws/
const WebSocketServer = require('ws').Server;
const log = require('./log');

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

    this.wss.on('connection', (client) => {
      // increment id counter
      const thisId = ++this.clientId;

      // we accepted message from user!
      client.on('message', (rawMessage) => {
        this.cdb.processUserActivity(JSON.parse(rawMessage), client);
      });

      client.on('close', () => {
        log.warn(`Client disconnected: ${thisId}`);
      });

      client.on('error', (e) => {
        log.error(`Client ${thisId} error: ${e.message}`);
      });
    });

    log.info('Web API started');
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

  static sendInitialResponse(client, login, locationMap, x, y) {
    let resp = {'changePosition': WebAPI.getChangePosition(login, x, y)};
    resp.allMap = locationMap;

    client.send(JSON.stringify(resp));
  }

  sendChangePositionBroadcast(login, direction, x, y) {
    let resp = {'changePosition': WebAPI.getChangePosition(login, x, y, direction)};

    this.wss.broadcast(resp);
  }
}
