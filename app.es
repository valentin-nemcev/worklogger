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
    return this;
  }
}


class IntervalView {
  constructor(interval) {
    this.interval = interval;

    const el = this.element = document.createElement('div');
    el.classList.add('interval');

    this.showView = new IntervalShowView();
    this.showViewIsHidden =
      new Transmitter.DOMElement.AttributeVar(this.showView.element, 'hidden');

    el.appendChild(this.showView.element);

    this.editView = new IntervalEditView();
    this.editViewIsHidden =
      new Transmitter.DOMElement.AttributeVar(this.editView.element, 'hidden');

    el.appendChild(this.editView.element);

    this.isEditedVar = new Transmitter.Nodes.Variable();
  }

  init(tr) {
    this.showView.init(tr);
    this.editView.init(tr);
    this._createIsEditedChannel().init(tr);
    return this;
  }

  _createIsEditedChannel() {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(this.showView.startEditEvt)
      .toTarget(this.isEditedVar)
      .withTransform( (startEditPayload) =>
          startEditPayload.map( () => true ) );

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(this.editView.completeEditEvt)
      .toTarget(this.isEditedVar)
      .withTransform( (completeEditPayload) =>
          completeEditPayload.map( () => false ) );

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSource(this.isEditedVar)
      .toTarget(this.editViewIsHidden)
      .withTransform( (isEditedPayload) =>
          isEditedPayload.map( (isEdited) => !isEdited ) );

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSource(this.isEditedVar)
      .toTarget(this.showViewIsHidden)
      .withTransform( (isEditedPayload) =>
          isEditedPayload.map( (isEdited) => isEdited ) );

    return ch;
  }

  createChannel(interval) {
    const ch = new Transmitter.Channels.CompositeChannel();
    ch.addChannel(this.showView.createChannel(interval));
    ch.addChannel(this.editView.createChannel(interval));
    return ch;
  }
}


class IntervalShowView {
  constructor() {
    const el = this.element = document.createElement('div');
    el.classList.add('show');
    this.startEl = el.appendChild(document.createElement('span'));
    el.appendChild(document.createTextNode(' — '));
    this.endEl = el.appendChild(document.createElement('span'));
    el.appendChild(document.createTextNode(' '));
    this.tagEl = el.appendChild(document.createElement('span'));

    this.startElVar = new Transmitter.DOMElement.TextVar(this.startEl);
    this.endElVar = new Transmitter.DOMElement.TextVar(this.endEl);
    this.tagElVar = new Transmitter.DOMElement.TextVar(this.tagEl);

    this.startEditEvt = new Transmitter.DOMElement.DOMEvent(el, 'dblclick');
  }

  init() {
    return this;
  }

  createChannel(interval) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.interval = interval;
    ch.intervalView = this;

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
}


class IntervalEditView {
  constructor() {
    const el = this.element = document.createElement('form');
    el.classList.add('edit');
    this.startEl = el.appendChild(document.createElement('input'));
    this.startEl.type = 'text';
    this.startEl.size = '14';
    el.appendChild(document.createTextNode(' — '));
    this.endEl = el.appendChild(document.createElement('input'));
    this.endEl.type = 'text';
    this.endEl.size = '14';
    el.appendChild(document.createTextNode(' '));
    this.tagEl = el.appendChild(document.createElement('input'));
    this.tagEl.type = 'text';

    this.startElVar = new Transmitter.DOMElement.InputValueVar(this.startEl);
    this.endElVar = new Transmitter.DOMElement.InputValueVar(this.endEl);
    this.tagElVar = new Transmitter.DOMElement.InputValueVar(this.tagEl);

    this.keydownEvt = new Transmitter.DOMElement.DOMEvent(el, 'keydown');
    this.completeEditEvt = new Transmitter.Nodes.RelayNode();
  }

  init(tr) {
    new Transmitter.Channels.SimpleChannel()
      .inBackwardDirection()
      .fromSource(this.keydownEvt)
      .toTarget(this.completeEditEvt)
      .withTransform( (keydownPayload) =>
        keydownPayload
          .map( (keydown) => keydown.key || keydown.keyIdentifier )
          .noopIf( (key) => key != 'Enter' )
      )
      .init(tr);
    return this;
  }

  createChannel(interval) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineVariableChannel()
      .withOrigin(interval.startVar)
      .withDerived(this.startElVar);

    ch.defineVariableChannel()
      .withOrigin(interval.endVar)
      .withDerived(this.endElVar);

    ch.defineVariableChannel()
      .withOrigin(interval.tagVar)
      .withDerived(this.tagElVar);

    return ch;
  }
}


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
      .withMatchOriginDerived(
        (intervalView, intervalEl) => intervalView.element == intervalEl )
      .init(tr);
    return this;
  }

  createChannel(intervalList) {
    return new Transmitter.Channels.ListChannel()
      .inForwardDirection()
      .withOrigin(intervalList)
      .withDerived(this.intervalViewList)
      .withMapOrigin( (interval, tr) => new IntervalView(interval).init(tr) )
      .withMatchOriginDerived(
        (interval, intervalView) => intervalView.interval == interval )
      .withOriginDerivedChannel(
        (interval, intervalView) => intervalView.createChannel(interval)
      )
      .withMatchOriginDerivedChannel( (interval, intervalView, channel) =>
        channel.interval == interval && channel.intervalView == intervalView
      );
  }
}


const intervalList = new Transmitter.Nodes.List();
const intervalListView = new IntervalListView();


Transmitter.startTransmission( (tr) => {

  const i1 = new Interval().init(tr,
      {start: '2015-10-15 19:25', end: '2015-10-15 19:40', tag: 'test2'});

  const i2 = new Interval().init(tr,
      {start: '2015-10-15 20:50', end: '2015-10-15 21:00', tag: 'test1'});

  intervalList.init(tr, [i1, i2]);
  intervalListView.createChannel(intervalList).init(tr);
  intervalListView.init(tr);
});

document.body.appendChild(intervalListView.element);
