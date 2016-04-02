

module.exports = {
  log: log,
  getRandom: getRandom,
  getRandomInt: getRandomInt
};


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