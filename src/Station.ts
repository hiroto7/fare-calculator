import Line from "./Line";
import { StationOnLine } from "./StationOnLine";

export default interface Station {
    name(): string;
    lines(): IterableIterator<Line>;
    isSeasonal(): boolean;
    on(line: Line): StationOnLine | null;
    substance(): StationSubstance;
}

export interface WritableStation extends Station {
    add(line: Line, onLine: StationOnLine): void;
    setOptions({ isSeasonal }: { isSeasonal?: boolean }): void;
}

export interface StationSubstance extends Station {
    readonly isSubstance: true;
    substance(): this;
}

export class Station1 implements StationSubstance, WritableStation {
    readonly isSubstance: true = true;
    private readonly rawName: string;
    private rawIsSeasonal: boolean = false;
    private readonly rawLines: Set<Line> = new Set();
    private readonly stationsOnLines: Map<Line, StationOnLine> = new Map();

    constructor(name: string) {
        this.rawName = name;
    }

    substance(): this { return this; }

    name(): string { return this.rawName; }
    *lines(): IterableIterator<Line> { yield* this.rawLines; }
    isSeasonal(): boolean { return this.rawIsSeasonal; }

    on(line: Line): StationOnLine | null {
        return line.onLineOf(this);
    }

    add(line: Line, onLine: StationOnLine) {
        this.rawLines.add(line);
        this.stationsOnLines.set(line, onLine);
    }

    setOptions({ isSeasonal }: {
        isSeasonal?: boolean
    }) {
        if (isSeasonal !== undefined)
            this.rawIsSeasonal = isSeasonal;
    }

    toString() { return this.name(); }
}