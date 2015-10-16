import Transmitter from 'transmitter-framework';

export default class CreateIntervalView {
  constructor() {
    const el = this.element = document.createElement('div');
    el.classList.add('create-interval');
    this.addButtonEl = el.appendChild(document.createElement('button'));
    this.addButtonEl.innerText = 'Add interval';

    this.createIntervalEvt =
      new Transmitter.DOMElement.DOMEvent(this.addButtonEl, 'click');
  }
}
