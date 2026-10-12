/**
 * @file
 * this file provides utilities for interacting with MW APIs and scraping page contents
 */
const PWR = (() => {
    /**@type {import("./stubs.cjs").MW} */
    let mw = window.mw;
    /**
     * @typedef {import("./stubs/apiphp.cjs").PageInfo} PageInfo
     * @typedef {import("./stubs/apiphp.cjs").Revision} Revision
     * @typedef {import("./stubs/apiphp.cjs").EditData} EditData
     * @typedef {import("./stubs.cjs").TemplateData} TemplateData
     * @typedef {import("./stubs.cjs").TemplateParamDef} TemplateParamDef
     * @typedef {import("./stubs.cjs").ScrapeBlueprint} ScrapeBlueprint
     * @typedef {import("./stubs.cjs").ReqData} ReqData
     */

    class PWR {
        /**
         * explicitly disallows `<base>`, `<embed>`, `<frame>`, `<iframe>`, `<object>`, `<style>`, `<script>`, `<link>`, `<use>`
         * explicitly allows `id`, `class`, `<fieldset>`, `<form>`, `<label>`
         * all other configurations are default {@link https://developer.mozilla.org/docs/Web/API/HTML_Sanitizer_API/Default_sanitizer_configuration}
         */
        static SCRAPE_SANITIZER = new Sanitizer();
        static {
            this.SCRAPE_SANITIZER.removeUnsafe();
            this.SCRAPE_SANITIZER.removeElement("style");
            this.SCRAPE_SANITIZER.removeElement("link");
            this.SCRAPE_SANITIZER.allowAttribute("class");
            this.SCRAPE_SANITIZER.allowAttribute("id");
            this.SCRAPE_SANITIZER.allowElement("fieldset");
            this.SCRAPE_SANITIZER.allowElement("form");
            this.SCRAPE_SANITIZER.allowElement("label");
        }
        static API = class {
            /**
             * fetches the rendered HTML of a page according to the sanitizer rules {@link PWR.SCRAPE_SANITIZER}
             * @param {string} uri partial URI, the `https://meta.miraheze.org/wiki/` will be prepended
             * @returns {Promise<Document|null>}
             */
            static async getDocument(uri) {
                const res = await fetch(`https://meta.miraheze.org/wiki/${uri}`, {method:"GET"});
                if (res.status !== 200) {
                    return null;
                }
                return Document.parseHTML(await res.text(), {sanitizer:PWR.SCRAPE_SANITIZER});
            }
            /**
             * convenience function to scrape the `Special:PrefixIndex` endpoint
             * @param {string} page the page to get subpages of
             * @param {boolean} directOnly whether to return only direct children
             * @returns {Promise<string[]|null>}
             */
            static async getSubpages(page, directOnly) {
                const sp = new URLSearchParams({"prefix":page, "stripprefix":"1"});
                const doc = await PWR.getDocument(`Special:PrefixIndex?${sp.toString()}`);
                if (!doc) return null;
                const subpages = [...doc.querySelectorAll("ul.mw-prefixindex-list > li > a")].map(v => v.textContent);
                return directOnly ? subpages.filter(v => !v.includes("/")) : subpages;
            }
            /**
             * uses the `index.php?action=raw` endpoint
             * returns `null` if the page does not exist
             * @param {string} page page name
             * @param {string?} revid optional revision id
             * @returns {Promise<string|null>}
             */
            static async getWikitext(page, revid) {
                const sp = new URLSearchParams({"title":page,"action":"raw"});
                if (revid) {
                    sp.set("oldid", revid);
                }
                const res = await fetch(`https://meta.miraheze.org/w/index.php?${sp.toString()}`, {method:"GET"});
                if (res.status !== 200) return null;
                return await res.text();
            }
            /**
             * direct use of this function is discouraged, specialize it if a new type of query is needed
             * @param {Record<string, string>} params
             * @returns {Promise<Record<string, string>[]|null>}
             */
            static async queryRaw(params) {
                const res = await fetch(`https://meta.miraheze.org/w/api.php?${new URLSearchParams({...params,"format":"json","formatversion":"2","action":"query"}).toString()}`, {method:"GET"});
                if (res.status !== 200) return null;
                return (await res.json()).query.pages;
            }
            /**
             * returns `null` if the page does not exist or there are no revisions
             * @param {{titles:string}|{pageids:number}} page page info
             * @returns {Promise<number|null>}
             */
            static async queryCurRevid(page) {
                /**@type {null|(PageInfo&{revisions:Revision[]})[]} */
                const r = await this.queryRaw({"prop":"revisions","rvlimit":"1",...page});
                if (r === null) return null;
                return (r[0]||{revisions:[]}).revisions[0]?.revid ?? null;
            }
            /**
             * @param {EditData} params
             * @returns {Promise<boolean>}
             */
            static async edit(params) {
                const len = (params.text ?? params.appendtext ?? params.prependtext).length;
                if (len >= 3000) {
                    const fd = new FormData();
                    for (const key in params) {
                        fd.append(key, params[key]);
                    }
                    fd.delete("token");
                    fd.append("token", mw.user.tokens.get("csrfToken"));
                    return (await fetch(`https://meta.miraheze.org/w/api.php?action=edit`, {method:"POST",body:fd})).status === 200;
                }
                const sp = new URLSearchParams(params);
                sp.delete("token");
                sp.set("token", mw.user.tokens.get("csrfToken"));
                return (await fetch(`https://meta.miraheze.org/w/api.php?action=edit&${sp.toString()}`)).status === 200;
            }
        };
        static Scrape = class {
            /**
             * @param {Document|HTMLElement} parent
             * @param {string} query
             * @param {string|null} value
             * @returns {string|null}
             */
            static #select(parent, query, value) {
                const result = ([...(parent.querySelector(query)?.childNodes??[])].map(node => node.textContent).map(v => v.trim()).filter(v => v.length).join("\n"))||null;
                if (result === null) {
                    return value ? null : "DATA NOT FOUND";
                }
                return value ? result === value : result;
            }
            /**
             * does the actual scraping, all other scrape functions are specializations of this one
             * @param {Document|HTMLElement} doc
             * @param {ScrapeBlueprint} blueprint
             * @returns {Record<string,any|null>}
             */
            static #scrapeRaw(doc, blueprint) {
                const ret = {};
                for (const k in blueprint) {
                    const spec = blueprint[k];
                    const trans = spec.transform ?? {type:"gather"};
                    switch (trans.type) {
                        // both operate on a single element
                        case "gather":case "gather-map": {
                            const g = this.#select(doc, spec.selector);
                            if (g === null) {
                                ret[k] = trans.default ?? null;
                            }
                            ret[k] = trans.type === "gather" ? g : trans.map[g];
                            break;
                        }
                        case "map-each": {
                            ret[k] = [...(doc.querySelectorAll(spec.selector)??[])].map(v => this.#scrapeRaw(v, trans.blueprint));
                            break;
                        }
                    }
                }
                return ret;
            }
            /**
             * scrapes a wiki request
             * @param {string} pageid
             * @returns {Promise<ReqData>}
             */
            static async scrapeRequest(pageid) {
                const doc = await PWR.API.getDocument(`Special:RequestWikiQueue/${pageid}`);
                if (!doc) throw new Error("request fetch failed");
                const select = (query, value) => select_(doc, query, value);
                /**@type {ReqData} */
                const data = {
                    "pageid":`Special:RequestWikiQueue/${pageid}`,
                    "sitename":select("label#mw-input-wpsitename"),
                    "domain":select("label#mw-input-wpurl"),
                    "requester":select("label#mw-input-wprequester > a > bdi"),
                    "private":select("label#mw-input-wpprivate > b","Yes"),
                    "realperson":select("label#mw-input-wpbio > b","Yes"),
                    "nsfw":select("label#mw-input-wpnsfw > b","Yes"),
                    "body":select("label#mw-input-wpreason"),
                    "comments": []
                };
                const comments = doc.querySelector("fieldset#mw-section-comments");
                if (comments) {
                    // scrapes comments
                    for (const comment of comments.querySelectorAll("div.oo-ui-fieldLayout-body")) {
                        // the header has the form "Comment by USERNAME at DATE" and the date never contains the word
                        // "at" so we get to not deal with regex, yay
                        const header = comment.querySelector("span.oo-ui-fieldLayout-header > label")?.textContent ?? "by UNDEFINED at NOT FOUND";
                        // the body is super easy
                        const body = ([...(comment.querySelector("div.oo-ui-fieldLayout-field > label")?.childNodes??[])].map(node => node.textContent).map(v => v.trim()).filter(v => v.length).join("\n"))??"NOT FOUND";
                        data.comments.push({
                            "author": header.slice(header.indexOf("by")+3, header.lastIndexOf("at")-1),
                            "date": header.slice(header.lastIndexOf("at")+3),
                            "body": body
                        });
                    }
                }
                return data;
            }
        };
        static Template = class {
            /**
             * parses a template
             * @param {string} wikitext
             * @returns {TemplateData}
             */
            static parse(wikitext) {
                const [content, defs] = wikitext.split("\n{=defs}\n");
                /**@type {TemplateData} */
                const data = {
                    /*
                    how this works:
                    1) add a space to the start and end of content, this is done to solve an edge case where the template starts or ends with a parameter invocation
                    2) split on '{' preceded and followed by non '{' characters and the same for '}'
                    3) remove the added spaces from the ends of content
                    4) replace template invocations with expected format
                    5) filter out all empty strings
                    */
                    template: ` ${content} `.split(/(?:(?<=[^{])[{](?=[^{]))|(?:(?<=[^}])[}]{1}(?=[^}]))/).map((v,i,a)=>i===0?v.slice(1):(i===a.length-1?v.slice(0,v.length-1):v)).map((v,i)=>i%2?{param:v}:v).filter(v=>typeof v !== "string" || v.length),
                    params: defs.split("\ndefine ").filter(v=>v.length).map(v => v.trim().split("\n").filter(l=>l.length)).map(v => {
                        /**@type {TemplateParamDef} */
                        const def = {
                            name: v[0].slice(v[0].indexOf(" ")+1),
                            type: v[0].slice(0, v[0].indexOf(" "))
                        };
                        v.slice(1).forEach(l => {
                            const prop = l.slice(1, l.indexOf(" ", 1));
                            const value = l.slice(l.indexOf(" ", 1)+1);
                            switch (prop) {
                                case "essay": {
                                    def.multiline = value === "true";
                                    break;
                                }
                                case "value":case "default":case "display": {
                                    def[prop] = value;
                                    break;
                                }
                                default: {
                                    if (prop in def) {
                                        def[prop].push(value);
                                    } else {
                                        def[prop] = [value];
                                    }
                                    break;
                                }
                            }
                        });
                        switch (def.type) {
                            case "const": {
                                if (Object.keys(def).length !== 3 || !("value" in def)) {
                                    throw new Error("bad parameter definition");
                                }
                                break;
                            }
                            case "choice": {
                                if (!Array.isArray(def.values) || (def.default&&!def.values.includes(def.default))) {
                                    throw new Error("bad parameter definition");
                                }
                                break;
                            }
                            case "text": {
                                break;
                            }
                            default: {
                                throw new Error("bad parameter type");
                            }
                        }
                        return def;
                    })
                };
                return data;
            }
        };
        /**@type {import("./stubs/make.cjs").ElementMaker} */
        static make = (tag, options) => {
            options = options ?? {};
            const elem = document.createElement(tag);
            document.createElement()
            if (options.classList) {
                elem.classList.add(...options.classList);
            }
            if (options.children) {
                elem.append(...options.children);
            }
            for (const k in options) {
                if (k === "classList" || k === "children") continue;
                elem[k] = options[k];
            }
            return elem;
        }
    }
    return PWR;
})();
