'use strict';

var playerSprites = {};

function createPlayerSprite(login, myLogin, y, x, stage, mapContainer, scale) {
  const playerSprite = PIXI.Sprite.fromImage('img/player.png');
  playerSprite.scale.set(scale);
  playerSprites[login] = playerSprite;

  if (login === myLogin) {
    playerSprite.y = 320 * scale;
    playerSprite.x = 320 * scale;

    stage.addChild(playerSprite);
    setMapAroundPlayer(mapContainer, y, x, scale);
  } else {
    mapContainer.addChild(playerSprite);
    movePlayer(login, y, x, scale);
  }
}

function movePlayer(login, y, x, scale) {
  playerSprites[login].y = y * 32 * scale;
  playerSprites[login].x = x * 32 * scale;
}