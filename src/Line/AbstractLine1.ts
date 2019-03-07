import Line, { LineWithChildren } from ".";
import { outbound, Direction, inbound } from "../Direction";
import Station, { StationSubstance } from "../Station";
import { StationOnLine } from "../StationOnLine";
import { ReadonlyDB } from "../DB";
import Code from "../Code";
import ColorPair from "../ColorPair";
import Set1 from "../Set1";

export default abstract class AbstractLine1<SOL extends StationOnLine> implements Line {
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
    abstract sectionBetween(from: Station, to: Station, direction: Direction): Line;
    abstract grandchildren(hidesVia?: boolean): IterableIterator<Line>;
    abstract minimize(): Line;
    abstract contains(line: Line): boolean;
    // abstract isContainedIn(line: Line): boolean;
    abstract hasChildren(): this is LineWithChildren;

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

    *sectionsFrom(station: Station): IterableIterator<Line> {
        for (const stationOnLine of this.onLineVersionsOf(station)) {
            if (stationOnLine !== this.from)
                yield this.sectionBetween(stationOnLine, this.from, inbound);
            if (stationOnLine !== this.to)
                yield this.sectionBetween(stationOnLine, this.to, outbound);
        }
    }

    toString() { return this.name; }

    equals(line: Line): boolean { return this.contains(line) && line.contains(this); }

    indexOf(station: Station): number | null {
        const stationOnLine = this.onLineVersionOf(station);
        if (stationOnLine === null)
            return null;
        else
            return this.rawStations.indexOf(stationOnLine);
    }
}

export abstract class AbstractLineWithChildren1<SOL extends StationOnLine> extends AbstractLine1<SOL> implements LineWithChildren {
    abstract children(): IterableIterator<Line>;

    private contains1(this: Line, line: Line): boolean {
        const colors1 = new Set1(this.colors());
        const colors2 = [...line.colors()];
        const codes1 = new Set(this.codes());
        const codes2 = [...line.codes()];

        return this.name === line.name &&
            colors2.every(pair => colors1.has(pair)) &&
            codes2.every(code => codes1.has(code));
    }

    contains(line: Line): boolean {
        for (const child of this.children()) {
            if (child.contains(line))
                return true;
        }

        if (!this.contains1(line) || !line.hasChildren())
            return false;

        for (const child of line.children()) {
            if (!this.contains(child))
                return false;
        }
        return true;
    }

    // isContainedIn(line: Line): boolean { return line.contains(this); }

    hasChildren(): true { return true; }
}
