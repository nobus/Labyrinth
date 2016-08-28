'use strict';

const rethinkDB = require('rethinkdb');
const program = require('commander');

const common = require('./../common');
const log = require('./../log');

const worldGenerator = require('./WorldGenerator');
const coralGenerator = require('./CoralUserGenerator');

const PostProcessor = require('./PostProcessor');


/*
The system of locations.
0.* Impassable blocks
  0.1 a wall (!!!should be renamed!!!)
  0.2 a tree
  0.3 a stump1
  0.4 a stump2
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
            + `If you want to create a new world, `
            + `you must delete the database "${config.rethink.dbname}". `
            + `The old world will ruined.`);

          throw  err;
        }

        conn.use(config.rethink.dbname);

        // 1 - for new worldGenerator.WorldGenerator.writeWorldMap
        const postProcessor = new PostProcessor.PostProcessor(1);

        const generator = new worldGenerator.WorldGenerator(
          conn,
          config.world.worldSize,
          config.world.locationSize,
          config.world.dungeons,
          postProcessor);

        const startLocationId = generator.generate();
        log.info(`start location id is ${startLocationId}`);

        if (config.test.users > 0) {
          const userGenerator = new coralGenerator.CoralUserGenerator(
            conn,
            config.test.users,
            config.test.prefix,
            startLocationId,
            postProcessor);

          userGenerator.generate();
        }
      });
  });
}
