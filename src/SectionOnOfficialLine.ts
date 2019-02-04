import AbstractLine1 from "./AbstractLine1";
import Station, { StationSubstance } from "./Station";
import OfficialLine from "./OfficialLine";
import { Direction } from "./Direction";
import { StationOnSection } from "./StationOnLine";
import Line from "./Line";

export default class SectionOnOfficialLine extends AbstractLine1<StationOnSection> {
    protected rawStations: ReadonlyArray<StationOnSection>;
    protected stationsOnLineMap: ReadonlyMap<StationSubstance, StationOnSection>;
    protected isSOL(station: Station): station is StationOnSection { return station instanceof StationOnSection; }

    private line: OfficialLine;
    private direction: Direction;

    constructor(line: OfficialLine, from: Station, to: Station, direction: Direction) {
        super();
        const stations: StationOnSection[] = [];
        const stationsOnLineMap: Map<StationSubstance, StationOnSection> = new Map();
        for (const originalStation of line.stationsBetween(from, to, direction)) {
            const station = new StationOnSection({ line: this, station: originalStation });
            stations.push(station);
            stationsOnLineMap.set(station.substance(), station);
        }
        this.rawStations = stations;
        this.stationsOnLineMap = stationsOnLineMap;

        this.line = line;
        this.direction = direction;
    }

    name(): string { return this.line.name(); }
    code(): string | null { return this.line.code(); }
    *codes(): IterableIterator<string> { yield* this.line.codes(); }

    codeOf(station: Station): string | null | undefined {
        const stationOnLine = this.onLineOf(station);
        if (stationOnLine === null) return null;
        return this.line.codeOf(stationOnLine.original());
    }

    *codesOf(station: Station): IterableIterator<string> {
        const stationOnLine = this.onLineOf(station);
        if (stationOnLine === null) throw new Error();
        yield* this.line.codesOf(stationOnLine.original());
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
