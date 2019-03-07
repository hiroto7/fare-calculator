import Station, { StationSubstance } from "./Station";
import Line from "./Line";
import { outbound } from "./Direction";

export interface StationOnLine extends Station {
    line: Line;
    readonly substance: StationSubstance;
    codes(): IterableIterator<string>;
    distanceFromStart(): number | null;
    index(): number;
    // children(): IterableIterator<StationOnLine>;
}

export abstract class AbstractStationOnLine1<L extends Line> implements StationOnLine {
    abstract readonly substance: StationSubstance;
    abstract codes(): IterableIterator<string>;
    abstract distanceFromStart(): number | null;

    readonly line: L;

    constructor(line: L) {
        this.line = line;
    }

    get name(): string { return this.substance.name; }
    get isSeasonal(): boolean { return this.substance.isSeasonal; }

    toString() { return `${this.name}@${this.line.name}` }
    index(): number {
        const index = this.line.indexOf(this);
        if (index === null)
            throw new Error(`'${this.name}' 駅のインデックスを取得できません。`);
        return index;
    }
}

export abstract class AbstractStationOnLine2<L extends Line> extends AbstractStationOnLine1<L> {
    abstract readonly substance: StationSubstance;

    *codes(): IterableIterator<string> {
        yield* this.line.codesOf(this);
    }

    distanceFromStart(): number | null {
        return this.line.distanceBetween(this.line.from, this, outbound);
    }
}

export abstract class AbstractStationOnSection<SOL extends StationOnLine> extends AbstractStationOnLine2<Line> {
    readonly original: SOL;

    constructor({ line, station }: {
        line: Line,
        station: SOL
    }) {
        super(line);
        this.original = station;
    }

    get substance(): StationSubstance { return this.original.substance; }
}