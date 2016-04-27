'use strict';

const rethinkDB = require('rethinkdb');
const program = require('commander');
const log = require('./log');


class LocationGenerator {
  constructor (conn) {
    this.conn = conn;
  }

  generate () {

  }
}


class WorldGenerator {
  constructor (conn, worldSize, locationSize) {
    this.conn = conn;
    this.worldSize = worldSize;
    this.locationSize = locationSize;
  }

  generate () {

  }
}


class CoralUserGenerator {
  constructor (conn, number) {
    this.conn = conn;
    this.name = 'coral';
    this.number = number;

    this.user = {x: 0, y: 0, direction: 'up', login: undefined};
  }

  generate () {
    rethinkDB
      .tableCreate('userPosition')
      .run(this.conn, (err) => {
        if (err) throw err;

        let login;

        for (let i = 0; i < this.number; i++) {
          this.user.login = `${this.name}${i}`;

          log.info(`Create test user ${this.user.login}`);

          rethinkDB
            .table('userPosition')
            .insert(this.user)
            .run(this.conn, (err) => {
              if (err) throw err;
            });
        }
      });
  }
}


if (require.main === module) {
  program
  .version('0.0.1')
  .option('-d, --dbname [name]', 'Name of world database')
  .option('-p, --port <n>', 'Port for RethinkDB, default is 28015', parseInt, {isDefault: 28015})
  .option('-t, --test <n>', 'Create n Corals', parseInt)
  .parse(process.argv);

  rethinkDB.connect( {host: 'localhost', port: program.port}, function(err, conn) {
    if (err) throw err;

    rethinkDB
      .dbCreate(program.dbname)
      .run(conn, (err) => {
        if (err) {
          log.error(`The world is exist. `
            + `If you really want create a new world, `
            + `delete the database "${program.dbname}".`);

          throw  err;
        }

        conn.use(program.dbname);

        let userGenerator = new CoralUserGenerator(conn, program.test);
        userGenerator.generate();
      });
  });
}
