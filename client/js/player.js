'use strict';

var playerSprites = {};

function createPlayerSprite(login, myLogin, y, x, stage, mapContainer) {
  const playerSprite = new PIXI.Sprite(PIXI.loader.resources['img/player.png'].texture);

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
