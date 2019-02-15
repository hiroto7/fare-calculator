import { Direction, outbound } from "./Direction";
import Line, { Section, RouteLine, OfficialLine } from "./Line/";
import { Station1, StationSubstance } from "./Station";
import DB from "./DB";
import { StationOnLine } from "./StationOnLine";

class XMLHandler {
    private visited: Set<string> = new Set();
    readonly linesDB = new Map<string, Line>();
    readonly stationsDB = new DB((key: string, name?: string) => {
        name = name || key;
        return new Station1(name);
    });
    readonly parser = new DOMParser();

    handleStation(e: Element): StationSubstance {
        if (e.tagName !== 'station') throw new Error();

        const name = e.getAttribute('name');
        if (name === null) throw new Error();
        const key = e.getAttribute('key') || name;

        const isSeasonal = e.hasAttribute('seasonal');
        const station = this.stationsDB.get1(key, name);
        station.setOptions({ isSeasonal });
        return station;
    }

    handleSection(e: Element): Line {
        if (e.tagName !== 'section') throw new Error();

        const lineKey = e.getAttribute('line');
        if (lineKey === null) throw new Error();

        const directionString = e.getAttribute('direction');
        if (directionString === null) throw new Error();
        if (directionString !== '+' && directionString !== '-') throw new Error();
        const direction: Direction = directionString === '+' ? outbound : Direction.inbound;

        const line: Line | undefined = this.linesDB.get(lineKey);
        if (line === undefined) throw new Error(e.outerHTML);

        const fromKey = e.getAttribute('from');
        const toKey = e.getAttribute('to');

        const from = fromKey === null ?
            direction === outbound ? line.from : line.to :
            this.stationsDB.get1(fromKey);
        const to = toKey === null ?
            direction === outbound ? line.to : line.from :
            this.stationsDB.get1(toKey);

        const name1: string | null = e.getAttribute('name');
        const name: string | undefined = name1 === null ? undefined : name1;

        const lineCode1: string | null = e.getAttribute('code');
        const lineCode: string | undefined = lineCode1 === null ? undefined : lineCode1;

        const hidesVia: boolean = e.hasAttribute('hides-via');

        const stationCodesMap: Map<StationSubstance, string | null> = new Map();
        for (const stationXML of Array.from(e.children)) {
            if (stationXML.tagName !== 'station') continue;

            const substance = this.handleStation(stationXML);
            const stationCode = stationXML.getAttribute('code');

            if (stationCode !== null)
                stationCodesMap.set(substance, lineCode === undefined ? stationCode : lineCode + stationCode);
        }

        return new Section({ name, code: lineCode, line, direction, from, to, stationCodesMap, hidesVia });
    }

    handleRouteLine(e: Element): RouteLine {
        if (e.tagName !== 'route') throw new Error();

        const name = e.getAttribute('name');
        if (name === null) throw new Error();

        const lineCode1: string | null = e.getAttribute('code');
        const lineCode: string | undefined = lineCode1 === null ? undefined : lineCode1;

        const hidesVia: boolean = e.hasAttribute('hides-via');

        const stationCodesMap: Map<StationSubstance, string | null> = new Map();
        const sections: Line[] = [];
        for (const child of Array.from(e.children)) {
            switch (child.tagName) {
                case 'section':
                    const section = this.handleSection(child);
                    sections.push(section);
                    break;

                case 'station':
                    const substance = this.handleStation(child);
                    const stationCode = child.getAttribute('code');

                    if (stationCode !== null)
                        stationCodesMap.set(substance, lineCode === undefined ? stationCode : lineCode + stationCode);

                    break;
            }
        }

        return new RouteLine({ name, code: lineCode, children: sections, stationCodesMap, hidesVia });
    }

    handleOfficialLine(e: Element): Line {
        if (e.tagName !== 'official') throw new Error();

        const name = e.getAttribute('name');
        if (name === null) throw new Error();
        const lineCode: string | null = e.getAttribute('code');

        const stations: {
            substance: StationSubstance,
            distanceFromStart: number | null,
            code?: string | null
        }[] = [];
        for (const stationXML of Array.from(e.children)) {
            if (stationXML.tagName !== 'station') continue;

            const substance = this.handleStation(stationXML);
            const distanceFromStartString = stationXML.getAttribute('distance');
            const distanceFromStart = distanceFromStartString === null ? null : +distanceFromStartString;

            const stationCode1 = stationXML.getAttribute('code');
            const stationCode = stationCode1 === null ? null :
                lineCode === null ? stationCode1 : lineCode + stationCode1;

            stations.push({ substance, distanceFromStart, code: stationCode });
        }

        return new OfficialLine({ name, code: lineCode, stations });
    }

    async import(url: URL) {
        const srcText = await (await fetch(url.toString())).text();
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
            if (child.tagName === 'official' ||
                child.tagName === 'route' ||
                child.tagName === 'section') {
                const line: Line = child.tagName === 'official' ?
                    this.handleOfficialLine(child) :
                    child.tagName === 'route' ?
                        this.handleRouteLine(child) :
                        this.handleSection(child);

                const key: string = child.getAttribute('key') || line.name;
                this.linesDB.set(key, line);
            } else if (child.tagName === 'station') {
                this.handleStation(child);
            } else if (child.tagName === 'import') {
                await this.handleImport(child, baseURL);
            }
        }
    }
}

const a = (line: Line): HTMLElement => {
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

const b = (line: Line, sections: Iterable<Line>): HTMLElement => {
    const list: HTMLElement = document.createElement('x-named-direction-list');

    const summary: HTMLHeadingElement = document.createElement('h1');
    summary.appendChild(document.createTextNode(line.name));
    summary.slot = 'summary';
    list.appendChild(summary);

    let symbolCount = 0;
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
                const stations: IterableIterator<StationOnLine> = section.stations();
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

    const linesDB = handler.linesDB;
    const stationsDB = handler.stationsDB;

    document.getElementById('add-button')!.addEventListener('click', () => {
        try {
            const stationInput: HTMLInputElement = document.getElementById('station-input')! as HTMLInputElement;
            const lineInput: HTMLInputElement = document.getElementById('line-input')! as HTMLInputElement;
            const station: StationSubstance = stationsDB.get(stationInput.value)!;
            const line: Line = linesDB.get(lineInput.value)!;

            document.getElementById('list1')!.appendChild(b(line, line.sectionsFrom(station)));
        } catch (e) {
            console.error(e);
        }
    });

    for (const line of linesDB.values()) {
        document.body.appendChild(a(line));
    }

    document.getElementById('loading')!.style.display = 'none';
})();
