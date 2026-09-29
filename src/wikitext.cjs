/**
 * @file
 * wikitext generator
 */

const fs = require("fs");
const path = require("path");

const { CANON_PARAMS } = require("./scraper.cjs");

const DIR = path.join(path.dirname(__dirname), "templates");

/**@type {Readonly<Record<string, Template>>} */
let templateIndex = {};
let indexing = false;

/**
 * @typedef LinkedDef
 * @type {{name:string,display?:string,multiline?:boolean,default?:string,"ro-if-udf"?:string[],"nd-if-udf"?:string[],"nd-if-def"?:string[],values?:string[]}}
 */

class TemplateParameter {
    /**
     * the type of this parameter
     * @type {"canon"|"scraped"|"linked"|"user"}
     */
    #type;
    /**
     * the name of this parameter
     * @type {string}
     */
    #name;
    /**
     * @param {"canon"|"scraped"|"linked"|"user"} type the type of parameter
     * @param {string} name parameter name (or scraper spec)
     */
    constructor(type, name) {
        this.#type = type;
        this.#name = name;
    }
    get name() {
        return this.#name;
    }
    get type() {
        return this.#type;
    }
}

class Template {
    /**@type {LinkedDef[]} */
    #linkedDefs;
    /**@type {(string|TemplateParameter)[][]} */
    #lines;
    /**@type {string} */
    #name;
    /**
     * a wikitext template
     * @param {string} name
     */
    constructor(name) {
        if (!indexing) throw new Error("cannot parse templates outside of template indexing");
        let lines = fs.readFileSync(path.join(DIR, name, "template.txt"), {"encoding":"ascii"}).split("\n").map((v,i)=>[v,i]).filter(v => !v[0].startsWith("!!"));
        lines = lines.slice(lines.findIndex(v => v[0].length), lines.findLastIndex(v => v[0].length)+1);
        /**@type {LinkedDef[]} */
        this.#linkedDefs = fs.existsSync(path.join(DIR, name, "params.json")) ? JSON.parse(fs.readFileSync(path.join(DIR, name, "params.json"), {"encoding":"ascii"})).params : [];
        this.#lines = lines.map(v => this.#parseLine(v[0], v[1]));
        this.#name = name;
    }
    /**
     * fills out the template
     * @param {{canon:(name:string)=>string,scraped:(spec:string)=>string,user:(name:string,defaultvalue:string|null,values:string[]|null,multiline:boolean?)=>Promise<string|null>}} params a parameter provider
     * @returns {Promise<string>}
     */
    async fill(params) {
        /**@type {Record<string,string|null>} */
        const resolvedLinked = {};
        /**
         * @param {TemplateParameter} param
         */
        const resolve = async (param) => {
            switch (param.type) {
                case "canon": {
                    return params.canon(param.name);
                }
                case "scraped": {
                    return params.scraped(param.name);
                }
                case "user": {
                    return await params.user(param.name, null);
                }
                case "linked": {
                    const linkdef = this.#linkedDefs.find(v => v.name === param.name);
                    // console.log(param.name);
                    // console.log(linkdef);
                    // console.log(resolvedLinked);
                    // await new Promise(r => setTimeout(r, 10));
                    let adefault = false;
                    if (typeof linkdef.default === "string") {
                        adefault = true;
                        if (linkdef["ro-if-udf"]?.every(v => !(v in resolvedLinked && resolvedLinked[v] !== null))) {
                            resolvedLinked[param.name] = null;
                            return linkdef.default;
                        }
                        if (linkdef["nd-if-udf"]?.some(v => !(resolvedLinked[v]))) {
                            adefault = false;
                        }
                        if (linkdef["nd-if-def"]?.some(v => (resolvedLinked[v] ?? null) !== null)) {
                            adefault = false;
                        }
                    }
                    const val = await params.user(linkdef.display??param.name, adefault?linkdef.default:null, linkdef.values??null,linkdef.multiline);
                    resolvedLinked[param.name] = val;
                    if (val === null) {
                        return linkdef.default;
                    }
                    return val;
                }
                default: {
                    throw new Error(`unexpected template parameter type: '${param.type}'`);
                }
            }
        };
        const lines = [];
        for (const l of this.#lines) {
            const line = [];
            for (const v of l) {
                if (v instanceof TemplateParameter) {
                    line.push(await resolve(v));
                } else {
                    line.push(v);
                }
            }
            lines.push(line.join(''));
        }
        return lines.join("\n")+"\n\n";
    }
    get name() {
        return this.#name;
    }
    /**
     * @param {string} line
     * @param {number} lineno
     * @returns {(string|TemplateParameter)[]}
     */
    #parseLine(line, lineno) {
        return line.split("{").flatMap(v => v.split("}")).map((v, i) => i%2?this.#parseParam(v, lineno, (i+1)/2):v);
    }
    /**
     * @param {string} param
     * @param {number} lineno
     * @param {number} paramno
     * @returns {TemplateParameter}
     */
    #parseParam(param, lineno, paramno) {
        const error = (text) => {throw new Error(`Line ${lineno} Parameter ${paramno}: ${text}`);};
        if (param.length === 0) error("empty parameter");
        switch (param[0]) {
            case "=": {
                if (param.length <= 1) error("empty parameter");
                if (param[1] === "!") {
                    if (param.length <= 2) error("empty parameter");
                    error("raw scraped parameters not supported yet");
                } else {
                    const name = param.slice(1);
                    if (!(name in CANON_PARAMS)) {
                        error(`'${name}' is not a canon parameter`);
                    }
                    return new TemplateParameter("canon", name);
                }
            }
            case "-": {
                if (param.length <= 1) error("empty parameter");
                const name = param.slice(1);
                if (this.#linkedDefs.findIndex(v => v.name === name) === -1) {
                    error(`'${name}' has no linked definition`);
                }
                return new TemplateParameter("linked", name);
            }
            default: {
                return new TemplateParameter("user", param);
            }
        }
    }
}

function indexTemplates() {
    let index = {};
    indexing = true;
    try {
        for (const dir of fs.readdirSync(DIR, {"withFileTypes":true})) {
            if (dir.isDirectory() && fs.existsSync(path.join(DIR, dir.name, "template.txt"))) {
                try {
                    index[dir.name] = new Template(dir.name);
                } catch (E) {
                    console.log(`Failed to parse template ${dir.name}:\n${E}`);
                }
            }
        }
        // console.log(index);
    } finally {
        indexing = false;
    }
    templateIndex = Object.freeze(index);
}

function _templateIndex() {
    return templateIndex;
}

function exec(line) {
    return eval(line);
}

exports.exec = exec;
exports.templateIndex = _templateIndex;
exports.indexTemplates = indexTemplates;
exports.Template = Template;
