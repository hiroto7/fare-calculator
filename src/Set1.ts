export default class Set1<T extends { equals(obj: T): boolean }> implements Set<T> {
    readonly raw: Set<T> = new Set();

    constructor(iterable: Iterable<T> = []) {
        for (const value of iterable)
            this.add(value);
    }

    add(value: T): this {
        if (!this.has(value))
            this.raw.add(value);
        return this;
    }

    delete(value: T): boolean {
        for (const val of this.raw) {
            if (val.equals(value)) {
                this.raw.delete(val);
                return true;
            }
        }
        return false;
    }

    has(value: T): boolean {
        for (const val of this.raw) {
            if (val.equals(value))
                return true;
        }
        return false;
    }

    forEach(callbackfn: (value: T, value2: T, set: Set<T>) => void, thisArg?: any): void {
        this.raw.forEach(callbackfn, thisArg);
    }

    clear(): void { this.raw.clear(); }
    get size(): number { return this.raw.size; };
    [Symbol.iterator](): IterableIterator<T> { return this.raw[Symbol.iterator](); }
    entries(): IterableIterator<[T, T]> { return this.raw.entries(); }
    keys(): IterableIterator<T> { return this.raw.keys(); }
    values(): IterableIterator<T> { return this.raw.values(); }
    [Symbol.toStringTag]: string;
}
