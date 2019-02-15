import Line from "./Line";

export default interface Station {
    readonly name: string;
    readonly isSeasonal: boolean;
    readonly substance: StationSubstance;
    lines(): IterableIterator<Line>;
}

export interface WritableStation extends Station {
    isSubstance: true;
    add(line: Line): void;
}

export interface StationSubstance extends Station {
    readonly isSubstance: true;
    readonly substance: this;
}

export class Station1 implements StationSubstance, WritableStation {
    isSubstance: true = true;
    private readonly rawLines: Set<Line> = new Set();

    readonly substance: this = this;
    readonly name: string;
    isSeasonal: boolean = false;

    constructor(name: string) {
        this.name = name;
    }

    *lines(): IterableIterator<Line> { yield* this.rawLines; }
    add(line: Line) { this.rawLines.add(line); }
    toString() { return this.name; }
}