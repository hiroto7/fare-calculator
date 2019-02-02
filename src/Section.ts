import { Direction } from "./Direction";
import Line from "./Line";
import RouteLine from "./RouteLine";
import Station from "./Station";

export default class Section extends RouteLine {
    private readonly line: Line;

    constructor({ name, code, line, from, to, direction, stationCodesMap }: {
        name?: string,
        code?: string | null,
        stationCodesMap?: Iterable<[Station, string | null]>
        line: Line,
        from: Station,
        to: Station,
        direction: Direction
    }) {
        super({
            name: name === undefined ? line.name() : name,
            code: code === undefined ? line.code() : code,
            children: line.childrenBetween(from, to, direction),
            stationCodesMap
        });
        this.line = line;
    }

    codeOf(station: Station): string | null | undefined {
        const code = super.codeOf(station);
        if (code === undefined)
            return this.line.codeOf(station);
        else
            return code;
    }
}