export default class ReverseIterator<T> implements IterableIterator<T> {
    private readonly array: ReadonlyArray<T>;
    private index: number;

    constructor(array: ReadonlyArray<T>) {
        this.array = array;
        this.index = array.length;
    }

    next(): IteratorResult<T> {
        if (this.index <= 0) {
            return {
                done: true,
                value: <T><unknown>undefined
            }
        } else {
            this.index--;
            return {
                done: false,
                value: this.array[this.index]
            }
        }
    }

    [Symbol.iterator](): this {
        return this;
    }
}
