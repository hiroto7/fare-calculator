class LineAlias implements Line {
    private readonly rawOriginalLine: Line;
    private readonly rawStations: ReadonlyArray<StationOnLineAlias>;
    private readonly stationsOnLineMap: ReadonlyMap<StationSubstance, StationOnLineAlias>;

    constructor(line: Line) {
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
    color(): string | null { return this.originalLine().color(); }
    *codes(direction?: Direction): IterableIterator<string> { yield* this.originalLine().codes(direction); }
    length(): number { return this.originalLine().length(); }

    *stations(direction: Direction = outbound): IterableIterator<StationOnLineAlias> {
        if (direction === outbound) {
            for (let i = 0; i < this.rawStations.length; i++)
                yield this.rawStations[i];
        } else {
            for (let i = this.rawStations.length; i > 0; i--)
                yield this.rawStations[i - 1];
        }
    }

    distanceBetween(from: Station, to: Station): number | null {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);
        if (from1 === null || to1 === null) return null;

        return this.originalLine().distanceBetween(from1.originalStation(), to1.originalStation());
    }

    from(): StationOnLineAlias { return this.rawStations[0]; }
    to(): StationOnLineAlias { return this.rawStations[this.rawStations.length - 1]; }

    onLineOf(station: Station): StationOnLineAlias | null {
        if (StationOnLineAlias.isStationOnLineAlias(station) && station.line() === this) {
            return station;
        } else {
            const station1 = this.stationsOnLineMap.get(station.substance());
            return station1 === undefined ? null : station1;
        }
    }

    has(station: Station): boolean { return this.onLineOf(station) !== null; }

    *childrenBetween(from: Station, to: Station, direction: Direction): IterableIterator<Line> {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);
        if (from1 === null || to1 === null) return null;

        yield* this.originalLine().childrenBetween(from1.originalStation(), to1.originalStation(), direction);
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