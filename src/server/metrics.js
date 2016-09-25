'use strict';

const lynx = require('lynx');
const gcStats = require('gc-stats')();
const eventLoopStats = require('event-loop-stats');


export class Metrics {
  constructor (period) {
    this.period = period;
    this.metrics = new lynx('localhost', 8125);
  }

  runMeasures () {
    gcStats.on('stats', (stats) => {
      this.metrics.gauge('gc.pause_ms', stats.pauseMS);

      this.metrics.gauge('gc.diff.total_heap_size', stats.diff.totalHeapSize);
      this.metrics.gauge('gc.diff.total_heap_executable_size', stats.diff.totalHeapExecutableSize);
      this.metrics.gauge('gc.diff.used_heap_size', stats.diff.usedHeapSize);
      this.metrics.gauge('gc.diff.heap_size_limit', stats.diff.heapSizeLimit);
      this.metrics.gauge('gc.diff.total_physical_size', stats.diff.totalPhysicalSize);
    });

    setInterval( () => {
      const mu = process.memoryUsage();
      this.metrics.gauge('process.memory.rss', mu.rss);
      this.metrics.gauge('process.memory.heap_total', mu.heapTotal);
      this.metrics.gauge('process.memory.heap_used', mu.heapUsed);

      const els = eventLoopStats.sense();
      this.metrics.gauge('event_loop.min', els.min);
      this.metrics.gauge('event_loop.max', els.max);
      this.metrics.gauge('event_loop.num', els.num);
      this.metrics.gauge('event_loop.sum', els.sum);

    }, this.period);
  }
}