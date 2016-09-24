'use strict';

const common = require('./../common');
const randomLocation = require('./RandomLocation');

export class RandomDungeonLocation extends randomLocation.RandomLocation {
  generateDungeonEntrances (level) {
    // add exit from current dungeon level to top level
    this.createDungeonExit(level);

    // add entrance from current dungeon level to bottom level
    this.createDungeonEntrance(level + 1);
  }
}
