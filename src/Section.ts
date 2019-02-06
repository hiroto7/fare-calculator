import Line from "./Line";
import Station, { StationSubstance } from "./Station";
import { Direction, outbound } from "./Direction";
import AbstractLine1 from "./AbstractLine1";
import { StationOnSection } from "./StationOnLine";
import DB, { ReadonlyDB } from "./DB";

export default class Section extends AbstractLine1<StationOnSection> {
    protected rawStations: ReadonlyArray<StationOnSection>;
    protected stationsOnLineDB: ReadonlyDB<StationSubstance, Iterable<StationOnSection>>;
    protected isSOL(station: Station): station is StationOnSection { return station instanceof StationOnSection; }

    private readonly line: Line;
    private readonly stationCodesMap: ReadonlyMap<StationSubstance, string | null>;
    private readonly rawName?: string;
    private readonly rawCode?: string | null;

    constructor({ name, code, line, from, to, direction, stationCodesMap = [] }: {
        name?: string,
        code?: string | null,
        stationCodesMap?: Iterable<[Station, string | null]>,
        line: Line,
        from: Station,
        to: Station,
        direction: Direction
    }) {
        super();
        const section = line.sectionBetween(from, to, direction);
        const stations: StationOnSection[] = [];
        const stationsOnLineMap: ReadonlyDB<StationSubstance, Set<StationOnSection>> = new DB(_ => new Set);
        for (const original of section.stations()) {
            const station = new StationOnSection({ line: this, station: original });
            stations.push(station);
            stationsOnLineMap.get1(station.substance()).add(station);
        }
        this.rawStations = stations;
        this.stationsOnLineDB = stationsOnLineMap;
        this.line = section;
        this.rawName = name;
        this.rawCode = code;

        const stationCodesMap1: Map<StationSubstance, string | null> = new Map();
        for (const [station, code] of stationCodesMap) {
            const substance = station.substance();
            stationCodesMap1.set(substance, code);
        }
        this.stationCodesMap = stationCodesMap1;
    }

    name(): string {
        if (this.rawName === undefined)
            return this.line.name();
        else
            return this.rawName;
    }

    code(): string | null | undefined {
        if (this.rawCode === undefined)
            return this.line.code();
        else
            return this.rawCode;
    }

    *codes(direction: Direction = outbound): IterableIterator<string> {
        const code = this.code();
        if (code === undefined)
            yield* this.line.codes(direction);
        else if (code === null)
            return;
        else
            yield code;
    }

    codeOf(station: Station): string | null | undefined {
        const substance = station.substance();
        const code = this.stationCodesMap.get(substance);
        if (code === undefined) {
            const stationOnLine = this.onLineOf(station);
            if (stationOnLine === null) return null;
            return this.line.codeOf(stationOnLine.original());
        } else {
            return code;
        }
    }

    *codesOf(station: Station): IterableIterator<string> {
        const stationOnLine = this.onLineOf(station);
        if (stationOnLine === null) throw new Error();
        const code = this.codeOf(stationOnLine);
        if (code === undefined)
            yield* this.line.codesOf(stationOnLine.original());
        else if (code === null)
            return;
        else
            yield code;
    }

    length(): number {
        return this.line.length();
    }

    distanceBetween(from: Station, to: Station, direction: Direction): number | null {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);

        if (from1 === null || to1 === null) return null;
        return this.line.distanceBetween(from1.original(), to1.original(), direction);
    }

    sectionBetween(from: Station, to: Station, direction: Direction): Line {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);
        if (from1 === null) throw new Error();
        if (to1 === null) throw new Error();
        return new Section({
            name: this.name(),
            code: this.code(),
            line: this.line,
            from: from1.original(),
            to: to1.original(),
            direction,
            stationCodesMap: this.stationCodesMap
        });
    }
}