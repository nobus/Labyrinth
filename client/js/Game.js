'use strict';

var stage, renderer;

class Game {
  constructor (myLogin) {
    this.myLogin = myLogin;
    this.worldMap;
    this.playerSprites = {};

    this.initNewStage();

    animate();

    function animate () {
      requestAnimationFrame(animate);
      renderer.render(stage);
    }
  }

  initNewStage () {
    // Initial game stage
    stage = new PIXI.Container();

    renderer = PIXI.autoDetectRenderer(0, 0, {antialias: false, transparent: false, resolution: 1});
    renderer.view.style.position = "absolute";
    renderer.view.style.display = "block";
    renderer.autoResize = true;
    renderer.resize(SIZE, SIZE);

    this.mapContainer = new PIXI.Container();
    this.mapContainer.x = 0;
    this.mapContainer.y = 0;

    stage.addChild(this.mapContainer);

    $('.canvas').empty();
    $('.canvas').append(renderer.view);
  }

  initScene (message) {
    document.title = `Test client, ${message.locationId}`;

    this.playerSprites = {};
    this.initNewStage();

    drawMap(message.allMap, this.mapContainer, message.spriteConf);

    if (this.worldMap) this.worldMap.moveGamer(message.locationId);
  }

  initWorldMap (message) {
    this.worldMap = new WorldMap(message.worldMap,
                                  message.locationId,
                                  '.world-map');
  }

  changeMap (message) {
    changeMap(message.changeMap, this.mapContainer);
  }

  changePosition (message) {
    const login = message.changePosition.login;
    const y = message.changePosition.y;
    const x = message.changePosition.x;

    if (this.playerSprites[login] === undefined || message.allMap) {
      this.playerSprites[login] = createPlayerSprite(login, this.myLogin, y, x, stage, this.mapContainer);
    }

    changePosition(login, this.myLogin, this.mapContainer, message.changePosition.direction, y, x);
  }

  removeFromLocation (message) {
    removePlayerSprite(message.removeFromLocation, this.mapContainer);
  }

}
