'use strict';

var globalMap = [];

function drawMap(labMap, mapContainer, spriteConf) {
  globalMap = [];

  const backgroundSprite = new PIXI.Sprite(PIXI.loader.resources[`img/${labMap.background}_background.png`].texture);
  mapContainer.addChild(backgroundSprite);

  const spriteFactory = new SpriteFactory(labMap.background, spriteConf);

  for (let i = 0; i < labMap.locationMap.length; i++) {
    globalMap.push([]);

    let mapRow = labMap.locationMap[i];

    for (let ii = 0; ii < mapRow.length; ii++) {
      var mapSprite = spriteFactory.getSprite(mapRow[ii]);

      if (mapSprite) {
        mapSprite.x = SPRITE_SIZE * ii;
        mapSprite.y = SPRITE_SIZE * i;

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
  mapContainer.y = SIZE / 2;
  mapContainer.x = SIZE / 2;
}

function moveMapAroundPlayer(mapContainer, direction) {
  if (direction === 'up') {
    mapContainer.y += SPRITE_SIZE;
  }

  if (direction === 'down') {
    mapContainer.y -= SPRITE_SIZE;
  }

  if (direction === 'left') {
    mapContainer.x += SPRITE_SIZE;
  }

  if (direction === 'right') {
    mapContainer.x -= SPRITE_SIZE;
  }
}
