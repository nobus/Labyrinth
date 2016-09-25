'use strict';

const common = require('./../common');
const customLocations = require('./customLocations');


export class SurfaceBluePrints {
  constructor(worldSize, dungeonBluePrints) {
    this.worldSize = worldSize;
    this.dungeonBluePrints = dungeonBluePrints;

    this.blueprints = {};
    this.startLocationId = undefined;

    this.locationTypes = [customLocations.ForestLocation, customLocations.MeadowLocation, customLocations.Swamp];
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
    for (let y = 0; y < this.worldSize; y++) {
      for (let x = 0; x < this.worldSize; x++) {
        const locationId = `location_${y}_${x}`;

        this.blueprints[locationId] = {};
        this.blueprints[locationId].locationType = this.getLocationType();

        // for the toroidal topology
        if (y === 0) {
          this.blueprints[locationId].up = `location_${this.worldSize - 1}_${x}`;
        }

        if (y === this.worldSize - 1) {
          this.blueprints[locationId].down = `location_0_${x}`;
        }

        if (x === 0) {
          this.blueprints[locationId].left = `location_${y}_${this.worldSize - 1}`;
        }

        if (x === this.worldSize - 1) {
          this.blueprints[locationId].right = `location_${y}_0`;
        }

        // for the common neighbors
        if (y > 0) {
          this.blueprints[locationId].up = `location_${y - 1}_${x}`;
        }

        if (y < this.worldSize - 1) {
          this.blueprints[locationId].down = `location_${y + 1}_${x}`;
        }

        if (x > 0) {
          this.blueprints[locationId].left = `location_${y}_${x - 1}`;
        }

        if (x < this.worldSize - 1) {
          this.blueprints[locationId].right = `location_${y}_${x + 1}`;
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
