'use strict';

var gameStage, gameRenderer;

class Game {
  constructor (myLogin) {
    this.myLogin = myLogin;
    this.worldMap;
    this.playerSprites = {};

    this.initGameStage();

    this.messageContainer = new MessageContainer(this.myLogin);

    animate();

    this.garbageCollector(this.mapContainer);

    function animate () {
      requestAnimationFrame(animate);
      gameRenderer.render(gameStage);
    }
  }

  /**
   * This method remove old messages
   * from the game stage or mapContainer.
   */
  garbageCollector () {
    setInterval ( () => {
        for (let elem of this.messageContainer.messages) {
          const messageObj = elem[1];

          if (messageObj && messageObj.gameTTL && messageObj.gameTTL < Date.now()) {
            const login = elem[0];

            if (login === this.myLogin) this.messageContainer.deleteMyMessage();
            else this.messageContainer.deleteAnotherMessage(login, this.mapContainer);
          }
        }
    }, 1000);
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
    this.createCurrentPlayer(message.initLocationScene.direction);
    setMapAroundPlayer(this.mapContainer, y, x);

    // move location's map
    this.mapContainer.y -= y * SPRITE_SIZE;
    this.mapContainer.x -= x * SPRITE_SIZE;

    // add another users to the stage
    message.initLocationScene.anotherUsers.forEach(user => {
      if (user.login !== this.myLogin)
        this.createAnotherPlayer(user.login,
          user.position.x, user.position.y,
          user.position.direction)
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
      if (login === this.myLogin) {
        this.createCurrentPlayer();
        setMapAroundPlayer(this.mapContainer, y, x);
      } else {
        this.createAnotherPlayer(login, x, y);
      }
    }

    if (login === this.myLogin) {
      if (message.changePosition.direction === undefined) {
        // it is first message after connect
        this.mapContainer.y -= y * SPRITE_SIZE;
        this.mapContainer.x -= x * SPRITE_SIZE;
      } else {
        moveMapAroundPlayer(this.mapContainer, message.changePosition.direction);
      }

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
        this.createCurrentPlayer(direction);
      } else {
        this.removeAnotherPlayerSprite(login);
        this.createAnotherPlayer(login, x, y, direction);
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
      this.createAnotherPlayer(login, x, y, message.addUserToLocation.position.direction);
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
   * @param {string} direction
   */
  createPlayerSprite (direction='left') {
    return new PIXI.Sprite(
        PIXI.loader.resources['img/player.json'].textures[`player_${direction}.png`]);
  }

  /**
   * Create player sprite for current user.
   *
   * @param {string} direction
   */
  createCurrentPlayer (direction) {
    const playerSprite = this.createPlayerSprite(direction);

    playerSprite.y = SIZE / 2;
    playerSprite.x = SIZE / 2;

    gameStage.addChild(playerSprite);
    this.playerSprites[this.myLogin] = playerSprite;
  }

  /**
   * Create player sprite for another user.
   *
   * @param {string} login
   * @param {number} x
   * @param {number} y
   * @param {string} direction
   */
  createAnotherPlayer (login, x, y, direction) {
    const playerSprite = this.createPlayerSprite(direction);

    playerSprite.y = y * SPRITE_SIZE;
    playerSprite.x = x * SPRITE_SIZE;

    this.mapContainer.addChild(playerSprite);
    this.playerSprites[login] = playerSprite;
  }

  /**
   * Print message from player.
   *
   * @param {string} message
   */
  printMessage (message) {
    // strange protocol =(((
    const login = message.message.login;
    const messageText = message.message.message;

    if (login === this.myLogin) {
      this.messageContainer.printMyMessage(messageText);
    } else {
      const x = this.playerSprites[login].x;
      const y = this.playerSprites[login].y;
      this.messageContainer.printAnotherMessage(messageText, login, this.mapContainer, x, y);
    }
  }
}
