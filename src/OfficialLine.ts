import { Direction, outbound } from "./Direction";
import Line from "./Line";
import Station, { StationSubstance } from "./Station";
import AbstractLine1 from "./AbstractLine1";
import SectionOnOfficialLine from "./SectionOnOfficialLine";
import { AbstractStationOnLine1 } from "./StationOnLine";
import DB, { ReadonlyDB } from "./DB";

export default class OfficialLine extends AbstractLine1<StationOnOfficialLine> {
    private readonly rawName: string;
    private readonly rawCode: string | null;

    protected rawStations: ReadonlyArray<StationOnOfficialLine>;
    protected stationsOnLineDB: ReadonlyDB<StationSubstance, Iterable<StationOnOfficialLine>>;

    protected isSOL(station: Station): station is StationOnOfficialLine { return station instanceof StationOnOfficialLine; }

    constructor({ name, code, stations }: {
        name: string,
        code?: string | null,
        stations: Iterable<{
            substance: StationSubstance,
            distanceFromStart: number | null,
            code?: string | null
        }>
    }) {
        super();
        this.rawName = name;
        this.rawCode = code === undefined ? null : code;

        const rawStations: StationOnOfficialLine[] = [];
        const stationsOnLineMap: ReadonlyDB<StationSubstance, Set<StationOnOfficialLine>, []> = new DB(_ => new Set());
        for (const stationParameter of stations) {
            const station = new StationOnOfficialLine({ line: this, ...stationParameter });
            rawStations.push(station);
            stationsOnLineMap.get1(station.substance()).add(station);
        }
        this.rawStations = rawStations;
        this.stationsOnLineDB = stationsOnLineMap;
    }

    name(): string {
        return this.rawName;
    }

    code(): string | null {
        return this.rawCode;
    }

    *codes(): IterableIterator<string> {
        const code = this.code();
        if (code !== null)
            yield code;
    }

    codeOf(station: Station): string | null | undefined {
        const codes = this.codesOf(station);
        const result = codes.next();
        if (result.done)
            return null;
        else
            result.value;
    }

    *codesOf(station: Station): IterableIterator<string> {
        const stationOnLine = this.onLineOf(station);
        if (stationOnLine === null) throw new Error();
        yield* stationOnLine.codes();
    }

    length(): number {
        const length = this.distanceBetween(this.from(), this.to(), outbound);
        if (length === null) throw new Error();
        return length;
    }

    distanceBetween(from: Station, to: Station, direction: Direction): number | null {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);
        if (from1 === null || to1 === null) return null;

        const d1 = from1.distanceFromStart();
        const d2 = to1.distanceFromStart();
        return d1 === null || d2 === null ? null : direction * (d2 - d1);
    }

    sectionBetween(from: Station, to: Station, direction: Direction): Line {
        return new SectionOnOfficialLine(this, from, to, direction);
    }

    *stationsBetween(from: Station, to: Station, direction: Direction): IterableIterator<StationOnOfficialLine> {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);
        if (from1 === null) throw new Error();
        if (to1 === null) throw new Error();

        const fromIndex = this.rawStations.indexOf(from1);
        if (fromIndex < 0) throw new Error();
        const toIndex = direction === outbound ?
            this.rawStations.indexOf(to1, fromIndex) :
            this.rawStations.lastIndexOf(to1, fromIndex);
        if (toIndex < 0) throw new Error();

        for (let i = fromIndex; direction * i <= direction * toIndex; i += direction) {
            yield this.rawStations[i];
        }
    }
}

class StationOnOfficialLine extends AbstractStationOnLine1<OfficialLine> {
    private readonly rawSubstance: StationSubstance;
    private readonly rawDistanceFromStart: number | null;
    private readonly rawCode: string | null;

    constructor({ line, substance, distanceFromStart, code = null }: {
        line: OfficialLine,
        substance: StationSubstance,
        distanceFromStart: number | null,
        code?: string | null
    }) {
        super(line);
        this.rawSubstance = substance;
        this.rawDistanceFromStart = distanceFromStart;
        this.rawCode = code;
    }

    substance(): StationSubstance { return this.rawSubstance; }

    *codes(): IterableIterator<string> {
        if (this.rawCode !== null)
            yield this.rawCode;
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
