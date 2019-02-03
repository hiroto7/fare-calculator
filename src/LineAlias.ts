import Line from "./Line";
import Station, { StationSubstance } from "./Station";
import { Direction } from "./Direction";
import AbstractLine1 from "./AbstractLine1";
import { AbstractStationOnLine1, StationOnLine } from "./StationOnLine";

export default class LineAlias extends AbstractLine1<StationOnLineAlias> {
    private readonly rawOriginalLine: Line;

    protected readonly rawStations: ReadonlyArray<StationOnLineAlias>;
    protected readonly stationsOnLineMap: ReadonlyMap<StationSubstance, StationOnLineAlias>;

    protected isSOL(station: Station): station is StationOnLineAlias { return station instanceof StationOnLineAlias; }

    constructor(line: Line) {
        super();
        this.rawOriginalLine = line;
        const stations: StationOnLineAlias[] = [];
        const stationsOnLineMap: Map<StationSubstance, StationOnLineAlias> = new Map();
        for (const station of line.stations()) {
            const stationAlias = new StationOnLineAlias({ line: this, station })
            stations.push(stationAlias);
            stationsOnLineMap.set(station.substance(), stationAlias);
        }
        this.rawStations = stations;
        this.stationsOnLineMap = stationsOnLineMap;
    }

    original(): Line { return this.rawOriginalLine; }

    name(): string { return this.original().name(); }
    // color(): string | null { return this.originalLine().color(); }
    code(): string | null | undefined { return this.original().code(); }
    *codes(direction?: Direction): IterableIterator<string> { yield* this.original().codes(direction); }
    length(): number { return this.original().length(); }
    codeOf(station: Station): string | null | undefined { return this.original().codeOf(station); }
    *codesOf(station: Station): IterableIterator<string> { yield* this.original().codesOf(station); }

    distanceBetween(from: Station, to: Station, direction: Direction): number | null {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);
        if (from1 === null || to1 === null) return null;

        return this.original().distanceBetween(from1.original(), to1.original(), direction);
    }

    has(station: Station): boolean { return this.onLineOf(station) !== null; }

    sectionBetween(from: Station, to: Station, direction: Direction): Line {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);
        if (from1 === null || to1 === null) throw new Error();

        return this.original().sectionBetween(from1.original(), to1.original(), direction);
    }
}

class StationOnLineAlias extends AbstractStationOnLine1 {
    private rawOriginalStation: StationOnLine;

    constructor({ line, station }: { line: LineAlias, station: StationOnLine }) {
        super(line);
        this.rawOriginalStation = station;
    }

    original(): StationOnLine { return this.rawOriginalStation; }

    *codes(): IterableIterator<string> { yield* this.original().codes(); }
    distanceFromStart(): number | null { return this.original().distanceFromStart(); }
    substance(): StationSubstance { return this.original().substance(); }
}