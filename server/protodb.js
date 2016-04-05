'use strict';

var rethinkDB = require('rethinkdb');


export class ProtoDB {
  constructor (conn, dbName, tableList) {
    this.conn = conn;
    this.dbName = dbName;
    this.tableList = tableList;

    this.conn.use(dbName);
  }

  searchDB (dbList) {
    let ret = false;

    dbList.find(function (dbName) {
      if (dbName === this.dbName) {
        ret = true;
      }
    }.bind(this));

    return ret;
  }

  initDB () {
    rethinkDB
      .dbList()
      .run(this.conn, function (err, dbList) {

        if (err) throw err;

        if (this.searchDB(dbList)) this.runDB();
        else this.createDB();
      }.bind(this));
  }

  createDB () {
    rethinkDB
      .dbCreate(this.dbName)
      .run(this.conn, function (err, res) {
        if (err) throw err;

        this.tableList.forEach(function (tableName) {
          this.createTable(tableName);
        }.bind(this));
      }.bind(this));
  }

  createTable (tableName) {
    rethinkDB
      .db(this.dbName)
      .tableCreate(tableName)
      .run(this.conn, function (err, res) {
        if (err) throw err;
      });
  }

  readChanges (tableName, callback) {
    rethinkDB
      .table(tableName, {readMode: 'outdated'})
      .changes()
      .run(this.conn, callback);
  }

  runDB () {}
}
