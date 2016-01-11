
// https://github.com/websockets/ws/
var WebSocketServer = require('ws').Server;

var wss = new WebSocketServer({ port: 8080 });

/**
 *
 * @param wigth X
 * @param hight Y
 * @returns {Array} new map of the Labyrinth
 */
function InitMap (wigth, hight) {
  var labMap = [];

  for (var i = 0; i < hight; i++) {
    labMap.push(Array.apply(null, Array(wigth)).map(function(_, i) {return 0;}));
  }

  return labMap;
}

// create new map
var labMap = InitMap(100, 100);

/**
 *
 * @param min the lower limit of the range
 * @param max the upper limit of the range
 * @returns {number} random number between min and max
 */
function GetRandom(min, max) {
  return Math.random() * (max - min + 1) + min;
}


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
var tmin = 1000;    // minimum delay for change the map
var tmax = 9000;    // maximum delay for change the map

setTimeout(function runThis() {
  console.log(Date.now() / 1000);

  var y = Math.floor(GetRandom(0, 99));
  var x = Math.floor(GetRandom(0, 99));
  var elementId;

  if (labMap[y][x] === 1) {
    elementId = 0;
    labMap[y][x] = elementId;
  } else if (labMap[y][x] === 0) {
    elementId = 1;
    labMap[y][x] = elementId;
  }
  // else that user === 3

  if (elementId) {
    // send to users command to change their maps
    var changeMap = {'changeMap': [{'y': y, 'x': x, 'id': elementId}]};
    wss.broadcast(JSON.stringify(changeMap));
  }

  setTimeout(runThis, GetRandom(tmin, tmax));
}, GetRandom(tmin, tmax));

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    console.log(data);
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

    console.log('%s: received: %s', Date.now()/1000, rawMessage);

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

        resp = JSON.stringify(resp);
        console.log('%s: send: %s', Date.now()/1000, resp);
        wss.broadcast(resp);
      }
    } else {
      // user would like changes his position and he has not old position
      // because is connecting at server just now
      console.log('New user!! %s, %d', message.login, thisId);
      var position = SearchStartPosition();
      connPool[thisId]['position'] = position;

      resp = {'allMap': labMap, 'changePosition': {'x': position.x, 'y': position.y, 'login': login}};

      resp = JSON.stringify(resp);
      console.log('%s: send: %s', Date.now()/1000, resp);
      ws.send(resp);
    }

    /*
    if (resp) {
      resp = JSON.stringify(resp);
      console.log('%s: send: %s', Date.now()/1000, resp);
      ws.send(resp);
    }
    */

  });

  ws.on('close', function() {
    console.log('Client %s disconnected.', connPool[thisId]['login']);
    delete connPool[thisId];
  });

  ws.on('error', function(e) {
    console.log('Client %s error: %s', connPool[thisId]['login'], e.message);
  });

});
