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
