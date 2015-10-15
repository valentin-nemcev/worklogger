const Transmitter = require('transmitter-framework');


class Interval {
  constructor() {
    this.startVar = new Transmitter.Nodes.Variable();
    this.endVar = new Transmitter.Nodes.Variable();
    this.tagVar = new Transmitter.Nodes.Variable();
  }
  init(tr, {start, end, tag = null}) {
    this.startVar.init(tr, start);
    this.endVar.init(tr, end);
    this.tagVar.init(tr, tag);
    return this
  }
};


class IntervalView {
  constructor() {
    const el = this.element = document.createElement('div');
    el.classList.add('interval');
    this.startEl = el.appendChild(document.createElement('span'));
    el.appendChild(document.createTextNode(' — '));
    this.endEl = el.appendChild(document.createElement('span'));
    el.appendChild(document.createTextNode(' '));
    this.tagEl = el.appendChild(document.createElement('span'));

    this.startElVar = new Transmitter.DOMElement.TextVar(this.startEl);
    this.endElVar = new Transmitter.DOMElement.TextVar(this.endEl);
    this.tagElVar = new Transmitter.DOMElement.TextVar(this.tagEl);
  }

  createChannel(interval) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineVariableChannel()
      .inForwardDirection()
      .withOrigin(interval.startVar)
      .withDerived(this.startElVar);

    ch.defineVariableChannel()
      .inForwardDirection()
      .withOrigin(interval.endVar)
      .withDerived(this.endElVar);

    ch.defineVariableChannel()
      .inForwardDirection()
      .withOrigin(interval.tagVar)
      .withDerived(this.tagElVar);

    return ch;
  }
};


class IntervalListView {
  constructor() {
    this.element = document.createElement('div');
    this.intervalViewList = new Transmitter.Nodes.List();
    this.intervalElementList =
      new Transmitter.DOMElement.ChildrenList(this.element);
  }

  init(tr) {
    new Transmitter.Channels.ListChannel()
      .inForwardDirection()
      .withOrigin(this.intervalViewList)
      .withDerived(this.intervalElementList)
      .withMapOrigin( (intervalView) => intervalView.element )
      .init(tr);
    return this;
  }

  createChannel(intervalList) {
    return new Transmitter.Channels.ListChannel()
      .inForwardDirection()
      .withOrigin(intervalList)
      .withDerived(this.intervalViewList)
      .withMapOrigin( (interval) => {
        console.log(interval);
        return new IntervalView();
      })
      .withOriginDerivedChannel(
        (interval, intervalView) => intervalView.createChannel(interval)
      );
  }
};


const intervalList = new Transmitter.Nodes.List();
const intervalListView = new IntervalListView();


Transmitter.startTransmission( (tr) => {

  const i1 = new Interval().init(tr,
      {start: '2015-10-15 19:25', end: '2015-10-15 19:40', tag: 'test2'});

  const i2 = new Interval().init(tr,
      {start: '2015-10-15 20:50', end: '2015-10-15 21:00', tag: 'test1'});

  intervalList.init(tr, [i1, i2]);
  console.log(intervalList.get());
  intervalListView.createChannel(intervalList).init(tr);
  intervalListView.init(tr);
});

document.body.appendChild(intervalListView.element);
