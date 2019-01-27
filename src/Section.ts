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
            to = this.rawTo.on(this.line);
        else if (this.direction === Direction.outbound)
            to = this.line.to();
        else
            to = this.line.from();

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
        const length = this.line.distance(this.from(), this.to());
        if (length === null) throw new Error();
        return this.direction * length;
    }

    private originalIterator(direction?: Direction): IterableIterator<StationOnLine>
    private originalIterator(direction: Direction,
        { from, to }: { from?: Station, to?: Station }): IterableIterator<StationOnLine> | null
    private originalIterator(direction: Direction = Direction.outbound,
        { from, to }: { from?: Station, to?: Station } = {}): IterableIterator<StationOnLine> | null {

        return this.line.stations(direction, { from, to });
    }

    stations(direction?: Direction): IterableIterator<StationOnLine>
    stations(direction: Direction,
        { from, to }: { from?: Station, to?: Station }): IterableIterator<StationOnLine> | null
    stations(direction: Direction = Direction.outbound,
        { from, to }: { from?: Station, to?: Station } = {}): IterableIterator<StationOnLine> | null {

        if (from === undefined) {
            if (direction === Direction.outbound)
                from = this.from();
            else
                from = this.to();
        }
        if (to === undefined) {
            if (direction === Direction.outbound)
                to = this.to();
            else
                to = this.from();
        }

        const stations = this.originalIterator(direction, { from, to });

        if (stations === null) {
            if (direction === Direction.outbound && from === this.from() && to === this.to() ||
                direction === Direction.inbound && from === this.to() && to === this.from())
                throw new Error();

            return null;
        }

        return new SectionIterator(this, stations);
    }

    onLineOf(station: Station): StationOnLine | null {
        const substance = station.substance();
        let onLine: StationOnLine | undefined = this.stationsOnLineMap.get(substance);

        if (onLine === undefined) {
            if (!new Set(this.originalIterator()).has(station.on(this.line)!)) return null;
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
