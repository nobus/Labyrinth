'use strict';

const rethinkDB = require('rethinkdb');

const common = require('./../server/common');
const log = require('./../server/log');

const dbp = require('./DungeonBluePrints');
const sbp = require('./SurfaceBluePrints');
const customLocations = require('./customLocations');

export class WorldGenerator {
  constructor (conn, worldSize, locationSize, numDungeon) {
    this.conn = conn;
    this.worldSize = worldSize;
    this.locationSize = locationSize;
    this.numDungeon = numDungeon;

    this.world = [];
    for (let i = 0; i < this.worldSize; i++) this.world.push([]);

    this.dungeons = {};
    this.dungeonBluePrints = new dbp.DungeonBluePrints(this.numDungeon, this.worldSize, this.locationSize);
    this.dungeonBluePrints.generate();

    this.surfaceBluePrints = new sbp.SurfaceBluePrints(this.worldSize, this.dungeonBluePrints);
    this.surfaceBluePrints.generate();
  }

  getLocation (locationId, locationType, dungeonBP) {
    const location = customLocations[locationType];
    return new location(this.conn, this.locationSize, locationId, dungeonBP);
  }

  writeWorldMap () {
    let buffer = [];

    for (let locationId in this.surfaceBluePrints.blueprints) {
      const locationElem = this.surfaceBluePrints.getBluePrints(locationId);
      locationElem.location = locationId;

      buffer.push(locationElem);
    }

    for (let locationId in this.dungeonBluePrints.blueprints) {
      const bp = this.dungeonBluePrints.getBluePrints(locationId);

      for (let dungLocationId in bp.neighbors) {
        const locationElem = bp.neighbors[dungLocationId];
        locationElem.location = dungLocationId;
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

  createDungeons () {
    for (let locationId in this.dungeonBluePrints.blueprints) {
      const dungeonBP = this.dungeonBluePrints.getBluePrints(locationId);
      const dungeonId = dungeonBP.dungeonId;

      for (let i = 0; i < dungeonBP.levels; i++) {
        const dungLocationId = dbp.DungeonBluePrints.getDungeonLocationId(dungeonId, i);
        const locationType = dungeonBP.neighbors[dungLocationId].locationType;

        this.dungeons[locationId] = this.getLocation(dungLocationId, locationType, dungeonBP);
        this.dungeons[locationId].generate(i);
      }
    }
  }

  createSurface () {
    for (let locationId in this.surfaceBluePrints.blueprints) {
      const dungeonBP = this.dungeonBluePrints.getBluePrints(locationId);
      const surfaceBP = this.surfaceBluePrints.getBluePrints(locationId);

      const location = this.getLocation(locationId, surfaceBP.locationType, dungeonBP);
      location.generate();
    }
  }

  generate () {
    rethinkDB
    rethinkDB
    .tableCreate('locations')
    .run(this.conn, (err) => {
      if (err) throw err;

      this.createDungeons();
      this.createSurface();

      this.writeWorldMap();
    });

    return this.surfaceBluePrints.getStartLocationId();
  }
}
