/**
 * @file
 * scrapes a RWQ entry
 */
const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const HTMLParser = require("node-html-parser");
const zlib = require("zlib")

/**
 * @typedef ScraperSpec
 * @type {{special:"path",query:null,contentMatch:null,values:null}|{special:null,query:string,contentMatch?:string,values?:string[]}}
 */


/**@type {Record<string,ScraperSpec>} */
const CANON_PARAMS = {
    "pageid": {special:"path"},
    "sitename": {query:"label#mw-input-wpsitename"},
    "body": {query:"label#mw-input-wpreason"},
    "private": {query:"label#mw-input-wpprivate > b",contentMatch:"Yes",values:["N","Y"]},
    "realperson": {query:"label#mw-input-wpbio > b",contentMatch:"Yes",values:["N","Y"]},
    "nsfw": {query:"label#mw-input-wpnsfw > b",contentMatch:"Yes",values:["N","Y"]}
};

class Scraper {
    static #allowConstruct = false;
    #uri;
    #content;
    /**
     * @param {string} uri
     * @param {string} data
     */
    constructor(uri, data) {
        if (!Scraper.#allowConstruct) throw new Error("cannot construct directly");
        this.#uri = uri;
        this.#content = HTMLParser.parse(data, {"preserveTagNesting":true,"parseNoneClosedTags":true});
        // console.log(this.#content.firstElementChild);
        // console.log(this.#content.firstElementChild.querySelector("body"));
    }
    /**
     * @param {string} uri
     */
    static async create(uri) {
        Scraper.#allowConstruct = true;
        let s;
        try {
            const data = await new Promise(r => {
                // console.log("req");
                //"sec-ch-ua":"\"Google Chrome\";v=\"153\", \"Not_A Brand\";v=\"8\", \"Chromium\";v=\"153\"",
                //,"sec-ch-ua":"\"Google Chrome\";v=\"153\", \"Not_A Brand\";v=\"8\", \"Chromium\";v=\"153\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"document","sec-fetch-mode":"navigate","sec-fetch-site":"same-origin","sec-fetch-user":"?1"
                const headers = {"method":"GET","headers":{"accept-encoding":"gzip, deflate, br, zstd","accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36","referer":"https://meta.miraheze.org/wiki/Special:RequestWikiQueue?sort=cw_timestamp&limit=50&asc=&desc=1"}};
                try {
                    headers["cookie"] = fs.readFileSync(path.join(path.dirname(__dirname), ".cookie"), {encoding:"utf-8"});
                } catch {}
                const req = https.request(`https://meta.miraheze.org/wiki/${uri}`, headers, (res) => {
                // const req = http.request(`http://github.com`, {"method":"GET"}, (res) => {
                    // console.log("resp");
                    if (res.statusCode !== 200) {
                        r(new Error(`status code ${res.statusCode}`));
                        return;
                    }
                    let data = [];
                    res.on("data", chunk => {data.push(chunk);});
                    // res.on("end", () => {r(zlib.deflateSync(data));});
                    res.on("end", () => {
                        // console.log(res.headers["content-encoding"]);
                        if (res.headers["content-encoding"]) {
                            data = Buffer.concat(data);
                        } else {
                            data = Buffer.concat(data).toString("utf-8");
                        }
                        switch (res.headers["content-encoding"]) {
                            case "zstd": {
                                data = zlib.zstdDecompressSync(data);
                                break;
                            }
                            case "deflate": {
                                data = zlib.inflateSync(data);
                                break;
                            }
                            case "br": {
                                data = zlib.brotliDecompressSync(data);
                                break;
                            }
                            case "gzip": {
                                data = zlib.gunzipSync(data);
                                break;
                            }
                        }
                        r(data);
                    });
                    res.on("error", (e) => {throw new Error(e);});
                });
                req.on("error", (e) => {console.log(e);});
                req.end();
                // req.on("information", () => {console.log("next")});
                // req.on("response", res => {
                // });
            });
            // fs.writeFileSync(path.join(path.dirname(__dirname),"mh.html"), data);
            if (data instanceof Error) s = data;
            else s = new Scraper(uri, data);
        } finally {
            Scraper.#allowConstruct = false;
        }
        return s;
    }
    /**
     * @param {ScraperSpec} spec
     */
    getScrapedValue(spec) {
        if (spec.special) {
            switch (spec.special) {
                case "path": {
                    return this.#uri;
                }
                default: {
                    return `ERROR: '${spec.special}' is not a valid value`;
                }
            }
        } else {
            const content = this.#content.firstElementChild.querySelector(spec.query).childNodes.map(node => node.nodeType===HTMLParser.NodeType.TEXT_NODE?node.text:node.textContent).map(v => v.trim()).filter(v => v.length).join("\n");
            if (spec.contentMatch && spec.values) {
                // console.log(spec.values, spec.contentMatch, content, spec.values[Number(content === spec.contentMatch)]);
                return spec.values[Number(content === spec.contentMatch)];
            }
            return content;
        }
    }
    /**
     * @param {string} param
     */
    getCanonParam(param) {
        return this.getScrapedValue(CANON_PARAMS[param]);
    }
}

function exec(line) {
    return eval(line);
}

exports.exec = exec;
exports.CANON_PARAMS = CANON_PARAMS;
exports.Scraper = Scraper;

