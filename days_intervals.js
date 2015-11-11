import * as Transmitter from 'transmitter-framework/index.es';
import moment from 'moment';

Object.assign(moment.fn, {
  inspect() { return `moment(${this.format()})`; }
});


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

const datetimeFormat = 'YYYY-MM-DD HH:mm';

let intervalLastDebugId = 0;

const dateFormat = 'YYYY-MM-DD';

let dayLastDebugId = 0;

function compareDatetimes(a, b) {
  return a.diff(b);
}


export default class Day {
  inspect() {
    return `[Day ${this.debugId}]`;
  }

  serializeDate(date) {
    return date.format('YYYY-MM-DD');
  }

  unserializeDate(dateStr) {
    dateStr = dateStr || '';
    return moment(dateStr, 'YYYY-MM-DD');
  }

  formatDate(date) {
    return date.format(dateFormat);
  }

  parseDate(dateStr) {
    dateStr = (dateStr || '').trim();
    return dateStr ? moment(dateStr, dateFormat) : moment().startOf('day');
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
    date = this.parseDate(date);
    this.dateValue.set(date).init(tr);
    this.targetValue.set(target).init(tr);
    return this;
  }
}

class Interval {
  inspect() {
    return `[Interval ${this.debugId}]`;
  }

  serializeDatetime(datetime) {
    return datetime.toJSON();
  }

  unserializeDatetime(datetimeStr) {
    datetimeStr = datetimeStr || '';
    return moment(datetimeStr);
  }

  formatDatetime(datetime) {
    return datetime.format(datetimeFormat);
  }

  parseDatetime(datetimeStr) {
    datetimeStr = (datetimeStr || '').trim();
    return datetimeStr ? moment(datetimeStr, datetimeFormat) : moment();
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
    start = this.parseDatetime(start);
    end = this.parseDatetime(end);
    this.startValue.set(start).init(tr);
    this.endValue.set(end).init(tr);
    this.tagValue.set(tag).init(tr);
    return this;
  }
}
