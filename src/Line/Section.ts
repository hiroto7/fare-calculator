import Line from ".";
import Station, { StationSubstance } from "../Station";
import { Direction, outbound } from "../Direction";
import AbstractLine1 from "./AbstractLine1";
import { StationOnSection } from "../StationOnLine";
import DB, { ReadonlyDB } from "../DB";
import Code from "../Code";
import ColorPair from "../ColorPair";

export default class Section<SS extends StationSubstance> extends AbstractLine1<SS, StationOnSection<SS>> {
    protected rawStations: ReadonlyArray<StationOnSection<SS>>;
    protected stationsOnLineDB: ReadonlyDB<StationSubstance, Iterable<StationOnSection<SS>>>;
    protected isSOL(station: Station): station is StationOnSection<SS> { return station instanceof StationOnSection; }

    private readonly line: Line<SS>;
    private readonly stationCodesMap: ReadonlyMap<StationSubstance, string | null>;
    private readonly rawName: string | undefined;
    private readonly rawCode: Code | null | undefined;
    private readonly rawColor: ColorPair | null | undefined;
    private readonly hidesVia: boolean;

    constructor({ name, code, color, line, from, to, direction, stationCodesMap = [], hidesVia = false }: {
        name?: string,
        code?: Code | null,
        color?: ColorPair | null,
        stationCodesMap?: Iterable<[Station, string | null]>,
        line: Line<SS>,
        from: Station,
        to: Station,
        direction: Direction,
        hidesVia?: boolean
    }) {
        super();
        const section = line.sectionBetween(from, to, direction);
        const stations: StationOnSection<SS>[] = [];
        const stationsOnLineMap: ReadonlyDB<StationSubstance, Set<StationOnSection<SS>>> = new DB(_ => new Set);
        for (const original of section.stations()) {
            const station = new StationOnSection<SS>({ line: this, station: original });
            stations.push(station);
            stationsOnLineMap.get1(station.substance).add(station);
        }
        this.rawStations = stations;
        this.stationsOnLineDB = stationsOnLineMap;
        this.line = section;
        this.rawName = name;
        this.rawCode = code;
        this.rawColor = color;
        this.hidesVia = hidesVia;

        const stationCodesMap1: Map<StationSubstance, string | null> = new Map();
        for (const [station, code] of stationCodesMap)
            stationCodesMap1.set(station.substance, code);

        this.stationCodesMap = stationCodesMap1;
    }

    get name(): string {
        if (this.rawName === undefined)
            return this.line.name;
        else
            return this.rawName;
    }

    get code(): Code | null | undefined {
        if (this.rawCode === undefined)
            return this.line.code;
        else
            return this.rawCode;
    }

    get color(): ColorPair | null | undefined {
        if (this.rawColor === undefined)
            return this.line.color;
        else
            return this.rawColor;
    }

    *codes(direction: Direction = outbound): IterableIterator<Code> {
        if (this.code === undefined)
            yield* this.line.codes(direction);
        else if (this.code === null)
            return;
        else
            yield this.code;
    }

    *colors(direction: Direction = outbound): IterableIterator<ColorPair> {
        if (this.color === undefined)
            yield* this.line.colors(direction);
        else if (this.color === null)
            return;
        else
            yield this.color;
    }

    codeOf(station: Station): string | null | undefined {
        const substance = station.substance;
        const code = this.stationCodesMap.get(substance);
        if (code === undefined) {
            const stationOnLine = this.onLineVersionOf(station);
            if (stationOnLine === null) return null;
            return this.line.codeOf(stationOnLine.original);
        } else {
            return code;
        }
    }

    *codesOf(station: Station): IterableIterator<string> {
        const stationOnLine = this.onLineVersionOf(station);
        if (stationOnLine === null) throw new Error();
        const code = this.codeOf(stationOnLine);
        if (code === undefined)
            yield* this.line.codesOf(stationOnLine.original);
        else if (code === null)
            return;
        else
            yield code;
    }

    length(): number { return this.line.length(); }

    distanceBetween(from: Station, to: Station, direction: Direction): number | null {
        const from1 = this.onLineVersionOf(from);
        const to1 = this.onLineVersionOf(to);

        if (from1 === null || to1 === null) return null;
        return this.line.distanceBetween(from1.original, to1.original, direction);
    }

    sectionBetween(from: Station, to: Station, direction: Direction): Line<SS> {
        const from1 = this.onLineVersionOf(from);
        const to1 = this.onLineVersionOf(to);
        if (from1 === null) throw new Error();
        if (to1 === null) throw new Error();
        return new Section<SS>({
            name: this.name,
            code: this.code,
            color: this.color,
            line: this.line,
            from: from1.original,
            to: to1.original,
            direction,
            stationCodesMap: this.stationCodesMap,
            hidesVia: this.hidesVia
        });
    }

    *grandchildren(hidesVia: boolean = false): IterableIterator<Line<SS>> {
        if (this.hidesVia && hidesVia)
            yield this;
        else
            yield* this.line.grandchildren(hidesVia);
    }
}