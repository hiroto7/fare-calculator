import AbstractLine1 from "./AbstractLine1";
import Station, { StationSubstance } from "../Station";
import OfficialLine from "./OfficialLine";
import { Direction } from "../Direction";
import { StationOnSection } from "../StationOnLine";
import Line from ".";
import DB, { ReadonlyDB } from "../DB";
import Code from "../Code";
import ColorPair from "../ColorPair";

export default class SectionOnOfficialLine<SS extends StationSubstance> extends AbstractLine1<SS, StationOnSection<SS>> {
    protected rawStations: ReadonlyArray<StationOnSection<SS>>;
    protected stationsOnLineDB: ReadonlyDB<StationSubstance, Iterable<StationOnSection<SS>>>;
    protected isSOL(station: Station): station is StationOnSection<SS> { return station instanceof StationOnSection; }

    private line: OfficialLine<SS>;
    private direction: Direction;

    constructor(line: OfficialLine<SS>, from: Station, to: Station, direction: Direction) {
        super();
        const stations: StationOnSection<SS>[] = [];
        const stationsOnLineMap: ReadonlyDB<SS, Set<StationOnSection<SS>>> = new DB(_ => new Set);
        for (const originalStation of line.stationsBetween(from, to, direction)) {
            const station = new StationOnSection<SS>({ line: this, station: originalStation });
            stations.push(station);
            stationsOnLineMap.get1(station.substance).add(station);
        }
        this.rawStations = stations;
        this.stationsOnLineDB = stationsOnLineMap;

        this.line = line;
        this.direction = direction;
    }

    get name(): string { return this.line.name; }
    get code(): Code | null { return this.line.code; }
    get color(): ColorPair | null { return this.line.color; }

    *codes(): IterableIterator<Code> { yield* this.line.codes(); }
    *colors(): IterableIterator<ColorPair> { yield* this.line.colors(); }

    codeOf(station: Station): string | null | undefined {
        const stationOnLine = this.onLineVersionOf(station);
        if (stationOnLine === null) return null;
        return this.line.codeOf(stationOnLine.original);
    }

    *codesOf(station: Station): IterableIterator<string> {
        const stationOnLine = this.onLineVersionOf(station);
        if (stationOnLine === null) throw new Error();
        yield* this.line.codesOf(stationOnLine.original);
    }

    length(): number {
        const length = this.line.distanceBetween(
            this.from.original, this.to.original,
            this.direction);
        if (length === null) throw new Error();
        return length;
    }

    distanceBetween(from: Station, to: Station, direction: Direction): number | null {
        const from1 = this.onLineVersionOf(from);
        const to1 = this.onLineVersionOf(to);

        if (from1 === null || to1 === null) return null;
        return this.line.distanceBetween(from1.original, to1.original, direction * this.direction);
    }

    sectionBetween(from: Station, to: Station, direction: Direction): Line<SS> {
        const from1 = this.onLineVersionOf(from);
        const to1 = this.onLineVersionOf(to);
        if (from1 === null) throw new Error();
        if (to1 === null) throw new Error();
        return this.line.sectionBetween(from1.original, to1.original, direction * this.direction);
    }

    *grandchildren(): IterableIterator<this> { yield this; }
}
