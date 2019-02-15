import Station, { StationSubstance } from "./Station";
import Line from "./Line";
import { outbound } from "./Direction";

export interface StationOnLine extends Station {
    line: Line;
    codes(): IterableIterator<string>;
    distanceFromStart(): number | null;
    // children(): IterableIterator<StationOnLine>;
}

export abstract class AbstractStationOnLine1<L extends Line = Line> implements StationOnLine {
    abstract readonly substance: StationSubstance;
    abstract codes(): IterableIterator<string>;
    abstract distanceFromStart(): number | null;

    readonly line: L;

    constructor(line: L) {
        this.line = line;
    }

    get name(): string { return this.substance.name; }
    get isSeasonal(): boolean { return this.substance.isSeasonal; }

    *lines(): IterableIterator<Line> { yield* this.substance.lines(); }

    toString() { return `${this.name}@${this.line.name}` }
}

export abstract class AbstractStationOnLine2<L extends Line = Line> extends AbstractStationOnLine1<L> {
    abstract readonly substance: StationSubstance;

    *codes(): IterableIterator<string> {
        yield* this.line.codesOf(this);
    }

    distanceFromStart(): number | null {
        return this.line.distanceBetween(this.line.from, this, outbound);
    }
}

export class StationOnSection extends AbstractStationOnLine2 {
    readonly original: StationOnLine;

    constructor({ line, station }: {
        line: Line,
        station: StationOnLine
    }) {
        super(line);
        this.original = station;
    }

    get substance(): StationSubstance { return this.original.substance; }
}