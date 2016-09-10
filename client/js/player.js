'use strict';

var playerSprites = {};

function createPlayerSprite(login, myLogin, y, x, stage, mapContainer, direction='left') {
  const playerSprite = new PIXI.Sprite(
    PIXI.loader.resources['img/player.json'].textures[`player_${direction}.png`]);

  playerSprites[login] = playerSprite;

  if (login === myLogin) {
    playerSprite.y = SIZE / 2;
    playerSprite.x = SIZE / 2;

    stage.addChild(playerSprite);
    setMapAroundPlayer(mapContainer, y, x);
  } else {
    mapContainer.addChild(playerSprite);
    playerSprite.y = y * SPRITE_SIZE;
    playerSprite.x = x * SPRITE_SIZE;
  }

  return playerSprite;
}

function removePlayerSprite(login, mapContainer) {
  const playerSprite = playerSprites[login];

  if (playerSprite) {
    mapContainer.removeChild(playerSprite);
    delete playerSprites[login];
  }
}

function changePosition(mapContainer, direction, y, x) {
  if (direction === undefined) {
    // it is first message after connect
    mapContainer.y -= y * SPRITE_SIZE;
    mapContainer.x -= x * SPRITE_SIZE;
  } else {
    moveMapAroundPlayer(mapContainer, direction);
  }
}
