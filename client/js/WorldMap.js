'use strict';

class WorldMap {
  constructor (worldMap, locationId, divClass) {
    this.worldMap = worldMap;
    this.divClass = divClass;
    this.locationId = locationId;

    const stage = new PIXI.Container();
    const renderer = PIXI.autoDetectRenderer(0, 0, {antialias: false, transparent: false, resolution: 1});

    this.stage = stage;
    this.renderer = renderer;

    this.renderer.view.style.position = "absolute";
    this.renderer.view.style.display = "block";
    this.renderer.autoResize = true;

    $(this.divClass).empty();
    $(this.divClass).append(this.renderer.view);

    this.createMap();

    animate();

    function animate () {
      requestAnimationFrame(animate);
      renderer.render(stage);
    }
  }

  getLocationCoord (locationName) {
    const a = locationName.split('_');

    if (a.length === 3 && a[0] === 'location') {
      return {y: a[1], x: a[2]}
    }
  }

  getSprite (spriteType) {
    if (spriteType === 'MeadowLocation') {
      return new PIXI.Sprite(PIXI.loader.resources['img/worldmap.json'].textures['map_meadow.png']);
    } else if (spriteType === 'ForestLocation') {
      return new PIXI.Sprite(PIXI.loader.resources['img/worldmap.json'].textures['map_forest.png']);
    } else if (spriteType === 'dungeon') {
      return new PIXI.Sprite(PIXI.loader.resources['img/worldmap.json'].textures['map_dungeon_entrance.png']);
    } else if (spriteType === 'gamer') {
      return new PIXI.Sprite(PIXI.loader.resources['img/worldmap.json'].textures['gamer_position.png']);
    }
   }

  createMap () {
    this.gamerSprite;

    const locations = Object.keys(this.worldMap).filter( (e) => {
      if (e.indexOf('location_') === 0) return e;
    })
    .sort()
    .forEach ( (k) => {
      const coord = this.getLocationCoord(k);

      const locationType = this.worldMap[k].locationType;
      const dungeon = this.worldMap[k].under;

      const locSprite = this.getSprite(locationType);
      locSprite.x = coord.x * SPRITE_SIZE;
      locSprite.y = coord.y * SPRITE_SIZE;

      this.stage.addChild(locSprite);

      if (dungeon) {
        const dungSprite = this.getSprite('dungeon');
        dungSprite.x = coord.x * SPRITE_SIZE;
        dungSprite.y = coord.y * SPRITE_SIZE;

        this.stage.addChild(dungSprite);
      }

      if (k === this.locationId) {
        this.gamerSprite = this.getSprite('gamer');
        this.gamerSprite.x = coord.x * SPRITE_SIZE;
        this.gamerSprite.y = coord.y * SPRITE_SIZE;

        this.stage.addChild(this.gamerSprite);
      }
    });
  }

  moveGamer (locationId) {
    const coord = this.getLocationCoord(locationId);

    if (coord) {
      this.gamerSprite.x = coord.x * SPRITE_SIZE;
      this.gamerSprite.y = coord.y * SPRITE_SIZE;
    }
  }
}
