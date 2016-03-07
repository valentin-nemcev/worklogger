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
        (payload) => payload.collapseEntries().map(JSON.stringify)
      )
      .withTransformDerived(
        (payload) => payload
          .map(parseJSONArray)
          .expandValues()
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

    let collection;

    if (items.collection instanceof Transmitter.Nodes.OrderedMapNode) {
      collection = items.collection;
    } else if (items.collection instanceof Transmitter.Nodes.OrderedSetNode) {
      collection = new Transmitter.Nodes.OrderedMapNode();
      ch.defineBidirectionalChannel()
        .withOriginDerived(items.collection, collection)
        .withTransformOrigin(
          (itemsPayload) =>
            itemsPayload.map( (item) => [item.uuid, item] )
              .valuesToEntries()
              .updateMapByKey( (item) => item )
        )
        .withTransformDerived(
          (itemsPayload) => itemsPayload.updateSetByValue( (a) => a )
        );
    }
    ch.defineNestedBidirectionalChannel()
      .withOriginDerived(collection, ch.serializedValueMap)
      .updateMapByKey()
      .withMapOrigin( () => new Transmitter.Nodes.ValueNode() )
      .withMapDerived(
        (valueNode, key, tr) =>
          this.ItemStorage.createItemByKey(items, key).init(tr)
      )
      .withOriginDerivedChannel(
        (item, serializedValue) =>
          this.ItemStorage.createSerializedItemChannel(item, serializedValue)
      );

    return ch;
  }
}
