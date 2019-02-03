import Line from "./Line";
import { outbound, Direction } from "./Direction";
import Station, {  StationSubstance } from "./Station";
import { StationOnLine } from "./StationOnLine";

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
    protected abstract readonly stationsOnLineMap: ReadonlyMap<StationSubstance, SOL>;

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
            const station1 = this.stationsOnLineMap.get(station.substance());
            return station1 === undefined ? null : station1;
        }
    }
}