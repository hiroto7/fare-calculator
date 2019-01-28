import Line from "./Line";

export default interface Station {
    name(): string;
    lines(): IterableIterator<Line>;
    isSeasonal(): boolean;
    on(line: Line): StationOnLine | null;
    substance(): StationSubstance;
}

export interface WritableStation extends Station {
    add(line: Line, onLine: StationOnLine): void;
    setOptions({ isSeasonal }: { isSeasonal?: boolean }): void;
}

export interface StationSubstance extends Station {
    readonly isSubstance: true;
    substance(): this;
}

export interface StationOnLine extends Station {
    line(): Line;
    code(): string | null;
    distanceFromStart(): number | null;
}

export class Station1 implements StationSubstance, WritableStation {
    readonly isSubstance: true = true;
    private readonly rawName: string;
    private rawIsSeasonal: boolean = false;
    private readonly rawLines: Set<Line> = new Set();
    private readonly stationsOnLines: Map<Line, StationOnLine> = new Map();

    constructor(name: string) {
        this.rawName = name;
    }

    name(): string {
        return this.rawName;
    }

    lines(): IterableIterator<Line> {
        return this.rawLines[Symbol.iterator]();
    }

    isSeasonal(): boolean {
        return this.rawIsSeasonal;
    }

    on(line: Line): StationOnLine | null {
        return line.onLineOf(this);
    }

    substance(): this {
        return this;
    }

    add(line: Line, onLine: StationOnLine) {
        this.rawLines.add(line);
        this.stationsOnLines.set(line, onLine);
    }

    setOptions({ isSeasonal }: {
        isSeasonal?: boolean
    }) {
        if (isSeasonal !== undefined)
            this.rawIsSeasonal = isSeasonal;
    }
}

export class StationOnLine1 implements StationOnLine {
    private readonly rawSubstance: StationSubstance;
    private readonly rawCode: string | null;
    protected readonly rawLine: Line;

    constructor({ line, substance, code = null }: {
        line: Line,
        substance: StationSubstance,
        code?: string | null
    }) {
        this.rawLine = line;
        this.rawSubstance = substance;
        this.rawCode = code;
    }

    name(): string { return this.substance().name(); }
    lines(): IterableIterator<Line> { return this.substance().lines(); }
    isSeasonal(): boolean { return this.substance().isSeasonal(); }

    substance(): StationSubstance { return this.rawSubstance; }
    code(): string | null { return this.rawCode; }
    line(): Line { return this.rawLine; }

    on(line: Line): StationOnLine | null {
        if (line === this.line())
            return this;
        else
            return this.substance().on(line);
    }

    distanceFromStart(): number | null {
        return this.line().distanceBetween(this.line().from(), this);
    }
}
