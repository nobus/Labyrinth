'use strict';

const common = require('./../server/common');
const location = require('./Location');

export class ForestLocation extends location.Location {
  generate () {
    for (let i = 0; i < this.locationMap.length; i++) {
      for (let ii = 0; ii < this.locationSize; ii++) {
        let x = common.getRandomInt(0, 100);

        if (x <= 75) {
          // add grass
          this.locationMap[i].push(1.2);
        } else if (x > 75 && x < 98) {
          // add tree
          this.locationMap[i].push(0.2);
        } else {
          // add ground
          this.locationMap[i].push(1.2)
        }
      }
    }

    this.createDungeonEntrance(-1);

    this.createTable();
  }
}

export class MeadowLocation extends location.Location {
  generate () {
    for (let i = 0; i < this.locationMap.length; i++) {
      for (let ii = 0; ii < this.locationSize; ii++) {
        let x = common.getRandomInt(0, 100);

        if (x <= 95) {
          // add grass
          this.locationMap[i].push(1.2);
        } else if (x > 95 && x < 98) {
          // add tree
          this.locationMap[i].push(0.2);
        } else {
          // add ground
          this.locationMap[i].push(1.1)
        }
      }
    }

    this.createDungeonEntrance(-1);

    this.createTable();
  }
}

export class Cave extends location.Location {
  generate (level) {
    for (let i = 0; i < this.locationMap.length; i++) {
      for (let ii = 0; ii < this.locationSize; ii++) {
        let x = common.getRandomInt(0, 100);

        if (x <= 90) {
          // add ground
          this.locationMap[i].push(1.1);
        } else {
          // add wall
          this.locationMap[i].push(0.1);
        }
      }
    }

    // add exit from current dungeon level to top level
    this.createDungeonExit(level);

    // add entrance from current dungeon level to bottom level
    this.createDungeonEntrance(level + 1);

    this.createTable();
  }
}

export class Labyrinth extends location.Location {
    /**
   *
   * @param max - maximum line's length
   * @returns {Object} where startY and startX - start point of the line
   */
  getLineParams(max) {
    const ret = {};

    ret.startY = common.getRandomInt(0, this.locationSize - max - 1);
    ret.startX = common.getRandomInt(0, this.locationSize - max - 1);
    ret.length = common.getRandomInt(3, max);

    return ret;
  }

  /**
   * draw horizontal line on the Map
   * @param max - maximum line's length
   */
  createHorizontalLine(max) {
    const params = this.getLineParams(max);

    for (let i = 0; i < params.length; i++) {
      // add a wall
      this.locationMap[params.startY][params.startX + i] = 0.1;
    }
  }

  /**
   * draw vertical line on the Map
   * @param max - maximum line's length
   */
  createVerticalLine(max) {
    const params = this.getLineParams(max);

    for (let i = 0; i < params.length; i++) {
      // add a wall
      this.locationMap[params.startY + i][params.startX] = 0.1;
    }
  }

  generate (level) {
    for (let i = 0; i < this.locationMap.length; i++) {
      for (let ii = 0; ii < this.locationSize; ii++) {
        // add a ground
        this.locationMap[i].push(1.1);
      }
    }

    for (let i = 0; i < 100; i++) {
      if (i % 2 === 0) {
        this.createHorizontalLine(10);
      }
      if (i % 2 === 1) {
        this.createVerticalLine(10);
      }
    }

    // add exit from current dungeon level to top level
    this.createDungeonExit(level);

    // add entrance from current dungeon level to bottom level
    this.createDungeonEntrance(level + 1);

    this.createTable();
  }
}
