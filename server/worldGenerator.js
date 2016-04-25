'use strict';

const rethinkDB = require('rethinkdb');
const program = require('commander');
const common = require('./common');


if (require.main === module) {
  rethinkDB.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;

  });
}