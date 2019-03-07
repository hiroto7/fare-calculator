import Line from ".";
import Code from "../Code";
import ColorPair from "../ColorPair";
import DB, { ReadonlyDB } from "../DB";
import { Direction } from "../Direction";
import Station, { StationSubstance } from "../Station";
import { AbstractStationOnLine1, StationOnLine } from "../StationOnLine";
import { AbstractLineWithChildren1 } from "./AbstractLine1";

export default class LineAlias extends AbstractLineWithChildren1<StationOnLineAlias>  {
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
            const stationAlias = new StationOnLineAlias({ line: this, original: station })
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

    sectionBetween(from: Station, to: Station, direction: Direction): Line {
        const from1 = this.onLineVersionOf(from);
        const to1 = this.onLineVersionOf(to);
        if (from1 === null || to1 === null) throw new Error();

        return this.original.sectionBetween(from1.original, to1.original, direction);
    }

    *grandchildren(hidesVia?: boolean): IterableIterator<Line> { yield* this.original.grandchildren(hidesVia); }

    minimize() { return this.original.minimize(); }

    contains(line: Line): boolean { return this.original.contains(line); }

    // isContainedIn(line: Line): boolean { return this.original.contains(line); }

    hasChildren(): true { return true; }

    *children(): IterableIterator<Line> { yield this.original; }
}

class StationOnLineAlias extends AbstractStationOnLine1<Line> {
    readonly original: StationOnLine;

    constructor({ line, original }: { line: LineAlias, original: StationOnLine }) {
        super(line);
        this.original = original;
    }

    get substance(): StationSubstance { return this.original.substance; }

    *codes(): IterableIterator<string> { yield* this.original.codes(); }
    distanceFromStart(): number | null { return this.original.distanceFromStart(); }
}