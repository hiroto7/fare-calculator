import Line from "./Line/";
import { Station1, StationSubstance, WritableStation } from "./Station";
import DB, { ReadonlyDB } from "./DB";
import { StationOnLine } from "./StationOnLine";
import StationXMLHandler from "./StationXMLHandler";
import LineXMLHandler from "./LineXMLHandler";
import Code from "./Code";
import { handleLineCodeXML } from "./handleLineCodeXML";

class XMLHandler {
    private visited: Set<string> = new Set();
    private readonly parser = new DOMParser();
    private readonly linesDB: Map<string, Line<StationSubstance>>;
    private readonly stationsDB: Map<string, WritableStation & StationSubstance>;
    private readonly codesDB: Map<string, Code>;
    private readonly stationXMLHandler: StationXMLHandler;
    private readonly lineXMLHandler: LineXMLHandler;

    constructor() {
        const linesDB: ReadonlyMap<string, Line<StationSubstance & WritableStation>> = this.linesDB = new Map();

        const stationsDB: ReadonlyDB<string, WritableStation & StationSubstance, [string?]> =
            this.stationsDB = new DB((key: string, name?: string) => new Station1(name || key));

        const codesDB: ReadonlyMap<string, Code> = this.codesDB = new Map();

        const stationXMLHandler = this.stationXMLHandler = new StationXMLHandler(stationsDB);
        this.lineXMLHandler = new LineXMLHandler({ linesDB, stationsDB, codesDB, stationXMLHandler });
    }

    async import(url: URL) {
        const response = await fetch(url.href);
        if (!response.ok)
            throw new Error(`[${url.href}] を読み込めません。`);
        const srcText = await response.text();
        const srcXML = this.parser.parseFromString(srcText, 'text/xml');

        await this.handleXMLData(srcXML.children[0], url);
    }

    async handleImport(e: Element, baseURL: URL) {
        if (e.tagName !== 'import') throw new Error();

        const src = e.getAttribute('src');
        if (src === null) throw new Error();

        const url: URL = new URL(src, baseURL);
        if (this.visited.has(url.href))
            return;

        this.visited.add(url.href);
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
            } else if (child.tagName === 'code' || child.tagName === 'svgcode') {
                const code: Code = handleLineCodeXML(child, baseURL);
                const key: string = child.getAttribute('key') || code.name;
                this.codesDB.set(key, code);
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

class NamedDirectionsList extends HTMLElement {
    constructor() {
        super();
        const templateId = 'x-named-directions-list-template';
        const template = document.getElementById(templateId);
        if (template === null)
            throw new Error(`#${templateId} が不足しています。`);
        else if (!(template instanceof HTMLTemplateElement))
            throw new Error(`#${templateId} は <template> 要素である必要があります。`);
        this.attachShadow({ mode: 'open' })
            .appendChild(template.content.cloneNode(true));
    }
}

customElements.define('x-named-directions-list', NamedDirectionsList);
declare const document: Document & {
    createElement: (tagName: 'x-named-directions-list', options?: ElementCreationOptions) => NamedDirectionsList;
};

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

            const linesList = document.getElementById('list1')!;
            linesList.textContent = null;

            const map: DB<string, Set<Line<StationSubstance>>> = new DB(_ => new Set);
            for (const line of station.lines()) {
                for (const section of line.sectionsFrom(station)) {
                    const grandchild = section.grandchildren(true).next().value;
                    map.get1(grandchild.name).add(section);
                }
            }

            for (const [name, sections] of map) {
                const directionsList = document.createElement('x-named-directions-list');

                const h1: HTMLHeadingElement = document.createElement('h1');
                h1.appendChild(document.createTextNode(name));
                h1.slot = 'summary';
                directionsList.appendChild(h1);

                let secondaryItemCount = 0;
                for (const section of sections) {
                    const button: HTMLElement = document.createElement('x-line-button');
                    const grandchild = section.grandchildren(true).next().value;
                    {
                        const colors = grandchild.colors();
                        const result = colors.next();
                        if (!result.done) {
                            const color = result.value;
                            button.style.setProperty('--color', color.first);
                            button.style.setProperty('--color2', color.second);
                        }
                    }
                    {
                        const codes = grandchild.codes();
                        const result = codes.next();
                        if (!result.done) {
                            const code = result.value;
                            const symbolsList: HTMLElement = document.createElement('x-symbols-list');
                            const codeSymbol: HTMLElement = code.toHTML();
                            codeSymbol.slot = 'symbol';
                            symbolsList.appendChild(codeSymbol);
                            symbolsList.slot = 'secondary';
                            secondaryItemCount = 1;
                            button.appendChild(symbolsList);
                        }
                    }
                    {
                        const summary = document.createElement('x-line-summary');
                        if (section.name !== name) {
                            const p: HTMLParagraphElement = document.createElement('p');
                            p.appendChild(document.createTextNode(section.name));
                            p.slot = 'summary';
                            summary.appendChild(p);
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
                            summary.appendChild(h1);
                        }
                        summary.slot = 'primary';
                        button.appendChild(summary);
                    }
                    button.slot = 'direction';
                    directionsList.appendChild(button);
                }
                directionsList.style.setProperty('--secondary-item-count', '' + secondaryItemCount);
                directionsList.slot = 'line';
                linesList.appendChild(directionsList);
            }
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
