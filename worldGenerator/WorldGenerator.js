'use strict';

const rethinkDB = require('rethinkdb');

const common = require('./../server/common');
const log = require('./../server/log');

const dbp = require('./DungeonBluePrints');
const customLocations = require('./customLocations');

export class WorldGenerator {
  constructor (conn, worldSize, locationSize, dungeons) {
    this.conn = conn;
    this.worldSize = worldSize;
    this.locationSize = locationSize;
    this.dungeons = dungeons;

    this.world = [];
    for (let i = 0; i < this.worldSize; i++) this.world.push([]);

    this.locationTypes = [customLocations.ForestLocation, customLocations.MeadowLocation];
  }

  getLocation (locationId, dungeonBP) {
    const location = this.locationTypes[common.getRandomInt(0, 1)];
    return new location(this.conn, this.locationSize, locationId, dungeonBP);
  }

  getStartLocationId () {
    return this.world[0][0];
  }

  writeWorldMap () {
    let buffer = [];

    for (let i = 0; i < this.world.length; i++) {
      for (let ii =0; ii < this.world[i].length; ii++) {
        let locationElem = {};

        locationElem.location_id = this.world[i][ii];

        if (i > 0) {
          locationElem.up = this.world[i - 1][ii];
        }

        if (i < this.worldSize - 1) {
          locationElem.down = this.world[i + 1][ii];
        }

        if (ii > 0) {
          locationElem.left = this.world[i][ii - 1];
        }

        if (ii < this.worldSize - 1) {
          locationElem.right = this.world[i][ii + 1];
        }

        buffer.push(locationElem);
      }
    }

    rethinkDB
      .tableCreate('worldMap')
      .run(this.conn, (err) => {
        if (err) throw err;

        log.info(`Table for world map created`);

        rethinkDB
          .table('worldMap')
          .insert(buffer)
          .run(this.conn, (err) => {
            if (err) throw err;

            log.info(`World's map created and written to the disk.`)
          });
      });
  }

  generate () {
    const dungeonBluePrints = new dbp.DungeonBluePrints(this.dungeons, this.worldSize, this.locationSize);
    dungeonBluePrints.generate();

    for (let i = 0; i < this.world.length; i++) {
      for (let ii =0; ii < this.worldSize; ii++) {
        const locationId = `location_${i}_${ii}`;
        const dungeonBP = dungeonBluePrints.getBluePrints(locationId);

        const location = this.getLocation(locationId, dungeonBP);

        location.generate();
        this.world[i].push(locationId);
      }
    }

    this.writeWorldMap();
    return this.getStartLocationId();
  }
}
