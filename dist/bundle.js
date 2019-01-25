/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/Direction.ts":
/*!**************************!*\
  !*** ./src/Direction.ts ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Direction;
(function (Direction) {
    Direction[Direction["inbound"] = -1] = "inbound";
    Direction[Direction["outbound"] = 1] = "outbound";
})(Direction = exports.Direction || (exports.Direction = {}));


/***/ }),

/***/ "./src/OfficialLine.ts":
/*!*****************************!*\
  !*** ./src/OfficialLine.ts ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Direction_1 = __webpack_require__(/*! ./Direction */ "./src/Direction.ts");
const ReverseIterator_1 = __webpack_require__(/*! ./ReverseIterator */ "./src/ReverseIterator.ts");
const Station_1 = __webpack_require__(/*! ./Station */ "./src/Station.ts");
class OfficialLine {
    constructor(name, { code = null, color = null } = {}) {
        this.rawName = name;
        this.rawCode = code;
        this.rawColor = color;
    }
    setStations(stations) {
        const rawStations = [];
        const stationsOnLineMap = new Map();
        for (const station of stations) {
            const stationOnLine = new StationOnOfficialLine({ line: this, ...station });
            rawStations.push(stationOnLine);
            stationsOnLineMap.set(station.substance, stationOnLine);
        }
        this.rawStations = rawStations;
        this.stationsOnLineMap = stationsOnLineMap;
    }
    name() {
        return this.rawName;
    }
    code() {
        return this.rawCode;
    }
    color() {
        return this.rawColor;
    }
    stations(direction = Direction_1.Direction.outbound, { from, to } = {}) {
        if (this.rawStations === undefined)
            throw new Error();
        let array;
        if (from === undefined && to === undefined) {
            array = this.rawStations;
        }
        else {
            let fromOnLine;
            let toOnLine;
            if (from === undefined) {
                fromOnLine = this.from();
            }
            else {
                let fromOnLine1 = this.onLineOf(from);
                if (fromOnLine1 === null)
                    return null;
                fromOnLine = fromOnLine1;
            }
            if (to === undefined) {
                toOnLine = this.to();
            }
            else {
                let toOnLine1 = this.onLineOf(to);
                if (toOnLine1 === null)
                    return null;
                toOnLine = toOnLine1;
            }
            let fromIndex = this.rawStations.indexOf(fromOnLine);
            let toIndex = this.rawStations.indexOf(toOnLine);
            if (fromIndex < 0)
                throw new Error();
            if (toIndex < 0)
                throw new Error();
            if (direction * fromIndex > direction * toIndex)
                return null;
            array = this.rawStations.slice(fromIndex, toIndex + 1);
        }
        if (direction === Direction_1.Direction.outbound)
            return array[Symbol.iterator]();
        else
            return new ReverseIterator_1.default(array);
    }
    from() {
        if (this.rawStations === undefined)
            throw new Error();
        return this.rawStations[0];
    }
    to() {
        if (this.rawStations === undefined)
            throw new Error();
        return this.rawStations[this.rawStations.length - 1];
    }
    length() {
        const length = this.distance(this.from(), this.to());
        if (length === null)
            throw new Error();
        return length;
    }
    onLineOf(station) {
        if (this.stationsOnLineMap === undefined)
            throw new Error();
        return this.stationsOnLineMap.get(station.substance()) || null;
    }
    distance(station1, station2) {
        const station1OnLine = this.onLineOf(station1);
        const station2OnLine = this.onLineOf(station2);
        if (station1OnLine === null || station2OnLine === null)
            return null;
        const d1 = station1OnLine.distanceFromStart;
        const d2 = station2OnLine.distanceFromStart;
        return d1 === null || d2 === null ? null : d2 - d1;
    }
    has(station) {
        return this.onLineOf(station) !== null;
    }
}
exports.OfficialLine = OfficialLine;
class StationOnOfficialLine extends Station_1.StationOnLine1 {
    constructor({ line, substance, distanceFromStart, code = null }) {
        super({ line, substance, code });
        this.distanceFromStart = distanceFromStart;
    }
}


/***/ }),

/***/ "./src/ReverseIterator.ts":
/*!********************************!*\
  !*** ./src/ReverseIterator.ts ***!
  \********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class ReverseIterator {
    constructor(array) {
        this.array = array;
        this.index = array.length;
    }
    next() {
        if (this.index <= 0) {
            return {
                done: true,
                value: undefined
            };
        }
        else {
            this.index--;
            return {
                done: false,
                value: this.array[this.index]
            };
        }
    }
    [Symbol.iterator]() {
        return this;
    }
}
exports.default = ReverseIterator;


/***/ }),

/***/ "./src/Section.ts":
/*!************************!*\
  !*** ./src/Section.ts ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Direction_1 = __webpack_require__(/*! ./Direction */ "./src/Direction.ts");
const Station_1 = __webpack_require__(/*! ./Station */ "./src/Station.ts");
class Section {
    constructor({ line, direction, from, to, stations = [] }) {
        this.line = line;
        this.direction = direction;
        this.rawFrom = from;
        this.rawTo = to;
        this.stationsOnLineMap = new Map();
        for (const station of stations) {
            this.stationsOnLineMap.set(station.substance, new Station_1.StationOnLine1({ line: this, ...station }));
        }
    }
    from() {
        let from;
        if (this.rawFrom !== undefined)
            from = this.rawFrom.on(this);
        else if (this.direction === Direction_1.Direction.outbound)
            from = this.line.from().on(this);
        else
            from = this.line.to().on(this);
        if (from === null)
            throw new Error();
        return from;
    }
    to() {
        let to;
        if (this.rawTo !== undefined)
            to = this.rawTo.on(this.line);
        else if (this.direction === Direction_1.Direction.outbound)
            to = this.line.to();
        else
            to = this.line.from();
        if (to === null)
            throw new Error();
        return to;
    }
    name() {
        return this.line.name();
    }
    code() {
        return this.line.code();
    }
    color() {
        return this.line.color();
    }
    length() {
        const length = this.line.distance(this.from(), this.to());
        if (length === null)
            throw new Error();
        return this.direction * length;
    }
    stations(direction = Direction_1.Direction.outbound, { from, to } = {}) {
        const stations = this.line.stations(direction, { from: this.from(), to: this.to() });
        if (stations === null) {
            if (from === undefined && to === undefined)
                throw new Error();
            return null;
        }
        return new SectionIterator(this, stations);
    }
    onLineOf(station) {
        const substance = station.substance();
        let onLine = this.stationsOnLineMap.get(substance);
        if (onLine === undefined) {
            if (!new Set(this.stations()).has(station.on(this.line)))
                return null;
            onLine = new Station_1.StationOnLine1({ line: this, substance, code: null });
            this.stationsOnLineMap.set(substance, onLine);
        }
        return onLine;
    }
    distance(station1, station2) {
        if (!this.has(station1) || !this.has(station2))
            return null;
        return this.line.distance(station1, station2);
    }
    has(station) {
        return station.on(this) !== null;
    }
}
exports.Section = Section;
class SectionIterator {
    constructor(line, iterator) {
        this.line = line;
        this.iterator = iterator;
    }
    next() {
        const result = this.iterator.next();
        if (result.done) {
            return {
                done: true,
                value: undefined
            };
        }
        else {
            const value = result.value.on(this.line);
            if (value === null)
                throw Error();
            return { done: false, value };
        }
    }
    [Symbol.iterator]() { return this; }
}


/***/ }),

/***/ "./src/Station.ts":
/*!************************!*\
  !*** ./src/Station.ts ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
class Station1 {
    constructor(name) {
        this.isSubstance = true;
        this.rawIsSeasonal = false;
        this.rawLines = new Set();
        this.stationsOnLines = new Map();
        this.rawName = name;
    }
    name() {
        return this.rawName;
    }
    lines() {
        return this.rawLines[Symbol.iterator]();
    }
    isSeasonal() {
        return this.rawIsSeasonal;
    }
    on(line) {
        // return this.stationsOnLines.get(line) || null;
        return line.onLineOf(this);
    }
    substance() {
        return this;
    }
    add(line, onLine) {
        this.rawLines.add(line);
        this.stationsOnLines.set(line, onLine);
    }
    setOptions({ isSeasonal }) {
        if (isSeasonal !== undefined)
            this.rawIsSeasonal = isSeasonal;
    }
}
exports.Station1 = Station1;
class StationOnLine1 {
    constructor({ line, substance, code = null }) {
        this.rawLine = line;
        this.rawSubstance = substance;
        this.rawCode = code;
    }
    name() { return this.substance().name(); }
    lines() { return this.substance().lines(); }
    isSeasonal() { return this.substance().isSeasonal(); }
    substance() { return this.rawSubstance; }
    code() { return this.rawCode; }
    line() { return this.rawLine; }
    on(line) {
        if (line === this.line())
            return this;
        else
            return this.substance().on(line);
    }
}
exports.StationOnLine1 = StationOnLine1;
/*
import Line from "./Line";

export default interface Station {
    name(): string;
    center(): StationCenter;
    lines(): IterableIterator<Line>;
    onLine(line: Line): StationOnLine;
}

export interface Station2 extends Station {

}
*/
/* ex: 東京駅．乗り入れ路線は東海道線，宇都宮線，京浜東北線… */
/*
export class StationCenter implements Station {
    private rowName: string;

    constructor(name: string) {
        this.rowName = name;
    }

    name(): string {
        return this.rowName;
    }

    center(): this {
        return this;
    }

    onLine(line: Line): StationOnLine {

    }
}
*/
/* ex: 東海道線の東京駅 */
/*
export class StationOnLine implements Station2 {
    public readonly line: Line;


    constructor(
        line: Line,
        private readonly rowCenter: StationCenter,
        private readonly rowName?: string) {

    }

    name(): string {
        if (this.rowName === undefined)
            return this.center().name();
        else
            return this.rowName;
    }

    center(): StationCenter {
        return this.rowCenter;
    }

    onLine(line: Line): StationOnLine {
        if (line === this.line)
            return this;
        else
            return this.center().onLine(line);
    }
}
*/ 


/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
const Direction_1 = __webpack_require__(/*! ./Direction */ "./src/Direction.ts");
const OfficialLine_1 = __webpack_require__(/*! ./OfficialLine */ "./src/OfficialLine.ts");
const Section_1 = __webpack_require__(/*! ./Section */ "./src/Section.ts");
const Station_1 = __webpack_require__(/*! ./Station */ "./src/Station.ts");
class StationsDB {
    constructor() {
        this.map = new Map();
    }
    get(name, key) {
        key = key || name;
        const station = this.map.get(key);
        if (station === undefined) {
            const station = new Station_1.Station1(name);
            this.map.set(key, station);
            return station;
        }
        else {
            return station;
        }
    }
}
class XMLHandler {
    constructor() {
        this.linesDB = new Map();
        this.stationsDB = new StationsDB();
    }
    handleStation(e) {
        if (e.tagName !== 'station')
            throw new Error();
        const name = e.getAttribute('name');
        if (name === null)
            throw new Error();
        const key = e.getAttribute('key') || name;
        const isSeasonal = e.hasAttribute('seasonal');
        const station = this.stationsDB.get(key);
        station.setOptions({ isSeasonal });
        return station;
    }
    handleSection(e) {
        if (e.tagName !== 'section')
            throw new Error();
        const lineKey = e.getAttribute('line');
        if (lineKey === null)
            throw new Error();
        const directionString = e.getAttribute('direction');
        if (directionString === null)
            throw new Error();
        if (directionString !== '+' && directionString !== '-')
            throw new Error();
        const direction = directionString === '+' ? Direction_1.Direction.outbound : Direction_1.Direction.inbound;
        const line = this.linesDB.get(lineKey);
        if (line === undefined)
            throw new Error();
        const fromKey = e.getAttribute('from');
        const toKey = e.getAttribute('to');
        const from = fromKey === null ? undefined : this.stationsDB.get(fromKey);
        const to = toKey === null ? undefined : this.stationsDB.get(toKey);
        const section = new Section_1.Section({ line, direction, from, to });
        const name = e.getAttribute('name');
        if (name !== null) {
            const key = e.getAttribute('key') || name;
            this.linesDB.set(key, section);
        }
        return section;
    }
    handleRouteLine(e) {
        e;
        /*
        if (e.tagName !== 'route') throw new Error();

        const stations: StationOnLine[] = [];
        for (const child of Array.from(e.children)) {
            switch (child.tagName) {
                case 'station':
                    const substance = this.handleStation(child);
                    stations.push(substance);
                    break;
                case 'section':
                    break;
            }
        }
        */
        return null;
    }
    handleOfficialLine(e) {
        if (e.tagName !== 'official')
            throw new Error();
        const name = e.getAttribute('name');
        if (name === null)
            throw new Error();
        const key = e.getAttribute('key') || name;
        const line = new OfficialLine_1.OfficialLine(name);
        this.linesDB.set(key, line);
        const stations = [];
        for (const stationXML of Array.from(e.children)) {
            if (stationXML.tagName !== 'station')
                continue;
            const substance = this.handleStation(stationXML);
            const distanceFromStartString = stationXML.getAttribute('distance');
            const distanceFromStart = distanceFromStartString === null ? null : +distanceFromStartString;
            const code = stationXML.getAttribute('code');
            stations.push({ substance, distanceFromStart, code });
        }
        line.setStations(stations);
        return line;
    }
    async handleImport(e, baseURL) {
        if (e.tagName !== 'import')
            throw new Error();
        const src = e.getAttribute('src');
        if (src === null)
            throw new Error();
        const url = new URL(src, baseURL);
        const srcText = await (await fetch(url.toString())).text();
        const parser = new DOMParser();
        const srcXml = parser.parseFromString(srcText, 'text/xml');
        console.log(srcXml);
        await this.handleXMLData(srcXml.children[0], baseURL);
    }
    async handleXMLData(data, baseURL) {
        if (data.tagName !== 'data')
            throw new Error();
        for (const child of Array.from(data.children)) {
            switch (child.tagName) {
                case 'import':
                    await this.handleImport(child, baseURL);
                    break;
                case 'station':
                    this.handleStation(child);
                    break;
                case 'official':
                    this.handleOfficialLine(child);
                    break;
                case 'route':
                    this.handleRouteLine(child);
                    break;
                case 'section':
                    this.handleSection(child);
                    break;
            }
        }
    }
}
(async () => {
    const indexXML = new URL('./sample/index.xml', location.href);
    const text = await (await fetch(indexXML.toString())).text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    console.log(xml);
    const handler = new XMLHandler();
    await handler.handleXMLData(xml.children[0], indexXML);
    console.log(handler);
})();


/***/ })

/******/ });
//# sourceMappingURL=bundle.js.map