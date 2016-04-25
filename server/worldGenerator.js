'use strict';

const rethinkDB = require('rethinkdb');
const program = require('commander');
const common = require('./common');

var worldDB = 'labyrinth';


if (require.main === module) {
  rethinkDB.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;

    rethinkDB
      .dbList()
      .run(conn, (err, dbList) => {
        if (err) throw err;

        for (let i = 0; i < dbList.length; i++) {
          if (dbList[i] === worldDB) {
            common.log(`The world is exist. `
              + `If you really want create a new world, `
              + `delete the database "${worldDB}".`);

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
