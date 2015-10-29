import Transmitter from 'transmitter-framework/index.es';

export default {
  createAddActionView(...args) {
    return new CreateIntervalView(...args);
  },

  createShow(...args) {
    return new IntervalShowView(...args);
  },

  createEdit(...args) {
    return new IntervalEditView(...args);
  }
};


class CreateIntervalView {
  constructor() {
    const el = this.element = document.createElement('div');
    el.classList.add('create-interval');
    this.addButtonEl = el.appendChild(document.createElement('button'));
    this.addButtonEl.innerText = 'Add interval';

    this.createItemEvt =
      new Transmitter.DOMElement.DOMEvent(this.addButtonEl, 'click');
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

    ch.defineVariableChannel()
      .inForwardDirection()
      .withOrigin(interval.startVar)
      .withMapOrigin(interval.formatDatetime)
      .withDerived(this.startElVar);

    ch.defineVariableChannel()
      .inForwardDirection()
      .withOrigin(interval.endVar)
      .withMapOrigin(interval.formatDatetime)
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
      .withMapOrigin(interval.formatDatetime)
      .withDerived(this.startElVar)
      .withMapDerived(interval.parseDatetime);


    ch.defineVariableChannel()
      .withOrigin(interval.endVar)
      .withMapOrigin(interval.formatDatetime)
      .withDerived(this.endElVar)
      .withMapDerived(interval.parseDatetime);

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
