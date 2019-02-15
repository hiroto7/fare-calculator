import Line from ".";
import Station, { StationSubstance } from "../Station";
import { Direction } from "../Direction";
import AbstractLine1 from "./AbstractLine1";
import { AbstractStationOnLine1, StationOnLine } from "../StationOnLine";
import DB, { ReadonlyDB } from "../DB";

export default class LineAlias extends AbstractLine1<StationOnLineAlias> {
    protected readonly rawStations: ReadonlyArray<StationOnLineAlias>;
    protected readonly stationsOnLineDB: ReadonlyDB<StationSubstance, Iterable<StationOnLineAlias>>;

    protected isSOL(station: Station): station is StationOnLineAlias { return station instanceof StationOnLineAlias; }

    readonly original: Line;

    constructor(line: Line) {
        super();
        this.original = line;
        const stations: StationOnLineAlias[] = [];
        const stationsOnLineMap: ReadonlyDB<StationSubstance, Set<StationOnLineAlias>, []> = new DB(_ => new Set);
        for (const station of line.stations()) {
            const stationAlias = new StationOnLineAlias({ line: this, station })
            stations.push(stationAlias);
            stationsOnLineMap.get1(station.substance).add(stationAlias);
        }
        this.rawStations = stations;
        this.stationsOnLineDB = stationsOnLineMap;
    }


    get name(): string { return this.original.name; }
    // color(): string | null { return this.originalLine().color(); }
    get code(): string | null | undefined { return this.original.code; }

    *codes(direction?: Direction): IterableIterator<string> { yield* this.original.codes(direction); }
    length(): number { return this.original.length(); }
    codeOf(station: Station): string | null | undefined { return this.original.codeOf(station); }
    *codesOf(station: Station): IterableIterator<string> { yield* this.original.codesOf(station); }

    distanceBetween(from: Station, to: Station, direction: Direction): number | null {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);
        if (from1 === null || to1 === null) return null;

        return this.original.distanceBetween(from1.original, to1.original, direction);
    }

    has(station: Station): boolean { return this.onLineOf(station) !== null; }

    sectionBetween(from: Station, to: Station, direction: Direction): Line {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);
        if (from1 === null || to1 === null) throw new Error();

        return this.original.sectionBetween(from1.original, to1.original, direction);
    }
}

class StationOnLineAlias extends AbstractStationOnLine1 {
    readonly original: StationOnLine;

    constructor({ line, station }: { line: LineAlias, station: StationOnLine }) {
        super(line);
        this.original = station;
    }

    get substance(): StationSubstance { return this.original.substance; }

    *codes(): IterableIterator<string> { yield* this.original.codes(); }
    distanceFromStart(): number | null { return this.original.distanceFromStart(); }
}