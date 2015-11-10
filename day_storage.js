import * as Transmitter from 'transmitter-framework/index.es';


export default {
  createSerializedItemChannel(day, serializedValue) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSources(day.dateValue, day.targetValue)
      .toTarget(serializedValue)
      .withTransform( ([payload, ...otherPayloads]) =>
          payload.merge(...otherPayloads).map( ([date, target]) =>
            ({
              date: day.serializeDate(date),
              target
            }))
          );

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(serializedValue)
      .toTargets(day.dateValue, day.targetValue)
      .withTransform( (payload) =>
          payload.map( (serialized) => {
            const {date, target} = Object(serialized);
            return [
              day.unserializeDate(date),
              target
            ];
          }).separate()
          );

    return ch;
  }
};
