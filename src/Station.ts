import Line from "./Line";
import { StationOnLine } from "./StationOnLine";

export default interface Station {
    readonly name: string;
    readonly isSeasonal: boolean;
    readonly substance: StationSubstance;
    lines(): IterableIterator<Line>;
}

export interface WritableStation extends Station {
    add(line: Line, onLine: StationOnLine): void;
    setOptions({ isSeasonal }: { isSeasonal?: boolean }): void;
}

export interface StationSubstance extends Station {
    readonly isSubstance: true;
    readonly substance: this;
}

export class Station1 implements StationSubstance, WritableStation {
    readonly isSubstance: true = true;
    private readonly rawLines: Set<Line> = new Set();
    private readonly stationsOnLines: Map<Line, StationOnLine> = new Map();

    readonly substance: this = this;
    readonly name: string;
    isSeasonal: boolean = false;

    constructor(name: string) {
        this.name = name;
    }

    *lines(): IterableIterator<Line> { yield* this.rawLines; }

    add(line: Line, onLine: StationOnLine) {
        this.rawLines.add(line);
        this.stationsOnLines.set(line, onLine);
    }

    setOptions({ isSeasonal }: {
        isSeasonal?: boolean
    }) {
        if (isSeasonal !== undefined)
            this.isSeasonal = isSeasonal;
    }

    toString() { return this.name; }
}