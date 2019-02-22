export default interface Code {
    readonly name: string;
    toHTML(): HTMLElement;
}

export interface CodeGenerator {
    generate(stationNumber: string): Code;
}

export class SVGCode implements Code {
    constructor(readonly name: string, private readonly url: URL) { }

    toHTML(): HTMLElement {
        const image = document.createElement('img');
        image.src = this.url.href;
        return image;
    }

    toString() { return this.name; }
}

export class TemplateCode implements Code {
    readonly name: string;
    private readonly template: HTMLTemplateElement;
    private readonly lineCodeText: string;
    private readonly stationNumber?: string;

    constructor({ lineCodeName, lineCodeText, stationNumber, template }: {
        lineCodeName: string,
        template: HTMLTemplateElement,
        stationNumber?: string,
        lineCodeText?: string
    }) {
        this.name = lineCodeName + (stationNumber || "");
        this.template = template;
        this.lineCodeText = lineCodeText || name;
        this.stationNumber = stationNumber;
    }

    toHTML(): HTMLElement {
        const div = document.createElement('div');
        {
            const span = document.createElement('span');
            span.textContent = this.lineCodeText;
            span.slot = 'line-code';
            div.appendChild(span);
        }
        if (this.stationNumber !== undefined) {
            const span = document.createElement('span');
            span.textContent = this.stationNumber;
            span.slot = 'station-number';
            div.appendChild(span);
        }

        div.attachShadow({ mode: 'open' })
            .appendChild(this.template.content.cloneNode(true));
        return div;
    }

    toString() { return this.name; }
}

export class TemplateStationCodeGenerator implements CodeGenerator {
    private readonly lineCodeName: string;
    private readonly template: HTMLTemplateElement;
    private readonly lineCodeText: string;

    constructor({ lineCodeName, lineCodeText, template }: {
        lineCodeName: string,
        template: HTMLTemplateElement,
        lineCodeText?: string
    }) {
        this.lineCodeName = lineCodeName;
        this.template = template;
        this.lineCodeText = lineCodeText || name;
    }

    generate(stationNumber: string): TemplateCode {
        return new TemplateCode({
            lineCodeName: this.lineCodeName,
            lineCodeText: this.lineCodeText,
            template: this.template,
            stationNumber
        });
    }
}

/*
export class SimpleStationCode implements Code {
    readonly name: string;

    constructor(lineCode: string, stationNumber: string) {
        this.name = lineCode + stationNumber;
    }

    toHTML(): HTMLElement {
        const span = document.createElement('span');
        span.textContent = this.name;
        return span;
    }

    toString() { return this.name; }
}

export class SimpleStationCodeGenerator implements CodeGenerator {
    constructor(private readonly lineCode: string) { }

    generate(stationNumber: string): SimpleStationCode {
        return new SimpleStationCode(this.lineCode, stationNumber);
    }
}
*/