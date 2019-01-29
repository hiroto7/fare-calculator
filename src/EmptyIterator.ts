export default class EmptyIterator<T> implements IterableIterator<T> {
    next(): IteratorResult<T> {
        return {
            done: true,
            value: <T><unknown>undefined
        };
    }

    [Symbol.iterator](): this {
        return this;
    }
}
