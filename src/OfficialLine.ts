import { Direction } from "./Direction";
import Line from "./Line";
import ReverseIterator from "./ReverseIterator";
import Station, { StationOnLine, StationOnLine1, StationSubstance } from "./Station";

export class OfficialLine implements Line {
    private rawName: string;
    private rawCode: string | null;
    private rawColor: string | null;
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

    stations(direction?: Direction): IterableIterator<StationOnLine>;
    stations(direction: Direction,
        { from, to }: { from?: Station; to?: Station; }): IterableIterator<StationOnLine> | null;
    stations(direction: Direction = Direction.outbound,
        { from, to }: { from?: Station; to?: Station; } = {}): IterableIterator<StationOnLine> | null {

        if (this.rawStations === undefined) throw new Error();

        let array: ReadonlyArray<StationOnOfficialLine>;
        if (from === undefined && to === undefined) {
            array = this.rawStations;
        } else {
            let fromOnLine: StationOnOfficialLine;
            let toOnLine: StationOnOfficialLine;

            if (from === undefined) {
                fromOnLine = this.from();
            } else {
                let fromOnLine1 = this.onLineOf(from);
                if (fromOnLine1 === null)
                    return null;
                fromOnLine = fromOnLine1;
            }

            if (to === undefined) {
                toOnLine = this.to();
            } else {
                let toOnLine1 = this.onLineOf(to);
                if (toOnLine1 === null)
                    return null;
                toOnLine = toOnLine1;
            }

            let fromIndex = this.rawStations.indexOf(fromOnLine);
            let toIndex = this.rawStations.indexOf(toOnLine);

            if (fromIndex < 0) throw new Error();
            if (toIndex < 0) throw new Error();

            if (direction * fromIndex > direction * toIndex) return null;
            array = this.rawStations.slice(fromIndex, toIndex + 1);
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
        const length = this.distance(this.from(), this.to());
        if (length === null) throw new Error();
        return length;
    }

    onLineOf(station: Station): StationOnOfficialLine | null {
        if (this.stationsOnLineMap === undefined) throw new Error();
        return this.stationsOnLineMap.get(station.substance()) || null;
    }

    distance(station1: Station, station2: Station): number | null {
        const station1OnLine = this.onLineOf(station1);
        const station2OnLine = this.onLineOf(station2);
        if (station1OnLine === null || station2OnLine === null) return null;

        const d1 = station1OnLine.distanceFromStart;
        const d2 = station2OnLine.distanceFromStart;
        return d1 === null || d2 === null ? null : d2 - d1;
    }

    has(station: Station): boolean {
        return this.onLineOf(station) !== null;
    }
}

class StationOnOfficialLine extends StationOnLine1 {
    readonly distanceFromStart: number | null;

    constructor({ line, substance, distanceFromStart, code = null }: {
        line: OfficialLine,
        substance: StationSubstance,
        distanceFromStart: number | null,
        code?: string | null
    }) {
        super({ line, substance, code });
        this.distanceFromStart = distanceFromStart;
    }
}
