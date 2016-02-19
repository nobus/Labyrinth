'use strict';

const assert = require('assert');
const server = require('../server/server');

describe('server', function () {
  describe('#getRandom()', function() {
    it('should return between 0 and 5', function () {
      let r = server.getRandom(1, 4);
      assert(r > 0 && r < 5, 'return between 0 and 5!');
    });
  });

  describe('#getRandomInt()', function() {
    it('should return 1', function () {
      let r = server.getRandomInt(1, 1);
      assert(r === 1, 'return 1!');
    });

    it('should return between 0 and 5', function () {
      let r = server.getRandomInt(1, 4);
      assert(r > 0 && r < 5, 'return between 0 and 5!');
    });
  });

  const mapY = 300;
  const mapX = 300;

  describe('#getLineParams()', function() {
    it('should return Object with startY, startX and length', function () {
      const lineMaxLength = 3;
      let line = server.getLineParams(mapY, mapX, lineMaxLength);

      assert(line.length && line.length > 0 && line.length <= lineMaxLength,
            'return line with true legth!');

      assert(line.startY && line.startY >= 0 && line.startY < mapY - lineMaxLength,
            'return line with true startY');

      assert(line.startX && line.startX >= 0 && line.startX < mapX - lineMaxLength,
            'return line with true startX');
    });
  });

  describe('#initMap()', function() {
    it('should return Array mapY x mapX', function () {
      let labMap = server.initMap(mapY, mapX);
      let yCounter = 0;

      labMap.forEach(function eachY (mapY) {
        yCounter++;
        let xCounter = 0;

        mapY.forEach(function eachX () {
          xCounter++;
        });

        assert(xCounter === mapX, 'width of maps elem is true');
      });

      assert(yCounter === mapY, 'maps height is true');

    });
  });

  describe('#searchStartPosition()', function() {
    it('should return Object with x and y', function () {
      let labMap = server.initMap(mapY, mapX);
      let pos = server.searchStartPosition();
      let mapElem = labMap[pos.y][pos.x];
      
      assert(mapElem === 0, 'return true position');

    });
  });
});