'use strict';

const rethinkDB = require('rethinkdb');
const program = require('commander');

const common = require('./common');
const log = require('./log');


class CartographerDB {
  constructor (conn, dbname, interval) {
    this.dbname = dbname;
    this.interval = interval;
  }

  run () {
    setInterval( () => {
      log.info('Change the Map!');
    }, this.interval);
  }

}

if (require.main === module) {
  program
  .version('0.0.1')
  .option('-d, --dbname [name]', 'Name of world database')
  .option('-p, --port <n>', 'Port for RethinkDB, default is 28015', parseInt, {isDefault: 28015})
  .option('-i, --interval <n>', 'Interval of time of changes', parseInt)
  .parse(process.argv);

  rethinkDB.connect( {host: 'localhost', port: program.port}, function(err, conn) {
    if (err) throw err;

    const cdb = new CartographerDB(conn, program.dbname, program.interval);
    cdb.run();
  });
}