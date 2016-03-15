'use strict';

const rethinkDB = require('rethinkdb');
const labyrinthDB = require('./labyrinthdb');


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
 * @returns {number} random float number between min and max
 */
function getRandom(min, max) {
  return Math.random() * (max - min + 1) + min;
}


/**
 *
 * @param min the lower limit of the range
 * @param max the upper limit of the range
 * @returns {number} random int number between min and max
 */
function getRandomInt(min, max) {
  return Math.floor(getRandom(min, max));
}


/**
 *
 * @param height - height of the game Map
 * @param width - width of the game Map
 * @param max - maximum line's length
 * @returns {Object} where startY and startX - start point of the line
 */
function getLineParams (height, width, max) {
  const ret = {};

  ret.startY = getRandomInt(0, height - max);
  ret.startX = getRandomInt(0, width - max);
  ret.length = getRandomInt(3, max);

  return ret;
}


/**
 * draw horizontal line on the Map
 * @param labMap - Object of the Map
 * @param height - height of the game Map
 * @param width - width of the game Map
 * @param max - maximum line's length
 */
function createHorizontalLine (labMap, height, width, max) {
  const params = getLineParams(height, width, max);

  for (let i = 0; i < params.length; i++) {
    labMap[params.startY][params.startX + i] = 1;
  }
}


/**
 * draw vertical line on the Map
 * @param labMap - Object of the Map
 * @param height - height of the game Map
 * @param width - width of the game Map
 * @param max - maximum line's length
 */
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
function generateWorldMap (height, width) {
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

if (require.main === module) {
  rethinkDB.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;

    const ldb = new labyrinthDB.LabyrinthDB(conn, 'labyrinth');

    if (!ldb.checkMap()) {
      ldb.writeNewWorldMap(generateWorldMap(100, 100));
    }
  });
}