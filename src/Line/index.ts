import { Direction } from "../Direction";
import Station, { StationSubstance } from "../Station";
import { StationOnLine } from "../StationOnLine";

export { default as AbstractLine1 } from './AbstractLine1';
export { default as OfficialLine } from './OfficialLine';
export { default as RouteLine } from './RouteLine';
export { default as Section } from './Section';

export default interface Line<SS extends StationSubstance> {
    readonly name: string;
    readonly color: string | null | undefined;
    readonly code: string | null | undefined;
    readonly from: StationOnLine<SS>;
    readonly to: StationOnLine<SS>;
    colors(direction?: Direction): IterableIterator<string>;
    codes(direction?: Direction): IterableIterator<string>;
    stations(direction?: Direction): IterableIterator<StationOnLine<SS>>;
    length(): number;
    distanceBetween(from: Station, to: Station, direction: Direction): number | null;
    onLineVersionOf(station: Station): StationOnLine<SS> | null;
    onLineVersionsOf(station: Station): IterableIterator<StationOnLine<SS>>;
    codeOf(station: Station): string | null | undefined;
    codesOf(station: Station): IterableIterator<string>;
    sectionBetween(from: Station, to: Station, direction: Direction): Line<SS>;
    sectionsFrom(station: Station): IterableIterator<Line<SS>>;
    grandchildren(hidesVia?: boolean): IterableIterator<Line<SS>>;
}
