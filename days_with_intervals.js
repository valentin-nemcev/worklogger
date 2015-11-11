import * as Transmitter from 'transmitter-framework/index.es';

export default class DaysWithIntervals {

  constructor() {
    this.list = new Transmitter.Nodes.List();
  }

  createChannel(dayList) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSource(dayList)
      .toTarget(this.list)
      .withTransform(
        (payload) => payload.updateMatching(
          (day) => new DayWithIntervals(day),
          (day, dayWithIntervals) => dayWithIntervals.day == day
        )
      );

    return ch;
  }
}


class DayWithIntervals {
  constructor(day) {
    this.day = day;
  }
}