export default class DB<K, V, TS extends any[]> {
    private readonly map: Map<K, V> = new Map();
    constructor(private readonly c: (key: K, ...args: TS) => V) { }

    get(key: K, ...args: TS): V {
        const value: V | undefined = this.map.get(key);
        if (value === undefined && !this.map.has(key)) {
            const value = this.c(key, ...args);
            this.map.set(key, value);
            return value;
        } else {
            return value!;
        }
    }
}
