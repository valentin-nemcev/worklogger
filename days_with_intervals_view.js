import * as Transmitter from 'transmitter-framework/index.es';

import {formatDate} from './date_utils';

import {ItemView} from './list_view';

export default class DaysWithIntervalsView {

  constructor({DayView, IntervalView}) {
    this.DayView = DayView;
    this.IntervalView = IntervalView;
    const el = this.element = document.createElement('div');

    this.dayListEl = el.appendChild(document.createElement('div'));
    this.dayListEl.classList.add('days-with-intervals-list');

    this.dayViewMap = new Transmitter.Nodes.OrderedMapNode();
    this.dayElementSet =
      new Transmitter.DOMElement.ChildrenSet(this.dayListEl);
  }

  init(tr) {
    new Transmitter.Channels.BidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(this.dayViewMap, this.dayElementSet)
      .updateSetByValue()
      .withMapOrigin( (dayWithIntervalsView) => dayWithIntervalsView.element )
      .init(tr);
    return this;
  }

  createChannel(daysWithIntervalsList) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineNestedBidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(daysWithIntervalsList.collection, this.dayViewMap)
      .updateMapByValue()
      .withMapOrigin(
        (dayWithIntervals, tr) =>
          new DayWithIntervalsView(
            this.DayView, this.IntervalView, dayWithIntervals
          ).init(tr)
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
    this.DayView = DayView;
    this.dayWithIntervals = dayWithIntervals;

    const el = this.element = document.createElement('div');
    el.classList.add('day-with-intervals');

    this.dateEl = el.appendChild(document.createElement('strong'));
    this.dateEl.innerText = formatDate(dayWithIntervals.dayIndex);

    this.dayValueEl = el.appendChild(document.createElement('div'));
    this.dayValueEl.classList.add('day');

    this.intervalListEl = el.appendChild(document.createElement('div'));
    this.intervalListEl.classList.add('intervals-list');

    this.dayViewOptional = new Transmitter.Nodes.OptionalNode();
    this.dayElementSet =
      new Transmitter.DOMElement.ChildrenSet(this.dayValueEl);

    this.intervalViewMap = new Transmitter.Nodes.OrderedMapNode();
    this.intervalElementSet =
      new Transmitter.DOMElement.ChildrenSet(this.intervalListEl);
  }

  init(tr) {
    new Transmitter.Channels.BidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(this.dayViewOptional, this.dayElementSet)
      .updateSetByValue()
      .withMapOrigin( (itemView) => itemView.element )
      .init(tr);

    new Transmitter.Channels.BidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(this.intervalViewMap, this.intervalElementSet)
      .updateSetByValue()
      .withMapOrigin( (itemView) => itemView.element )
      .init(tr);
    return this;
  }

  createChannel(dayWithIntervals) {
    const ch = new Transmitter.Channels.CompositeChannel();
    ch.dayWithIntervals = dayWithIntervals;
    ch.dayWithIntervalsView = this;

    ch.defineNestedBidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(dayWithIntervals.dayOptional, this.dayViewOptional)
      .updateMapByValue()
      .withMapOrigin(
        (item, tr) => this.DayView.createShow(item).init(tr)
      )
      .withOriginDerivedChannel(
        (item, itemView) => itemView.createChannel(item)
      );

    ch.defineNestedBidirectionalChannel()
      .inForwardDirection()
      .withOriginDerived(dayWithIntervals.intervalSet, this.intervalViewMap)
      .updateMapByValue()
      .withMapOrigin(
        (item, tr) => new ItemView(this.IntervalView, item).init(tr)
      )
      .withOriginDerivedChannel(
        (item, itemView) => itemView.createChannel(item)
      );

    // ch.removeItemChannelList = new Transmitter.ChannelNodes.ChannelList();

    // ch.defineNestedSimpleChannel()
    //   .fromSource(this.intervalViewMap)
    //   .toChannelTarget(ch.removeItemChannelList)
    //   .withTransform( (itemViewsPayload) =>
    //     itemViewsPayload.map( (itemView) =>
    //       itemView.createRemoveChannel(dayWithIntervals.intervalSet) )
    //   );


    return ch;
  }
}
