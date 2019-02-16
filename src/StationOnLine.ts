import Station, { StationSubstance } from "./Station";
import Line from "./Line";
import { outbound } from "./Direction";

export interface StationOnLine<SS extends StationSubstance> extends Station {
    line: Line<SS>;
    readonly substance: SS;
    codes(): IterableIterator<string>;
    distanceFromStart(): number | null;
    // children(): IterableIterator<StationOnLine>;
}

export abstract class AbstractStationOnLine1<L extends Line<SS>, SS extends StationSubstance> implements StationOnLine<SS> {
    abstract readonly substance: SS;
    abstract codes(): IterableIterator<string>;
    abstract distanceFromStart(): number | null;

    readonly line: L;

    constructor(line: L) {
        this.line = line;
    }

    get name(): string { return this.substance.name; }
    get isSeasonal(): boolean { return this.substance.isSeasonal; }

    *lines(): IterableIterator<Line<SS>> { yield* this.substance.lines(); }

    toString() { return `${this.name}@${this.line.name}` }
}

export abstract class AbstractStationOnLine2<L extends Line<SS>, SS extends StationSubstance> extends AbstractStationOnLine1<L, SS> {
    abstract readonly substance: SS;

    *codes(): IterableIterator<string> {
        yield* this.line.codesOf(this);
    }

    distanceFromStart(): number | null {
        return this.line.distanceBetween(this.line.from, this, outbound);
    }
}

export class StationOnSection<SS extends StationSubstance> extends AbstractStationOnLine2<Line<SS>, SS> {
    readonly original: StationOnLine<SS>;

    constructor({ line, station }: {
        line: Line<SS>,
        station: StationOnLine<SS>
    }) {
        super(line);
        this.original = station;
    }

    get substance(): SS { return this.original.substance; }
}