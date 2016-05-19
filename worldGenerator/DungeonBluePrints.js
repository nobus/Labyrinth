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
    const idList = [];

    while (this.number) {
      let lx = common.getRandomInt(0, this.worldSize - 1);
      let ly = common.getRandomInt(0, this.worldSize - 1);

      let locationId = `location_${ly}_${lx}`;

      if (idList.indexOf(locationId) > -1) continue;

      idList.push(locationId);
      this.number--;

      let dungeonId = `dungeon_${this.number}`;

      let levels = common.getRandomInt(1, this.worldSize);

      let entrances = [];
      for (let l = 0; l < levels; l++) {
        let x = common.getRandomInt(0, this.locationSize - 1);
        let y = common.getRandomInt(0, this.locationSize - 1);

        entrances.push([x, y]);
      }

      this.blueprints[dungeonId] = {
        'locationId': locationId,
        'levels': levels,
        'entrances': entrances
      };
    }
  }
}
