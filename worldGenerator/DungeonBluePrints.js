'use strict';

const common = require('./../server/common');

export class DungeonBluePrints {
  constructor (number, worldSize, locationSize) {
    this.number = number;
    this.worldSize = worldSize;
    this.locationSize = locationSize;

    this.blueprints = {};
  }


  generate () {
    for (let i = 0; i < this.worldSize; i++) {
      let lx = common.getRandomInt(0, this.worldSize - 1);
      let ly = common.getRandomInt(0, this.worldSize - 1);

      let locId = `location_${ly}_${lx}`;

      let levels = common.getRandomInt(1, this.worldSize);

      let entrances = [];
      for (let l = 0; l < levels; l++) {
        let x = common.getRandomInt(0, this.locationSize - 1);
        let y = common.getRandomInt(0, this.locationSize - 1);

        entrances.push([x, y]);
      }

      this.blueprints[locId] = {
        'levels': levels,
        'entrances': entrances
      };
    }
  }
}
