import { Direction, outbound, inbound } from "./Direction";
import Line, { Section, RouteLine, OfficialLine } from "./Line/";
import Station, { Station1, StationSubstance, WritableStation } from "./Station";
import DB, { ReadonlyDB } from "./DB";
import { StationOnLine } from "./StationOnLine";

class StationXMLHandler {
    constructor(private readonly stationsDB: ReadonlyDB<string, WritableStation & StationSubstance, [string?]>) { }

    handle(e: Element): StationSubstance & WritableStation {
        if (e.tagName !== 'station')
            throw new Error('このメソッドの引数は <station> 要素である必要があります。');

        const name = e.getAttribute('name');
        if (name === null)
            throw new Error('name 属性を省略することはできません。');
        const key = e.getAttribute('key') || name;

        const isSeasonal = e.hasAttribute('seasonal') || undefined;
        const station = this.stationsDB.get1(key, name);
        station.setOptions({ isSeasonal });
        return station;
    }
}

class LineXMLHandler {
    constructor(
        private readonly linesDB: ReadonlyMap<string, Line<StationSubstance & WritableStation>>,
        private readonly stationsDB: ReadonlyDB<string, StationSubstance>,
        private readonly stationXMLHandler: StationXMLHandler) { }

    private handleO(e: Element, { name, code: lineCode, color }: {
        name: string | undefined,
        code: string | undefined,
        color: string | undefined
    }): OfficialLine<StationSubstance & WritableStation> {

        if (name === undefined)
            throw new Error('name 属性を省略することはできません。');

        const stations: {
            substance: StationSubstance & WritableStation,
            distanceFromStart: number | null,
            code?: string | null
        }[] = [];
        for (const stationXML of Array.from(e.children)) {
            if (stationXML.tagName !== 'station') continue;

            const substance = this.stationXMLHandler.handle(stationXML);
            const distanceFromStartString = stationXML.getAttribute('distance');
            const distanceFromStart = distanceFromStartString === null ? null : +distanceFromStartString;

            const stationCode1 = stationXML.getAttribute('code');
            const stationCode = stationCode1 === null ? null :
                lineCode === null ? stationCode1 : lineCode + stationCode1;

            stations.push({ substance, distanceFromStart, code: stationCode });
        }

        return new OfficialLine({ name, code: lineCode, color, stations });
    }

    private handleS(e: Element, { name, code: lineCode, color, hidesVia, stationCodesMap }: {
        name: string | undefined,
        code: string | undefined,
        color: string | undefined,
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
        code: string | undefined,
        color: string | undefined,
        hidesVia: boolean,
        stationCodesMap: Iterable<[StationSubstance, string | null]>
    }): RouteLine<StationSubstance & WritableStation> {

        if (name === undefined)
            throw new Error('name 属性を省略することはできません。');

        const sections: Line<StationSubstance & WritableStation>[] = [];
        for (const child of Array.from(e.children)) {
            if (child.tagName !== 'official' && child.tagName !== 'route' && child.tagName !== 'section') continue;

            const section = this.handle(child);
            sections.push(section);
        }

        return new RouteLine({ name, code: lineCode, color, children: sections, stationCodesMap, hidesVia });
    }

    handle(e: Element): Line<StationSubstance & WritableStation> {
        const name: string | undefined = e.getAttribute('name') || undefined;
        const lineCode: string | undefined = e.getAttribute('code') || undefined;
        const color: string | undefined = e.getAttribute('color') || undefined;
        const hidesVia: boolean = e.hasAttribute('hides-via');

        const params: {
            name: string | undefined,
            code: string | undefined,
            color: string | undefined,
            hidesVia: boolean,
            stationCodesMap?: Iterable<[StationSubstance, string | null]>
        } = { name, code: lineCode, color, hidesVia };

        if (e.tagName === 'official') {
            return this.handleO(e, params);
        } else if (e.tagName === 'section' || e.tagName === 'route') {

            const stationCodesMap: Map<StationSubstance, string | null> = new Map();
            for (const stationXML of Array.from(e.children)) {
                if (stationXML.tagName !== 'station') continue;

                const substance = this.stationXMLHandler.handle(stationXML);
                const stationCode = stationXML.getAttribute('code');

                if (stationCode !== null)
                    stationCodesMap.set(substance, lineCode === undefined ? stationCode : lineCode + stationCode);
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

class XMLHandler {
    private visited: Set<string> = new Set();
    private readonly parser = new DOMParser();
    private readonly linesDB: Map<string, Line<StationSubstance>>;
    private readonly stationsDB: Map<string, WritableStation & StationSubstance>;
    private readonly stationXMLHandler: StationXMLHandler;
    private readonly lineXMLHandler: LineXMLHandler;

    constructor() {
        const linesDB: ReadonlyMap<string, Line<StationSubstance & WritableStation>> = this.linesDB = new Map();
        const stationsDB: ReadonlyDB<string, WritableStation & StationSubstance> = this.stationsDB = new DB((key: string, name?: string) => {
            name = name || key;
            return new Station1(name);
        });
        const stationXMLHandler = this.stationXMLHandler = new StationXMLHandler(stationsDB);
        this.lineXMLHandler = new LineXMLHandler(linesDB, stationsDB, stationXMLHandler);
    }

    async import(url: URL) {
        const response = await fetch(url.toString());
        if (!response.ok)
            throw new Error(`[${url.toString()}] を読み込めません。`);
        const srcText = await response.text();
        const srcXML = this.parser.parseFromString(srcText, 'text/xml');

        await this.handleXMLData(srcXML.children[0], url);
    }

    async handleImport(e: Element, baseURL: URL) {
        if (e.tagName !== 'import') throw new Error();

        const src = e.getAttribute('src');
        if (src === null) throw new Error();

        const url: URL = new URL(src, baseURL);
        if (this.visited.has(url.toString()))
            return;

        this.visited.add(url.toString());
        await this.import(url);
    }

    async handleXMLData(data: Element, baseURL: URL) {
        if (data.tagName !== 'data') throw new Error();

        for (const child of Array.from(data.children)) {
            if (child.tagName === 'official' || child.tagName === 'route' || child.tagName === 'section') {
                const line: Line<StationSubstance & WritableStation> = this.lineXMLHandler.handle(child);
                const key: string = child.getAttribute('key') || line.name;
                this.linesDB.set(key, line);
                const hidden: boolean = child.hasAttribute('hidden');
                if (!hidden) {
                    for (const station of line.stations())
                        station.substance.add(line);
                }
            } else if (child.tagName === 'station') {
                this.stationXMLHandler.handle(child);
            } else if (child.tagName === 'import') {
                await this.handleImport(child, baseURL);
            }
        }
    }

    getDB(): {
        readonly linesDB: ReadonlyMap<string, Line<StationSubstance>>,
        readonly stationsDB: ReadonlyMap<string, StationSubstance>
    } {
        return {
            linesDB: this.linesDB, stationsDB: this.stationsDB
        };
    }
}

const a = (line: Line<StationSubstance>): HTMLElement => {
    const section: HTMLElement = document.createElement('section');

    section.innerHTML = `<h1>${[...line.codes()].map(v => `[${v}] `).join(``)}${line.name} [${line.from.name} - ${line.to.name}]</h1>
    <p>営業キロ : ${line.length()}</p>
    `;

    const table = document.createElement('table');
    for (const station of line.stations()) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${[...station.codes()]}</td>
        <td>${station.name}</td>
        <td>${Math.floor(station.distanceFromStart()! * 10) / 10}</td>
        <td>${station.isSeasonal ? '臨時駅' : ''}</td>
        <td>${[...station.lines()].toString()}</td>`
        table.appendChild(tr);
    }
    section.appendChild(table);

    return section;
}

const b = (line: Line<StationSubstance>, station: Station): HTMLElement => {
    const list: HTMLElement = document.createElement('x-named-direction-list');

    const summary: HTMLHeadingElement = document.createElement('h1');
    summary.appendChild(document.createTextNode(line.name));
    summary.slot = 'summary';
    list.appendChild(summary);

    let symbolCount = 0;
    const sections = line.sectionsFrom(station);
    for (const section of sections) {
        const button: HTMLElement = document.createElement('x-line-button');
        const grandchild = section.grandchildren(true).next().value;
        {
            const codes = grandchild.codes();
            const result = codes.next();
            if (!result.done) {
                const code = result.value;
                const image: HTMLImageElement = document.createElement('img');
                image.src = `./sample/${code}.svg`;
                image.slot = 'symbol';
                button.appendChild(image);
                symbolCount = 1;
            }
        }
        {
            const colors = grandchild.colors();
            const result = colors.next();
            if (!result.done) {
                const color = result.value;
                button.style.setProperty('--color', color);
            }
        }
        if (grandchild.name !== line.name) {
            const p: HTMLParagraphElement = document.createElement('p');
            p.appendChild(document.createTextNode(grandchild.name));
            p.slot = 'summary';
            button.appendChild(p);
        }
        {
            const h1: HTMLHeadingElement = document.createElement('h1');
            const halfway: Set<StationSubstance> = new Set();
            {
                const stations: IterableIterator<StationOnLine<StationSubstance>> = section.stations();
                halfway.add((stations.next(), stations.next()).value.substance);
            }
            halfway.add(grandchild.to.substance);
            halfway.add(section.to.substance);
            h1.appendChild(document.createTextNode(`${[...halfway].join(', ')} 方面`));
            h1.slot = 'summary';
            button.appendChild(h1);
        }

        button.slot = 'direction';
        list.appendChild(button);
    }
    list.style.setProperty('--symbols-count', '' + symbolCount);
    list.slot = 'line';

    return list;
}

(async () => {
    const handler = new XMLHandler();
    const indexURL = new URL('./sample/index.xml', location.href);
    await handler.import(indexURL);
    console.log(handler);

    const linesDB = handler.getDB().linesDB;
    const stationsDB = handler.getDB().stationsDB;

    document.getElementById('station-input')!.addEventListener('keypress', e => {
        if (e.keyCode !== 13) return;
        document.getElementById('show-button')!.click();
        e.preventDefault();
    });

    document.getElementById('show-button')!.addEventListener('click', () => {
        try {
            const stationInput: HTMLInputElement = document.getElementById('station-input')! as HTMLInputElement;
            const station: StationSubstance | undefined = stationsDB.get(stationInput.value);
            if (station === undefined)
                throw new Error(`'${stationInput.value}' が見つかりません。`);

            document.getElementById('list1')!.textContent = null;
            for (const line of station.lines())
                document.getElementById('list1')!.appendChild(b(line, station));
            document.getElementById('p1')!.textContent = null;
        } catch (e) {
            document.getElementById('p1')!.textContent = e;
        }
    });

    document.getElementById('clear-button')!.addEventListener('click', () => {
        document.getElementById('p1')!.textContent = null;
        document.getElementById('list1')!.textContent = null;
    });

    const sec1 = document.getElementById('sec1')!;

    for (const line of linesDB.values()) {
        sec1.appendChild(a(line));
    }

    document.getElementById('loading')!.style.display = 'none';
})();
