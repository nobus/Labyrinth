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

    this.rowId;
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

        // setTimeout is the hack for ReqlOpFailedError:
        // Cannot perform write: primary replica for shard ["", +inf) not available
        setTimeout(this.writeNewLocationMap.bind(this), 20000);
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
    rethinkDB
      .table(this.locationId)
      .insert({'locationMap': JSON.stringify(this.locationMap)})
      .run(this.conn, (err, res) => {
        if (err) {
          log.error(`Data for ${this.locationId} not inserted`);
          throw err;
        }

        log.info(`Location map done. We inserted ${res['inserted']} elements to ${this.locationId}`);
      });
  }

  mutate () {
    const data = this.mutator();

    for (let i = 0; i < data.length; i++) {
      const e = data[i];

      // 2. === entrances or exits
      if (this.locationMap[e.y][e.x] < 2 || this.locationMap[e.y][e.x] >= 3) {
        this.locationMap[e.y][e.x] = e.type;
      }
    }

    rethinkDB
      .table(this.locationId)
      .get(this.rowId)
      .update({'locationMap': JSON.stringify(this.locationMap)})
      .run(this.conn, (err) => {
        if (err) {
          log.error(`Data for ${this.locationId} not updated`);
          throw err;
        }
      });
  }

  loadLocation (resolve) {
    rethinkDB
    .table(this.locationId, {readMode: 'outdated'})
    .run(this.conn, (err, cursor) => {
      if (err) throw err;

      cursor.toArray( (err, res) => {
        if (err) throw err;

        if (res.length === 1) {
          this.rowId = res[0].id;
          this.locationMap = JSON.parse(res[0].locationMap);
          resolve(`Location cache for ${this.locationId} is ready. Number of elements is ${this.locationMap.length}`);
        } else {
          reject(`res length is ${res.length}`);
        }
      });
    });
  }

  getLocationMap () {
    return this.locationMap;
  }
}
