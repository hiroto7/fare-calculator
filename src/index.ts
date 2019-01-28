import { Direction } from "./Direction";
import Line from "./Line";
import OfficialLine from "./OfficialLine";
import Section from "./Section";
import { Station1, StationSubstance, WritableStation } from "./Station";

class StationsDB {
    private readonly map: Map<string, StationSubstance & WritableStation> = new Map();

    get(name: string, key?: string): StationSubstance & WritableStation {
        key = key || name;

        const station = this.map.get(key);
        if (station === undefined) {
            const station = new Station1(name);
            this.map.set(key, station);
            return station;
        } else {
            return station;
        }
    }
}

class XMLHandler {
    private visited: Set<string> = new Set();
    linesDB = new Map<string, Line>();
    stationsDB = new StationsDB();

    handleStation(e: Element): StationSubstance {
        if (e.tagName !== 'station') throw new Error();

        const name = e.getAttribute('name');
        if (name === null) throw new Error();
        const key = e.getAttribute('key') || name;

        const isSeasonal = e.hasAttribute('seasonal');
        const station = this.stationsDB.get(key);
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
        const direction: Direction = directionString === '+' ? Direction.outbound : Direction.inbound;

        const line: Line | undefined = this.linesDB.get(lineKey);
        if (line === undefined) throw new Error();

        const fromKey = e.getAttribute('from');
        const toKey = e.getAttribute('to');

        const from = fromKey === null ? undefined : this.stationsDB.get(fromKey);
        const to = toKey === null ? undefined : this.stationsDB.get(toKey);

        const name1: string | null = e.getAttribute('name');
        const name: string | undefined = name1 === null ? undefined : name1;

        const lineCode1: string | null = e.getAttribute('code');
        const lineCode: string | undefined = lineCode1 === null ? undefined : lineCode1;

        const stations: {
            substance: StationSubstance,
            code?: string | null
        }[] = [];
        for (const stationXML of Array.from(e.children)) {
            if (stationXML.tagName !== 'station') continue;

            const substance = this.handleStation(stationXML);
            const stationCode1 = stationXML.getAttribute('code');
            const stationCode = stationCode1 === null ? undefined :
                lineCode === null ? stationCode1 : lineCode + stationCode1;

            stations.push({ substance, code: stationCode });
        }

        const section: Section = new Section({ name, code: lineCode, line, direction, from, to, stations });

        if (name !== undefined) {
            const key: string = e.getAttribute('key') || name;
            this.linesDB.set(key, section);
        }

        return section;
    }

    handleRouteLine(e: Element): Line {
        e;
        return <Line><unknown>null;
    }

    handleOfficialLine(e: Element): Line {
        if (e.tagName !== 'official') throw new Error();

        const name = e.getAttribute('name');
        if (name === null) throw new Error();
        const lineCode: string | null = e.getAttribute('code');

        const key: string = e.getAttribute('key') || name;

        const line = new OfficialLine(name, { code: lineCode });
        this.linesDB.set(key, line);

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
        line.setStations(stations);
        return line;
    }

    async import(url: URL) {
        const srcText = await (await fetch(url.toString())).text();
        const parser = new DOMParser();
        const srcXML = parser.parseFromString(srcText, 'text/xml');

        await this.handleXMLData(srcXML.children[0], url);
    }

    async handleImport(e: Element, baseURL: URL) {
        if (e.tagName !== 'import') throw new Error();

        const src = e.getAttribute('src');
        if (src === null) throw new Error();

        const url: URL = new URL(src, baseURL);
        if (this.visited.has(url.toString())) {
            console.warn(e);
            return;
        }

        this.visited.add(url.toString());
        await this.import(url);
    }

    async handleXMLData(data: Element, baseURL: URL) {
        if (data.tagName !== 'data') throw new Error();

        for (const child of Array.from(data.children)) {
            switch (child.tagName) {
                case 'import':
                    await this.handleImport(child, baseURL);
                    break;

                case 'station':
                    this.handleStation(child);
                    break;

                case 'official':
                    this.handleOfficialLine(child);
                    break;

                case 'route':
                    // this.handleRouteLine(child);
                    break;

                case 'section':
                    this.handleSection(child);
                    break;
            }
        }
    }
}

const a = (line: Line): HTMLElement => {
    const section: HTMLElement = document.createElement('section');

    section.innerHTML = `<h1>${line.name()}</h1>
    <p>区間 : ${line.from().name()} - ${line.to().name()}</p>
    <p>営業キロ : ${line.length()}</p>
    <p>路線記号 : ${line.code()}</p>
    `;

    const table = document.createElement('table');
    for (const station of line.stations()) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${station.code() ? station.code() : ''}</td>
        <td>${station.name()}</td>
        <td>${station.distanceFromStart()}</td>
        <td>${station.isSeasonal() ? '臨時駅' : ''}</td>`
        table.appendChild(tr);
    }
    section.appendChild(table);

    return section;
}

(async () => {
    const handler = new XMLHandler();
    const indexURL = new URL('./sample/index.xml', location.href);
    await handler.import(indexURL);
    console.log(handler);

    const linesDB = handler.linesDB;

    for (const line of linesDB.values()) {
        document.body.appendChild(a(line));
    }
})();
