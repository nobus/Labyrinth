'use strict';

const rethinkDB = require('rethinkdb');

const log = require('./../server/log');

export class Location {
  constructor(conn, locationSize, locationId, dungeonBP) {
    this.conn = conn;
    this.locationSize = locationSize;
    this.locationId = locationId;
    this.dungeonBP = dungeonBP;

    this.locationMap = [];
    for (let i = 0; i < locationSize; i++) this.locationMap.push([]);
  }

  createTable() {
    rethinkDB
      .tableCreate(this.locationId)
      .run(this.conn, (err) => {
        if (err) {
          log.error(`Table for ${this.locationId} not created`);
          throw err;
        }

        log.info(`Table for ${this.locationId} created`);
        this.writeNewLocationMap();
      });
  }

  createDungeonTunnel (type, level) {
    if (this.dungeonBP) {
      if (level === -1) {
        // add entrance from surface to dungeon
        const x = this.dungeonBP.entrances[0][0];
        const y = this.dungeonBP.entrances[0][1];
        this.locationMap[y][x] = 2.1;
      } else {
        if (this.dungeonBP.entrances.length > level) {
          const x = this.dungeonBP.entrances[level][0];
          const y = this.dungeonBP.entrances[level][1];
          this.locationMap[y][x] = type;
        }
      }
    }
  }

  createDungeonEntrance (level) {
    this.createDungeonTunnel(2.1, level);
  }

  createDungeonExit (level) {
    this.createDungeonTunnel(2.2, level);
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
        if (err) {
          log.error(`Data for ${this.locationId} not inserted`);
          throw err;
        }

        log.info(`Location map done. We inserted ${res['inserted']} elements to ${this.locationId}`);
        log.info(`Let's create the index for ${this.locationId}!`);

        rethinkDB
          .table(this.locationId)
          .indexCreate('coord', [rethinkDB.row('x'), rethinkDB.row('y')])
          .run(this.conn, (err) => {
            if (err) {
              log.error(`Index for ${this.locationId} not created`);
              throw err;
            }

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
