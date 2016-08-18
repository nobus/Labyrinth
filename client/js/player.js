'use strict';

var playerSprites = {};

function createPlayerSprite(login, myLogin, y, x, stage, mapContainer, scale) {
  const playerSprite = PIXI.Sprite.fromImage('img/player.png');
  playerSprite.scale.set(scale);
  playerSprites[login] = playerSprite;

  if (login === myLogin) {
    const canvasHeight = $(document).height();
    const canvasWidth = $(document).width();

    playerSprite.y = (canvasHeight / 2);
    playerSprite.x = (canvasWidth / 2);

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