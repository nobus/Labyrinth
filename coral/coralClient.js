'use strict';

const WebSocket = require('ws');
const program = require('commander');

const common = require('../server/common');
const log = require('../server/log');

// node coral/coralClient.js --host localhost --port 8081 --name coral --number 10

program
  .version('0.0.1')
  .option('-h, --host [fqdn||ip]', 'userGarden host')
  .option('-p, --port <n>', 'userGarden port', parseInt)
  .option('-nm, --name [name]', 'name of Corals')
  .option('-n, --number <n>', 'number of Corals', parseInt)
  .parse(process.argv);


if (require.main === module) {
  console.log(program.host);
  console.log(program.port);
  console.log(program.name);
  console.log(program.number);

  var coralsPool = [];

  for (let i = 0; i < program.number; i++) {

    let socket = new WebSocket(`ws://${program.host}:${program.port}/`);
    let coralLogin = `${program.name}${i}`;

    coralsPool.push(socket);

    socket.onopen = function () {
      const login = coralLogin;
      socket.send(JSON.stringify({'login': login}));
      console.log('Connection done.');

      setInterval(() => {
        const directions = ['up', 'down', 'left', 'right'];
        const d = directions[common.getRandomInt(0, 3)];
        socket.send(JSON.stringify({'login': login, 'direction': d}));

      }, 500 + common.getRandomInt(0, 400));
    };

    socket.onmessage = function (event) {
      const rawMessage = event.data;
      log.info(`Data received ${coralLogin}: ${rawMessage.length}`);
    };

    socket.onclose = function (event) {
      if (event.wasClean) {
        log.warn('Connection closed.');
      } else {
        log.error('Connection broken.'); // for example, server died
      }
      log.warn(`Code: ${event.code} reason: ${event.reason}`);
    };

    socket.onerror = function (error) {
      log.error(`Error ${error.message}`);
    };

  }

}
