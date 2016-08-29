'use strict';

const conf = require('./mapObjectsConf');

export class IdMapper {
  constructor () {
    this.map = {};

    // static
    this.initSet('static', 'halfBlock');
    this.initSet('static', 'block');

    // dynamic
    this.initSet('dynamic', 'block');
    this.initSet('dynamic', 'halfBlock');
    this.initSet('dynamic', 'entrances');
    this.initSet('dynamic', 'exits')
    this.initSet('dynamic', 'noBlock');
  }

  initSet(type1, type2) {
    for (let i = 0; i < conf[type1][type2].length; i++) {
      const e = conf[type1][type2][i].name;
      this.map[e] = conf.ranges[type1][type2][0] + i;
    }
  }

  getId (name) {
    return this.map[name];
  }

  getConf () {
    return conf;
  }

  isEntrance (id) {
    if (id >= conf.ranges.dynamic.entrances[0]
      && id <= conf.ranges.dynamic.entrances[1]) {
        return true;
      }
  }

  isExit (id) {
    if (id >= conf.ranges.dynamic.exits[0]
      && id <= conf.ranges.dynamic.exits[1]) {
        return true;
      }
  }

  isNoBlock (id) {
    if (id >= conf.ranges.dynamic.noBlock[0]) {
      return true;
    }
  }
}
