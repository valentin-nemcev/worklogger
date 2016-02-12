import * as Transmitter from 'transmitter-framework/index.es';

function parseJSONWithoutThrowing(str) {
  try {
    return JSON.parse(str);
  } catch(e) {
    return null;
  }
}

function parseJSONArray(str) {
  return Array.from(parseJSONWithoutThrowing(str) || []);
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
        (payload) => payload.joinEntries().map(JSON.stringify)
      )
      .withTransformDerived(
        (payload) => payload
          .map(parseJSONArray)
          .splitValues()
          .valuesToEntries()
      );

    ch.serializedValueMap = new Transmitter.Nodes.OrderedMapNode();

    ch.defineSimpleChannel()
      .inBackwardDirection()
      .fromSource(ch.serializedMap)
      .toTarget(ch.serializedValueMap)
      .withTransform( (localStoragePayload) =>
        localStoragePayload.updateMapByKey(
          () => new Transmitter.Nodes.ValueNode()
        )
      );

    ch.defineFlatteningChannel()
      .withNestedAsOrigin(ch.serializedValueMap)
      .withFlat(ch.serializedMap);

    ch.defineNestedBidirectionalChannel()
      .withOriginDerived(items.collection, ch.serializedValueMap)
      .updateMapByKey()
      .withMapOrigin( () => new Transmitter.Nodes.ValueNode() )
      .withMapDerived(
        (valueNode, key) => this.ItemStorage.createItemByKey(items, key)
      )
      .withOriginDerivedChannel(
        (item, serializedValue) =>
          this.ItemStorage.createSerializedItemChannel(item, serializedValue)
      );

    return ch;
  }
}
