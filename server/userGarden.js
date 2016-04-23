'use strict';

const rethinkDB = require('rethinkdb');
const UserDB = require('./UserDB');

const program = require('commander');

const common = require('./common');
const metrics = require('./metrics');


program
  .version('0.0.1')
  .option('-p, --port <n>', 'Port for WebSocket', parseInt)
  .option('-d, --dump <n>', 'Period for dump of user positions, sec', parseInt)
  .parse(process.argv);


if (require.main === module) {
  const m = new metrics.Metrics(5000);
  m.runMeasures();

  rethinkDB.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;

    const cdb = new UserDB.UserDB(
      conn,
      'labyrinth',
      ['userPosition'],
      program.dump,
      program.port
    );

    cdb.initDB();
  });
}