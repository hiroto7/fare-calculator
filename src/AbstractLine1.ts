import Line from "./Line";
import { outbound, Direction, inbound } from "./Direction";
import Station, { StationSubstance } from "./Station";
import { StationOnLine } from "./StationOnLine";
import { ReadonlyDB } from "./DB";

export default abstract class AbstractLine1<SOL extends StationOnLine = StationOnLine> implements Line {
    abstract name(): string;
    // abstract color(): string | null;
    abstract code(): string | null | undefined;
    abstract codes(direction?: Direction): IterableIterator<string>;
    abstract length(): number;
    abstract codeOf(station: Station): string | null | undefined;
    abstract codesOf(station: Station): IterableIterator<string>;
    abstract distanceBetween(from: Station, to: Station, direction: Direction): number | null;
    // abstract childrenBetween(from: Station, to: Station, direction: Direction): IterableIterator<Line>;
    abstract sectionBetween(from: Station, to: Station, direction: Direction): Line;

    protected abstract readonly rawStations: ReadonlyArray<SOL>;
    protected abstract readonly stationsOnLineDB: ReadonlyDB<StationSubstance, Iterable<SOL>>;

    protected abstract isSOL(station: Station): station is SOL;

    *stations(direction: Direction = outbound): IterableIterator<SOL> {
        if (direction === outbound) {
            for (let i = 0; i < this.rawStations.length; i++)
                yield this.rawStations[i];
        } else {
            for (let i = this.rawStations.length; i > 0; i--)
                yield this.rawStations[i - 1];
        }
    }

    from(): SOL { return this.rawStations[0]; }
    to(): SOL { return this.rawStations[this.rawStations.length - 1]; }

    onLineOf(station: Station): SOL | null {
        if (this.isSOL(station) && station.line() === this) {
            return station;
        } else {
            const stationsOnLine = this.stationsOnLineDB.get(station.substance());
            if (stationsOnLine === undefined) return null;
            const result = stationsOnLine[Symbol.iterator]().next();
            return result.done ? null : result.value;
        }
    }

    *sectionsFrom(station: Station): IterableIterator<Line> {
        const stationsOnLine = this.stationsOnLineDB.get(station.substance());
        if (stationsOnLine === undefined) return;
        for (const stationOnLine of stationsOnLine) {
            if (stationOnLine !== this.from())
                yield this.sectionBetween(stationOnLine, this.from(), inbound);
            if (stationOnLine !== this.to())
                yield this.sectionBetween(stationOnLine, this.to(), outbound);
        }
    }

    toString() { return this.name(); }
}