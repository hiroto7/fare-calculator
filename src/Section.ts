import { Direction } from "./Direction";
import Line from "./Line";
import Station, { StationOnLine, StationOnLine1, StationSubstance } from "./Station";

export class Section implements Line {
    private line: Line;
    private direction: Direction;
    private rawFrom?: Station;
    private rawTo?: Station;
    private stationsOnLineMap: Map<StationSubstance, StationOnLine>;

    constructor({ line, direction, from, to, stations = [] }: {
        line: Line,
        direction: Direction,
        from?: Station,
        to?: Station,
        stations?: Iterable<{
            substance: StationSubstance;
            distanceFromStart: number | null;
            code?: string | null;
        }>
    }) {
        this.line = line;
        this.direction = direction;
        this.rawFrom = from;
        this.rawTo = to;

        this.stationsOnLineMap = new Map();
        for (const station of stations) {
            this.stationsOnLineMap.set(station.substance, new StationOnLine1({ line: this, ...station }));
        }
    }

    from() {
        let from: StationOnLine | null;
        if (this.rawFrom !== undefined)
            from = this.rawFrom.on(this);
        else if (this.direction === Direction.outbound)
            from = this.line.from().on(this);
        else
            from = this.line.to().on(this);

        if (from === null) throw new Error();
        return from;
    }

    to() {
        let to: StationOnLine | null;
        if (this.rawTo !== undefined)
            to = this.rawTo.on(this.line);
        else if (this.direction === Direction.outbound)
            to = this.line.to();
        else
            to = this.line.from();


        if (to === null) throw new Error();
        return to;
    }

    name() {
        return this.line.name();
    }

    code() {
        return this.line.code();
    }

    color() {
        return this.line.color();
    }

    length() {
        const length = this.line.distance(this.from(), this.to());
        if (length === null) throw new Error();
        return this.direction * length;
    }

    stations(direction?: Direction): IterableIterator<StationOnLine>
    stations(direction: Direction,
        { from, to }: { from?: Station, to?: Station }): IterableIterator<StationOnLine> | null
    stations(direction: Direction = Direction.outbound,
        { from, to }: { from?: Station, to?: Station } = {}): IterableIterator<StationOnLine> | null {

        const stations = this.line.stations(direction, { from: this.from(), to: this.to() });

        if (stations === null) {
            if (from === undefined && to === undefined) throw new Error();
            return null;
        }

        return new SectionIterator(this, stations);
    }

    onLineOf(station: Station): StationOnLine | null {
        const substance = station.substance();
        let onLine: StationOnLine | undefined = this.stationsOnLineMap.get(substance);

        if (onLine === undefined) {
            if (!new Set(this.stations()).has(station.on(this.line)!)) return null;
            onLine = new StationOnLine1({ line: this, substance, code: null });
            this.stationsOnLineMap.set(substance, onLine);
        }

        return onLine;
    }

    distance(station1: Station, station2: Station): number | null {
        if (!this.has(station1) || !this.has(station2)) return null;
        return this.line.distance(station1, station2);
    }

    has(station: Station): boolean {
        return station.on(this) !== null;
    }
}

class SectionIterator implements IterableIterator<StationOnLine> {
    constructor(private readonly line: Line,
        private readonly iterator: Iterator<Station>) { }

    next(): IteratorResult<StationOnLine> {
        const result = this.iterator.next();
        if (result.done) {
            return {
                done: true,
                value: <StationOnLine><unknown>undefined
            };
        } else {
            const value: StationOnLine | null = result.value.on(this.line);

            if (value === null) throw Error();

            return { done: false, value };
        }
    }

    [Symbol.iterator](): this { return this; }
}
