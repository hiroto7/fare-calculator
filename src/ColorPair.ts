export default class ColorPair {
    constructor(readonly first: string, readonly second: string) { }
    equals(pair: ColorPair) { return this.first === pair.first && this.second === pair.second; }
}