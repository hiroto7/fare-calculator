import Code, { SVGCode, TemplateCode } from "./Code";

export const handleLineCodeXML = (e: Element, baseURL: URL): Code => {
    const lineCodeName: string | null = e.getAttribute('name');
    if (lineCodeName === null)
        throw new Error('name 属性を省略することはできません。');

    switch (e.tagName) {
        case 'svgcode':
            const src: string | null = e.getAttribute('src');
            if (src === null)
                throw new Error('src 属性を省略することはできません。');
            return new SVGCode(lineCodeName, new URL(src, baseURL));
        case 'code':
            const lineCodeText: string | undefined = e.getAttribute('text') || undefined;

            const templateId = e.getAttribute('template');
            if (templateId === null)
                throw new Error('template 属性を省略することはできません。');

            const template = document.getElementById(templateId);
            if (template === null)
                throw new Error(`#${templateId} が見つかりません。`);
            else if (!(template instanceof HTMLTemplateElement))
                throw new Error(`#${templateId} は <template> 要素である必要があります。`);

            return new TemplateCode({ lineCodeName, lineCodeText, template });

        default:
            throw new Error('このメソッドの引数は <code>, <svgcode> のいずれかの要素である必要があります。');
    }
}