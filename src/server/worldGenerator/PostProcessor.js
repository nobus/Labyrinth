'use strict';

const log = require('./../log');


export class PostProcessor {
  constructor(n) {
    this.counter;

    if (typeof n === 'number') {
      this.counter = n;
    }
  }

  increment (n) {
    if (typeof this.counter === 'undefined') {
      this.counter = 0;
    }

    this.counter += n;
  }

  decrement (n) {
    if (typeof this.counter === 'number') {
      this.counter -= n;

      if (this.counter <= 0) {
        this.exit();
      }
    }
  }

  exit () {
    log.info(`I'm going to exit, bye!`);
    process.exit();
  }
}
