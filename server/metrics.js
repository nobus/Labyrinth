'use strict';

const gcStats = require('gc-stats')();
const eventLoopStats = require('event-loop-stats');

const common = require('./common');


export class Metrics {
  constructor (period) {
    this.period = period;

    this.metrics = {};
    this.metrics.rss = 0;
    this.metrics.heapTotal = 0;
    this.metrics.heapUsed = 0;
  }

  runMeasures () {
    gcStats.on('stats', (stats) => {
      common.log(`GC happened ${JSON.stringify(stats)}`);
    });

    setInterval( () => {
      const mu = process.memoryUsage();
      this.metrics.rss = mu.rss;
      this.metrics.heapTotal = mu.heapTotal;
      this.metrics.heapUsed = mu.heapUsed;

      common.log(JSON.stringify(this.metrics));
      common.log(`event loop stats', ${JSON.stringify(eventLoopStats.sense())}`);

    }, this.period);
  }
}