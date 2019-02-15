import Line from ".";
import { Direction, outbound } from "../Direction";
import Station, { StationSubstance } from "../Station";
import LineAlias from "./LineAlias";
import AbstractLine1 from "./AbstractLine1";
import { StationOnLine, AbstractStationOnLine2 } from "../StationOnLine";
import DB, { ReadonlyDB } from "../DB";

export default class RouteLine extends AbstractLine1<StationOnRouteLine> {
    protected readonly rawStations: ReadonlyArray<StationOnRouteLine>;
    protected readonly stationsOnLineDB: ReadonlyDB<StationSubstance, Iterable<StationOnRouteLine>>;

    private readonly rawChildren: ReadonlyArray<Line>;
    private readonly stationCodesMap: ReadonlyMap<StationSubstance, string | null>;

    protected isSOL(station: Station): station is StationOnRouteLine { return station instanceof StationOnRouteLine; }

    readonly name: string;
    readonly code: string | null | undefined;

    constructor({ name, code, children, stationCodesMap = [] }: {
        name: string,
        code?: string | null;
        children: Iterable<Line>,
        stationCodesMap?: Iterable<[Station, string | null]>
    }) {
        super();
        this.name = name;
        this.code = code;
        const rawChildren: Set<Line> = new Set();
        const stations: Set<StationOnRouteLine> = new Set();
        const stationsOnLineMap: ReadonlyDB<StationSubstance, Set<StationOnRouteLine>, []> = new DB(_ => new Set());
        let lastSubstance: StationSubstance | null;
        let stationChildren: Set<StationOnLine> | null;

        {
            lastSubstance = null;
            stationChildren = null;
        }
        for (const child of children) {
            const child1 = rawChildren.has(child) ? new LineAlias(child) : child;
            rawChildren.add(child1);

            if (lastSubstance !== null && child1.from.substance !== lastSubstance) throw new Error();

            for (const stationChild of child1.stations()) {
                if (stationChild.substance === lastSubstance) {
                    if (stationChildren === null) throw new Error();
                    stationChildren.add(stationChild);
                } else {
                    if (stationChildren !== null) {
                        const station = new StationOnRouteLine({ line: this, children: stationChildren });
                        stations.add(station);
                        if (lastSubstance === null) throw new Error();
                        stationsOnLineMap.get1(lastSubstance).add(station);
                    }

                    stationChildren = new Set();
                    stationChildren.add(stationChild);
                }
                lastSubstance = stationChild.substance;
            }
        }
        {
            if (stationChildren === null) throw new Error();
            const station = new StationOnRouteLine({ line: this, children: stationChildren });
            stations.add(station);
            if (lastSubstance === null) throw new Error();
            stationsOnLineMap.get1(lastSubstance).add(station);
        }

        this.rawChildren = [...rawChildren];
        this.rawStations = [...stations];
        this.stationsOnLineDB = stationsOnLineMap;

        const stationCodesMap1: Map<StationSubstance, string | null> = new Map();
        for (const [station, code] of stationCodesMap)
            stationCodesMap1.set(station.substance, code);

        this.stationCodesMap = stationCodesMap1;
    }

    // color(): string | null { }

    *codes(direction: Direction = outbound): IterableIterator<string> {
        if (this.code === undefined) {
            const codes: Set<string> = new Set();
            if (direction === outbound) {
                for (let i = 0; i < this.rawChildren.length; i++) {
                    for (const code of this.rawChildren[i].codes(direction))
                        codes.add(code);
                }
            } else {
                for (let i = this.rawChildren.length; i > 0; i--) {
                    for (const code of this.rawChildren[i - 1].codes(direction))
                        codes.add(code);
                }
            }
            yield* codes;
        } else if (this.code === null) {
            return;
        } else {
            yield this.code;
        }
    }

    codeOf(station: Station): string | null | undefined { return this.stationCodesMap.get(station.substance); }

    *codesOf(station: Station): IterableIterator<string> {
        const stationOnLine = this.onLineOf(station);
        if (stationOnLine === null) throw new Error();
        const code = this.codeOf(stationOnLine);
        if (code === undefined) {
            const codes: Set<string> = new Set();
            for (const child of stationOnLine.children()) {
                for (const code of child.codes())
                    codes.add(code);
            }
            yield* codes;
        } else if (code === null) {
            return;
        } else {
            yield code;
        }
    }

    length(): number {
        let length = 0;
        for (const child of this.rawChildren) {
            length += child.length();
        }
        return length;
    }

    distanceBetween(from: Station, to: Station, direction: Direction): number | null {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);

        if (from1 === null || to1 === null) return null;

        const fromChildren: ReadonlyArray<StationOnLine> = [...from1.children()];
        const toChildren: ReadonlyArray<StationOnLine> = [...to1.children()];
        const fromChild: StationOnLine = fromChildren[
            direction === outbound ? fromChildren.length - 1 : 0
        ];
        const toChild: StationOnLine = toChildren[
            direction === outbound ? 0 : toChildren.length - 1
        ];

        const fromLineIndex = this.rawChildren.indexOf(fromChild.line);
        if (fromLineIndex < 0) throw new Error();

        const toLineIndex = direction === outbound ?
            this.rawChildren.indexOf(toChild.line, fromLineIndex) :
            this.rawChildren.lastIndexOf(toChild.line, fromLineIndex);
        if (toLineIndex < 0) throw new Error();

        if (direction * fromLineIndex > direction * toLineIndex) return null;

        if (fromLineIndex === toLineIndex) {
            const lineIndex = fromLineIndex;
            const child = this.rawChildren[lineIndex];
            return child.distanceBetween(fromChild, toChild, direction);
        } else {
            let distance = 0;
            {
                const child = this.rawChildren[fromLineIndex];
                const childDistance = child.distanceBetween(
                    fromChild, direction === outbound ? child.to : child.from,
                    direction);

                if (childDistance === null) return null;
                distance += childDistance;
            }
            for (let i = fromLineIndex + direction; direction * i < direction * toLineIndex; i += direction) {
                const child = this.rawChildren[i];
                const childDistance = direction === outbound ?
                    child.distanceBetween(child.from, child.to, direction) :
                    child.distanceBetween(child.to, child.from, direction);

                if (childDistance === null) return null;
                distance += childDistance;
            }
            {
                const child = this.rawChildren[toLineIndex];
                const childDistance = child.distanceBetween(
                    direction === outbound ? child.from : child.to, toChild,
                    direction);

                if (childDistance === null) return null;
                distance += childDistance;
            }
            return distance
        }
    }

    // has(station: Station): boolean { }

    *childrenBetween(from: Station, to: Station, direction: Direction): IterableIterator<Line> {
        const from1 = this.onLineOf(from);
        const to1 = this.onLineOf(to);

        if (from1 === null) throw new Error();
        if (to1 === null) throw new Error();

        const fromChildren: ReadonlyArray<StationOnLine> = [...from1.children()];
        const toChildren: ReadonlyArray<StationOnLine> = [...to1.children()];
        const fromChild: StationOnLine = fromChildren[
            direction === outbound ? fromChildren.length - 1 : 0
        ];
        const toChild: StationOnLine = toChildren[
            direction === outbound ? 0 : toChildren.length - 1
        ];

        const fromLineIndex = this.rawChildren.indexOf(fromChild.line);
        if (fromLineIndex < 0) throw new Error();

        const toLineIndex = direction === outbound ?
            this.rawChildren.indexOf(toChild.line, fromLineIndex) :
            this.rawChildren.lastIndexOf(toChild.line, fromLineIndex);
        if (toLineIndex < 0) throw new Error();

        if (direction * fromLineIndex > direction * toLineIndex) throw new Error();

        if (fromLineIndex === toLineIndex) {
            const lineIndex = fromLineIndex;
            const child = this.rawChildren[lineIndex];
            yield child.sectionBetween(fromChild, toChild, direction);
        } else {
            {
                const child = this.rawChildren[fromLineIndex];
                yield child.sectionBetween(
                    fromChild,
                    direction === outbound ? child.to : child.from,
                    direction
                );
            }
            for (let i = fromLineIndex + direction; direction * i < direction * toLineIndex; i += direction) {
                const child = this.rawChildren[i];
                yield direction === outbound ?
                    child.sectionBetween(child.from, child.to, direction) :
                    child.sectionBetween(child.to, child.from, direction);
            }
            {
                const child = this.rawChildren[toLineIndex];
                yield child.sectionBetween(
                    direction === outbound ? child.from : child.to,
                    toChild,
                    direction
                );
            }
        }
    }

    sectionBetween(from: Station, to: Station, direction: Direction): Line {
        // return new SectionOnRouteLine({ line: this, from, to, direction });
        return new RouteLine({
            name: this.name,
            code: this.code,
            children: this.childrenBetween(from, to, direction),
            stationCodesMap: this.stationCodesMap
        });
    }
}

class StationOnRouteLine extends AbstractStationOnLine2 {
    private readonly rawChildren: ReadonlyArray<StationOnLine> = [];

    constructor({ line, children }: { line: RouteLine, children: Iterable<StationOnLine> }) {
        super(line);
        this.rawChildren = [...children];
    }

    get substance(): StationSubstance { return this.rawChildren[0].substance; }

    *children(): IterableIterator<StationOnLine> { yield* this.rawChildren; }
}