'use strict';

const globalMap = [];

function drawMap(labMap, mapContainer, scale) {
  for (let i = 0; i < labMap.length; i++) {
    globalMap.push([]);

    let mapRow = labMap[i];

    for (let ii = 0; ii < mapRow.length; ii++) {
      var mapSprite;
      var element = mapRow[ii];

      if (element === 1) {
        mapSprite = PIXI.Sprite.fromImage("img/wall.png");
      } else if (element === 0) {
        mapSprite = PIXI.Sprite.fromImage("img/ground.png");
      }

      if (mapSprite) {
        mapSprite.scale.set(scale);
        mapSprite.x = 32 * ii * scale;
        mapSprite.y = 32 * i * scale;

        mapContainer.addChild(mapSprite);

        globalMap[i].push(mapSprite);
      }
    }
  }
}

function changeMap(changeMap, mapContainer, scale) {
  changeMap.forEach(function (item) {
    for (let i = 0; i < item.length; i++) {
      let mapSprite;

      if (item.id === 1) {
        mapSprite = PIXI.Sprite.fromImage("img/wall.png");
      } else if (item.id === 0) {
        mapSprite = PIXI.Sprite.fromImage("img/ground.png");
      }

      mapSprite.scale.set(scale);

      let y = item.startY;
      let x = item.startX;

      if (item.type === 'vertical') {
        y += i;
      } else {
        x += i;
      }

      let oldMapSprite = globalMap[y][x];

      mapSprite.x = oldMapSprite.x;
      mapSprite.y = oldMapSprite.y;

      mapContainer.removeChild(oldMapSprite);
      mapContainer.addChild(mapSprite);

      globalMap[y][x] = mapSprite;

    }
  });
}

function setMapAroundPlayer(mapContainer, y, x, scale) {
  mapContainer.y = y + 320 * scale;
  mapContainer.x = x + 320 * scale;
}

function moveMapAroundPlayer(mapContainer, direction, scale) {
  if (direction === 'up') {
    mapContainer.y += 32 * scale;
  }

  if (direction === 'down') {
    mapContainer.y -= 32 * scale;
  }

  if (direction === 'left') {
    mapContainer.x += 32 * scale;
  }

  if (direction === 'right') {
    mapContainer.x -= 32 * scale;
  }
}