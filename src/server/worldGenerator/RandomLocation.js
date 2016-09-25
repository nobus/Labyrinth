'use strict';

const common = require('./../common');
const location = require('./Location');

export class RandomLocation extends location.Location {
  calculateRanges () {
    const elemKeys = Object.keys(this.elements);

    let ranges = [];
    let sumK = 0;

    for (let i = 0; i < elemKeys.length; i++) {
      const k = elemKeys[i];
      const range = {'name': k, 'range': []};

      range.range.push(sumK);
      sumK += this.elements[k];
      range.range.push(sumK);

      ranges.push(range);
    }

    return [ranges, sumK];
  }

  createElement (sumK, ranges) {
    const r = common.getRandomInt(0, sumK);

    for (let i = 0; i < ranges.length; i++) {
      if (r >= ranges[i]['range'][0] && r <= ranges[i]['range'][1]) {
        const name = ranges[i]['name'];

        if (name === this.background) {
          return undefined;
        } else {
          return this.idMapper.getId(name);
        }
      }
    }
  }

  generateDungeonEntrances (level) {}

  generate (level) {
    const r = this.calculateRanges();
    const ranges = r[0];
    const sumK = r[1];

    for (let y = 0; y < this.locationSize; y++) {
      for (let x = 0; x < this.locationSize; x++) {
        this.locationMap[y].push(this.createElement(sumK, ranges));
      }
    }

    this.generateDungeonEntrances(level);
    this.writeNewLocationMap();
  }

  mutator () {
    const buffer = [];

    const c = this.calculateRanges();
    const ranges = c[0];
    const sumK = c[1];

    for (let i = 0; i < common.getRandomInt(this.minMutationRate, this.maxMutationRate); i++) {
      const x = common.getRandomInt(0, this.locationSize - 1);
      const y = common.getRandomInt(0, this.locationSize - 1);
      const eType = this.createElement(sumK, ranges);

      buffer.push({x: x, y: y, type: eType});
    }

    return buffer;
  }
}
