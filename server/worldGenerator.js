'use strict';

const rethinkDB = require('rethinkdb');
const program = require('commander');
const colors = require('colors');
const common = require('./common');

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
      .dbList()
      .run(conn, (err, dbList) => {
        if (err) throw err;

        for (let i = 0; i < dbList.length; i++) {
          if (dbList[i] === worldDB) {
            common.log(colors.red(`The world is exist. `
              + `If you really want create a new world, `
              + `delete the database "${worldDB}".`));

            process.exit(1);
          }
        }

        rethinkDB
          .dbCreate(worldDB)
          .run(this.conn, (err, res) => {
            if (err) throw err;


          });
      });
  });
}
