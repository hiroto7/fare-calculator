import AbstractLine1 from "./AbstractLine1";
import Station, { StationSubstance } from "./Station";
import OfficialLine from "./OfficialLine";
import { Direction } from "./Direction";
import { AbstractStationOnLine2, StationOnLine } from "./StationOnLine";
import Line from "./Line";

export default class SectionOnOfficialLine extends AbstractLine1<StationOnSectionOnOfficialLine> {
    protected rawStations: ReadonlyArray<StationOnSectionOnOfficialLine>;
    protected stationsOnLineMap: ReadonlyMap<StationSubstance, StationOnSectionOnOfficialLine>;
    protected isSOL(station: Station): station is StationOnSectionOnOfficialLine { return station instanceof StationOnSectionOnOfficialLine; }

    private line: OfficialLine;
    private direction: Direction;
    private readonly stationCodesMap: ReadonlyMap<StationOnLine, string | null>;
    private rawName?: string;
    private rawCode?: string | null;

    constructor({ name, code, line, from, to, direction, stationCodesMap = [] }: {
        name?: string,
        code?: string | null,
        stationCodesMap?: Iterable<[Station, string | null]>,
        line: OfficialLine,
        from: Station,
        to: Station,
        direction: Direction
    }) {
        super();
        const stations: StationOnSectionOnOfficialLine[] = [];
        const stationsOnLineMap: Map<StationSubstance, StationOnSectionOnOfficialLine> = new Map();
        for (const originalStation of line.stationsBetween(from, to, direction)) {
            const station = new StationOnSectionOnOfficialLine({ line: this, station: originalStation });
            stations.push(station);
            stationsOnLineMap.set(station.substance(), station);
        }
        this.rawStations = stations;
        this.stationsOnLineMap = stationsOnLineMap;

        this.line = line;
        this.direction = direction;
        this.rawName = name;
        this.rawCode = code;

        const stationCodesMap1: Map<StationOnLine, string | null> = new Map();
        for (const [station, code] of stationCodesMap) {
            const stationOnLine = this.onLineOf(station);
            if (stationOnLine === null) throw new Error();
            stationCodesMap1.set(stationOnLine, code);
        }
        this.stationCodesMap = stationCodesMap1;
    }

    name(): string {
        if (this.rawName === undefined)
            return this.line.name();
        else
            return this.rawName;
    }

    code(): string | null {
        if (this.rawCode === undefined)
            return this.line.code();
        else
            return this.rawCode;
    }

    *codes(): IterableIterator<string> {
        const code = this.code();
        if (code !== null)
            yield code;
    }

    codeOf(station: Station): string | null | undefined {
        const stationOnLine = this.onLineOf(station);
        if (stationOnLine === null) return null;
        const code = this.stationCodesMap.get(stationOnLine);
        if (code === undefined)
            return this.line.codeOf(stationOnLine.original());
        else
            return code;
    }

    *codesOf(station: Station): IterableIterator<string> {
        const code = this.codeOf(station);
        if (code !== null && code !== undefined)
            yield code;
    }

    length(): number {
        const length = this.line.distanceBetween(
            this.from().original(), this.to().original(),
            this.direction);
        if (length === null) throw new Error();
        return length;
    }

    distanceBetween(from: Station, to: Station, direction: Direction): number | null {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);

        if (from1 === null || to1 === null) return null;
        return this.line.distanceBetween(from1.original(), to1.original(), direction * this.direction);
    }

    sectionBetween(from: Station, to: Station, direction: Direction): Line {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);
        if (from1 === null) throw new Error();
        if (to1 === null) throw new Error();
        return this.line.sectionBetween(from1.original(), to1.original(), direction * this.direction);
    }
}

class StationOnSectionOnOfficialLine extends AbstractStationOnLine2 {
    private rawOriginalStation: StationOnLine;

    constructor({ line, station }: {
        line: SectionOnOfficialLine,
        station: StationOnLine
    }) {
        super(line);
        this.rawOriginalStation = station;
    }

    original(): StationOnLine { return this.rawOriginalStation; }
    substance(): StationSubstance { return this.original().substance(); }
}