'use strict';

// https://github.com/websockets/ws/
const WebSocketServer = require('ws').Server;
const log = require('./log');

export class WebAPI {
  constructor (cdb, port) {
    this.cdb = cdb;
    this.clientId = 0;
    this.wss = new WebSocketServer({ port: port });

    this.wss.broadcast = (data, clientList) => {
      if (clientList === undefined) {
        clientList = this.wss.clients;
      }

      clientList.forEach(function each(client) {
        client.send(data);
      });
    };

    this.wss.on('connection', (client) => {
      // increment id counter
      const thisId = ++this.clientId;
      log.warn(`Client connected: ${thisId}`);

      // we accepted message from user!
      client.on('message', (rawMessage) => {
        this.cdb.processUserActivity(JSON.parse(rawMessage), client, thisId);
      });

      client.on('close', () => {
        log.warn(`Client disconnected: ${thisId}`);
        this.cdb.switchOffline(thisId);
      });

      client.on('error', (e) => {
        log.error(`Client ${thisId} error: ${e.message}`);
        this.cdb.switchOffline(thisId);
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

  static sendInitLocationResp (client, login, locationId, locationMap, x, y, direction, spriteConf, anotherUsers) {
    const resp = {'initLocationScene': {}};
    resp.initLocationScene.locationId = locationId;
    resp.initLocationScene.allMap = locationMap;
    resp.initLocationScene.spriteConf = spriteConf;

    resp.initLocationScene.login = login;
    resp.initLocationScene.y = y;
    resp.initLocationScene.x = x;
    resp.initLocationScene.direction = direction;

    resp.initLocationScene.anotherUsers = anotherUsers;

    client.send(JSON.stringify(resp));
  }

  /**
   * Send broadcast for remove user from clients
   *
   * @param {object[]} clientList some clients who get this broadcast
   * @param {string} login
   */
  sendRemoveUserBroadcast(clientList, login) {
    const resp = {'removeUserFromLocation': login};
    this.wss.broadcast(JSON.stringify(resp), clientList);
  }

  /**
   * Send broadcast for add user to clients
   *
   * @param {object[]} clientList some clients who get this broadcast
   * @param {string} login
   * @param {object} userPosition include x, y and direction
   */
  sendAddUserBroadcast(clientList, login, userPosition) {
    const resp = {'addUserToLocation': {}};
    resp.addUserToLocation.login = login;
    resp.addUserToLocation.position = userPosition;

    this.wss.broadcast(JSON.stringify(resp), clientList);
  }

  sendChangePositionBroadcast(clientList, login, direction, x, y) {
    const resp = {'changePosition': WebAPI.getChangePosition(login, x, y, direction)};

    this.wss.broadcast(JSON.stringify(resp), clientList);
  }

  sendWorldMap (client, worldMap, locationId) {
    const resp = {'worldMap': worldMap, 'locationId': locationId};
    client.send(JSON.stringify(resp));
  }
}
