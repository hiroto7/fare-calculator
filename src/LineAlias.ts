import Line from "./Line";
import Station, { StationSubstance, StationOnLine } from "./Station";
import { Direction } from "./Direction";
import AbstractLine1 from "./AbstractLine1";

export default class LineAlias extends AbstractLine1<StationOnLineAlias> {
    private readonly rawOriginalLine: Line;

    protected readonly rawStations: ReadonlyArray<StationOnLineAlias>;
    protected readonly stationsOnLineMap: ReadonlyMap<StationSubstance, StationOnLineAlias>;

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

    originalLine(): Line { return this.rawOriginalLine; }

    name(): string { return this.originalLine().name(); }
    // color(): string | null { return this.originalLine().color(); }
    code(): string | null | undefined { return this.originalLine().code(); }
    *codes(direction?: Direction): IterableIterator<string> { yield* this.originalLine().codes(direction); }
    length(): number { return this.originalLine().length(); }
    codeOf(station: Station): string | null | undefined { return this.originalLine().codeOf(station); }
    *codesOf(station: Station): IterableIterator<string> { yield* this.originalLine().codesOf(station); }

    onLineOf(station: Station): StationOnLineAlias | null {
        if (StationOnLineAlias.isStationOnLineAlias(station) && station.line() === this) {
            return station;
        } else {
            const station1 = this.stationsOnLineMap.get(station.substance());
            return station1 === undefined ? null : station1;
        }
    }

    distanceBetween(from: Station, to: Station, direction: Direction): number | null {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);
        if (from1 === null || to1 === null) return null;

        return this.originalLine().distanceBetween(from1.originalStation(), to1.originalStation(), direction);
    }

    has(station: Station): boolean { return this.onLineOf(station) !== null; }

    sectionBetween(from: Station, to: Station, direction: Direction): Line {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);
        if (from1 === null || to1 === null) throw new Error();

        return this.originalLine().sectionBetween(from1.originalStation(), to1.originalStation(), direction);
    }
}

class StationOnLineAlias implements StationOnLine {
    static isStationOnLineAlias(station: any): station is StationOnLineAlias {
        return StationOnLine.isStationOnLine(station) && 'station' in station;
    }

    private rawLine: LineAlias;
    private rawOriginalStation: StationOnLine;

    constructor({ line, station }: { line: LineAlias, station: StationOnLine }) {
        this.rawLine = line;
        this.rawOriginalStation = station;
    }

    originalStation(): StationOnLine { return this.rawOriginalStation; }
    line(): LineAlias { return this.rawLine; }

    name(): string { return this.substance().name(); }
    *lines(): IterableIterator<Line> { yield* this.substance().lines(); }
    isSeasonal(): boolean { return this.substance().isSeasonal(); }

    *codes(): IterableIterator<string> { yield* this.originalStation().codes(); }
    distanceFromStart(): number | null { return this.originalStation().distanceFromStart(); }
    substance(): StationSubstance { return this.originalStation().substance(); }

    *children(): IterableIterator<StationOnLine> {
        yield this.originalStation();
    }

    on(line: Line): StationOnLine | null {
        if (line === this.line())
            return this;
        else
            return this.substance().on(line);
    }
}