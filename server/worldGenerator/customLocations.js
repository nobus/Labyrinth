'use strict';

const common = require('./../common');
const location = require('./Location');
const randomLocation = require('./RandomLocation');


export class ForestLocation extends randomLocation.RandomLocation {
  setUp () {
    this.background = 'grass0';

    this.elements.grass0 = 800;
    this.elements.tree0 = 170;
    this.elements.stump0 = 15;
    this.elements.stump1 = 15;

    this.minMutationRate = 1;
    this.maxMutationRate = 20;
  }
}

export class MeadowLocation extends randomLocation.RandomLocation {
  setUp () {
    this.background = 'grass0';

    this.elements.grass0 = 950;
    this.elements.tree0 = 40;
    this.elements.stump0 = 5;
    this.elements.stump1 = 5;

    this.minMutationRate = 1;
    this.maxMutationRate = 20;
  }
}

export class Cave extends randomLocation.RandomLocation {
  setUp () {
    this.background = 'ground0';

    this.elements.ground0 = 900;
    this.elements.rock0 = 100;

    this.minMutationRate = 1;
    this.maxMutationRate = 20;
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
        this.locationMap[i].push(undefined);
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
      lineType = undefined;
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
