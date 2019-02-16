import Line from "./Line";

export default interface Station {
    readonly name: string;
    readonly isSeasonal: boolean;
    readonly substance: StationSubstance;
    lines(): IterableIterator<Line<StationSubstance>>;
}

export interface WritableStation extends Station {
    add(line: Line<StationSubstance>): void;
    setOptions({ isSeasonal }: { isSeasonal?: boolean }): void;
}

export interface StationSubstance extends Station {
    readonly isSubstance: true;
    readonly substance: this;
}

export class Station1 implements StationSubstance, WritableStation {
    isSubstance: true = true;
    private rawIsSeasonal: boolean = false;
    private readonly rawLines: Set<Line<StationSubstance>> = new Set();

    readonly substance: this = this;
    readonly name: string;

    get isSeasonal(): boolean { return this.rawIsSeasonal; };

    constructor(name: string) {
        this.name = name;
    }

    setOptions({ isSeasonal }: { isSeasonal?: boolean }): void {
        if (isSeasonal !== undefined)
            this.rawIsSeasonal = isSeasonal;
    };

    *lines(): IterableIterator<Line<StationSubstance>> { yield* this.rawLines; }
    add(line: Line<StationSubstance>) { this.rawLines.add(line); }
    toString() { return this.name; }
}