import Line from ".";
import { outbound, Direction, inbound } from "../Direction";
import Station, { StationSubstance } from "../Station";
import { StationOnLine } from "../StationOnLine";
import { ReadonlyDB } from "../DB";
import Code from "../Code";
import ColorPair from "../ColorPair";

export default abstract class AbstractLine1<SS extends StationSubstance, SOL extends StationOnLine<SS>> implements Line<SS> {
    abstract readonly name: string;
    abstract readonly color: ColorPair | null | undefined;
    abstract readonly code: Code | null | undefined;
    abstract colors(direction?: Direction): IterableIterator<ColorPair>;
    abstract codes(direction?: Direction): IterableIterator<Code>;
    abstract length(): number;
    abstract codeOf(station: Station): string | null | undefined;
    abstract codesOf(station: Station): IterableIterator<string>;
    abstract distanceBetween(from: Station, to: Station, direction: Direction): number | null;
    // abstract childrenBetween(from: Station, to: Station, direction: Direction): IterableIterator<Line>;
    abstract sectionBetween(from: Station, to: Station, direction: Direction): Line<SS>;
    abstract grandchildren(hidesVia?: boolean): IterableIterator<Line<SS>>;

    protected abstract readonly rawStations: ReadonlyArray<SOL>;
    protected abstract readonly stationsOnLineDB: ReadonlyDB<StationSubstance, Iterable<SOL>>;

    protected abstract isSOL(station: Station): station is SOL;

    get from(): SOL { return this.rawStations[0]; }
    get to(): SOL { return this.rawStations[this.rawStations.length - 1]; }

    *stations(direction: Direction = outbound): IterableIterator<SOL> {
        if (direction === outbound) {
            for (let i = 0; i < this.rawStations.length; i++)
                yield this.rawStations[i];
        } else {
            for (let i = this.rawStations.length; i > 0; i--)
                yield this.rawStations[i - 1];
        }
    }

    onLineVersionOf(station: Station): SOL | null {
        if (this.isSOL(station) && station.line === this) {
            return station;
        } else {
            const stationsOnLine = this.onLineVersionsOf(station);
            const result = stationsOnLine.next();
            return result.done ? null : result.value;
        }
    }

    *onLineVersionsOf(station: Station): IterableIterator<SOL> {
        const stationsOnLine = this.stationsOnLineDB.get(station.substance);
        if (stationsOnLine === undefined)
            return;
        else
            yield* stationsOnLine;
    }

    *sectionsFrom(station: Station): IterableIterator<Line<SS>> {
        const stationsOnLine = this.stationsOnLineDB.get(station.substance);
        if (stationsOnLine === undefined) return;
        for (const stationOnLine of stationsOnLine) {
            if (stationOnLine !== this.from)
                yield this.sectionBetween(stationOnLine, this.from, inbound);
            if (stationOnLine !== this.to)
                yield this.sectionBetween(stationOnLine, this.to, outbound);
        }
    }

    toString() { return this.name; }
}