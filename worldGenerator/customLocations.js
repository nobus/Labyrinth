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

    this.createTable();
  }
}
