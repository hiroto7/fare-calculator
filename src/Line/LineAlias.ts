import Line from ".";
import Station, { StationSubstance } from "../Station";
import { Direction } from "../Direction";
import AbstractLine1 from "./AbstractLine1";
import { AbstractStationOnLine1, StationOnLine } from "../StationOnLine";
import DB, { ReadonlyDB } from "../DB";
import Code from "../Code";
import ColorPair from "../ColorPair";

export default class LineAlias<SS extends StationSubstance> extends AbstractLine1<SS, StationOnLineAlias<SS>> {
    protected readonly rawStations: ReadonlyArray<StationOnLineAlias<SS>>;
    protected readonly stationsOnLineDB: ReadonlyDB<StationSubstance, Iterable<StationOnLineAlias<SS>>>;

    protected isSOL(station: Station): station is StationOnLineAlias<SS> { return station instanceof StationOnLineAlias; }

    readonly original: Line<SS>;

    constructor(line: Line<SS>) {
        super();
        this.original = line;
        const stations: StationOnLineAlias<SS>[] = [];
        const stationsOnLineMap: ReadonlyDB<StationSubstance, Set<StationOnLineAlias<SS>>, []> = new DB(_ => new Set);
        for (const station of line.stations()) {
            const stationAlias = new StationOnLineAlias<SS>({ line: this, station })
            stations.push(stationAlias);
            stationsOnLineMap.get1(station.substance).add(stationAlias);
        }
        this.rawStations = stations;
        this.stationsOnLineDB = stationsOnLineMap;
    }

    get name(): string { return this.original.name; }
    get color(): ColorPair | null | undefined { return this.original.color; }
    get code(): Code | null | undefined { return this.original.code; }

    *codes(direction?: Direction): IterableIterator<Code> { yield* this.original.codes(direction); }
    *colors(direction?: Direction): IterableIterator<ColorPair> { yield* this.original.colors(direction); }
    length(): number { return this.original.length(); }
    codeOf(station: Station): string | null | undefined { return this.original.codeOf(station); }
    *codesOf(station: Station): IterableIterator<string> { yield* this.original.codesOf(station); }

    distanceBetween(from: Station, to: Station, direction: Direction): number | null {
        const from1 = this.onLineVersionOf(from);
        const to1 = this.onLineVersionOf(to);
        if (from1 === null || to1 === null) return null;

        return this.original.distanceBetween(from1.original, to1.original, direction);
    }

    has(station: Station): boolean { return this.onLineVersionOf(station) !== null; }

    sectionBetween(from: Station, to: Station, direction: Direction): Line<SS> {
        const from1 = this.onLineVersionOf(from);
        const to1 = this.onLineVersionOf(to);
        if (from1 === null || to1 === null) throw new Error();

        return this.original.sectionBetween(from1.original, to1.original, direction);
    }

    *grandchildren(hidesVia?: boolean): IterableIterator<Line<SS>> { yield* this.original.grandchildren(hidesVia); }
}

class StationOnLineAlias<SS extends StationSubstance> extends AbstractStationOnLine1<Line<SS>, SS> {
    readonly original: StationOnLine<SS>;

    constructor({ line, station }: { line: LineAlias<SS>, station: StationOnLine<SS> }) {
        super(line);
        this.original = station;
    }

    get substance(): SS { return this.original.substance; }

    *codes(): IterableIterator<string> { yield* this.original.codes(); }
    distanceFromStart(): number | null { return this.original.distanceFromStart(); }
}