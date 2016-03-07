import * as Transmitter from 'transmitter-framework/index.es';

import {formatDate, parseDate} from './date_utils';

export default {
  createAddActionView(...args) {
    return new CreateDayView(...args);
  },

  createShow(...args) {
    return new DayShowView(...args);
  },

  createEdit(...args) {
    return new DayEditView(...args);
  }
};


class CreateDayView {
  constructor() {
    const el = this.element = document.createElement('div');
    el.classList.add('create-day');

    this.dateEl = el.appendChild(document.createElement('input'));
    this.dateEl.value = '2016-01-01';
    this.dateEl.type = 'text';
    this.dateEl.size = '14';

    el.appendChild(document.createTextNode(' '));

    this.addButtonEl = el.appendChild(document.createElement('button'));
    this.addButtonEl.innerText = 'Add day';

    this.dateElValue = new Transmitter.DOMElement.InputValue(this.dateEl);

    this.createItemEvt =
      new Transmitter.DOMElement.DOMEvent(this.addButtonEl, 'click');
  }

  createCreateChannel(days) {
    return new Transmitter.Channels.SimpleChannel()
      .inBackwardDirection()
      .fromSources(this.createItemEvt, this.dateElValue)
      .toTarget(days.collection)
      .withTransform( ([createItemPayload, datePayload], tr) =>
        datePayload.replaceByNoOp(createItemPayload)
          .map(
            (date) => days.createItemWithDefaultValues(tr, parseDate(date))
          )
          .toSetAtAction( (day) => day.dateIndex )
      );
  }
}


class DayShowView {
  constructor() {
    const el = this.element = document.createElement('div');
    el.classList.add('show');
    this.dateEl = el.appendChild(document.createElement('span'));
    el.appendChild(document.createTextNode(' '));
    this.targetEl = el.appendChild(document.createElement('span'));

    this.targetElValue = new Transmitter.DOMElement.TextValue(this.targetEl);

    this.startEditEvt = new Transmitter.DOMElement.DOMEvent(el, 'dblclick');
  }

  init() {
    return this;
  }

  createChannel(day) {
    this.dateEl.innerText = formatDate(day.date);
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineBidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(day.targetValue, this.targetElValue);

    return ch;
  }
}


class DayEditView {
  constructor() {
    const el = this.element = document.createElement('form');
    el.addEventListener('submit', (ev) => ev.preventDefault() );
    el.classList.add('edit');
    this.dateEl = el.appendChild(document.createElement('span'));
    el.appendChild(document.createTextNode(' '));
    this.targetEl = el.appendChild(document.createElement('input'));
    this.targetEl.type = 'text';
    el.appendChild(document.createTextNode(' '));
    this.removeEl = el.appendChild(document.createElement('button'));
    this.removeEl.classList.add('remove-day');
    this.removeEl.type = 'button';
    this.removeEl.innerText = '×';

    this.targetElValue = new Transmitter.DOMElement.InputValue(this.targetEl);

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

  createChannel(day) {
    this.dateEl.innerText = formatDate(day.date);

    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineBidirectionalChannel()
      .withOriginDerived(day.targetValue, this.targetElValue)
      .withMapDerived( (str) => parseInt(str, 10) );

    return ch;
  }

  createRemoveChannel(dayList, day) {
    return new Transmitter.Channels.SimpleChannel()
      .inBackwardDirection()
      .fromSource(this.removeEvt)
      .toTarget(dayList)
      .withTransform(
        (removePayload) =>
          removePayload
            .map( () => day )
            .toRemoveAtAction( (day) => day.dateIndex )
      );
  }
}
