import * as Transmitter from 'transmitter-framework/index.es';

import {formatDatetime, parseDatetime} from './date_utils';

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

  createCreateChannel(intervals) {
    return new Transmitter.Channels.SimpleChannel()
      .inBackwardDirection()
      .fromSource(this.createItemEvt)
      .toTarget(intervals.collection)
      .withTransform( (createItemPayload, tr) =>
        createItemPayload
          .map( () => intervals.createItem().init(tr) )
          .toAppendAction()
      );
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

    this.startElValue = new Transmitter.DOMElement.TextValue(this.startEl);
    this.endElValue = new Transmitter.DOMElement.TextValue(this.endEl);
    this.tagElValue = new Transmitter.DOMElement.TextValue(this.tagEl);

    this.startEditEvt = new Transmitter.DOMElement.DOMEvent(el, 'dblclick');
  }

  init() {
    return this;
  }

  createChannel(interval) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineBidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(interval.startValue, this.startElValue)
      .withMapOrigin(formatDatetime);

    ch.defineBidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(interval.endValue, this.endElValue)
      .withMapOrigin(formatDatetime);

    ch.defineBidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(interval.tagValue, this.tagElValue);

    return ch;
  }
}


class IntervalEditView {
  constructor() {
    const el = this.element = document.createElement('form');
    el.addEventListener('submit', (ev) => ev.preventDefault() );
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

    this.startElValue = new Transmitter.DOMElement.InputValue(this.startEl);
    this.endElValue = new Transmitter.DOMElement.InputValue(this.endEl);
    this.tagElValue = new Transmitter.DOMElement.InputValue(this.tagEl);

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
          .noOpIf( (key) => key != 'Enter' )
      )
      .init(tr);
    return this;
  }

  createChannel(interval) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineBidirectionalChannel()
      .withOriginDerived(interval.startValue, this.startElValue)
      .withMapOrigin(formatDatetime)
      .withMapDerived(parseDatetime);


    ch.defineBidirectionalChannel()
      .withOriginDerived(interval.endValue, this.endElValue)
      .withMapOrigin(formatDatetime)
      .withMapDerived(parseDatetime);

    ch.defineBidirectionalChannel()
      .withOriginDerived(interval.tagValue, this.tagElValue);

    return ch;
  }

  createRemoveChannel(intervalCollection, interval) {
    return new Transmitter.Channels.SimpleChannel()
      .inBackwardDirection()
      .fromSource(this.removeEvt)
      .toTarget(intervalCollection)
      .withTransform( (removePayload) =>
          removePayload.map( () => interval ).toRemoveAction()
      );
  }
}
