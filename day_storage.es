import Transmitter from 'transmitter-framework';


export default {
  createSerializedItemChannel(day, serializedVar) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.defineSimpleChannel()
      .inForwardDirection()
      .fromSources(day.dateVar, day.targetVar)
      .toTarget(serializedVar)
      .withTransform( ([payload, ...otherPayloads]) =>
          payload.merge(...otherPayloads).map( ([date, target]) =>
            ({
              date: day.serializeDate(date),
              target
            }))
          );

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(serializedVar)
      .toTargets(day.dateVar, day.targetVar)
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
