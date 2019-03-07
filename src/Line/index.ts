import Code from "../Code";
import ColorPair from "../ColorPair";
import { Direction } from "../Direction";
import Station from "../Station";
import { StationOnLine } from "../StationOnLine";

export { default as AbstractLine1 } from './AbstractLine1';
export { default as OfficialLine } from './OfficialLine';
export { default as RouteLine } from './RouteLine';
export { default as Section } from './Section';

export default interface Line {
    readonly name: string;
    readonly color: ColorPair | null | undefined;
    readonly code: Code | null | undefined;
    readonly from: StationOnLine;
    readonly to: StationOnLine;
    colors(direction?: Direction): IterableIterator<ColorPair>;
    codes(direction?: Direction): IterableIterator<Code>;
    stations(direction?: Direction): IterableIterator<StationOnLine>;
    length(): number;
    distanceBetween(from: Station, to: Station, direction: Direction): number | null;
    onLineVersionOf(station: Station): StationOnLine | null;
    onLineVersionsOf(station: Station): IterableIterator<StationOnLine>;
    codeOf(station: Station): string | null | undefined;
    codesOf(station: Station): IterableIterator<string>;
    sectionBetween(from: Station, to: Station, direction: Direction): Line;
    sectionsFrom(station: Station): IterableIterator<Line>;
    grandchildren(hidesVia?: boolean): IterableIterator<Line>;
    equals(line: Line): boolean;
    contains(line: Line): boolean;
    // isContainedIn(line:Line):boolean;
    minimize(): Line;
    hasChildren(): this is LineWithChildren;
    indexOf(station: Station): number | null;
}

export interface LineWithChildren extends Line {
    hasChildren(): true;
    children(): IterableIterator<Line>;
}