'use strict';

const common = require('./../server/common');
const customLocations = require('./customLocations');


export class SurfaceBluePrints {
  constructor(worldSize, dungeonBluePrints) {
    this.worldSize = worldSize;
    this.dungeonBluePrints = dungeonBluePrints;

    this.blueprints = {};
    this.startLocationId = undefined;

    this.locationTypes = [customLocations.ForestLocation, customLocations.MeadowLocation];
  }

  setStartLocationId () {
    const c = Math.floor(this.worldSize / 2);
    this.startLocationId = `location_${c}_${c}`;
  }

  getStartLocationId () {
    return this.startLocationId;
  }

  getLocationType () {
    const location = this.locationTypes[common.getRandomInt(0, this.locationTypes.length - 1)];
    return location.name;
  }

  generate () {
    for (let i = 0; i < this.worldSize; i++) {
      for (let ii =0; ii < this.worldSize; ii++) {
        const locationId = `location_${i}_${ii}`;

        this.blueprints[locationId] = {};
        this.blueprints[locationId].locationType = this.getLocationType();

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

    return Math.pow(this.worldSize, 2);
  }

  getBluePrints (locationId) {
    return this.blueprints[locationId];
  }
}
