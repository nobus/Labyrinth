'use strict';

class SpriteFactory {
  constructor (background, spriteConf) {
    this.background = background;

    const types = ['static', 'dynamic'];
    this.cache = {};

    types.forEach( (t) => {
      const blockTypes = Object.keys(spriteConf[t]);

      blockTypes.forEach( (bt) => {
        for (let i = 0; i < spriteConf[t][bt].length; i++) {
          this.cache[spriteConf['ranges'][t][bt][0] + i] = spriteConf[t][bt][i]['name'];
        }
      });
    });
  }

  getSprite (id) {
    if (this.cache[id] != this.background) {
      const name = `${this.cache[id]}.png`;
      return new PIXI.Sprite(PIXI.loader.resources['img/terrain.json'].textures[name]);
    }
  }
}
