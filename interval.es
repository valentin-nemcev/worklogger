import Transmitter from 'transmitter-framework';


export default class Interval {
  constructor() {
    this.startVar = new Transmitter.Nodes.Variable();
    this.endVar = new Transmitter.Nodes.Variable();
    this.tagVar = new Transmitter.Nodes.Variable();
  }
  init(tr, {start, end, tag = null} = {}) {
    start = start || new Date().toISOString();
    end = end || new Date().toISOString();
    this.startVar.init(tr, start);
    this.endVar.init(tr, end);
    this.tagVar.init(tr, tag);
    return this;
  }
}
