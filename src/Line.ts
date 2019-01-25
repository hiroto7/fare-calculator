import { Direction } from "./Direction";
import Station, { StationOnLine } from "./Station";

export default interface Line {
    name(): string;
    code(): string | null;
    color(): string | null;
    length(): number;
    stations(direction?: Direction): IterableIterator<StationOnLine>
    stations(direction: Direction, { from, to }: { from?: Station, to?: Station }): IterableIterator<StationOnLine> | null;
    from(): StationOnLine;
    to(): StationOnLine;
    onLineOf(station: Station): StationOnLine | null;
    distance(station1: Station, station2: Station): number | null;
    has(station: Station): boolean;
}
