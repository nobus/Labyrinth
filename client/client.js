
function getURLParameter (sParam) {
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

function addMessageToConsole (message) {
  var htmlString = $('#console').html() + '<p>' + message + '</p>';
  $('#console').html(htmlString);
  var top = $('#console').get(0).scrollHeight;
  $('#console').scrollTop(top);
}

function drawSquare (color, y, x) {
  var elemSize = 7;

  $('#labyrinth').drawRect({
    fillStyle: color,
    x: x * elemSize,
    y: y * elemSize,
    width: elemSize,
    height: elemSize,
    fromCenter: false
  });
}

function drawMap (labMap) {
  for (var i = 0; i < labMap.length; i++) {
    var mapRow = labMap[i];

    for (var ii = 0; ii < mapRow.length; ii++) {
      var element = mapRow[ii];

      if (element === 1) {
        var colorStyle = '#000';
      } else if (element === 0) {
        var colorStyle = '#fff';
      }

      drawSquare(colorStyle, i, ii);
    }
  }
}

function changeMap (changeMap) {
  changeMap.forEach(function (item) {
    if (item.id === 1) {
      var colorStyle = '#000';
    } else if (item.id === 0) {
      var colorStyle = '#fff';
    }

    for (var i = 0; i < item.length; i++) {
      if (item.type === 'vertical') {
        drawSquare(colorStyle, item.startY + i, item.startX);
      } else {
        drawSquare(colorStyle, item.startY, item.startX + i);
      }
    }
  });
}

function changePosition (changePosition) {
  var yourColor = '#00aa00';
  var neighborColor = '#0000aa';

  if (changePosition.login === myLogin) {
    drawSquare(yourColor, changePosition.y, changePosition.x);
  } else {
    drawSquare(neighborColor, changePosition.y, changePosition.x);
  }

  if ('oldY' in changePosition && 'oldX' in changePosition) {
    drawSquare('#fff', changePosition.oldY, changePosition.oldX);
  }
}

var myLogin = getURLParameter('login');
var socket = new WebSocket('ws://localhost:8080/');

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