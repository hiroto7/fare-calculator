export default class DB<K, V, TS extends any[]> extends Map<K, V> {
    constructor(private readonly c: (key: K, ...args: TS) => V) { super(); }

    get1(key: K, ...args: TS): V {
        const value: V | undefined = this.get(key);
        if (value === undefined && !this.has(key)) {
            const value = this.c(key, ...args);
            this.set(key, value);
            return value;
        } else {
            return value!;
        }
    }
}
