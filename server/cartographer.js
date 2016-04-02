'use strict';

const rethinkDB = require('rethinkdb');

const protoDB = require('./protodb');
const common = require('./common');


class CartographerDB extends protoDB.ProtoDB {
  /**
   *
   * @param height - height of the game Map
   * @param width - width of the game Map
   * @param max - maximum line's length
   * @returns {Object} where startY and startX - start point of the line
   */
  static getLineParams(height, width, max) {
    const ret = {};

    ret.startY = common.getRandomInt(0, height - max);
    ret.startX = common.getRandomInt(0, width - max);
    ret.length = common.getRandomInt(3, max);

    return ret;
  }


  /**
   * draw horizontal line on the Map
   * @param locationMap - array for location's map
   * @param height - height of the game Map
   * @param width - width of the game Map
   * @param max - maximum line's length
   */
  static createHorizontalLine(locationMap, height, width, max) {
    const params = CartographerDB.getLineParams(height, width, max);

    for (let i = 0; i < params.length; i++) {
      locationMap[params.startY][params.startX + i] = 1;
    }
  }


  /**
   * draw vertical line on the Map
   * @param locationMap - array for location's map
   * @param height - height of the game Map
   * @param width - width of the game Map
   * @param max - maximum line's length
   */
  static createVerticalLine(locationMap, height, width, max) {
    const params = CartographerDB.getLineParams(height, width, max);

    for (let i = 0; i < params.length; i++) {
      locationMap[params.startY + i][params.startX] = 1;
    }
  }


  /**
   *
   * @param height Y
   * @param width X
   * @returns {Array} new map of the Labyrinth's location
   */
  static generateLocationMap(height, width) {
    let locationMap = [];

    for (let i = 0; i < height; i++) {
      locationMap.push(Array.apply(null, Array(width)).map(function (_, i) {
        return 0;
      }));
    }

    for (let i = 0; i < 300; i++) {
      if (i % 2 === 0) {
        CartographerDB.createHorizontalLine(locationMap, height, width, 10);
      }
      if (i % 2 === 1) {
        CartographerDB.createVerticalLine(locationMap, height, width, 10);
      }
    }

    return locationMap;
  }

  createTable (tableName) {
    const _this = this;

    rethinkDB.tableCreate(tableName).run(this.conn, function (err, res) {
      if (err) throw err;

      if (tableName === 'startLocation') {
        common.log('Map generator started.');
        _this.writeNewLocationMap(tableName, CartographerDB.generateLocationMap(100, 100));
        common.log('Map generator ended.');
      }
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

    const _this = this;

    rethinkDB
      .table(tableName)
      .insert(buffer)
      .run(this.conn, function (err, res) {
        if (err) throw err;

        common.log(`Location map done. We inserted ${res['inserted']} elements to ${tableName} for you!`);
        common.log('Let\'s create the index!');

        rethinkDB
          .table(tableName)
          .indexCreate('coord', [rethinkDB.row('x'), rethinkDB.row('y')])
          .run(_this.conn, function(err, res) {
            if (err) throw err;

            rethinkDB
              .table(tableName)
              .indexWait('coord')
              .run(_this.conn, function(err, res) {
                if (err) throw err;

                common.log(`Index for ${tableName} created!`);
                _this.runDB();
              });
          });
      });
  }


  runDB () {
    const _this = this;

    setInterval(function () {
      common.log('Change the Map!');

      const params = CartographerDB.getLineParams(100, 100, 20);
      const elementId = common.getRandomInt(0, 1);

      for (let i = 0; i < params.length; i++) {
        if (elementId === 0) {
          params.startX += 1;
        } else {
          params.startY += 1;
        }

        common.log(`${JSON.stringify(params)}, ${elementId}`);

        rethinkDB
          .table('startLocation')
          .getAll([params.startX, params.startY], {index: 'coord'})
          .update({type: elementId})
          .run(_this.conn, function (err, result) {
            if (err) throw err;
            common.log(JSON.stringify(result));
          });
      }
    }, 5000);
  }

}

if (require.main === module) {
  rethinkDB.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;

    const cdb = new CartographerDB(conn, 'labyrinth', ['userPosition', 'startLocation']);
    cdb.initDB();
  });
}