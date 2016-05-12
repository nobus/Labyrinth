'use strict';

const colors = require('colors');
const common = require('./common');

module.exports = {
  info: info,
  warn: warn,
  error: error
};

function getTimestamp () {
  return Date.now() / 1000;
}

function info (message) {
  console.log(`${getTimestamp()}: ${colors.green(message)}`);
}

function warn (message) {
  console.warn(`${getTimestamp()}: ${colors.yellow(message)}`);
}

function error (message) {
  console.error(`${getTimestamp()}: ${colors.red(message)}`);
}
