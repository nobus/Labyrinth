'use strict';

export class SurfaceBluePrints {
  constructor(worldSize, dungeonBluePrints) {
    this.worldSize = worldSize;
    this.dungeonBluePrints = dungeonBluePrints;

    this.blueprints = {};
    this.startLocationId = undefined;
  }

  setStartLocationId () {
    const c = Math.floor(this.worldSize / 2);
    this.startLocationId = `location_${c}_${c}`;
  }

  getStartLocationId () {
    return this.startLocationId;
  }

  generate () {
    for (let i = 0; i < this.worldSize; i++) {
      for (let ii =0; ii < this.worldSize; ii++) {
        const locationId = `location_${i}_${ii}`;

        this.blueprints[locationId] = {};

        if (i > 0) {
          this.blueprints[locationId].up = `location_${i - 1}_${ii}`;
        }

        if (i < this.worldSize - 1) {
          this.blueprints[locationId].down = `location_${i + 1}_${ii}`;
        }

        if (ii > 0) {
          this.blueprints[locationId].left = `location_${i}_${ii - 1}`;
        }

        if (ii < this.worldSize - 1) {
          this.blueprints[locationId].right = `location_${i}_${ii + 1}`;
        }

        const dungeonBP = this.dungeonBluePrints.getBluePrints(locationId);

        if (dungeonBP) {
          this.blueprints[locationId].under = dungeonBP.firstLevelId;
        }
      }
    }

    this.setStartLocationId();
  }

  getBluePrints (locationId) {
    return this.blueprints[locationId];
  }
}
