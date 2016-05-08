'use strict';

const rethinkDB = require('rethinkdb');
const program = require('commander');

const common = require('./../server/common');
const log = require('./../server/log');

const worldGenerator = require('./WorldGenerator');
const coralGenerator = require('./CoralUserGenerator');

/*
The system of locations.
0.* Impassable blocks
  0.1 a wall (!!!should be renamed!!!)
  0.2 a tree

1.* Passable blocks
  1.1 a ground
  1.2 a grass

2.* Gates and entrances
  2.1 Entrance to dungeon
  2.2 Exit from dungeon
 */


if (require.main === module) {
  program
  .version('0.0.1')
  .option('-d, --dbname [name]', 'Name of world database')
  .option('-p, --port <n>', 'Port for RethinkDB, default is 28015', parseInt, {isDefault: 28015})
  .option('-t, --test <n>', 'Create n Corals', parseInt)
  .option('-g, --dungeons <n>', 'Create n Dungeons', parseInt)
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

        const generator = new worldGenerator.WorldGenerator(conn, 3, 100, program.dungeons);
        const startLocationId = generator.generate();
        log.info(`start location id is ${startLocationId}`);

        if (program.test) {
          const userGenerator = new coralGenerator.CoralUserGenerator(conn, program.test, startLocationId);
          userGenerator.generate();
        }
      });
  });
}
