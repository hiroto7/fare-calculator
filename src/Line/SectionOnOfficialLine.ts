import Line from ".";
import Code from "../Code";
import ColorPair from "../ColorPair";
import DB, { ReadonlyDB } from "../DB";
import { Direction } from "../Direction";
import Station, { StationSubstance } from "../Station";
import { AbstractStationOnSection } from "../StationOnLine";
import AbstractLine1 from "./AbstractLine1";
import OfficialLine, { StationOnOfficialLine } from "./OfficialLine";

export default class SectionOnOfficialLine extends AbstractLine1<StationOnSectionOnOfficialLine> {
    protected rawStations: ReadonlyArray<StationOnSectionOnOfficialLine>;
    protected stationsOnLineDB: ReadonlyDB<StationSubstance, Iterable<StationOnSectionOnOfficialLine>>;
    protected isSOL(station: Station): station is StationOnSectionOnOfficialLine { return station instanceof StationOnSectionOnOfficialLine; }

    direction: Direction;
    original: OfficialLine;

    constructor(line: OfficialLine, from: Station, to: Station, direction: Direction) {
        super();
        const stations: StationOnSectionOnOfficialLine[] = [];
        const stationsOnLineMap: ReadonlyDB<StationSubstance, Set<StationOnSectionOnOfficialLine>> = new DB(_ => new Set);
        for (const originalStation of line.stationsBetween(from, to, direction)) {
            const station = new StationOnSectionOnOfficialLine({ line: this, station: originalStation });
            stations.push(station);
            stationsOnLineMap.get1(station.substance).add(station);
        }
        this.rawStations = stations;
        this.stationsOnLineDB = stationsOnLineMap;

        this.original = line;
        this.direction = direction;
    }

    get name(): string { return this.original.name; }
    get code(): Code | null { return this.original.code; }
    get color(): ColorPair | null { return this.original.color; }

    *codes(): IterableIterator<Code> { yield* this.original.codes(); }
    *colors(): IterableIterator<ColorPair> { yield* this.original.colors(); }

    codeOf(station: Station): string | null | undefined {
        const stationOnLine = this.onLineVersionOf(station);
        if (stationOnLine === null) return null;
        return this.original.codeOf(stationOnLine.original);
    }

    *codesOf(station: Station): IterableIterator<string> {
        const stationOnLine = this.onLineVersionOf(station);
        if (stationOnLine === null) throw new Error();
        yield* this.original.codesOf(stationOnLine.original);
    }

    length(): number {
        const length = this.original.distanceBetween(
            this.from.original, this.to.original,
            this.direction);
        if (length === null) throw new Error();
        return length;
    }

    distanceBetween(from: Station, to: Station, direction: Direction): number | null {
        const from1 = this.onLineVersionOf(from);
        const to1 = this.onLineVersionOf(to);

        if (from1 === null || to1 === null) return null;
        return this.original.distanceBetween(from1.original, to1.original, direction * this.direction);
    }

    sectionBetween(from: Station, to: Station, direction: Direction): Line {
        const from1 = this.onLineVersionOf(from);
        const to1 = this.onLineVersionOf(to);
        if (from1 === null) throw new Error();
        if (to1 === null) throw new Error();
        return this.original.sectionBetween(from1.original, to1.original, direction * this.direction);
    }

    *grandchildren(): IterableIterator<this> { yield this; }

    minimize(): Line { return this; }

    contains(line: Line): boolean {
        if (line.hasChildren()) {
            const children = [...line.children()];
            if (children.length === 1)
                return this.contains(children[0]);
            else
                return false;
        } else if (line instanceof OfficialLine) {
            return this.original === line && line.from === this.from.original && line.to === this.to.original;
        } else if (line instanceof SectionOnOfficialLine) {
            const direction = this.direction;
            return line.original === this.original && line.direction === this.direction &&
                direction * this.from.original.index() <= direction * line.from.original.index() &&
                direction * line.to.original.index() <= direction * this.to.original.index();
        } else {
            throw new Error();
        }
    }

    hasChildren(): false { return false; }
}

class StationOnSectionOnOfficialLine extends AbstractStationOnSection<StationOnOfficialLine> { }