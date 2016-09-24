'use strict';

const common = require('./../common');
const randomLocation = require('./RandomLocation');

export class RandomSurfaceLocation extends randomLocation.RandomLocation {
  generateDungeonEntrances (level) {
    this.createDungeonEntrance(-1);
  }
}
