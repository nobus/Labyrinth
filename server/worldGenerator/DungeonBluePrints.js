'use strict';

const common = require('./../server/common');
const customLocations = require('./customLocations');


export class DungeonBluePrints {
  constructor (number, worldSize, locationSize) {
    this.number = number;
    this.worldSize = worldSize;
    this.locationSize = locationSize;

    this.blueprints = {};

    this.locationTypes = [customLocations.Cave, customLocations.Labyrinth];
  }

  getLocationType () {
    const location = this.locationTypes[common.getRandomInt(0, this.locationTypes.length - 1)];
    return location.name;
  }

  generate () {
    let levelCounter = 0;

    while (this.number) {
      let lx = common.getRandomInt(0, this.worldSize - 1);
      let ly = common.getRandomInt(0, this.worldSize - 1);

      let locationId = `location_${ly}_${lx}`;

      if (locationId in this.blueprints) continue;

      this.number--;

      let dungeonId = `dungeon_${this.number}`;

      let levels = common.getRandomInt(1, this.worldSize);
      levelCounter += levels;

      let entrances = [];
      let neighbors = {};
      let firstLevelId = undefined;

      for (let l = 0; l < levels; l++) {
        let x = common.getRandomInt(0, this.locationSize - 1);
        let y = common.getRandomInt(0, this.locationSize - 1);

        entrances.push([x, y]);

        let dungLocationId = DungeonBluePrints.getDungeonLocationId(dungeonId, l);
        neighbors[dungLocationId] = {};
        neighbors[dungLocationId].locationType = this.getLocationType();

        if (l === 0) {
          // first level
          neighbors[dungLocationId].over = locationId;

          if (levels > 1)
            neighbors[dungLocationId].under = DungeonBluePrints.getDungeonLocationId(dungeonId, l + 1);

          firstLevelId = dungLocationId;
        } else if (l === (levels - 1)) {
          // last level
          neighbors[dungLocationId].over = DungeonBluePrints.getDungeonLocationId(dungeonId, l - 1);
        } else {
          // some middle levels
          neighbors[dungLocationId].over = DungeonBluePrints.getDungeonLocationId(dungeonId, l - 1);
          neighbors[dungLocationId].under = DungeonBluePrints.getDungeonLocationId(dungeonId, l + 1);
        }
      }

      this.blueprints[locationId] = {
        'dungeonId': dungeonId,
        'levels': levels,
        'entrances': entrances,
        'neighbors': neighbors,
        'firstLevelId': firstLevelId
      };
    }

    return levelCounter;
  }

  getBluePrints (locationId) {
    return this.blueprints[locationId];
  }

  static getDungeonLocationId (dungeonId, level) {
    return `${dungeonId}_${level}`;
  }
}
