'use strict';

$(document).ready(function() {
  var globalMap = [];

  var playerSprites = {};

  var stage = new PIXI.Container();

  var canvasWidth = $(window).width() * 0.6;
  var canvasHeight = $(window).height() * 0.95;

  var sideLength = Math.floor((canvasWidth < canvasHeight) ? canvasWidth: canvasHeight);
  var scale = sideLength / 640;

  var renderer = PIXI.autoDetectRenderer(sideLength, sideLength);

  var mapContainer = new PIXI.Container();

  mapContainer.x = 0;
  mapContainer.y = 0;

  stage.addChild(mapContainer);

  $('.canvas-block').append(renderer.view);

  $('.chat-block').draggable();
  $('.backpack-block').draggable();
  $('.canvas-block').draggable();

  animate();

  var myLogin = getURLParameter('login');
  var host = window.document.location.host.replace(/:.*/, '');

  var socket = new WebSocket('ws://' + host + ':8081/');

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(stage);
  }

  function getURLParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1));
    var sURLVariables = sPageURL.split('&');
    var sParameterName;

    for (var i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : sParameterName[1];
      }
    }
  }

  function drawMap(labMap) {
    for (var i = 0; i < labMap.length; i++) {
      globalMap.push([]);

      var mapRow = labMap[i];

      for (var ii = 0; ii < mapRow.length; ii++) {
      var mapSprite;
        var element = mapRow[ii];

        if (element === 1) {
          mapSprite = PIXI.Sprite.fromImage("img/wall.png");
        } else if (element === 0) {
          mapSprite = PIXI.Sprite.fromImage("img/ground.png");
        }

        if (mapSprite) {
          mapSprite.scale.set(scale);
          mapSprite.x = 32 * ii * scale;
          mapSprite.y = 32 * i * scale;

          mapContainer.addChild(mapSprite);

          globalMap[i].push(mapSprite);
        }
      }
    }
  }

  function changeMap(changeMap) {
    changeMap.forEach(function (item) {
      for (var i = 0; i < item.length; i++) {
        var mapSprite;

        if (item.id === 1) {
          mapSprite = PIXI.Sprite.fromImage("img/wall.png");
        } else if (item.id === 0) {
          mapSprite = PIXI.Sprite.fromImage("img/ground.png");
        }

        mapSprite.scale.set(scale);

        var y = item.startY;
        var x = item.startX;

        if (item.type === 'vertical') {
          y += i;
        } else {
          x += i;
        }

        var oldMapSprite = globalMap[y][x];

        mapSprite.x = oldMapSprite.x;
        mapSprite.y = oldMapSprite.y;

        mapContainer.removeChild(oldMapSprite);
        mapContainer.addChild(mapSprite);

        globalMap[y][x] = mapSprite;

      }
    });
  }

  function createPlayerSprite(login, y, x) {
    var playerSprite = PIXI.Sprite.fromImage('img/player.png');
    playerSprite.scale.set(scale);
    playerSprites[login] = playerSprite;

    if (login === myLogin) {
      playerSprite.y = 320 * scale;
      playerSprite.x = 320 * scale;

      stage.addChild(playerSprite);
      setMapAroundPlayer(y, x);
    } else {
      mapContainer.addChild(playerSprite);
      movePlayer(login, y, x);
    }
  }

  function setMapAroundPlayer(y, x) {
    mapContainer.y = y + 320 * scale;
    mapContainer.x = x + 320 * scale;
  }

  function moveMapAroundPlayer(direction) {
    if (direction === 'up') {
      mapContainer.y += 32 * scale;
    }

    if (direction === 'down') {
      mapContainer.y -= 32 * scale;
    }

    if (direction === 'left') {
      mapContainer.x += 32 * scale;
    }

    if (direction === 'right') {
      mapContainer.x -= 32 * scale;
    }
  }

  function movePlayer(login, y, x) {
    playerSprites[login].y = y * 32 * scale;
    playerSprites[login].x = x * 32 * scale;
  }

  function changePosition(login, direction, y, x) {
    if (login === myLogin) {
      moveMapAroundPlayer(direction);
    } else {
      movePlayer(login, y, x);
    }
  }

  socket.onopen = function () {
    socket.send(JSON.stringify({'login': myLogin}));
    console.log('Connection done.');

    $(document).keypress(function (event) {
      if (socket) {
        var direction;

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
    var rawMessage = event.data;
    console.log('Data received: ' + rawMessage.length);
    var message = JSON.parse(rawMessage);

    if (message.allMap) {
      drawMap(message.allMap);
    }

    if (message.changeMap) {
      changeMap(message.changeMap);
    }

    if (message.changePosition) {
      var login = message.changePosition.login;
      var y = message.changePosition.y;
      var x = message.changePosition.x;

      if (playerSprites[login] === undefined) {
        createPlayerSprite(login, y, x);
      } else {
        var direction = message.changePosition.direction;
        changePosition(login, direction, y, x);
      }
    }
  };

  socket.onerror = function (error) {
    console.log('Error ' + error.message);
  };

});