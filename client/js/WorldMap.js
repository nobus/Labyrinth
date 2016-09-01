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
    this.renderer.resize(SIZE, SIZE);

    $(this.divClass).empty();
    $(this.divClass).append(this.renderer.view);

    animate();

    function animate () {
      requestAnimationFrame(animate);
      renderer.render(stage);
    }

    const forest = new PIXI.Sprite(PIXI.loader.resources['img/worldmap.json'].textures['map_forest.png']);
    this.stage.addChild(forest);
  }
}
