'use strict';

const rethinkDB = require('rethinkdb');
const program = require('commander');

const common = require('./common');
const log = require('./log');

const customLocations = require('../worldGenerator/customLocations');


class CartographerDB {
  constructor (conn, dbName, interval) {
    this.conn = conn;
    this.dbName = dbName;
    this.interval = interval;

    this.conn.use(this.dbName);

    this.worldMapCache = {};
    this.userPositionCache = {};

    this.cacheWorldMap();
    this.cacheUserPosition();
  }

  cacheWorldMap () {
    rethinkDB
      .table('worldMap', {readMode: 'outdated'})
      .run(this.conn, (err, cursor) => {
        if (err) throw err;

        cursor.toArray((err, res) => {
          if (err) throw err;

          for (let i = 0; i < res.length; i++) {
            let e = res[i];
            this.worldMapCache[e.location] = e;
          }

          log.info(`World map cache is ready.`);
        });
      });
  }

  cacheUserPosition () {
    rethinkDB
      .table('userPosition', {readMode: 'outdated'})
      .run(this.conn, (err, cursor) => {
        if (err) throw  err;

        cursor.toArray( (err, res) => {
          if (err) throw  err;

          for (let i = 0; i < res.length; i++) {
            let e = res[i];
            this.userPositionCache[e.login] = e;
          }

          log.info(`User position cache is ready.`);

          this.userPositionChangeFeed();
        });
      });
  }

  userPositionChangeFeed () {
    rethinkDB
      .table('userPosition', {readMode: 'outdated'})
      .changes()
      .run(this.conn, (err, cursor) => {
        if (err) throw  err;

        cursor.each((err, row) => {
          if (err) throw err;

          const e = row.new_val;
          this.userPositionCache[e.login] = e;
        });
      });
  }

  getLocationForChange () {
    const allLocations = Object.keys(this.worldMapCache);
    const onlineLocations = [];

    for (let login in this.userPositionCache) {
      if (this.userPositionCache[login].online === true) {
        let location = this.userPositionCache[login].location;

        if (onlineLocations.indexOf(location) === -1) {
          onlineLocations.push(location);
        }
      }
    }

    const res = allLocations.filter((e) => {if (onlineLocations.indexOf(e) === -1) return e});

    if (res) {
      return res[common.getRandomInt(0, res.length - 1)];
    }
  }

  getLocationType (locationId) {
    return this.worldMapCache[locationId].locationType;
  }

  run () {
    setInterval( () => {
      if (common.isEmpty(this.worldMapCache) || common.isEmpty(this.userPositionCache)) {
        log.warn('Not ready caches yet');
      } else {
        const locationId = this.getLocationForChange();

        if (locationId) {
          log.info(`Change the Location ${locationId}!`);
          const locationType = this.getLocationType(locationId);

          const location = new customLocations[locationType](this.conn, 100, locationId);
          location.mutate();
        }
      }
    }, this.interval);
  }
}

if (require.main === module) {
  program
  .version('0.0.1')
  .option('-d, --dbname [name]', 'Name of world database')
  .option('-p, --port <n>', 'Port for RethinkDB, default is 28015', parseInt, {isDefault: 28015})
  .option('-i, --interval <n>', 'Interval of time of changes', parseInt)
  .parse(process.argv);

  rethinkDB.connect( {host: 'localhost', port: program.port}, function(err, conn) {
    if (err) throw err;

    const cdb = new CartographerDB(conn, program.dbname, program.interval);
    cdb.run();
  });
}
