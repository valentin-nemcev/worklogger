import * as Transmitter from 'transmitter-framework/index.es';

import moment from 'moment';
import {formatDateKey} from './date_utils';

export class Days {
  constructor() {
    this.collection = new Transmitter.Nodes.OrderedMapNode();
  }

  createItem(tr, date) {
    return new Day(tr, date);
  }

  createItemWithDefaultValues(tr, date) {
    return new Day(tr, date, {target: 0});
  }
}

export class Intervals {
  constructor(tr) {
    this.collection = new Transmitter.Nodes.OrderedSetNode();
    this.collection.debugTrace = true;
    this.collection.inspect = () => 'intervals.collection';
    this.withDays = new Transmitter.Nodes.OrderedMapNode();

    this.createWithDaysChannel().init(tr);
  }

  createItem(tr) {
    return new Interval(tr);
  }

  createItemWithDefaultValues(tr) {
    return new Interval(tr, undefined,
                        {start: moment(), end: moment(), tag: ''});
  }

  createWithDaysChannel() {
    const ch = new Transmitter.Channels.CompositeChannel();

    const map = new Transmitter.Nodes.OrderedMapNode();

    ch.defineBidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(this.collection, map)
      .updateMapByValue()
      .withMapOrigin( (interval) => interval.dateIndexValue );

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

  constructor(tr, date, values) {
    this.date = date.clone();
    this.dateIndex = formatDateKey(this.date);
    this.targetValue = new Transmitter.Nodes.ValueNode();

    if (values != null) this.targetValue.set(values.target).init(tr);
    return this;
  }
}

class Interval {
  inspect() {
    return `[Interval ${this.uuid}]`;
  }

  constructor(tr, uuid, values) {
    this.uuid = uuid || genUUID();
    this.startValue = new Transmitter.Nodes.ValueNode();
    this.endValue = new Transmitter.Nodes.ValueNode();
    this.tagValue = new Transmitter.Nodes.ValueNode();

    this.dateIndexValue = new Transmitter.Nodes.ValueNode();

    new Transmitter.Channels.BidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(this.startValue, this.dateIndexValue)
      .withMapOrigin(formatDateKey)
      .init(tr);

    if (values != null) {
      this.startValue.set(values.start).init(tr);
      this.endValue.set(values.end).init(tr);
      this.tagValue.set(values.tag).init(tr);
    }
  }
}
