const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const HTMLParser = require("node-html-parser");

const DIR = path.dirname(__dirname);

/**
 * @type {{PORT:number,COOKIE_PASS:string}}
 */
const settings = JSON.parse(fs.readFileSync(path.join(DIR, "settings.json"), {encoding:"ascii"}));
let COOKIE = "";

const server = http.createServer(async (req, res) => {
    const url = new URL("http://localhost"+req.url);
    switch (url.pathname) {
        case "/pwr": {
            res.writeHead(200, {"content-type":"text/html","content-encoding":"gzip"});
            const zipper = zlib.createGzip();
            fs.createReadStream(path.join(DIR, "webroot", "index.html"), {"encoding":"utf-8"}).pipe(zipper);
            zipper.pipe(res);
            return;
        }
        case "/pwr/scrape": {
            if (req.method !== "GET") {
                res.writeHead(405, {"content-type":"text/plain"}).end("must use GET");
                return;
            }
            const pageid = url.searchParams.get("id");
            if (pageid === null || !pageid.match(/^[0-9]{5,7}$/)) {
                res.writeHead(400, {"content-type":"text/plain"}).end("bad page id");
                return;
            }
            await scrapePage(pageid, res);
            return;
        }
        case "/pwr/cookie": {
            if (req.method !== "PUT") {
                res.writeHead(405, {"content-type":"text/plain"}).end("must use PUT");
                return;
            }
            if (url.searchParams.get("pass") !== settings.COOKIE_PASS) {
                res.writeHead(403, {"content-type":"text/plain"}).end("don't ruin it for everyone else");
                return;
            }
            let data = "";
            req.on("data", (chunk) => {data += chunk;});
            let responded = false;
            req.on("end", () => {
                if (responded) return;
                responded = true;
                COOKIE = data;
                res.writeHead(200, {"content-type":"text/plain"}).end("cookie updated successfully");
            });
            req.on("error", () => {
                if (responded) return;
                responded = true;
                res.writeHead(500, {"content-type":"text/plain"}).end("problem reading body");
            });
            return;
        }
        default: {
            res.writeHead(404, {"content-type":"text/plain"}).end("invalid endpoint");
            return;
        }
    }
});

server.listen(settings.PORT);

/**
 * @param {string} pageid
 * @param {http.ServerResponse} dst
 * @returns {Promise<void>}
 */
async function scrapePage(pageid, dst) {
    const headers = {"method":"GET","headers":{"accept-encoding":"gzip, deflate, br, zstd","accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36","referer":"https://meta.miraheze.org/wiki/Special:RequestWikiQueue?sort=cw_timestamp&limit=50&asc=&desc=1"}};
    if (COOKIE.length) {
        headers["cookie"] = COOKIE;
    }
    const pagedata = await new Promise(r => {
        const req = https.request(`https://meta.miraheze.org/wiki/Special:RequestWikiQueue/${pageid}`, headers, (res) => {
            if (res.statusCode !== 200) {
                dst.writeHead(503, {"content-type":"text/plain"}).end(`got status code ${res.statusCode}`);
                r();
                return;
            }
            let data = [];
            res.on("data", chunk => {data.push(chunk);});
            res.on("end", () => {
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
            res.on("error", (e) => {
                dst.writeHead(500, {"content-type":"text/plain"}).end("there was a problem with the request");
                r();
            });
        });
        req.on("error", (e) => {
            dst.writeHead(500, {"content-type":"text/plain"}).end("there was a problem with the request");
            r();
        });
        req.end();
    });
    if (!pagedata) {
        return;
    }
    const content = HTMLParser.parse(pagedata, {"preserveTagNesting":true,"parseNoneClosedTags":true}).firstElementChild;
    const select = (query, value) => {
        const result = (content.querySelector(query)?.childNodes?.map(node => node.nodeType===HTMLParser.NodeType.TEXT_NODE?node.text:node.textContent).map(v => v.trim()).filter(v => v.length).join("\n"))??null;
        if (result === null) {
            return value ? null : "DATA NOT FOUND";
        }
        return value ? result === value : result;
    };
    /**
     * @typedef {{sitename:string,domain:string,requester:string,private:boolean,realperson:boolean,nsfw:boolean,body:string,comments:{author:string,date:string,body:string}[]}} ReqData
     */
    /**@type {ReqData} */
    const data = {
        "sitename":select("label#mw-input-wpsitename"),
        "domain":select("label#mw-input-wpurl"),
        "requester":select("label#mw-input-wprequester > a > bdi"),
        "private":select("label#mw-input-wpprivate > b","Yes"),
        "realperson":select("label#mw-input-wpbio > b","Yes"),
        "nsfw":select("label#mw-input-wpnsfw > b","Yes"),
        "body":select("label#mw-input-wpreason"),
        "comments": []
    };
    const comments = content.querySelector("fieldset#mw-section-comments");
    if (comments) {
        for (const comment of comments.querySelectorAll("div.oo-ui-fieldLayout-body")) {
            const header = comment.querySelector("span.oo-ui-fieldLayout-header > label")?.textContent ?? "by UNDEFINED at NOT FOUND";
            const body = (comment.querySelector("div.oo-ui-fieldLayout-field > label")?.childNodes?.map(node => node.nodeType===HTMLParser.NodeType.TEXT_NODE?node.text:node.textContent).map(v => v.trim()).filter(v => v.length).join("\n"))??"NOT FOUND";
            data.comments.push({
                "author": header.slice(header.indexOf("by")+3, header.lastIndexOf("at")-1),
                "date": header.slice(header.lastIndexOf("at")+3),
                "body": body
            });
        }
    }
    dst.writeHead(200, {"content-type":"application/json"}).end(JSON.stringify(data));
}

