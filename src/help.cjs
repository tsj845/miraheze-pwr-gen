/**
 * @file
 * module containing all the help info for the utility
 */
const fs = require("fs");
const path = require("path");

const VERSION = "v0.1.0";

const DIR = path.join(path.dirname(__dirname), "help");

const INDEX_CONTENT = true;

// users can't search for ampersand help pages, but query transformers can
let OVERRIDE_AMP = 0;

/**@type {string[]} */
let searchPath = [];
/**@type {string[]} */
let searchTopics = null;

/**
 * @typedef {{"&default"?:string,"&fallback"?:string}&Record<string,string|HelpEntry>} HelpEntry
 */


/**@type {HelpEntry} */
let index = null;

/**
 * @param {...string} pathname
 * @returns {HelpEntry}
 */
function indexDir(...pathname) {
    /**@type {HelpEntry} */
    const index = {};
    // try {
    //     index["&default"] = fs.readFileSync(path.join(DIR, ...pathname, "&default.txt"), {encoding:"utf-8"});
    // } catch {}
    // try {
    //     index["&fallback"] = fs.readFileSync(path.join(DIR, ...pathname, "&fallback.txt"), {encoding:"utf-8"});
    // } catch {}
    for (const ent of fs.readdirSync(path.join(DIR, ...pathname), {withFileTypes:true})) {
        if (ent.isDirectory()) {
            index[ent.name] = indexDir(...pathname, ent.name);
        } else if (ent.isFile() && ent.name.endsWith(".txt")) {
            const name = ent.name.slice(0,ent.name.length-4);
            index[name] = null;
            if (INDEX_CONTENT) index[name] = fs.readFileSync(path.join(DIR, ...pathname, ent.name), {encoding:"utf-8"});
        }
    }
    return index;
}

index = indexDir();

/**
 * @param {string} content
 * @param {HelpEntry} currindex
 * @param {string} currpath
 * @param {string} item
 */
function renderContent(content, currindex, currpath, item) {
    // this file is actually a file containing instructions to transform the query
    if (content.startsWith("{@meta}")) {
        let rval = "UNABLE TO EVALUATE QUERY TRANSFORMER";
        /**
         * @param {string} v
         */
        const renderVar = (v) => {
            // console.log(`rendering var: ${v}`);
            switch (v) {
                case "topics": {
                    return searchTopics;
                }
            }
        };
        try {
            OVERRIDE_AMP ++;
            outer: for (const line of content.split(/\n+/).slice(1)) {
                const parts = line.split(" ");
                switch (parts[0]) {
                    case "@try": {
                        let oldpath = new Array(searchPath);
                        let oldtopics = new Array(searchTopics);
                        const topics = parts.slice(1).map(v => v.match(/^\{.*\}$/)?renderVar(v.slice(1,v.length-1)):v).flat();
                        // console.log("SP");
                        // console.log(searchPath);
                        // console.log(parts);
                        // console.log(topics);
                        if (topics.some(v => typeof v !== "string")) continue;
                        const val = searchIndex(topics, index, "");
                        searchPath = oldpath;
                        searchTopics = oldtopics;
                        if (val !== null) {
                            rval = val;
                            break outer;
                        }
                        break;
                    }
                }
            }
        } finally {
            OVERRIDE_AMP --;
        }
        return rval;
    } else {
        return content.replaceAll("{VERSION}", VERSION);
    }
}

/**
 * @param {HelpEntry} currindex
 * @param {string} currpath
 * @param {string} item
 * @returns {string}
 */
function getContent(currindex, currpath, item) {
    return renderContent(INDEX_CONTENT ? currindex[item] : fs.readFileSync(path.join(DIR, currpath, `${item}.txt`), {encoding:"utf-8"}), currindex, currpath, item, searchPath);
}

/**
 * @param {string[]} topics
 * @param {HelpEntry} currindex
 * @param {string} currpath
 * @returns {string | null}
 */
function searchIndex(topics, currindex, currpath) {
    if (searchTopics === null) {
        searchTopics = topics;
        let rval;
        try {
            rval = searchIndex(topics, currindex, currpath);
        } finally {
            searchTopics = null;
        }
        return rval;
    }
    // console.log(topics);
    if (topics.length === 0) {
        if ("&default" in currindex) return getContent(currindex, currpath, "&default");
        return null;
    }
    searchPath.push(topics[0]);
    let val;
    try {
        val = (() => {
            let value = null;
            if (OVERRIDE_AMP || !topics[0].startsWith("&")) {
                if (typeof currindex[topics[0]] === "object") {
                    value = searchIndex(topics.slice(1), currindex[topics[0]], path.join(currpath, topics[0]));
                } else if (topics[0] in currindex) {
                    value = getContent(currindex, currpath, topics[0]);
                }
            }
            if (value === null) {
                if ("&fallback" in currindex) return getContent(currindex, currpath, "&fallback");
                if ("&default" in currindex) return getContent(currindex, currpath, "&default");
                return null;
            }
            return value;
        })();
    } finally {
        searchPath.pop();
    }
    return val;
}

/**
 * @param {string[]} topics
 * @returns {string}
 */
function getHelp(topics) {
    if (index === null) {
        index = indexDir();
    }
    return (searchIndex(topics, index, "") ?? "Help page not found.").trim();
}

function reindex() {
    index = null;
}

function exec(line) {
    return eval(line);
}

exports.exec = exec;
exports.getHelp = getHelp;
exports.reindex = reindex;
exports.VERSION = VERSION;

