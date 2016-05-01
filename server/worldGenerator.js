'use strict';

const rethinkDB = require('rethinkdb');
const program = require('commander');

const common = require('./common');
const log = require('./log');

/*
The system of locations.
0.* Impassable blocks
  0.0 a ground
  0.1 a grass

1.* Passable blocks
  1.0 a wall (!!!should be renamed!!!)
  1.1 a tree

 */


class Location {
  constructor(conn, locationSize, locationId) {
    this.conn = conn;
    this.locationSize = locationSize;
    this.locationId = locationId;

    this.locationMap = [];
    for (let i = 0; i < locationSize; i++) this.locationMap.push([]);
  }

  createTable() {
    rethinkDB
      .tableCreate(this.locationId)
      .run(this.conn, (err) => {
        if (err) throw err;

        log.info(`Table for ${this.locationId} created`);
        this.writeNewLocationMap();
      });
  }

  writeNewLocationMap() {
    let buffer = [];

    for (let y = 0; y < this.locationMap.length; y++) {
      let mapRow = this.locationMap[y];

      for (let x = 0; x < mapRow.length; x++) {
        let elem = {};
        elem['x'] = x;
        elem['y'] = y;
        elem['type'] = mapRow[x];
        buffer.push(elem);
      }
    }

    rethinkDB
      .table(this.locationId)
      .insert(buffer)
      .run(this.conn, (err, res) => {
        if (err) throw err;

        log.info(`Location map done. We inserted ${res['inserted']} elements to ${this.locationId}`);
        log.info(`Let's create the index for ${this.locationId}!`);

        rethinkDB
          .table(this.locationId)
          .indexCreate('coord', [rethinkDB.row('x'), rethinkDB.row('y')])
          .run(this.conn, (err) => {
            if (err) throw err;

            rethinkDB
              .table(this.locationId)
              .indexWait('coord')
              .run(this.conn, (err) => {
                if (err) throw err;

                log.info(`Index for ${this.locationId} created!`);
              });
          });
      });
  }
}

class ForestLocation extends Location {
  generate () {
    for (let i = 0; i < this.locationMap.length; i++) {
      for (let ii = 0; ii < this.locationSize; ii++) {
        let x = common.getRandomInt(0, 100);

        if (x <= 40) {
          // add grass
          this.locationMap[i].push(0.1);
        } else if (x >= 41 && x <= 90) {
          // add tree
          this.locationMap[i].push(1.1);
        } else {
          // add ground
          this.locationMap[i].push(0.0)
        }
      }
    }

    this.createTable();
  }
}

class MeadowLocation extends Location {
  generate () {
    for (let i = 0; i < this.locationMap.length; i++) {
      for (let ii = 0; ii < this.locationSize; ii++) {
        let x = common.getRandomInt(0, 100);

        if (x <= 80) {
          // add grass
          this.locationMap[i].push(0.1);
        } else if (x >= 81 && x <= 90) {
          // add tree
          this.locationMap[i].push(1.1);
        } else {
          // add ground
          this.locationMap[i].push(0.0)
        }
      }
    }

    this.createTable();
  }
}

class WorldGenerator {
  constructor (conn, worldSize, locationSize) {
    this.conn = conn;
    this.worldSize = worldSize;
    this.locationSize = locationSize;

    this.world = [];
    for (let i = 0; i < this.worldSize; i++) this.world.push([]);

    this.locationTypes = [ForestLocation, MeadowLocation];
  }

  getLocation (locationId) {
    const location = this.locationTypes[common.getRandomInt(0, 1)];
    return new location(this.conn, this.locationSize, locationId);
  }

  getStartLocationId () {
    return this.world[0][0];
  }

  generate () {
    for (let i = 0; i < this.world.length; i++) {
      for (let ii =0; ii < this.worldSize; ii++) {
        const locationId = `location_${i}_${ii}`;
        const location = this.getLocation(locationId);

        location.generate();
        this.world[i].push(locationId);
      }
    }

    return this.getStartLocationId();
  }
}

class CoralUserGenerator {
  constructor (conn, number, startLocationId) {
    this.conn = conn;
    this.name = 'coral';
    this.number = number;

    this.user = {x: 0, y: 0, direction: 'up', login: undefined, location: startLocationId};
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

        const worldGenerator = new WorldGenerator(conn, 3, 100);
        const startLocationId = worldGenerator.generate();
        log.info(`start location id is ${startLocationId}`);

        if (program.test) {
          const userGenerator = new CoralUserGenerator(conn, program.test, startLocationId);
          userGenerator.generate();
        }
      });
  });
}
