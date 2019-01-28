import { Direction } from "./Direction";
import Line from "./Line";
import ReverseIterator from "./ReverseIterator";
import Station, { StationOnLine1, StationSubstance } from "./Station";

export default class OfficialLine implements Line {
    private readonly rawName: string;
    private readonly rawCode: string | null;
    private readonly rawColor: string | null;
    private rawStations?: ReadonlyArray<StationOnOfficialLine>;
    private stationsOnLineMap?: ReadonlyMap<StationSubstance, StationOnOfficialLine>;

    constructor(name: string, { code = null, color = null }: {
        code?: string | null;
        color?: string | null;
    } = {}) {
        this.rawName = name;
        this.rawCode = code;
        this.rawColor = color;
    }

    setStations(stations: Iterable<{
        substance: StationSubstance;
        distanceFromStart: number | null;
        code?: string | null;
    }>) {
        const rawStations: StationOnOfficialLine[] = [];
        const stationsOnLineMap: Map<StationSubstance, StationOnOfficialLine> = new Map();
        for (const station of stations) {
            const stationOnLine = new StationOnOfficialLine({ line: this, ...station });
            rawStations.push(stationOnLine);
            stationsOnLineMap.set(station.substance, stationOnLine);
        }
        this.rawStations = rawStations;
        this.stationsOnLineMap = stationsOnLineMap;
    }

    name(): string {
        return this.rawName;
    }

    code(): string | null {
        return this.rawCode;
    }

    color(): string | null {
        return this.rawColor;
    }

    stations(direction: Direction = Direction.outbound): IterableIterator<StationOnOfficialLine> {
        if (this.rawStations === undefined) throw new Error();

        if (direction === Direction.outbound)
            return this.rawStations[Symbol.iterator]();
        else
            return new ReverseIterator(this.rawStations);
    }

    stationsBetween(from: Station, to: Station, direction: Direction = Direction.outbound): IterableIterator<StationOnOfficialLine> | null {

        if (this.rawStations === undefined) throw new Error();

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

        let array: ReadonlyArray<StationOnOfficialLine>;
        if (direction === Direction.outbound && from === this.from() && to === this.to() ||
            direction === Direction.inbound && from === this.to() && to === this.from()) {

            array = this.rawStations;
        } else {
            let fromIndex: number;
            let toIndex: number;

            if (direction === Direction.outbound && from === this.from()) {
                fromIndex = 0;
            } else if (direction === Direction.inbound && from === this.to()) {
                fromIndex = this.rawStations.length - 1;
            } else {
                const fromOnLine = this.onLineOf(from);
                if (fromOnLine === null) return null;
                fromIndex = this.rawStations.indexOf(fromOnLine);
            }

            if (direction === Direction.outbound && to === this.to()) {
                toIndex = this.rawStations.length - 1;
            } else if (direction === Direction.inbound && to === this.from()) {
                toIndex = 0;
            } else {
                const toOnLine = this.onLineOf(to);
                if (toOnLine === null) return null;
                toIndex = this.rawStations.indexOf(toOnLine);
            }

            if (fromIndex < 0) throw new Error();
            if (toIndex < 0) throw new Error();

            if (direction * fromIndex > direction * toIndex) return null;

            if (direction === Direction.outbound)
                array = this.rawStations.slice(fromIndex, toIndex + 1);
            else
                array = this.rawStations.slice(toIndex, fromIndex + 1);
        }

        if (direction === Direction.outbound)
            return array[Symbol.iterator]();
        else
            return new ReverseIterator(array);
    }

    from(): StationOnOfficialLine {
        if (this.rawStations === undefined) throw new Error();
        return this.rawStations[0];
    }

    to(): StationOnOfficialLine {
        if (this.rawStations === undefined) throw new Error();
        return this.rawStations[this.rawStations.length - 1];
    }

    length(): number {
        const length = this.distanceBetween(this.from(), this.to());
        if (length === null) throw new Error();
        return length;
    }

    onLineOf(station: Station): StationOnOfficialLine | null {
        if (this.stationsOnLineMap === undefined) throw new Error();
        return this.stationsOnLineMap.get(station.substance()) || null;
    }

    distanceBetween(from: Station, to: Station): number | null {
        const station1OnLine = this.onLineOf(from);
        const station2OnLine = this.onLineOf(to);
        if (station1OnLine === null || station2OnLine === null) return null;

        const d1 = station1OnLine.distanceFromStart();
        const d2 = station2OnLine.distanceFromStart();
        return d1 === null || d2 === null ? null : d2 - d1;
    }

    has(station: Station): boolean {
        return this.onLineOf(station) !== null;
    }
}

class StationOnOfficialLine extends StationOnLine1 {
    private readonly rawDistanceFromStart: number | null;
    protected readonly rawLine: OfficialLine;

    constructor({ line, substance, distanceFromStart, code = null }: {
        line: OfficialLine,
        substance: StationSubstance,
        distanceFromStart: number | null,
        code?: string | null
    }) {
        super({ line, substance, code });
        this.rawDistanceFromStart = distanceFromStart;
        this.rawLine = line;
    }

    line(): OfficialLine {
        return this.rawLine;
    }

    distanceFromStart(): number | null {
        if (this === this.line().from()) {
            if (this.rawDistanceFromStart === null) throw new Error();
            return 0;
        } else {
            const distanceOfStart = this.line().from().rawDistanceFromStart;
            if (distanceOfStart === null) throw new Error();
            if (this.rawDistanceFromStart === null) return null;
            return this.rawDistanceFromStart - distanceOfStart;
        }
    }
}
