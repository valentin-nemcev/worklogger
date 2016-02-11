import * as Transmitter from 'transmitter-framework/index.es';

function parseJSONWithoutThrowing(str) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return null;
  }
}

export default class Storage {
  constructor(name, ItemStorage) {
    this.ItemStorage = ItemStorage;
    this.localStorageValue =
      new Transmitter.Nodes.PropertyValueNode(window.localStorage, name);
  }

  load(tr) {
    this.localStorageValue.originate(tr);
  }

  createChannel(items) {
    const ch = new Transmitter.Channels.CompositeChannel();

    ch.serializedMap = new Transmitter.Nodes.OrderedMapNode();

    ch.defineBidirectionalChannel()
      .withOriginDerived(ch.serializedMap, this.localStorageValue)
      .withTransformOrigin(
        (payload) => payload.toValue().map(JSON.stringify)
      )
      .withTransformDerived(
        (payload) => payload.map(parseJSONWithoutThrowing).toList()
      );

    ch.serializedValueMap = new Transmitter.Nodes.OrderedMapNode();

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(ch.serializedMap)
      .toTarget(ch.serializedValueMap)
      .withTransform( (localStoragePayload) =>
        localStoragePayload
          .updateMatching(
            () => new Transmitter.Nodes.Value(),
            () => true
          )
      );

    ch.defineFlatteningChannel()
      .withNestedAsOrigin(ch.serializedValueMap)
      .withFlat(ch.serializedMap);

    ch.defineNestedBidirectionalChannel()
      .withOriginDerived(items.map, ch.serializedValueMap)
      .withMatchOriginDerived( (item, serializedValue) =>
          serializedValue.item == item
      )
      .withMapOrigin( (item) => {
        const v = new Transmitter.Nodes.Value();
        v.item = item;
        return v;
      })
      .withMapDerived( (serializedValue) => {
        const item = items.createItem();
        serializedValue.item = item;
        return item;
      })
      .withOriginDerivedChannel( (item, serializedValue) =>
          this.ItemStorage.createSerializedItemChannel(item, serializedValue));

    return ch;
  }
}
