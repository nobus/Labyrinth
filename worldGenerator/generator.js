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
  .option('-c, --config [path]', 'Path to config')
  .parse(process.argv);

  const config = require(program.config);

  rethinkDB.connect( {host: config.rethink.dbhost, port: config.rethink.dbport}, function(err, conn) {
    if (err) throw err;

    rethinkDB
      .dbCreate(config.rethink.dbname)
      .run(conn, (err) => {
        if (err) {
          log.error(`The world is exist. `
            + `If you really want create a new world, `
            + `delete the database "${config.rethink.dbname}".`);

          throw  err;
        }

        conn.use(config.rethink.dbname);

        const generator = new worldGenerator.WorldGenerator(
          conn,
          config.world.worldSize,
          config.world.locationSize,
          config.world.dungeons);

        const startLocationId = generator.generate();
        log.info(`start location id is ${startLocationId}`);

        if (config.test.users > 0) {
          const userGenerator = new coralGenerator.CoralUserGenerator(
            conn,
            config.test.users,
            config.test.prefix,
            startLocationId);

          userGenerator.generate();
        }
      });
  });
}
