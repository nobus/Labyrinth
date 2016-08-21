'use strict';

var globalMap = [];

function createMapSprite (id) {
  if (id === 0.1) {
    return new PIXI.Sprite(PIXI.loader.resources['img/terrain.json'].textures['wall.png']);
  } else if (id === 0.2) {
    return new PIXI.Sprite(PIXI.loader.resources['img/green_terrain.json'].textures['greentree.png']);
  } else if (id === 0.3) {
    return new PIXI.Sprite(PIXI.loader.resources['img/green_terrain.json'].textures['stump1.png']);
  } else if (id === 0.4) {
    return new PIXI.Sprite(PIXI.loader.resources['img/green_terrain.json'].textures['stump2.png']);
  } else if (id === 1.1) {
    return new PIXI.Sprite(PIXI.loader.resources['img/terrain.json'].textures['ground.png']);
  } else if (id === 1.2) {
    return new PIXI.Sprite(PIXI.loader.resources['img/green_terrain.json'].textures['grass.png']);
  } else if (id === 2.1) {
    return new PIXI.Sprite(PIXI.loader.resources['img/terrain.json'].textures['entrance.png']);
  } else if (id === 2.2) {
    return new PIXI.Sprite(PIXI.loader.resources['img/terrain.json'].textures['exit1.png']);
  }
}

function drawMap(labMap, mapContainer) {
  globalMap = [];

  for (let i = 0; i < labMap.length; i++) {
    globalMap.push([]);

    let mapRow = labMap[i];

    for (let ii = 0; ii < mapRow.length; ii++) {
      var mapSprite = createMapSprite(mapRow[ii]);

      if (mapSprite) {
        mapSprite.x = 32 * ii;
        mapSprite.y = 32 * i;

        mapContainer.addChild(mapSprite);

        globalMap[i].push(mapSprite);
      }
    }
  }
}

function changeMap(changeMap, mapContainer) {
  changeMap.forEach(function (item) {
    for (let i = 0; i < item.length; i++) {
      let mapSprite = createEmptySourceMap(item.id);

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

function setMapAroundPlayer(mapContainer, y, x) {
  mapContainer.y = $(document).height() / 2;
  mapContainer.x = $(document).width() / 2;
}

function moveMapAroundPlayer(mapContainer, direction) {
  if (direction === 'up') {
    mapContainer.y += 32;
  }

  if (direction === 'down') {
    mapContainer.y -= 32;
  }

  if (direction === 'left') {
    mapContainer.x += 32;
  }

  if (direction === 'right') {
    mapContainer.x -= 32;
  }
}
