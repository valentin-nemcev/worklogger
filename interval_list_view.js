import Transmitter from 'transmitter-framework/index.es';

import IntervalView from './interval_view';
import CreateIntervalView from './create_interval_view';


export default class IntervalListView {
  constructor() {
    const el = this.element = document.createElement('div');

    this.intervalListEl = el.appendChild(document.createElement('div'));
    this.intervalListEl.classList.add('interval-list');

    this.intervalViewList = new Transmitter.Nodes.List();
    this.intervalElementList =
      new Transmitter.DOMElement.ChildrenList(this.intervalListEl);

    this.createIntervalView = new CreateIntervalView();
    el.appendChild(this.createIntervalView.element);
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
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineListChannel()
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

    ch.removeIntervalChannelList = new Transmitter.ChannelNodes.ChannelList();

    ch.defineSimpleChannel()
      .fromSource(this.intervalViewList)
      .toConnectionTarget(ch.removeIntervalChannelList)
      .withTransform( (intervalViewsPayload) =>
        intervalViewsPayload.map( (intervalView) =>
          intervalView.createRemoveChannel(intervalList) )
      );

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(this.createIntervalView.createIntervalEvt)
      .toTarget(intervalList)
      .withTransform( (createIntervalPayload, tr) =>
          createIntervalPayload
          .map( () => intervalList.createInterval().init(tr) )
          .toAppendListElement()
      );

    return ch;
  }
}
