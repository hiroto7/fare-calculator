export default class SingleEntryIterator<T> implements IterableIterator<T> {
    private done: boolean = false;
    constructor(private readonly entry: T) { }

    next(): IteratorResult<T> {
        if (this.done) {
            return {
                done: true,
                value: <T><unknown>undefined
            };
        }
        else {
            this.done = true;
            return {
                done: false,
                value: this.entry
            }
        }
    }

    [Symbol.iterator](): this {
        return this;
    }
}