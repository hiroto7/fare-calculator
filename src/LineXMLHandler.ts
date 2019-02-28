import Line, { OfficialLine, Section, RouteLine } from "./Line";
import { StationSubstance, WritableStation } from "./Station";
import { ReadonlyDB } from "./DB";
import { Direction, outbound, inbound } from "./Direction";
import StationXMLHandler from "./StationXMLHandler";
import Code from "./Code";
import ColorPair from "./ColorPair";

export default class LineXMLHandler {
    private readonly linesDB: ReadonlyMap<string, Line<StationSubstance & WritableStation>>;
    private readonly stationsDB: ReadonlyDB<string, StationSubstance>;
    private readonly codesDB: ReadonlyMap<string, Code>;
    private readonly stationXMLHandler: StationXMLHandler;

    constructor({ linesDB, stationsDB, codesDB, stationXMLHandler }: {
        linesDB: ReadonlyMap<string, Line<StationSubstance & WritableStation>>,
        stationsDB: ReadonlyDB<string, StationSubstance>,
        codesDB: ReadonlyMap<string, Code>,
        stationXMLHandler: StationXMLHandler
    }) {
        this.linesDB = linesDB;
        this.stationsDB = stationsDB;
        this.codesDB = codesDB;
        this.stationXMLHandler = stationXMLHandler;
    }

    private handleO(e: Element, { name, code: lineCode, color }: {
        name: string | undefined,
        code: Code | undefined,
        color: ColorPair | undefined
    }): OfficialLine<StationSubstance & WritableStation> {

        if (name === undefined)
            throw new Error('name 属性を省略することはできません。');

        const stations: {
            substance: StationSubstance & WritableStation,
            distanceFromStart: number | null,
            code?: string | null
        }[] = [];
        for (const stationXML of e.children) {
            if (stationXML.tagName !== 'station') continue;

            const substance = this.stationXMLHandler.handle(stationXML);
            const distanceFromStartString = stationXML.getAttribute('distance');
            const distanceFromStart = distanceFromStartString === null ? null : +distanceFromStartString;

            const stationCode1 = stationXML.getAttribute('code');
            const stationCode = stationCode1 === null ? null :
                lineCode === undefined ? stationCode1 : lineCode.name + stationCode1;

            stations.push({ substance, distanceFromStart, code: stationCode });
        }

        return new OfficialLine({ name, code: lineCode, color, stations });
    }

    private handleS(e: Element, { name, code: lineCode, color, hidesVia, stationCodesMap }: {
        name: string | undefined,
        code: Code | undefined,
        color: ColorPair | undefined,
        hidesVia: boolean,
        stationCodesMap: Iterable<[StationSubstance, string | null]>
    }): Section<StationSubstance & WritableStation> {

        const lineKey = e.getAttribute('line');
        if (lineKey === null)
            throw new Error('line 属性を省略することはできません。');

        const directionString = e.getAttribute('direction');
        if (directionString === null)
            throw new Error('direction 属性を省略することはできません。');
        if (directionString !== '+' && directionString !== '-')
            throw new Error('direction 属性の値は "+" または "-" である必要があります。');
        const direction: Direction = directionString === '+' ? outbound : inbound;

        const line: Line<StationSubstance & WritableStation> | undefined = this.linesDB.get(lineKey);
        if (line === undefined)
            throw new Error(`${lineKey} が見つかりません。`);

        const fromKey = e.getAttribute('from');
        const toKey = e.getAttribute('to');

        const from = fromKey === null ?
            direction === outbound ? line.from : line.to :
            this.stationsDB.get1(fromKey);
        const to = toKey === null ?
            direction === outbound ? line.to : line.from :
            this.stationsDB.get1(toKey);

        return new Section({ name, code: lineCode, color, line, direction, from, to, stationCodesMap, hidesVia });
    }

    private handleR(e: Element, { name, code: lineCode, color, hidesVia, stationCodesMap }: {
        name: string | undefined,
        code: Code | undefined,
        color: ColorPair | undefined,
        hidesVia: boolean,
        stationCodesMap: Iterable<[StationSubstance, string | null]>
    }): RouteLine<StationSubstance & WritableStation> {

        if (name === undefined)
            throw new Error('name 属性を省略することはできません。');

        const sections: Line<StationSubstance & WritableStation>[] = [];
        for (const child of e.children) {
            if (child.tagName !== 'official' && child.tagName !== 'route' && child.tagName !== 'section') continue;

            const section = this.handle(child);
            sections.push(section);
        }

        return new RouteLine({ name, code: lineCode, color, children: sections, stationCodesMap, hidesVia });
    }

    handle(e: Element): Line<StationSubstance & WritableStation> {
        const name: string | undefined = e.getAttribute('name') || undefined;
        const hidesVia: boolean = e.hasAttribute('hides-via');

        const color1: string | null = e.getAttribute('color');
        const color2: string | null = e.getAttribute('color2');
        const color: ColorPair | undefined = color1 === null ? undefined : new ColorPair(color1, color2 || 'white');

        const lineCodeKey: string | undefined = e.getAttribute('code') || undefined;
        let lineCode: Code | undefined = undefined
        if (lineCodeKey !== undefined) {
            lineCode = this.codesDB.get(lineCodeKey);
            if (lineCode === undefined)
                throw new Error(`路線記号 '${lineCodeKey}' が見つかりません。`);
        }

        const params: {
            name: string | undefined,
            code: Code | undefined,
            color: ColorPair | undefined,
            hidesVia: boolean,
            stationCodesMap?: Iterable<[StationSubstance, string | null]>
        } = { name, code: lineCode, color, hidesVia };

        if (e.tagName === 'official') {
            return this.handleO(e, params);
        } else if (e.tagName === 'section' || e.tagName === 'route') {

            const stationCodesMap: Map<StationSubstance, string | null> = new Map();
            for (const stationXML of e.children) {
                if (stationXML.tagName !== 'station') continue;

                const substance = this.stationXMLHandler.handle(stationXML);
                const stationCode = stationXML.getAttribute('code');

                if (stationCode !== null)
                    stationCodesMap.set(substance, lineCode === undefined ? stationCode : lineCode.name + stationCode);
            }

            if (e.tagName === 'section') {
                return this.handleS(e, { ...params, stationCodesMap });
            } else {
                return this.handleR(e, { ...params, stationCodesMap });
            }

        } else {
            throw new Error('このメソッドの引数は <official>, <section>, <route> のいずれかの要素である必要があります。');
        }
    }
}
