'use strict';

var playerSprites = {};

function createPlayerSprite(login, myLogin, y, x, stage, mapContainer) {
  //const playerSprite = new PIXI.Sprite(PIXI.loader.resources['img/player.png'].texture);
  const playerSprite = new PIXI.Sprite(PIXI.loader.resources['img/player.png'].texture);

  playerSprites[login] = playerSprite;

  if (login === myLogin) {
    playerSprite.y = $(document).height() / 2;
    playerSprite.x = $(document).width() / 2;

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
  playerSprites[login].y = y * 32;
  playerSprites[login].x = x * 32;
}
