import { Direction } from "./Direction";
import Station, { StationOnLine } from "./Station";

export default interface Line {
    name(): string;
    code(): string | null;
    color(): string | null;
    length(): number;
    stations(direction?: Direction): IterableIterator<StationOnLine>;
    stationsBetween(from: Station, to: Station, direction?: Direction): IterableIterator<StationOnLine> | null;
    from(): StationOnLine;
    to(): StationOnLine;
    onLineOf(station: Station): StationOnLine | null;
    distanceBetween(from: Station, to: Station): number | null;
    has(station: Station): boolean;
}
