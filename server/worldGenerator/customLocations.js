'use strict';

const common = require('./../common');
const location = require('./Location');

export class ForestLocation extends location.Location {
  setUp () {
    this.background = 'grass0';
  }

  generate () {
    for (let i = 0; i < this.locationMap.length; i++) {
      for (let ii = 0; ii < this.locationSize; ii++) {
        let x = common.getRandomInt(0, 1000);

        if (x <= 750) {
          // add grass
          this.locationMap[i].push(this.idMapper.getId('grass0'));
        } else if (x > 750 && x < 900) {
          // add tree
          this.locationMap[i].push(this.idMapper.getId('tree0'));
        } else if (x > 900 && x < 940) {
          //add stump1
          this.locationMap[i].push(this.idMapper.getId('stump0'));
        } else if (x > 940 && x < 980) {
          //add stump2
          this.locationMap[i].push(this.idMapper.getId('stump1'));
        } else {
          // add ground
          this.locationMap[i].push(this.idMapper.getId('ground0'));
        }
      }
    }

    this.createDungeonEntrance(-1);

    this.writeNewLocationMap();
  }

  mutator () {
    const buffer = [];

    for (let i = 0; i < common.getRandomInt(1, 20); i++) {
      const x = common.getRandomInt(0, this.locationSize - 1);
      const y = common.getRandomInt(0, this.locationSize - 1);

      const t = common.getRandomInt(0, 1000);

      let eType;
      if (t <= 750) {
        // add grass
        eType = this.idMapper.getId('grass0');
      } else if (t > 750 && t < 900) {
        // add tree
        eType = this.idMapper.getId('tree0');
      } else if (t > 900 && t < 940) {
        // add stump1
        eType = this.idMapper.getId('stump0');
      } else if (t > 940 && t < 980) {
        // add stump2
        eType = this.idMapper.getId('stump1');
      } else {
        // add ground
        eType = this.idMapper.getId('ground0');
      }
      buffer.push({x: x, y: y, type: eType});
    }
    return buffer;
  }
}

export class MeadowLocation extends location.Location {
  setUp () {
    this.background = 'grass0';
  }

  generate () {
    for (let i = 0; i < this.locationMap.length; i++) {
      for (let ii = 0; ii < this.locationSize; ii++) {
        let x = common.getRandomInt(0, 100);

        if (x <= 95) {
          // add grass
          this.locationMap[i].push(this.idMapper.getId('grass0'));
        } else if (x > 95 && x < 97) {
          // add tree
          this.locationMap[i].push(this.idMapper.getId('tree0'));
        } else if (x === 98) {
          // add stump1
          this.locationMap[i].push(this.idMapper.getId('stump0'));
        } else {
          // add ground
          this.locationMap[i].push(this.idMapper.getId('ground0'));
        }
      }
    }

    this.createDungeonEntrance(-1);

    this.writeNewLocationMap();
  }


  mutator () {
    const buffer = [];

    for (let i = 0; i < common.getRandomInt(1, 20); i++) {
      const x = common.getRandomInt(0, this.locationSize - 1);
      const y = common.getRandomInt(0, this.locationSize - 1);

      const t = common.getRandomInt(0, 100);

      let eType;
      if (t <= 95) {
        // add grass
        eType = this.idMapper.getId('grass0');
      } else if (t > 95 && t < 97) {
        // add tree
        eType = this.idMapper.getId('tree0');
      } else if (x === 98) {
        // add stump1
        eType = this.idMapper.getId('stump0');
      } else {
        // add ground
        eType = this.idMapper.getId('ground0');
      }

      buffer.push({x: x, y: y, type: eType});
    }

    return buffer;
  }
}

export class Cave extends location.Location {
  setUp () {
    this.background = 'ground0';
  }

  generate (level) {
    for (let i = 0; i < this.locationMap.length; i++) {
      for (let ii = 0; ii < this.locationSize; ii++) {
        let x = common.getRandomInt(0, 100);

        if (x <= 90) {
          // add ground
          this.locationMap[i].push(this.idMapper.getId('ground0'));
        } else {
          // add wall
          this.locationMap[i].push(this.idMapper.getId('rock0'));
        }
      }
    }

    // add exit from current dungeon level to top level
    this.createDungeonExit(level);

    // add entrance from current dungeon level to bottom level
    this.createDungeonEntrance(level + 1);

    this.writeNewLocationMap();
  }

  mutator () {
    const buffer = [];

    for (let i = 0; i < common.getRandomInt(1, 20); i++) {
      const x = common.getRandomInt(0, this.locationSize - 1);
      const y = common.getRandomInt(0, this.locationSize - 1);

      const t = common.getRandomInt(0, 100);

      let eType;
      if (t <= 90) {
        // add ground
        eType = this.idMapper.getId('ground0');
      } else {
        // add wall
        eType = this.idMapper.getId('rock0');
      }

      buffer.push({x: x, y: y, type: eType});
    }

    return buffer;
  }
}

export class Labyrinth extends location.Location {
  setUp () {
    this.background = 'ground0';
  }

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
      this.locationMap[params.startY][params.startX + i] = this.idMapper.getId('rock0');
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
      this.locationMap[params.startY + i][params.startX] = this.idMapper.getId('rock0');
    }
  }

  generate (level) {
    for (let i = 0; i < this.locationMap.length; i++) {
      for (let ii = 0; ii < this.locationSize; ii++) {
        // add a ground
        this.locationMap[i].push(this.idMapper.getId('ground0'));
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

    this.writeNewLocationMap();
  }

  mutator () {
    const buffer = [];
    const params = this.getLineParams(10);

    // 0 === wall
    // 1 === ground
    let lineType = common.getRandom(0, 1);

    if (lineType === 0) {
      lineType = this.idMapper.getId('rock0');
    } else if (lineType === 1) {
      lineType = this.idMapper.getId('ground0');
    }

    const directionType = common.getRandomInt(0, 1);

    for (let i = 0; i < params.length; i++) {
      if (directionType === 0) // horizontal
        buffer.push({x: params.startX + i, y: params.startY, type: lineType});
      else  // vertical
        buffer.push({x: params.startX, y: params.startY + i, type: lineType});
    }

    return buffer;
  }
}
