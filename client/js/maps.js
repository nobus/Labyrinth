'use strict';

var globalMap = [];

function createMapSprite (id) {
  if (id === 0.1) {
    return PIXI.Sprite.fromImage('img/wall.png');
  } else if (id === 0.2) {
    return PIXI.Sprite.fromImage('img/tree.png');
  } else if (id === 1.1) {
    return PIXI.Sprite.fromImage('img/ground.png');
  } else if (id === 1.2) {
    return PIXI.Sprite.fromImage('img/grass.png');
  } else if (id === 2.1) {
    return PIXI.Sprite.fromImage('img/entrance.png');
  }
}

function drawMap(labMap, mapContainer, scale) {
  globalMap = [];

  for (let i = 0; i < labMap.length; i++) {
    globalMap.push([]);

    let mapRow = labMap[i];

    for (let ii = 0; ii < mapRow.length; ii++) {
      var mapSprite = createMapSprite(mapRow[ii]);

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
      let mapSprite = createEmptySourceMap(item.id);

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
  mapContainer.y = 320 * scale;
  mapContainer.x = 320 * scale;
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