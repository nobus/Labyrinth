'use strict';

$(document).ready(function() {
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

  function addMessageToChat(message) {
    // for the future
    var htmlString = $('.chat-block').html() + '<p>' + message + '</p>';
    $('.chat-block').html(htmlString);
    var top = $('.chat-block').get(0).scrollHeight;
    $('.chat-block').scrollTop(top);
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
      drawMap(message.allMap, mapContainer, scale);
    }

    if (message.changeMap) {
      changeMap(message.changeMap, mapContainer, scale);
    }

    if (message.changePosition) {
      var login = message.changePosition.login;
      var y = message.changePosition.y;
      var x = message.changePosition.x;

      if (playerSprites[login] === undefined) {
        createPlayerSprite(login, myLogin, y, x, stage, mapContainer, scale);
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