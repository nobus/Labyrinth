
// https://github.com/websockets/ws/
var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({ port: 8080 });

/**
 *
 * @param message
 */
function log(message) {
  console.log('%s: %s', Date.now() / 1000, message);
}

/**
 *
 * @param min the lower limit of the range
 * @param max the upper limit of the range
 * @returns {number} random number between min and max
 */
function GetRandom(min, max) {
  return Math.random() * (max - min + 1) + min;
}

function GetRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}


function GetLineParams (height, width, max) {
  var ret = {};

  ret.startY = GetRandomInt(0, height - max);
  ret.startX = GetRandomInt(0, width);
  ret.length = GetRandomInt(3, max);

  return ret;
}

function CreateHorizontalLine (labMap, height, width, max) {
  var params = GetLineParams(height, width, max);

  for (var i = 0; i < params.length; i++) {
    labMap[params.startY][params.startX + i] = 1;
  }
}

function CreateVerticalLine (labMap, height, width, max) {
  var params = GetLineParams(height, width, max);

  for (var i = 0; i < params.length; i++) {
    labMap[params.startY + i][params.startX] = 1;
  }
}


/**
 *
 * @param height Y
 * @param width X
 * @returns {Array} new map of the Labyrinth
 */
function InitMap (height, width) {
  var labMap = [];

  for (var i = 0; i < height; i++) {
    labMap.push(Array.apply(null, Array(width)).map(function (_, i) {
      return 0;
    }));
  }

  for (i = 0; i < 100; i++) {
    if (i % 2 === 0) {
      CreateHorizontalLine(labMap, height, width, 20);
    }
    if (i % 2 === 1) {
      CreateVerticalLine(labMap, height, width, 20);
    }
  }

  return labMap;
}

// create new map
var labMap = InitMap(100, 100);

/**
 * search start position for new user
 * @returns {{y: number, x: number}}
 */
function SearchStartPosition () {
  for (var i = 0; i < labMap.length; i++) {
    for (var ii = 0; ii < labMap[i].length; ii++) {
      if (labMap[i][ii] === 0) {
        return {'y': i, 'x': ii};
      }
    }
  }
}

// dictionary for variant of offset
var offsets = {
  'up': {'x': 0, 'y': -1},
  'down': {'x': 0, 'y': 1},
  'left': {'x': -1, 'y': 0},
  'right': {'x': 1, 'y': 0}
};

/**
 *
 * @param curPosition {y, x} current user position
 * @param direction 'up', or 'down', or 'left', or 'right'
 * @returns {{y: *, x: *, oldY: *, oldX: *}} new and old position
 *          or undefined if block ahead
 * @constructor
 */
function GetNewPosition(curPosition, direction) {
  var offset = offsets[direction];

  var newY = curPosition.y + offset.y;
  var newX = curPosition.x + offset.x;

  if (newX >= 0 && newX < labMap.length && newY >= 0 && newY < labMap.length) {
    if (labMap[newY][newX] === 0) {
      return {'y': newY, 'x': newX, 'oldY': curPosition.y, 'oldX': curPosition.x};
    }
  }
}

var connPool = {};  // dictionary for user data
const tmin = 1000;    // minimum delay for change the map
const tmax = 9000;    // maximum delay for change the map

setTimeout(function runThis() {
  log('Change the Map!');

  /*
  var y = GetRandomInt(0, 99);
  var x = GetRandomInt(0, 99);
  var elementId;

  if (labMap[y][x] === 1) {
    elementId = 0;
    labMap[y][x] = elementId;
  } else if (labMap[y][x] === 0) {
    elementId = 1;
    labMap[y][x] = elementId;
  }
  // else that user === 3
  */

  var params = GetLineParams(100, 100, 20);
  var elementId = GetRandomInt(0, 1);

  if (GetRandomInt(0, 1) === 0) {
    // horizontal line!
    params.type = 'horizontal';

    for (var i = 0; i < params.length; i++) {
      labMap[params.startY][params.startX + i] = elementId;
    }
  } else {
    // vertical line!
    params.type = 'vertical';

    for (var i = 0; i < params.length; i++) {
      labMap[params.startY + i][params.startX] = elementId;
    }
  }

  // send to users command to change their maps
  var changeMap = {'changeMap': [{'startY': params.startY, 'startX': params.startX, 'length': params.length, 'type': params.type, 'id': elementId}]};
  wss.broadcast(changeMap);

  setTimeout(runThis, GetRandom(tmin, tmax));
}, GetRandom(tmin, tmax));

wss.broadcast = function broadcast(data) {
  if (wss.clients.length) {
    data = JSON.stringify(data);
    log('Send broadcast: ' + data);
  }

  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};

var clientId = 0;

wss.on('connection', function(ws) {
  var thisId = ++clientId;  // increment id counter
  connPool[thisId] = {};    // set up structure for this connection

  ws.on('message', function(rawMessage) {
    // we accept message from user!
    var resp; // it will be our response for user

    log('Received: ' + rawMessage);

    var message = JSON.parse(rawMessage);
    var login = message.login;
    connPool[thisId]['login'] = login;

    if ('direction' in message && 'position' in connPool[thisId]) {
      // user would like changes his position and he has old position
      var new_position = GetNewPosition(connPool[thisId]['position'], message.direction);

      if (new_position) {
        connPool[thisId]['position'] = new_position;
        resp = {'changePosition': new_position};
        resp.changePosition.login = login;

        wss.broadcast(resp);
      }
    } else {
      // user would like changes his position and he has not old position
      // because is connecting at server just now
      log('New user!! ' + message.login + ' '  + thisId);
      var position = SearchStartPosition();
      connPool[thisId]['position'] = position;

      resp = {'allMap': labMap, 'changePosition': {'x': position.x, 'y': position.y, 'login': login}};

      resp = JSON.stringify(resp);
      log('Send: %' + resp);
      ws.send(resp);
    }

  });

  ws.on('close', function() {
    log('Client disconnected: ' + connPool[thisId]['login']);
    delete connPool[thisId];
  });

  ws.on('error', function(e) {
    log('Client ' + connPool[thisId]['login'] + ' error: ' + e.message);
  });

});
