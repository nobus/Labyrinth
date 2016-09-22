'use strict';

var SIZE = 640;
var SPRITE_SIZE = 32;

$(document).ready(function() {
  PIXI.loader
  .add([
        'img/grass0_background.png',
        'img/ground0_background.png',
        'img/swamp0_background.png',
        'img/player.json',
        'img/terrain.json',
        'img/worldmap.json'
        ])
  .load(function () {
    var chatDisabled = true;

    const myLogin = getURLParameter('login');
    const game = new Game(myLogin);
    const messageContainer = new MessageContainer(7000, myLogin);

    const port = getURLParameter('port');
    const host = window.document.location.host.replace(/:.*/, '');
    const socket = new WebSocket('ws://' + host + ':' + port + '/');

    socket.onopen = function () {
      const messageHelper = function () {
        const message = $('.chat-input').val();
        $('.chat-input').val("");

        messageContainer.printMyMessage(message);
      }

      socket.send(JSON.stringify({'login': myLogin}));

      console.log('Connection done.');

      socket.send(JSON.stringify({'login': myLogin, 'command': 'worldMap'}));

      $('.chat-input').focusin(function () {
        chatDisabled = false;
      });

      $('.chat-input').focusout(function () {
        chatDisabled = true;
      });

      $('.chat-button').click(messageHelper);

      $(document).keydown(function (event) {
        if (socket) {
          if (event.keyCode === 13 && !chatDisabled) {
            // enter
            messageHelper();
          } else if (chatDisabled) {
            let direction;
            if (event.keyCode === 38 || event.keyCode === 87) {
              // w
              direction = 'up';
            } else if (event.keyCode === 40 || event.keyCode === 83) {
              // s
              direction = 'down';
            } else if (event.keyCode === 37 || event.keyCode === 65) {
              // a
              direction = 'left';
            } else if (event.keyCode === 39 || event.keyCode === 68) {
              // d
              direction = 'right';
            }

            if (direction) {
              socket.send(JSON.stringify({'login': myLogin, 'direction': direction}));
            }
          }
        }

      });
    };

    socket.onmessage = function (event) {
      const rawMessage = event.data;
      console.log('Data received: ' + rawMessage.length);
      const message = JSON.parse(rawMessage);

      // processing events in the game protocol
      if (message.initLocationScene) game.initLocationScene(message);
      if (message.changeMap) game.changeMap(message);
      if (message.changePosition) game.changePosition(message);
      if (message.changeDirection) game.changeDirection(message);
      if (message.addUserToLocation) game.addUserToLocation(message);
      if (message.removeUserFromLocation) game.removeUserFromLocation(message);
      if (message.worldMap) game.initWorldMap(message);
    };

    socket.onerror = function (error) {
      console.log('Error ' + error.message);
    };

    socket.onclose = function (event) {
      if (event.wasClean) {
        console.log('Connection closed.');
      } else {
        console.log('Connection broken.'); // for example, server died
      }
      console.log('Code: ' + event.code + ' reason: ' + event.reason);
    };
  });
});
