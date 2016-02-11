import * as Transmitter from 'transmitter-framework/index.es';

import {
  formatDateKey,
  compareDatetimes,
  parseDatetime
} from './date_utils';

export class Days {
  constructor() {
    this.collection = new Transmitter.Nodes.OrderedMapNode();
  }

  init() {
    return this;
  }

  createItem(date) {
    return new Day(date);
  }
}

export class Intervals {
  constructor() {
    this.collection = new Transmitter.Nodes.OrderedSetNode();
  }

  init() {
    return this;
  }

  createItem() {
    return new Interval();
  }
}

let intervalLastDebugId = 0;

let dayLastDebugId = 0;



export default class Day {
  inspect() {
    return `[Day ${this.debugId}]`;
  }

  constructor(date) {
    this.debugId = dayLastDebugId++;
    this.date = date.clone();
    this.dateIndex = formatDateKey(this.date);
    this.targetValue = new Transmitter.Nodes.ValueNode();
  }

  getIndex() {
    return this.dateIndex;
  }

  compareIndexes(a, b) {
    return compareDatetimes(a, b);
  }

  init(tr, {target = 0} = {}) {
    this.targetValue.set(target).init(tr);
    return this;
  }
}

class Interval {
  inspect() {
    return `[Interval ${this.debugId}]`;
  }

  constructor() {
    this.debugId = intervalLastDebugId++;
    this.startValue = new Transmitter.Nodes.ValueNode();
    this.endValue = new Transmitter.Nodes.ValueNode();
    this.tagValue = new Transmitter.Nodes.ValueNode();
  }

  getIndex() {
    return this.startValue;
  }

  compareIndexes(a, b) {
    return compareDatetimes(a, b);
  }

  init(tr, {start, end, tag = null} = {}) {
    start = parseDatetime(start);
    end = parseDatetime(end);
    this.startValue.set(start).init(tr);
    this.endValue.set(end).init(tr);
    this.tagValue.set(tag).init(tr);
    return this;
  }
}
