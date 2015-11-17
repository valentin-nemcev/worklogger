import * as Transmitter from 'transmitter-framework/index.es';

import {compareDatetimes, parseDate, parseDatetime} from './date_utils';

class IndexedCollection {
  constructor() {

    this.list = new Transmitter.Nodes.List();
    this.indexedList = new Transmitter.Nodes.List();
  }

  init(tr) {
    this.createIndexedChannel().init(tr);
    return this;
  }

  createIndexedChannel() {
    const ch = new Transmitter.Channels.CompositeChannel();
    const indexList = new Transmitter.Nodes.List();

    ch.defineFlatteningChannel()
      .inBackwardDirection()
      .withNestedAsDerived(this.list, (item) => item.getIndex())
      .withFlat(indexList);

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSources(this.list, indexList)
      .toTarget(this.indexedList)
      .withTransform(
        ([listPayload, indexListPayload]) =>
          listPayload.zip(indexListPayload)
            .map( ([item, index]) => ({item, index}))
            .toValue()
            .map( (indexedItems) =>
              indexedItems.slice().sort(
                ({index: indexA, item}, {index: indexB}) =>
                  item.compareIndexes(indexA, indexB)
              )
            )
      );

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSource(this.indexedList)
      .toTarget(this.list)
      .withTransform(
        (payload) => payload.map( ({item}) => item )
      );

    return ch;
  }
}

export class Days extends IndexedCollection {
  createItem() {
    return new Day();
  }
}

export class Intervals extends IndexedCollection {
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

  constructor() {
    this.debugId = dayLastDebugId++;
    this.dateValue = new Transmitter.Nodes.Value();
    this.targetValue = new Transmitter.Nodes.Value();
  }

  getIndex() {
    return this.dateValue;
  }

  compareIndexes(a, b) {
    return compareDatetimes(a, b);
  }

  init(tr, {date, target = 0} = {}) {
    date = parseDate(date);
    this.dateValue.set(date).init(tr);
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
    this.startValue = new Transmitter.Nodes.Value();
    this.endValue = new Transmitter.Nodes.Value();
    this.tagValue = new Transmitter.Nodes.Value();
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
