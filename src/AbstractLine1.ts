import Line from "./Line";
import { outbound, Direction } from "./Direction";
import Station, { StationOnLine, StationSubstance } from "./Station";

export default abstract class AbstractLine1<SOL extends StationOnLine> implements Line {
    abstract name(): string;
    // abstract color(): string | null;
    abstract codes(direction?: Direction): IterableIterator<string>;
    abstract length(): number;
    abstract codeOf(station: Station): IterableIterator<string>;
    abstract distanceBetween(from: Station, to: Station, direction: Direction): number | null;
    abstract childrenBetween(from: Station, to: Station, direction: Direction): IterableIterator<Line>;

    protected abstract readonly rawStations: ReadonlyArray<SOL>;
    protected abstract readonly stationsOnLineMap: ReadonlyMap<StationSubstance, SOL>;

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

    onLineOf(station: Station): StationOnLine | null {
        if (StationOnLine.isStationOnLine(station) && station.line() === this) {
            return station;
        } else {
            const station1 = this.stationsOnLineMap.get(station.substance());
            return station1 === undefined ? null : station1;
        }
    }
}