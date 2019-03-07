export default interface Station {
    readonly name: string;
    readonly isSeasonal: boolean;
    readonly substance: StationSubstance;
}

export interface WritableStation extends Station {
    setOptions({ isSeasonal }: { isSeasonal?: boolean }): void;
}

export interface StationSubstance extends Station {
    readonly isSubstance: true;
    readonly substance: this;
}

export class Station1 implements StationSubstance, WritableStation {
    isSubstance: true = true;
    private rawIsSeasonal: boolean = false;

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

    toString() { return this.name; }
}