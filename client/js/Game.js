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

  /**
   * First step is initialization game scene for location,
   * where user is staying.
   * @param {object} message this is an object with some fields:
   *        initLocationScene.locationId
   *        initLocationScene.allMap the map of current location
   *        initLocationScene.spriteConf the sprite config for map drawing
   *        initLocationScene.login this is login of current user
   *        initLocationScene.y and initLocationScene.y this is coord of current user
   *        initLocationScene.anotherUsers this is other users in the current location
   */
  initLocationScene (message) {
    document.title = `Test client, ${message.initLocationScene.locationId}`;

    this.playerSprites = {};
    this.initGameStage();

    drawMap(message.initLocationScene.allMap,
      this.mapContainer,
      message.initLocationScene.spriteConf);

    if (this.worldMap)
      this.worldMap.moveGamer(message.initLocationScene.locationId);

    const y = message.initLocationScene.y;
    const x = message.initLocationScene.x;

    // add sprite for user
    this.playerSprites[this.myLogin] = createPlayerSprite(this.myLogin,
                                                          this.myLogin,
                                                          y, x,
                                                          gameStage,
                                                          this.mapContainer,
                                                          message.initLocationScene.direction);

    // move location's map
    this.mapContainer.y -= y * SPRITE_SIZE;
    this.mapContainer.x -= x * SPRITE_SIZE;

    // add another users to the stage
    message.initLocationScene.anotherUsers.forEach(user => {
      if (user.login !== this.myLogin)
          this.playerSprites[user.login] = createPlayerSprite(user.login,
                                                              this.myLogin,
                                                              user.position.y,
                                                              user.position.x,
                                                              gameStage,
                                                              this.mapContainer,
                                                              user.position.direction);
    });
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

  /**
   * change direction
   *
   * @param {object} message this is an object with some fields:
   *        changeDirection.login
   *        changeDirection.x
   *        changeDirection.y
   *        changeDirection.direction
   */
  changeDirection (message) {
    const login = message.changeDirection.login;

    if (this.playerSprites[login]) {
      const x = message.changeDirection.x;
      const y = message.changeDirection.y;
      const direction = message.changeDirection.direction;

      if (login === this.myLogin) {
        this.removeCurrentPlayerSprite(login);
        const playerSprite = this.createPlayerSprite(direction);

        playerSprite.y = SIZE / 2;
        playerSprite.x = SIZE / 2;

        gameStage.addChild(playerSprite);
        this.playerSprites[login] = playerSprite;
      } else {
        this.removeAnotherPlayerSprite(login);
        const playerSprite = this.createPlayerSprite(direction);

        playerSprite.y = y * SPRITE_SIZE;
        playerSprite.x = x * SPRITE_SIZE;

        this.playerSprites[login] = playerSprite;
        this.mapContainer.addChild(playerSprite);
      }
    }
  }

  /**
   * Add user to the game stage
   * @param {object} message this is an object with some fields:
   *        addUserToLocation.login
   *        addUserToLocation.position.y
   *        addUserToLocation.position.x
   *        addUserToLocation.position.direction
   */
  addUserToLocation (message) {
    const login = message.addUserToLocation.login;
    const y = message.addUserToLocation.position.y;
    const x = message.addUserToLocation.position.x;

    if (login !== this.myLogin)
      this.playerSprites[login] = createPlayerSprite(login,
                                                     this.myLogin, y, x,
                                                     gameStage, this.mapContainer,
                                                     message.addUserToLocation.position.direction);
  }

  /**
   * Remove user from the game stage
   * @param {object} message this is an object with some fields:
   *                 removeUserToLocation.login
   */
  removeUserFromLocation (message) {
    this.removeAnotherPlayerSprite(message.removeUserFromLocation);
  }

  /**
   * Remove player sprite from the gameStage. Use for himself only.
   *
   * @param {string} login
   */
  removeCurrentPlayerSprite (login) {
    const playerSprite = this.playerSprites[login];

    if (playerSprite) {
      gameStage.removeChild(playerSprite);
      delete this.playerSprites[login];
    }
  }

  /**
   * Remove player sprite from the mapContainer. Don't use for himself.
   *
   * @param {string} login
   */
  removeAnotherPlayerSprite (login) {
    const playerSprite = this.playerSprites[login];

    if (playerSprite) {
      this.mapContainer.removeChild(playerSprite);
      delete this.playerSprites[login];
    }
  }

  /**
   * Create player sprite.
   *
   * @param {string} login
   */
  createPlayerSprite (direction='left') {
    return new PIXI.Sprite(
        PIXI.loader.resources['img/player.json'].textures[`player_${direction}.png`]);
  }
}
