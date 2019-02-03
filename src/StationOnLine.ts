import Station, { StationSubstance } from "./Station";
import Line from "./Line";
import { outbound } from "./Direction";

export interface StationOnLine extends Station {
    line(): Line;
    codes(): IterableIterator<string>;
    distanceFromStart(): number | null;
    // children(): IterableIterator<StationOnLine>;
}

export abstract class AbstractStationOnLine1<L extends Line = Line> implements StationOnLine {
    abstract substance(): StationSubstance;
    abstract codes(): IterableIterator<string>;
    abstract distanceFromStart(): number | null;

    private readonly rawLine: L;

    constructor(line: L) {
        this.rawLine = line;
    }

    line(): L { return this.rawLine; }

    name(): string { return this.substance().name(); }
    *lines(): IterableIterator<Line> { yield* this.substance().lines(); }
    isSeasonal(): boolean { return this.substance().isSeasonal(); }

    on(line: Line): StationOnLine | null {
        if (line === this.line())
            return this;
        else
            return this.substance().on(line);
    }

    toString() { return `${this.name()}@${this.line().name()}` }
}

export abstract class AbstractStationOnLine2<L extends Line = Line> extends AbstractStationOnLine1<L> {
    abstract substance(): StationSubstance;

    *codes(): IterableIterator<string> {
        yield* this.line().codesOf(this);
    }

    distanceFromStart(): number | null {
        return this.line().distanceBetween(this.line().from(), this, outbound);
    }
}