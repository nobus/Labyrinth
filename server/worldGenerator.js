'use strict';

const rethinkDB = require('rethinkdb');
const program = require('commander');
const log = require('./log');

var worldDB = 'labyrinth';


if (require.main === module) {
  program
  .version('0.0.1')
  .option('-p, --port <n>', 'Port for RethinkDB, default is 28015', parseInt, {isDefault: 28015})
  .option('-t, --test <n>', 'Create n Corals', parseInt)
  .parse(process.argv);

  rethinkDB.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;

    rethinkDB
      .dbCreate(worldDB)
      .run(conn, (err, res) => {
        if (err) {
          log.error(`The world is exist. `
            + `If you really want create a new world, `
            + `delete the database "${worldDB}".`);

          throw  err;
        }
      });
  });
}
