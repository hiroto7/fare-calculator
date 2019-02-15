import { Direction } from "../Direction";
import Station from "../Station";
import { StationOnLine } from "../StationOnLine";

export { default as AbstractLine1 } from './AbstractLine1';
export { default as OfficialLine } from './OfficialLine';
export { default as RouteLine } from './RouteLine';
export { default as Section } from './Section';

export default interface Line {
    readonly name: string;
    // color(): string | null;
    readonly code: string | null | undefined;
    readonly from: StationOnLine;
    readonly to: StationOnLine;
    codes(direction?: Direction): IterableIterator<string>;
    stations(direction?: Direction): IterableIterator<StationOnLine>;
    length(): number;
    distanceBetween(from: Station, to: Station, direction: Direction): number | null;
    onLineOf(station: Station): StationOnLine | null;
    codeOf(station: Station): string | null | undefined;
    codesOf(station: Station): IterableIterator<string>;
    sectionBetween(from: Station, to: Station, direction: Direction): Line;
    sectionsFrom(station: Station): IterableIterator<Line>;
    grandchildren(hidesVia?: boolean): IterableIterator<Line>;
}
