'use strict';

var playerSprites = {};

function createPlayerSprite(login, myLogin, y, x, stage, mapContainer, scale) {
  const playerSprite = new PIXI.Sprite(PIXI.loader.resources['img/player.png'].texture);

  playerSprite.scale.set(scale);
  playerSprites[login] = playerSprite;

  if (login === myLogin) {
    playerSprite.y = $(document).height() / 2;
    playerSprite.x = $(document).width() / 2;

    stage.addChild(playerSprite);
    setMapAroundPlayer(mapContainer, y, x, scale);
  } else {
    mapContainer.addChild(playerSprite);
    movePlayer(login, y, x, scale);
  }
}

function removePlayerSprite(login, mapContainer) {
  const playerSprite = playerSprites[login];

  if (playerSprite) {
    mapContainer.removeChild(playerSprite);
    delete playerSprite[login];
  }
}

function movePlayer(login, y, x, scale) {
  playerSprites[login].y = y * 32 * scale;
  playerSprites[login].x = x * 32 * scale;
}