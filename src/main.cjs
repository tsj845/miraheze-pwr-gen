const rl = require("readline");
const fs = require("fs");
const path = require("path");
const wikitext = require("./wikitext.cjs");
const scraper = require("./scraper.cjs");
const help = require("./help.cjs");

const DIR = path.dirname(__dirname);

if (!fs.existsSync(path.join(DIR, "wikitext"))) {
    fs.mkdirSync(path.join(DIR, "wikitext"));
}

/**
 * @param {string} target
 * @param {string} data
 */
function writeTemplateOutput(target, data) {
    const p = path.join(DIR, "wikitext", target);
    fs.appendFileSync(p, data, {"encoding":"utf-8"});
}


class Interface {
    static #interface = rl.createInterface(process.stdin, process.stdout, this.completer);
    /**@type {string[]} */
    static #completions = [];
    /**@type {string | null} */
    static #default = null;
    /**@type {wikitext.Template | null} */
    static #template = null;
    /**@type {string | null} */
    static #output = null;
    /**@type {"command"|"param"|"repl"|"template"} */
    static #state = "command";
    /**@type {"main"|"help"|"wiki"|"scrape"} */
    static #replcontext = "main";
    static #targetfile = "wikitext.txt";
    /**
     * prompts the user to fill a template value
     * @param {string} name
     * @param {string | null} defaultvalue
     * @param {string[] | null} values
     * @param {boolean} multiline
     * @returns {Promise<string | null>}
     */
    static async query(name, defaultvalue, values, multiline) {
        const state = this.#state;
        this.#state = "param";
        this.#completions = (values ?? []).concat(defaultvalue !== null ? [defaultvalue] : []);
        this.#default = defaultvalue;
        const P = this.#interface.getPrompt();
        let res;
        try {
            if (multiline) this.#interface.setPrompt("");
            res = await new Promise(async r => {
                const pos = this.#interface.getCursorPos();
                const prompt = async () => {
                    // await new Promise(r2 => rl.cursorTo(process.stdout, pos.cols, pos.rows, r2));
                    // await new Promise(r2 => rl.clearScreenDown(process.stdout, r2));
                    this.#interface.write(`${name}${defaultvalue!==null?' ('+defaultvalue+')':''}:\n`);
                    /**@type {string[]} */
                    const data = [];
                    /**
                     * @param {string} input
                     */
                    const validate = (input) => {
                        input = input.trim();
                        if (input.length === 0) {
                            if (defaultvalue !== null) r(null);
                            else prompt();
                        } else {
                            if (values) {
                                if (input !== defaultvalue && !values.includes(input)) {
                                    if (input === defaultvalue) r(null);
                                    else prompt();
                                } else {
                                    r(input);
                                }
                            } else {
                                r(input);
                            }
                        }
                    };
                    /**
                     * @param {string} input
                     */
                    const online = (input) => {
                        input = input.trim();
                        if (multiline) {
                            if (input === ".stop") {
                                validate(data.join("\n"));
                            } else {
                                data.push(input);
                                this.#interface.once("line", online);
                            }
                        } else {
                            validate(input);
                        }
                    };
                    this.#interface.once("line", online);
                };
                prompt();
            });
        } finally {
            this.#completions = [];
            this.#default = null;
            this.#state = state;
            this.#interface.setPrompt(P);
        }
        return res;
    }
    /**
     * @param {string} line
     * @returns {import("readline").CompleterResult}
     */
    static completer(line) {
        const that = Interface;
        switch (that.#state) {
            case "param": {
                const completions = that.#completions.filter(v => v.startsWith(line));
                return [completions.length ? completions : that.#completions, line];
            }
            case "command": {
                //
            }
            default: {
                return [[], line];
            }
        }
    }
    /**
     * convenience to get a line of input
     * @returns {Promise<string>}
     */
    static #line() {
        return new Promise(r => {this.#interface.once("line", (input) => {r(input.trim());});});
    }
    /**
     * main interface loop
     * @returns {never}
     */
    static async mainLoop() {
        wikitext.indexTemplates();
        if ("default" in wikitext.templateIndex()) {
            this.#template = wikitext.templateIndex()["default"];
        }
        while (true) {
            this.#interface.prompt();
            const command = (await this.#line()).split(" ");
            switch (this.#state) {
                // do repl things
                case "repl": {
                    const line = command.join(" ");
                    if (line === "exit") {
                        this.#state = "command";
                        break;
                    }
                    const func = {"main":eval,"help":help.exec,"wiki":wikitext.exec,"scrape":scraper.exec}[this.#replcontext];
                    try {
                        console.log(func(line));
                    } catch (E) {
                        console.error(E);
                    }
                    break;
                }
                // do template things
                case "template": {
                    break;
                }
                // do command things
                case "command": {
                    switch (command[0]) {
                        case "quit": {
                            process.exit(0);
                        }
                        case "version": {
                            console.log(`Miraheze Practice WikiRequest Utility ${help.VERSION}\nAuthored by Tristan S (@tsj845 on GitHub) (@person0192837465 on wiki)`);
                            break;
                        }
                        case "help": {
                            console.log(help.getHelp(command.slice(1)));
                            break;
                        }
                        case "templ": {
                            switch (command[1]) {
                                case "list": {
                                    console.log(Object.keys(wikitext.templateIndex()).map(v => (v===this.#template.name?"* ":"  ")+v).join("\n"));
                                    break;
                                }
                                case "index": {
                                    wikitext.indexTemplates();
                                    break;
                                }
                                case "pick": {
                                    if (command[2] in wikitext.templateIndex()) {
                                        this.#template = wikitext.templateIndex()[command[2]];
                                    } else {
                                        console.log(`template ${command[2]} not found`);
                                    }
                                    break;
                                }
                                default: {
                                    console.log("unknown template command");
                                    break;
                                }
                            }
                            break;
                        }
                        case "review": {
                            if (!command[1]) {
                                console.log("must provide a target");
                                break;
                            }
                            if (!(/(Special:RequestWikiQueue\/)?[0-9]{5,7}/.test(command[1]))) {
                                console.log("invalid target");
                                break;
                            }
                            let target = command[1];
                            if (!target.startsWith("Special:RequestWikiQueue/")) {
                                target = "Special:RequestWikiQueue/" + target;
                            }
                            const scrape = await scraper.Scraper.create(target);
                            if (scrape instanceof Error) {
                                console.log("failed to scrape data");
                                console.log(scrape.message);
                                break;
                            }
                            function canon(name) {return scrape.getCanonParam(name);};
                            function scraped(spec) {return scrape.getScrapedValue(spec);};
                            async function user(...args) {return await Interface.query(...args)};
                            const text = await this.#template.fill({canon, scraped, user});
                            writeTemplateOutput(this.#targetfile, text);
                            break;
                        }
                        case "dbg": {
                            switch (command[1]) {
                                case "help": {
                                    switch (command[2]) {
                                        case "reindex": {
                                            help.reindex();
                                            break;
                                        }
                                        default: {
                                            console.log("unknown help debug command");
                                            break;
                                        }
                                    }
                                    break;
                                }
                                case "repl": {
                                    if ([undefined,"main","help","wiki","scrape"].includes(command[2])) {
                                        this.#state = "repl";
                                        this.#replcontext = command[2] ?? "main";
                                    } else {
                                        console.log("unknown repl context");
                                    }
                                    break;
                                }
                                default: {
                                    console.log("unknown debug command");
                                    break;
                                }
                            }
                            break;
                        }
                        default: {
                            console.log("unrecognized command");
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }
}


Interface.mainLoop();

// wikitext.indexTemplates();

// // console.log(wikitext.templateIndex());

// async function user(name, defaultvalue, values) {
//     if (defaultvalue) return null;
//     return name;
// }

// async function main() {
//     const s = await scraper.Scraper.create("Special:RequestWikiQueue/91957");
//     function canon(name) {return s.getCanonParam(name);}
//     function scraped(spec) {return s.getScrapedValue(spec);}
//     console.log(await wikitext.templateIndex()["default"].fill({canon, scraped, user}));
// }

// main();




