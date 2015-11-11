import * as Transmitter from 'transmitter-framework/index.es';
import moment from 'moment';

Object.assign(moment.fn, {
  inspect() { return `moment(${this.format()})`; }
});


export class Days {
  constructor() {
    this.list = new Transmitter.Nodes.List();
  }

  createItem = function () {
    return new Day();
  }
}

export class Intervals {
  constructor() {
    this.list = new Transmitter.Nodes.List();
  }

  createItem = function () {
    return new Interval();
  }
}

const datetimeFormat = 'YYYY-MM-DD HH:mm';

let intervalLastDebugId = 0;

const dateFormat = 'YYYY-MM-DD';

let dayLastDebugId = 0;

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

  init(tr, {start, end, tag = null} = {}) {
    start = this.parseDatetime(start);
    end = this.parseDatetime(end);
    this.startValue.set(start).init(tr);
    this.endValue.set(end).init(tr);
    this.tagValue.set(tag).init(tr);
    return this;
  }
}
