/**
 * ES6 Map + custom extensions.
 */
export class MapExt<K, V> extends Map<K, V> {
  getOrAdd(k: K, factory: (k: K) => V): V {
    let r = this.get(k);
    if (r === undefined) {
      r = factory(k);
      this.set(k, r);
    }
    return r;
  }
}
