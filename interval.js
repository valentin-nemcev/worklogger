import * as Transmitter from 'transmitter-framework/index.es';
import moment from 'moment';

Object.assign(moment.fn, {
  inspect() { return `moment(${this.format()})`; }
});

const datetimeFormat = 'YYYY-MM-DD HH:mm';

let intervalLastDebugId = 0;

export default class Interval {
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
