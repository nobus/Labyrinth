'use strict';

var playerSprites = {};

function createPlayerSprite(login, myLogin, y, x, stage, mapContainer) {
  const playerSprite = new PIXI.Sprite(
    PIXI.loader.resources['img/player.json'].textures['player_left.png']);

  playerSprites[login] = playerSprite;

  if (login === myLogin) {
    playerSprite.y = SIZE / 2;
    playerSprite.x = SIZE / 2;

    stage.addChild(playerSprite);
    setMapAroundPlayer(mapContainer, y, x);
  } else {
    mapContainer.addChild(playerSprite);
    movePlayer(login, y, x);
  }
}

function removePlayerSprite(login, mapContainer) {
  const playerSprite = playerSprites[login];

  if (playerSprite) {
    mapContainer.removeChild(playerSprite);
    delete playerSprite[login];
  }
}

function movePlayer(login, y, x) {
  playerSprites[login].y = y * SPRITE_SIZE;
  playerSprites[login].x = x * SPRITE_SIZE;
}

function changePosition(login, myLogin, mapContainer, direction, y, x) {
  if (login === myLogin) {
    if (direction === undefined) {
      // it is first message after connect
      mapContainer.y -= y * SPRITE_SIZE;
      mapContainer.x -= x * SPRITE_SIZE;
    } else {
      moveMapAroundPlayer(mapContainer, direction);
    }
  } else {
    movePlayer(login, y, x);
  }
}
