import Transmitter from 'transmitter-framework/index.es';


export default {
  createSerializedItemChannel(interval, serializedVar) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSources(interval.startVar, interval.endVar, interval.tagVar)
      .toTarget(serializedVar)
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
      .fromSource(serializedVar)
      .toTargets(interval.startVar, interval.endVar, interval.tagVar)
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