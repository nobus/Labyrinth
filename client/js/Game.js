'use strict';

var gameStage, gameRenderer;

class Game {
  constructor (myLogin) {
    this.myLogin = myLogin;
    this.worldMap;
    this.playerSprites = {};

    this.initGameStage();

    animate();

    function animate () {
      requestAnimationFrame(animate);
      gameRenderer.render(gameStage);
    }
  }

  initGameStage () {
    // Initial game stage
    gameStage = new PIXI.Container();

    gameRenderer = PIXI.autoDetectRenderer(0, 0, {antialias: false, transparent: false, resolution: 1});
    gameRenderer.view.style.position = "absolute";
    gameRenderer.view.style.display = "block";
    gameRenderer.autoResize = true;
    gameRenderer.resize(SIZE, SIZE);

    this.mapContainer = new PIXI.Container();
    this.mapContainer.x = 0;
    this.mapContainer.y = 0;

    gameStage.addChild(this.mapContainer);

    $('.canvas').empty();
    $('.canvas').append(gameRenderer.view);
  }

  initScene (message) {
    document.title = `Test client, ${message.locationId}`;

    this.playerSprites = {};
    this.initGameStage();

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
      this.playerSprites[login] = createPlayerSprite(login, this.myLogin, y, x, gameStage, this.mapContainer);
    }

    if (login === this.myLogin) {
      changePosition(this.mapContainer, message.changePosition.direction, y, x);
    } else {
      this.playerSprites[login].y = y * SPRITE_SIZE;
      this.playerSprites[login].x = x * SPRITE_SIZE;
    }
  }

  removeFromLocation (message) {
    removePlayerSprite(message.removeFromLocation, this.mapContainer);
  }

}
