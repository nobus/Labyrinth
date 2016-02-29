'use strict';

$(document).ready(function() {
  const stage = new PIXI.Container();

  const canvasWidth = $(window).width() * 0.6;
  const canvasHeight = $(window).height() * 0.95;

  const sideLength = Math.floor((canvasWidth < canvasHeight) ? canvasWidth: canvasHeight);
  const scale = sideLength / 640;

  const renderer = PIXI.autoDetectRenderer(sideLength, sideLength);

  const mapContainer = new PIXI.Container();

  mapContainer.x = 0;
  mapContainer.y = 0;

  stage.addChild(mapContainer);

  $('.canvas-block').append(renderer.view);

  $('.chat-block').draggable();
  $('.backpack-block').draggable();
  $('.canvas-block').draggable();

  animate();

  const myLogin = getURLParameter('login');
  const host = window.document.location.host.replace(/:.*/, '');

  const socket = new WebSocket('ws://' + host + ':8081/');

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(stage);
  }

  function getURLParameter(sParam) {
    const sPageURL = decodeURIComponent(window.location.search.substring(1));
    const sURLVariables = sPageURL.split('&');
    let sParameterName;

    for (let i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : sParameterName[1];
      }
    }
  }

  function changePosition(login, direction, y, x) {
    if (login === myLogin) {
      moveMapAroundPlayer(mapContainer, direction, scale);
    } else {
      movePlayer(login, y, x, scale);
    }
  }

  socket.onopen = function () {
    socket.send(JSON.stringify({'login': myLogin}));
    console.log('Connection done.');

    $(document).keypress(function (event) {
      if (socket) {
        let direction;

        if (event.charCode === 119) {          // w
          direction = 'up';
        } else if (event.charCode === 115) {   // s
          direction = 'down';
        } else if (event.charCode === 97) {    // a
          direction = 'left';
        } else if (event.charCode === 100) {   // d
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

    if (message.allMap) {
      drawMap(message.allMap, mapContainer, scale);
    }

    if (message.changeMap) {
      changeMap(message.changeMap, mapContainer, scale);
    }

    if (message.changePosition) {
      let login = message.changePosition.login;
      let y = message.changePosition.y;
      let x = message.changePosition.x;

      if (playerSprites[login] === undefined) {
        createPlayerSprite(login, myLogin, y, x, stage, mapContainer, scale);
      } else {
        let direction = message.changePosition.direction;
        changePosition(login, direction, y, x);
      }
    }
  };

  socket.onerror = function (error) {
    console.log('Error ' + error.message);
  };
});