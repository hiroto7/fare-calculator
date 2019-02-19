import { ReadonlyDB } from "./DB";
import { WritableStation, StationSubstance } from "./Station";

export default class StationXMLHandler {
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
