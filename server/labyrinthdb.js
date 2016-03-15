'use strict';

var r = require('rethinkdb');


export class LabyrinthDB {
  constructor (conn, dbName) {
    this.conn = conn;
    this.dbName = dbName;

    this.tableList = ['chat', 'worldmap'];

    this.checkDB();
  }

  checkDB () {
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
    r.db(this.dbName).tableCreate(tableName).run(this.conn, function (err, res) {
      if (err) throw err;
    });
  }

  checkMap () {
    r.db(this.dbName).table('worldmap').count().run(this.conn, function (err, res) {
      if (err) throw err;

      // res eq 0 if table is empty
      return res;
    });

  }

  writeNewWorldMap(worldMapArray) {
  }
}
