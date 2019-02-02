import Line from "./Line";
import { Direction, outbound } from "./Direction";
import Station, { StationOnLine, StationSubstance } from "./Station";
import LineAlias from "./LineAlias";
import AbstractLine1 from "./AbstractLine1";
import Section from "./Section";

export default class RouteLine extends AbstractLine1<StationOnLine10> {
    protected readonly rawStations: ReadonlyArray<StationOnLine10>;
    protected readonly stationsOnLineMap: ReadonlyMap<StationSubstance, StationOnLine10>;

    private readonly rawChildren: ReadonlyArray<Line>;
    private readonly stationCodesMap: ReadonlyMap<StationOnLine, string | null>;
    private readonly rawName: string;

    constructor({ name, children, stationCodesMap = [] }: {
        name: string,
        children: Iterable<Line>,
        stationCodesMap?: Iterable<[Station, string | null]>
    }) {
        super();
        this.rawName = name;
        const rawChildren: Set<Line> = new Set();
        const stations: Set<StationOnLine10> = new Set();
        const stationsOnLineMap: Map<StationSubstance, StationOnLine10> = new Map();
        let lastSubstance: StationSubstance | null = null;
        let stationChildren: Set<StationOnLine> | null = null;

        for (const child of children) {
            const child1 = rawChildren.has(child) ? new LineAlias(child) : child;
            rawChildren.add(child1);

            if (lastSubstance !== null && child1.from().substance() !== lastSubstance) throw new Error();

            for (const stationChild of child1.stations()) {
                if (stationChild.substance() === lastSubstance) {
                    if (stationChildren === null) throw new Error();
                    stationChildren.add(stationChild);
                } else {
                    if (stationChildren !== null) {
                        const station = new StationOnLine10({ line: this, children: stationChildren });
                        stations.add(station);
                        if (lastSubstance === null) throw new Error();
                        stationsOnLineMap.set(lastSubstance, station);
                    }

                    stationChildren = new Set();
                    stationChildren.add(stationChild);
                }
                lastSubstance = stationChild.substance();
            }
        }
        this.rawChildren = [...rawChildren];
        this.rawStations = [...stations];
        this.stationsOnLineMap = stationsOnLineMap;

        const stationCodesMap1: Map<StationOnLine, string | null> = new Map();
        for (const [station, code] of stationCodesMap) {
            const stationOnLine = this.onLineOf(station);
            if (stationOnLine === null) throw new Error();
            stationCodesMap1.set(stationOnLine, code);
        }
        this.stationCodesMap = stationCodesMap1;
    }

    name(): string { return this.rawName; }

    // color(): string | null { }

    *codes(direction?: Direction): IterableIterator<string> {
        const codes: Set<string> = new Set();
        if (direction === outbound) {
            for (let i = 0; i < this.rawChildren.length; i++) {
                for (const code of this.rawChildren[i].codes(direction))
                    codes.add(code);
            }
        } else {
            for (let i = this.rawChildren.length; i > 0; i--)
                for (const code of this.rawChildren[i - 1].codes(direction))
                    codes.add(code);
        }
        yield* codes;
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

        const fromLineIndex = this.rawChildren.indexOf(fromChild.line());
        if (fromLineIndex < 0) throw new Error();

        const toLineIndex = direction === outbound ?
            this.rawChildren.indexOf(toChild.line(), fromLineIndex) :
            this.rawChildren.lastIndexOf(toChild.line(), fromLineIndex);
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
                    fromChild, direction === outbound ? child.to() : child.from(),
                    direction);

                if (childDistance === null) return null;
                distance += childDistance;
            }
            for (let i = fromLineIndex + direction; direction * i < direction * toLineIndex; direction++) {
                const child = this.rawChildren[i];
                const childDistance = direction === outbound ?
                    child.distanceBetween(child.from(), child.to(), direction) :
                    child.distanceBetween(child.to(), child.from(), direction);

                if (childDistance === null) return null;
                distance += childDistance;
            }
            {
                const child = this.rawChildren[toLineIndex];
                const childDistance = child.distanceBetween(
                    direction === outbound ? child.from() : child.to(), toChild,
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

        const fromLineIndex = this.rawChildren.indexOf(fromChild.line());
        if (fromLineIndex < 0) throw new Error();

        const toLineIndex = direction === outbound ?
            this.rawChildren.indexOf(toChild.line(), fromLineIndex) :
            this.rawChildren.lastIndexOf(toChild.line(), fromLineIndex);
        if (toLineIndex < 0) throw new Error();

        if (direction * fromLineIndex > direction * toLineIndex) throw new Error();

        if (fromLineIndex === toLineIndex) {
            const lineIndex = fromLineIndex;
            const child = this.rawChildren[lineIndex];
            yield new Section({ line: child, from: fromChild, to: toChild, direction });
        } else {
            {
                const child = this.rawChildren[fromLineIndex];
                yield new Section({
                    line: child,
                    from: fromChild,
                    to: direction === outbound ? child.to() : child.from(),
                    direction
                });
            }
            for (let i = fromLineIndex + direction; direction * i < direction * toLineIndex; direction++) {
                const child = this.rawChildren[i];
                yield direction === outbound ?
                    new Section({ line: child, from: child.from(), to: child.to(), direction }) :
                    new Section({ line: child, from: child.to(), to: child.from(), direction });
            }
            {
                const child = this.rawChildren[toLineIndex];
                yield new Section({
                    line: child,
                    from: direction === outbound ? child.from() : child.to(),
                    to: toChild,
                    direction
                });

            }
        }
    }

    codeOf(station: Station): string | null | undefined {
        const stationOnLine = station.on(this);
        if (stationOnLine === null) return null;
        return this.stationCodesMap.get(stationOnLine);
    }

    *codesOf(station: Station): IterableIterator<string> {
        const stationOnLine = station.on(this);
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
}

class StationOnLine10 implements StationOnLine {
    private readonly rawLine: RouteLine;
    private readonly rawChildren: ReadonlyArray<StationOnLine> = [];

    constructor({ line, children }: { line: RouteLine, children: Iterable<StationOnLine> }) {
        this.rawLine = line;
        this.rawChildren = [...children];
    }

    name(): string { return this.substance().name(); }
    *lines(): IterableIterator<Line> { yield* this.substance().lines(); }
    isSeasonal(): boolean { return this.substance().isSeasonal(); }

    line(): Line { return this.rawLine; }

    substance(): StationSubstance {
        return this.rawChildren[0].substance();
    }

    *codes(): IterableIterator<string> {
        yield* this.line().codesOf(this);
    }

    on(line: Line): StationOnLine | null {
        if (line === this.line())
            return this;
        else
            return this.substance().on(line);
    }

    distanceFromStart(): number | null {
        return this.line().distanceBetween(this.line().from(), this, outbound);
    }

    *children(): IterableIterator<StationOnLine> {
        yield* this.rawChildren;
    }
}
