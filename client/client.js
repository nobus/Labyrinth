
$(document).ready(function() {
  var globalMap = [];

  var playerSprites = {};

  var stage = new PIXI.Container();
  var renderer = PIXI.autoDetectRenderer(640, 640);

  var mapContainer = new PIXI.Container();

  mapContainer.x = 0;
  mapContainer.y = 0;

  stage.addChild(mapContainer);

  $('.canvas-block').append(renderer.view);

  animate();

  var myLogin = getURLParameter('login');
  var socket = new WebSocket('ws://localhost:8081/');

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(stage);
  }

  function getURLParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1));
    var sURLVariables = sPageURL.split('&');
    var sParameterName;

    for (i = 0; i < sURLVariables.length; i++) {
      sParameterName = sURLVariables[i].split('=');

      if (sParameterName[0] === sParam) {
        return sParameterName[1] === undefined ? true : sParameterName[1];
      }
    }
  }

  function addMessageToConsole(message) {
    var htmlString = $('#console').html() + '<p>' + message + '</p>';
    $('#console').html(htmlString);
    var top = $('#console').get(0).scrollHeight;
    $('#console').scrollTop(top);
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
          mapSprite.x = 32 * ii;
          mapSprite.y = 32 * i;

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

  function changePosition(changePosition) {
    var login = changePosition.login;

    if (playerSprites[login] === undefined) {
      var playerSprite = PIXI.Sprite.fromImage('img/player.png');
      playerSprites[login] = playerSprite;

      if (login === myLogin) {
        playerSprite.y = 320;
        playerSprite.x = 320;

        stage.addChild(playerSprite);
      } else {
        mapContainer.addChild(playerSprite);
      }
    }

    if (login === myLogin) {
      mapContainer.x = changePosition.x * 32;
      mapContainer.y = changePosition.y * 32;
    } else {
      playerSprites[login].y = changePosition.y * 32;
      playerSprites[login].x = changePosition.x * 32;
    }

  }

  socket.onopen = function () {
    socket.send(JSON.stringify({'login': myLogin}));
    addMessageToConsole('Connection done.');

    $(document).keypress(function (event) {
      if (socket) {
        var direction;

        if (event.keyCode === 119) {          // w
          direction = 'up';
        } else if (event.keyCode === 115) {   // s
          direction = 'down';
        } else if (event.keyCode === 97) {    // a
          direction = 'left';
        } else if (event.keyCode === 100) {   // d
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
      addMessageToConsole('Connection closed.');
    } else {
      addMessageToConsole('Connection broken.'); // for example, server died
    }
    addMessageToConsole('Code: ' + event.code + ' reason: ' + event.reason);
  };

  socket.onmessage = function (event) {
    var rawMessage = event.data;
    addMessageToConsole('Data received: ' + rawMessage.length);
    var message = JSON.parse(rawMessage);

    if (message.allMap) {
      drawMap(message.allMap);
    }

    if (message.changeMap) {
      changeMap(message.changeMap);
    }

    if (message.changePosition) {
      changePosition(message.changePosition);
    }
  };

  socket.onerror = function (error) {
    addMessageToConsole('Error ' + error.message);
  };

});