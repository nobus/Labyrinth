'use strict';

module.exports = {
  'rethink': {
    'dbhost': 'localhost',
    'dbport': 28015,
    'dbname': 'qwerty',
    'dump': 60
  },
  'world': {
    'dungeons': 16,
    'worldSize': 16,
    'locationSize': 128
  },
  'garden': {
    'ports': 8081     // in the future, [8081, 8082], because 'portS'
  },
  'cartographer': {
    'period': 10
  },
  'statsd': {
    'period': 5,
    'host': 'localhost',
    'port': 8125
  },
  'test': {
    'users': 100,
    'prefix': 'coral'
  }
};
