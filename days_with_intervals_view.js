import * as Transmitter from 'transmitter-framework/index.es';

export default class DaysWithIntervalsView {

  constructor({DayView, IntervalView}) {
    this.DayView = DayView;
    this.IntervalView = IntervalView;
    const el = this.element = document.createElement('div');

    this.dayListEl = el.appendChild(document.createElement('div'));
    this.dayListEl.classList.add('days-with-intervals-list');

    this.dayViewList = new Transmitter.Nodes.List();
    this.dayElementList =
      new Transmitter.DOMElement.ChildrenList(this.dayListEl);
  }

  init(tr) {
    new Transmitter.Channels.BidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(this.dayViewList, this.dayElementList)
      .withMatchOriginDerived(
        (dayWithIntervalsView, dayEl) => dayWithIntervalsView.element == dayEl )
      .withMapOrigin( (dayWithIntervalsView) => dayWithIntervalsView.element )
      .init(tr);
    return this;
  }

  createChannel(daysWithIntervalsList) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineNestedBidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(daysWithIntervalsList.list, this.dayViewList)
      .withMatchOriginDerived(
        (dayWithIntervals, dayWithIntervalsView) =>
          dayWithIntervalsView.dayWithIntervals == dayWithIntervals
      )
      .withMapOrigin(
        (dayWithIntervals, tr) =>
          new DayWithIntervalsView(this.DayView, this.IntervalView, dayWithIntervals)
          .init(tr)
      )
      .withMatchOriginDerivedChannel(
        (dayWithIntervals, dayWithIntervalsView, channel) =>
          channel.dayWithIntervals == dayWithIntervals
          && channel.dayWithIntervalsView == dayWithIntervalsView
      )
      .withOriginDerivedChannel(
        (dayWithIntervals, dayWithIntervalsView) =>
          dayWithIntervalsView.createChannel(dayWithIntervals)
      );

    return ch;
  }
}

class DayWithIntervalsView {

  constructor(DayView, IntervalView, dayWithIntervals) {
    this.IntervalView = IntervalView;
    this.dayWithIntervals = dayWithIntervals;

    const el = this.element = document.createElement('div');
    el.classList.add('day-with-intervals');

    this.dayView = DayView.createShow();
    el.appendChild(this.dayView.element);

    this.intervalListEl = el.appendChild(document.createElement('div'));
    this.intervalListEl.classList.add('intervals-list');

    this.intervalViewList = new Transmitter.Nodes.List();
    this.intervalElementList =
      new Transmitter.DOMElement.ChildrenList(this.intervalListEl);
  }

  init(tr) {
    this.dayView.init(tr);
    new Transmitter.Channels.BidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(this.intervalViewList, this.intervalElementList)
      .withMatchOriginDerived(
        (itemView, itemEl) => itemView.element == itemEl )
      .withMapOrigin( (itemView) => itemView.element )
      .init(tr);
    return this;
  }

  createChannel(dayWithIntervals) {
    const ch = new Transmitter.Channels.CompositeChannel();
    ch.dayWithIntervals = dayWithIntervals;
    ch.dayWithIntervalsView = this;
    ch.addChannel(this.dayView.createChannel(dayWithIntervals.day));

    ch.defineNestedBidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(dayWithIntervals.intervalList, this.intervalViewList)
      // .withMatchOriginDerived(
      //   (item, itemView) => itemView.item == item )
      .withMapOrigin( (item, tr) => this.IntervalView.createShow(item).init(tr) )
      // .withMatchOriginDerivedChannel( (item, itemView, channel) =>
      //   channel.item == item && channel.itemView == itemView
      // )
      .withOriginDerivedChannel(
        (item, itemView) => itemView.createChannel(item)
      );

    return ch;
  }

}
