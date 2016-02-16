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
    this.withDays = new Transmitter.Nodes.OrderedMapNode();
  }

  init(tr) {
    this.createWithDaysChannel().init(tr);
    return this;
  }

  createItem() {
    return new Interval();
  }

  createWithDaysChannel() {
    const ch = new Transmitter.Channels.CompositeChannel();

    const map = new Transmitter.Nodes.OrderedMapNode();

    ch.defineBidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(this.collection, map)
      .updateMapByValue()
      .withMapOrigin( (interval) => interval.startValue );

    ch.defineFlatteningChannel()
      .inForwardDirection()
      .withNestedAsOrigin(map)
      .withFlat(this.withDays);

    return ch;
  }
}


function genUUID(){
  return ([1e7]+-1e3+-4e3+-8e3+-1e11)
    .replace(/[018]/g,a=>(a^Math.random()*16>>a/4).toString(16));
}

export default class Day {
  inspect() {
    return `[Day ${this.dateIndex}]`;
  }

  constructor(date) {
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
    return `[Interval ${this.uuid}]`;
  }

  constructor(uuid) {
    this.uuid = uuid || genUUID();
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
