'use strict';

const log4js = require('log4js');

module.exports = {
  info: info,
  warn: warn,
  error: error,
  debug: debug
};

const logger = log4js.getLogger();

function info (message) {
  logger.info(message);
}

function warn (message) {
  logger.warn(message);
}

function error (message) {
  logger.error(message);
}

function debug (message) {
  logger.debug(message);
}
