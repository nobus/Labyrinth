
'use strict';


// https://github.com/websockets/ws/
const WebSocketServer = require('ws').Server;
const wss = new WebSocketServer({ port: 8081 });

/**
 *
 * @param message
 */
function log(message) {
  console.log(`${Date.now() / 1000}: ${message}`);
}

/**
 *
 * @param min the lower limit of the range
 * @param max the upper limit of the range
 * @returns {number} random number between min and max
 */
function getRandom(min, max) {
  return Math.random() * (max - min + 1) + min;
}

function getRandomInt(min, max) {
  return Math.floor(getRandom(min, max));
}


function getLineParams (height, width, max) {
  const ret = {};

  ret.startY = getRandomInt(0, height - max);
  ret.startX = getRandomInt(0, width - max);
  ret.length = getRandomInt(3, max);

  return ret;
}

function createHorizontalLine (labMap, height, width, max) {
  const params = getLineParams(height, width, max);

  for (let i = 0; i < params.length; i++) {
    labMap[params.startY][params.startX + i] = 1;
  }
}

function createVerticalLine (labMap, height, width, max) {
  const params = getLineParams(height, width, max);

  for (let i = 0; i < params.length; i++) {
    labMap[params.startY + i][params.startX] = 1;
  }
}


/**
 *
 * @param height Y
 * @param width X
 * @returns {Array} new map of the Labyrinth
 */
function initMap (height, width) {
  let labMap = [];

  for (let i = 0; i < height; i++) {
    labMap.push(Array.apply(null, Array(width)).map(function (_, i) {
      return 0;
    }));
  }

  for (let i = 0; i < 300; i++) {
    if (i % 2 === 0) {
      createHorizontalLine(labMap, height, width, 10);
    }
    if (i % 2 === 1) {
      createVerticalLine(labMap, height, width, 10);
    }
  }

  return labMap;
}

// create new map
const labMap = initMap(100, 100);

/**
 * search start position for new user
 * @returns {{y: number, x: number}}
 */
function searchStartPosition () {
  for (let i = 0; i < labMap.length; i++) {
    for (let ii = 0; ii < labMap[i].length; ii++) {
      if (labMap[i][ii] === 0) {
        return {'y': i, 'x': ii};
      }
    }
  }
}

// dictionary for variant of offset
const offsets = {
  'up': {'x': 0, 'y': -1},
  'down': {'x': 0, 'y': 1},
  'left': {'x': -1, 'y': 0},
  'right': {'x': 1, 'y': 0}
};

/**
 *
 * @param curPosition {y, x} current user position
 * @param direction 'up', or 'down', or 'left', or 'right'
 * @returns {{y: *, x: *, direction: *}} new position and direction
 *          or undefined if block ahead
 * @constructor
 */
function getNewPosition(curPosition, direction) {
  const offset = offsets[direction];

  const newY = curPosition.y + offset.y;
  const newX = curPosition.x + offset.x;

  if (newX >= 0 && newX < labMap.length && newY >= 0 && newY < labMap.length) {
    if (labMap[newY][newX] === 0) {
      return {
        'y': newY,
        'x': newX,
        'direction': direction};
    }
  }
}

// dictionary for user data
var connPool = {};

// minimum delay for change the map
const tmin = 1000;

// maximum delay for change the map
const tmax = 9000;

setTimeout(function runThis() {
  log('Change the Map!');

  const params = getLineParams(100, 100, 20);
  const elementId = getRandomInt(0, 1);

  if (getRandomInt(0, 1) === 0) {
    // horizontal line!
    params.type = 'horizontal';

    for (let i = 0; i < params.length; i++) {
      labMap[params.startY][params.startX + i] = elementId;
    }
  } else {
    // vertical line!
    params.type = 'vertical';

    for (let i = 0; i < params.length; i++) {
      labMap[params.startY + i][params.startX] = elementId;
    }
  }

  // send to users command to change their maps
  const changeMap = {
    'changeMap': [
      {
        'startY': params.startY,
        'startX': params.startX,
        'length': params.length,
        'type': params.type,
        'id': elementId}
    ]
  };

  wss.broadcast(changeMap);

  setTimeout(runThis, getRandom(tmin, tmax));
}, getRandom(tmin, tmax));

wss.broadcast = function broadcast(data) {
  if (wss.clients.length) {
    data = JSON.stringify(data);
    log(`Send broadcast: ${data}`);
  }

  wss.clients.forEach(function each(client) {
    client.send(data);
  });
};

var clientId = 0;

wss.on('connection', function(ws) {
  // increment id counter
  const thisId = ++clientId;

  // set up structure for this connection
  connPool[thisId] = {};

  // we accept message from user!
  ws.on('message', function(rawMessage) {
    log(`Received: ${rawMessage}`);

    const message = JSON.parse(rawMessage);
    connPool[thisId]['login'] = message.login;

    if (message.direction && 'position' in connPool[thisId]) {
      // user would like changes his position and he has old position
      const new_position = getNewPosition(connPool[thisId]['position'], message.direction);

      if (new_position) {
        connPool[thisId]['position'] = new_position;

        let resp = {'changePosition': new_position};
        resp.changePosition.login = message.login;

        wss.broadcast(resp);
      }
    } else {
      /**
       * user would like changes his position and he has not old position
       * because is connecting at server just now
       */
      log(`New user!! ${message.login} ${thisId}`);
      const position = searchStartPosition();
      connPool[thisId]['position'] = position;

      let resp = {
        allMap: labMap,
        changePosition: {
          x: position.x,
          y: position.y,
          login: message.login
        }
      };

      resp = JSON.stringify(resp);

      log(`Send: ${resp}`);
      ws.send(resp);
    }

  });

  ws.on('close', function() {
    log(`Client disconnected: ${connPool[thisId]['login']}`);
    delete connPool[thisId];
  });

  ws.on('error', function(e) {
    log(`Client connPool[thisId]['login'] error + ${e.message}`);
  });

});
