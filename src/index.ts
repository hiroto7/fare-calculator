import { Direction } from "./Direction";
import Line from "./Line";
import { OfficialLine } from "./OfficialLine";
import { Section } from "./Section";
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

        const section: Section = new Section({ line, direction, from, to });

        const name: string | null = e.getAttribute('name');
        if (name !== null) {
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

        const key: string = e.getAttribute('key') || name;
        const line = new OfficialLine(name);
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
            const code = stationXML.getAttribute('code');

            stations.push({ substance, distanceFromStart, code });
        }
        line.setStations(stations);
        return line;
    }

    async handleImport(e: Element, baseURL: URL) {
        if (e.tagName !== 'import') throw new Error();

        const src = e.getAttribute('src');
        if (src === null) throw new Error();

        const url: URL = new URL(src, baseURL);
        const srcText = await (await fetch(url.toString())).text();
        const parser = new DOMParser();
        const srcXml = parser.parseFromString(srcText, 'text/xml');
        console.log(srcXml);

        await this.handleXMLData(srcXml.children[0], baseURL);
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
                    this.handleRouteLine(child);
                    break;

                case 'section':
                    this.handleSection(child);
                    break;
            }
        }
    }
}

(async () => {
    const indexXML = new URL('./sample/index.xml', location.href);
    const text = await (await fetch(indexXML.toString())).text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    console.log(xml);

    const handler = new XMLHandler();
    await handler.handleXMLData(xml.children[0], indexXML);
    console.log(handler);

    const linesDB = handler.linesDB;
    console.log(linesDB.get('上野東京ライン')!.stations())
    console.log([...linesDB.get('上野東京ライン')!.stations()])
})();
