'use strict';

const colors = require('colors');
const common = require('./common');

module.exports = {
  info: info,
  warn: warn,
  error: error
};


function info (message) {
  common.log(colors.green(message));
}

function warn (message) {
  common.log(colors.yellow(message));
}

function error (message) {
  common.log(colors.red(message));
}
