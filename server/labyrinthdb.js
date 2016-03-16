'use strict';

var r = require('rethinkdb');


export class LabyrinthDB {
  constructor (conn, dbName, tableList, custInit) {
    this.conn = conn;
    this.dbName = dbName;
    this.tableList = tableList;
    this.custInit = custInit;
  }

  initDB () {
    const _this = this;

    r.dbList().run(this.conn, function (err, dbList) {
      if (err) throw err;

      if (!dbList.find(function (e) {
          return e === _this.dbName
        })) _this.createDB();
    });
  }

  createDB () {
    const _this = this;

    r.dbCreate(this.dbName).run(this.conn, function (err, res) {
      if (err) throw err;

      _this.tableList.forEach(function (tableName) {
        _this.createTable(tableName);
      });

    });
  }

  createTable (tableName) {
    const _this = this;

    r.db(this.dbName).tableCreate(tableName).run(this.conn, function (err, res) {
      if (err) throw err;

      _this.custInit(tableName);
    });
  }

  writeNewLocationMap(tableName, worldMapArray) {
    let buffer = [];

    for (let y = 0; y < worldMapArray.length; y++) {
      let mapRow = worldMapArray[y];

      for (let x = 0; x < mapRow.length; x++) {
        let elem = {};
        elem['x'] = x;
        elem['y'] = y;
        elem['type'] = mapRow[x];
        buffer.push(elem);
      }
    }

    r.db(this.dbName).table(tableName).insert(buffer).run(this.conn, function (err, res) {
      if (err) throw err;

      console.log(`Location map done. We inserted ${res['inserted']} elements to ${tableName} for you!`)
    });
  }
}
