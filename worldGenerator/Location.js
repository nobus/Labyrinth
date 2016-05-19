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
