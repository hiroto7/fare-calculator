import { Direction } from "./Direction";
import Line from "./Line";
import Station, { StationOnLine, StationOnLine1, StationSubstance } from "./Station";

export default class Section implements Line {
    private readonly rawName?: string;
    private readonly rawCode?: string | null;
    private readonly rawColor?: string | null;
    private readonly line: Line;
    private readonly direction: Direction;
    private readonly rawFrom?: Station;
    private readonly rawTo?: Station;
    private readonly stationsOnLineMap: Map<StationSubstance, StationOnLine>;
    // private set: ReadonlySet<StationOnLine>;

    constructor({ name, code, color, line, direction, from, to, stations = [] }: {
        name?: string
        code?: string | null;
        color?: string | null;
        line: Line,
        direction: Direction,
        from?: Station,
        to?: Station,
        stations?: Iterable<{
            substance: StationSubstance;
            code?: string | null;
        }>
    }) {
        this.rawName = name;
        this.rawCode = code;
        this.rawColor = color;
        this.line = line;
        this.direction = direction;
        this.rawFrom = from;
        this.rawTo = to;

        // this.set = new Set(this.originalIterator());
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
            to = this.rawTo.on(this);
        else if (this.direction === Direction.outbound)
            to = this.line.to().on(this);
        else
            to = this.line.from().on(this);

        if (to === null) throw new Error();
        return to;
    }

    name() {
        return this.rawName === undefined ? this.line.name() : this.rawName;
    }

    code() {
        return this.rawCode === undefined ? this.line.code() : this.rawCode;
    }

    color() {
        return this.rawColor === undefined ? this.line.color() : this.rawColor;
    }

    length() {
        const length = this.line.distanceBetween(this.from(), this.to());
        if (length === null) throw new Error();
        return this.direction * length;
    }

    private originalStations(direction: Direction = Direction.outbound): IterableIterator<StationOnLine> {
        if (this.rawFrom === undefined && this.rawTo === undefined)
            return this.line.stations(this.direction * direction);
        else {
            const stations = this.line.stationsBetween(this.rawFrom || this.line.from(), this.rawTo || this.line.to(), this.direction * direction);
            if (stations === null) throw Error();
            return stations;
        }
    }

    private originalStationsBetween(from: Station, to: Station, direction: Direction = Direction.outbound): IterableIterator<StationOnLine> | null {
        return this.line.stationsBetween(from, to, this.direction * direction);
    }

    stations(direction: Direction = Direction.outbound): IterableIterator<StationOnLine> {
        return this.originalStations(direction);
    }

    stationsBetween(from: Station, to: Station, direction: Direction = Direction.outbound): IterableIterator<StationOnLine> | null {
        const stations = this.originalStationsBetween(from, to, direction);
        if (stations === null) return null;
        return new SectionIterator(this, stations);
    }

    onLineOf(station: Station): StationOnLine | null {
        const substance = station.substance();
        let onLine: StationOnLine | undefined = this.stationsOnLineMap.get(substance);

        if (onLine === undefined) {
            if (!new Set(this.originalStations()).has(station.on(this.line)!)) return null;
            onLine = new StationOnLine1({ line: this, substance, code: null });
            this.stationsOnLineMap.set(substance, onLine);
        }

        return onLine;
    }

    distanceBetween(station1: Station, station2: Station): number | null {
        if (!this.has(station1) || !this.has(station2)) return null;
        const distance = this.line.distanceBetween(station1, station2)
        return distance === null ? null : this.direction * distance;
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
                value: undefined as unknown as StationOnLine
            };
        } else {
            const value: StationOnLine | null = result.value.on(this.line);

            if (value === null) throw Error();

            return { done: false, value };
        }
    }

    [Symbol.iterator](): this { return this; }
}
