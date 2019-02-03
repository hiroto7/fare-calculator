import { Direction } from "./Direction";
import Station from "./Station";
import { StationOnLine } from "./StationOnLine";

export default interface Line {
    name(): string;
    // color(): string | null;
    code(): string | null | undefined;
    codes(direction?: Direction): IterableIterator<string>;
    stations(direction?: Direction): IterableIterator<StationOnLine>;
    // stationsBetween(from: Station, to: Station, direction: Direction): IterableIterator<StationOnLine>;
    length(): number;
    distanceBetween(from: Station, to: Station, direction: Direction): number | null;
    from(): StationOnLine;
    to(): StationOnLine;
    onLineOf(station: Station): StationOnLine | null;
    codeOf(station: Station): string | null | undefined;
    codesOf(station: Station): IterableIterator<string>;
    // has(station: Station): boolean;
    // childrenBetween(from: Station, to: Station, direction: Direction): IterableIterator<Line>;
    sectionBetween(from: Station, to: Station, direction: Direction): Line;
}
