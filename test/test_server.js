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
});