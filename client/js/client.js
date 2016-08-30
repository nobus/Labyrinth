'use strict';

$(document).ready(function() {
  PIXI.loader
  .add([
        'img/player.png',
        'img/grass0_background.png',
        'img/ground0_background.png',
        'img/terrain.json'
        ])
  .load(function () {
    const myLogin = getURLParameter('login');
    const port = getURLParameter('port');
    const host = window.document.location.host.replace(/:.*/, '');

    const socket = new WebSocket('ws://' + host + ':' + port + '/');

    // Initial game stage
    const ret = initNewStage();

    var stage = ret.stage;
    var renderer = ret.renderer;
    var mapContainer = ret.mapContainer;

    animate();

    function initNewStage () {
      const stage = new PIXI.Container();

      const renderer = PIXI.autoDetectRenderer(0, 0, {antialias: false, transparent: false, resolution: 1});

      renderer.view.style.position = "absolute";
      renderer.view.style.display = "block";
      renderer.autoResize = true;
      renderer.resize(window.innerWidth, window.innerHeight);

      const mapContainer = new PIXI.Container();

      mapContainer.x = 0;
      mapContainer.y = 0;

      stage.addChild(mapContainer);

      $(document.body).empty();
      $(document.body).append(renderer.view);

      return {stage: stage, renderer: renderer, mapContainer: mapContainer};
    }

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
        if (direction === undefined) {
          // it is first message after connect
          mapContainer.y -= y * 32;
          mapContainer.x -= x * 32;
        } else {
          moveMapAroundPlayer(mapContainer, direction);
        }
      } else {
        movePlayer(login, y, x);
      }
    }

    socket.onopen = function () {
      socket.send(JSON.stringify({'login': myLogin}));
      console.log('Connection done.');

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

      if (message.allMap && message.spriteConf) {
        document.title = `Test client, ${message.locationId}`;

        playerSprites = {};
        const ret = initNewStage();

        stage = ret.stage;
        renderer = ret.renderer;
        mapContainer = ret.mapContainer;

        drawMap(message.allMap, mapContainer, message.spriteConf);
      }

      if (message.changeMap) {
        changeMap(message.changeMap, mapContainer);
      }

      if (message.changePosition) {
        let login = message.changePosition.login;
        let y = message.changePosition.y;
        let x = message.changePosition.x;

        if (playerSprites[login] === undefined || message.allMap) {
          createPlayerSprite(login, myLogin, y, x, stage, mapContainer);
        }

        changePosition(login, message.changePosition.direction, y, x);
      }

      if (message.removeFromLocation) {
        removePlayerSprite(message.removeFromLocation, mapContainer);
      }
    };

    socket.onerror = function (error) {
      console.log('Error ' + error.message);
    };
  });
});
