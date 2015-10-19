import Transmitter from 'transmitter-framework';


export default class IntervalView {
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
    ch.interval = interval;
    ch.intervalView = this;
    ch.addChannel(this.showView.createChannel(interval));
    ch.addChannel(this.editView.createChannel(interval));
    return ch;
  }

  createRemoveChannel(intervalList) {
    return this.editView.createRemoveChannel(intervalList, this.interval);
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
    el.appendChild(document.createTextNode(' '));
    this.removeEl = el.appendChild(document.createElement('button'));
    this.removeEl.classList.add('remove-interval');
    this.removeEl.type = 'button';
    this.removeEl.innerText = '×';

    this.startElVar = new Transmitter.DOMElement.InputValueVar(this.startEl);
    this.endElVar = new Transmitter.DOMElement.InputValueVar(this.endEl);
    this.tagElVar = new Transmitter.DOMElement.InputValueVar(this.tagEl);

    this.keydownEvt = new Transmitter.DOMElement.DOMEvent(el, 'keydown');
    this.completeEditEvt = new Transmitter.Nodes.RelayNode();
    this.removeEvt =
      new Transmitter.DOMElement.DOMEvent(this.removeEl, 'click');
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

  createRemoveChannel(intervalList, interval) {
    return new Transmitter.Channels.SimpleChannel()
      .inBackwardDirection()
      .fromSource(this.removeEvt)
      .toTarget(intervalList)
      .withTransform( (removePayload) =>
          removePayload.map( () => interval ).toRemoveListElement()
      );
  }
}
