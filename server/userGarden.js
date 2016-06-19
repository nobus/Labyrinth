'use strict';

const rethinkDB = require('rethinkdb');
const program = require('commander');

const UserDB = require('./UserDB');
const metrics = require('./metrics');

if (require.main === module) {
  program
    .version('0.0.1')
    .option('-c, --config [path]', 'Path to config')
    .parse(process.argv);

  const config = require(program.config);

  const m = new metrics.Metrics(config.statsd.period * 1000);
  m.runMeasures();

  rethinkDB.connect( {host: config.rethink.dbhost, port: config.rethink.dbport}, function(err, conn) {
    if (err) throw err;

    const userDB = new UserDB.UserDB(
      conn,
      config.rethink.dbname,
      config.rethink.dump,
      config.garden.ports,
      config.world.locationSize,
      config.cartographer.period
    );

    userDB.run();
  });
}