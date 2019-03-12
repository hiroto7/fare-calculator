import Direction, { outbound } from "../Direction";
import Line from ".";
import Station, { StationSubstance } from "../Station";
import AbstractLine1 from "./AbstractLine1";
import SectionOnOfficialLine from "./SectionOnOfficialLine";
import { AbstractStationOnLine1 } from "../StationOnLine";
import DB, { ReadonlyDB } from "../DB";
import Code from "../Code";
import ColorPair from "../ColorPair";

export default class OfficialLine extends AbstractLine1<StationOnOfficialLine> {
    protected rawStations: ReadonlyArray<StationOnOfficialLine>;
    protected stationsOnLineDB: ReadonlyDB<StationSubstance, Iterable<StationOnOfficialLine>>;

    protected isSOL(station: Station): station is StationOnOfficialLine { return station instanceof StationOnOfficialLine; }

    readonly name: string;
    readonly color: ColorPair | null;
    readonly code: Code | null;

    constructor({ name, code = null, color = null, stations }: {
        name: string,
        color?: ColorPair | null,
        code?: Code | null,
        stations: Iterable<{
            substance: StationSubstance,
            distanceFromStart: number | null,
            code?: string | null
        }>
    }) {
        super();
        this.name = name;
        this.color = color;
        this.code = code;

        const rawStations: StationOnOfficialLine[] = [];
        const stationsOnLineMap: ReadonlyDB<StationSubstance, Set<StationOnOfficialLine>, []> = new DB(_ => new Set());
        for (const stationParameter of stations) {
            const station = new StationOnOfficialLine({ line: this, ...stationParameter });
            rawStations.push(station);
            stationsOnLineMap.get1(station.substance).add(station);
        }
        this.rawStations = rawStations;
        this.stationsOnLineDB = stationsOnLineMap;
    }

    *colors(): IterableIterator<ColorPair> {
        const color = this.color;
        if (color !== null)
            yield color;
    }

    *codes(): IterableIterator<Code> {
        const code = this.code;
        if (code !== null)
            yield code;
    }

    codeOf(station: Station): string | null | undefined {
        const codes = this.codesOf(station);
        const result = codes.next();
        if (result.done)
            return null;
        else
            result.value;
    }

    *codesOf(station: Station): IterableIterator<string> {
        const stationOnLine = this.onLineVersionOf(station);
        if (stationOnLine === null) throw new Error();
        yield* stationOnLine.codes();
    }

    length(): number {
        const length = this.distanceBetween(this.from, this.to, outbound);
        if (length === null) throw new Error();
        return length;
    }

    distanceBetween(from: Station, to: Station, direction: Direction): number | null {
        const from1 = this.onLineVersionOf(from);
        const to1 = this.onLineVersionOf(to);
        if (from1 === null || to1 === null) return null;

        const d1 = from1.distanceFromStart();
        const d2 = to1.distanceFromStart();
        return d1 === null || d2 === null ? null : direction * (d2 - d1);
    }

    sectionBetween(from: Station, to: Station, direction: Direction): Line {
        return new SectionOnOfficialLine(this, from, to, direction);
    }

    *stationsBetween(from: Station, to: Station, direction: Direction): IterableIterator<StationOnOfficialLine> {
        const from1 = this.onLineVersionOf(from);
        const to1 = this.onLineVersionOf(to);
        if (from1 === null) throw new Error(`${this}, ${from}, ${to}, ${direction}`);
        if (to1 === null) throw new Error(`${this}, ${from}, ${to}, ${direction}`);

        const fromIndex = this.rawStations.indexOf(from1);
        if (fromIndex < 0) throw new Error();
        const toIndex = direction === outbound ?
            this.rawStations.indexOf(to1, fromIndex) :
            this.rawStations.lastIndexOf(to1, fromIndex);
        if (toIndex < 0) throw new Error();

        for (let i = fromIndex; direction * i <= direction * toIndex; i += direction)
            yield this.rawStations[i];
    }

    *grandchildren() { yield this; }

    equals(line: Line): boolean { return this === line; }

    minimize() { return this; }

    contains(line: Line): boolean {
        if (line.hasChildren()) {
            const children = [...line.children()];
            if (children.length === 1)
                return this.contains(children[0]);
            else
                return false;
        } else if (line instanceof OfficialLine) {
            return line === this;
        } else if (line instanceof SectionOnOfficialLine) {
            return line.original === this && line.direction === outbound;
        } else {
            throw new Error();
        }
    }

    hasChildren(): false { return false; }
}

export class StationOnOfficialLine extends AbstractStationOnLine1<OfficialLine> {
    private readonly rawDistanceFromStart: number | null;
    private readonly rawCode: string | null;

    readonly substance: StationSubstance;

    constructor({ line, substance, distanceFromStart, code = null }: {
        line: OfficialLine,
        substance: StationSubstance,
        distanceFromStart: number | null,
        code?: string | null
    }) {
        super(line);
        this.substance = substance;
        this.rawDistanceFromStart = distanceFromStart;
        this.rawCode = code;
    }

    *codes(): IterableIterator<string> {
        if (this.rawCode !== null)
            yield this.rawCode;
    }

    distanceFromStart(): number | null {
        if (this === this.line.from) {
            if (this.rawDistanceFromStart === null) throw new Error();
            return 0;
        } else {
            const distanceOfStart = this.line.from.rawDistanceFromStart;
            if (distanceOfStart === null) throw new Error();
            if (this.rawDistanceFromStart === null) return null;
            return this.rawDistanceFromStart - distanceOfStart;
        }
    }
}
