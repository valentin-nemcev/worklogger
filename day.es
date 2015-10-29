import Transmitter from 'transmitter-framework/index.es';
import moment from 'moment';

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
    this.dateVar = new Transmitter.Nodes.Variable();
    this.targetVar = new Transmitter.Nodes.Variable();
  }

  init(tr, {date, target = 0} = {}) {
    date = this.parseDate(date);
    this.dateVar.init(tr, date);
    this.targetVar.init(tr, target);
    return this;
  }
}
