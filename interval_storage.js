import * as Transmitter from 'transmitter-framework/index.es';


export default {
  createSerializedItemChannel(interval, serializedValue) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSources(interval.startValue, interval.endValue, interval.tagValue)
      .toTarget(serializedValue)
      .withTransform( ([payload, ...otherPayloads]) =>
          payload.merge(...otherPayloads).map( ([start, end, tag]) =>
            ({
              start: interval.serializeDatetime(start),
              end: interval.serializeDatetime(end),
              tag
            }))
          );

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(serializedValue)
      .toTargets(interval.startValue, interval.endValue, interval.tagValue)
      .withTransform( (payload) =>
          payload.map( (serialized) => {
            const {start, end, tag} = Object(serialized);
            return [
              interval.unserializeDatetime(start),
              interval.unserializeDatetime(end),
              tag
            ];
          }).separate()
          );

    return ch;
  }
};
