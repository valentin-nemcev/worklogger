import Transmitter from 'transmitter-framework';
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
    this.startVar = new Transmitter.Nodes.Variable();
    this.endVar = new Transmitter.Nodes.Variable();
    this.tagVar = new Transmitter.Nodes.Variable();
  }

  init(tr, {start, end, tag = null} = {}) {
    start = this.parseDatetime(start);
    end = this.parseDatetime(end);
    this.startVar.init(tr, start);
    this.endVar.init(tr, end);
    this.tagVar.init(tr, tag);
    return this;
  }
}
