'use strict';

var SIZE = 640;
var SPRITE_SIZE = 32;

$(document).ready(function() {
  PIXI.loader
  .add([
        'img/grass0_background.png',
        'img/ground0_background.png',
        'img/player.json',
        'img/terrain.json',
        'img/worldmap.json'
        ])
  .load(function () {
    const myLogin = getURLParameter('login');
    const game = new Game(myLogin);

    const port = getURLParameter('port');
    const host = window.document.location.host.replace(/:.*/, '');
    const socket = new WebSocket('ws://' + host + ':' + port + '/');

    socket.onopen = function () {
      socket.send(JSON.stringify({'login': myLogin}));

      console.log('Connection done.');

      socket.send(JSON.stringify({'login': myLogin, 'command': 'worldMap'}));

      $(document).keypress(function (event) {
        if (socket) {
          let direction;
          if (event.charCode === 119 || event.charCode === 1094) {          // w
            direction = 'up';
          } else if (event.charCode === 115 || event.charCode === 1099) {   // s
            direction = 'down';
          } else if (event.charCode === 97 || event.charCode === 1092) {    // a
            direction = 'left';
          } else if (event.charCode === 100 || event.charCode === 1074) {   // d
            direction = 'right';
          }

          if (direction) {
            socket.send(JSON.stringify({'login': myLogin, 'direction': direction}));
          }
        }

      });
    };

    socket.onclose = function (event) {
      if (event.wasClean) {
        console.log('Connection closed.');
      } else {
        console.log('Connection broken.'); // for example, server died
      }
      console.log('Code: ' + event.code + ' reason: ' + event.reason);
    };

    socket.onmessage = function (event) {
      const rawMessage = event.data;
      console.log('Data received: ' + rawMessage.length);
      const message = JSON.parse(rawMessage);

      if (message.allMap && message.spriteConf) game.initScene(message);
      if (message.changeMap) game.changeMap(message);
      if (message.changePosition) game.changePosition(message);
      if (message.removeFromLocation) this.removePlayerSprite(message);
      if (message.worldMap) game.initWorldMap(message);
    };

    socket.onerror = function (error) {
      console.log('Error ' + error.message);
    };
  });
});
