
const now = require('performance-now');
const log = require('./log');


module.exports = {
  timeLogger: timeLogger,
  getRandom: getRandom,
  getRandomInt: getRandomInt
};


function timeLogger(f) {
  return function() {
    const start = now();

    const result = f.apply(this, arguments); // (*)

    const end = now() - start;
    log.info(`function ${f.name} performed ${end} ms`);

    return result;
  }
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