/**
 * @file
 * this file provides namespaced helper functions
 */

// this silliness is all because I want to get my IDE to recognize `mw` as something that exists
const PWR = (() => {
    /**@type {import("./stubs.cjs").MW} */
    let mw = window.mw;
    /**
     * @typedef {import("./stubs/apiphp.cjs").PageInfo} PageInfo
     * @typedef {import("./stubs/apiphp.cjs").Revision} Revision
     * @typedef {import("./stubs/apiphp.cjs").EditData} EditData
     * @typedef {import("./stubs.cjs").TemplateData} TemplateData
     * @typedef {import("./stubs.cjs").TemplateParamDef} TemplateParamDef
     * @typedef {import("./stubs.cjs").ReqData} ReqData
     * @typedef {import("./stubs.cjs").SETTINGS} SETTINGS
     * @typedef {import("./stubs.cjs").ReviewStatusArtifact} ReviewStatusArtifact
     * @typedef {import("./stubs.cjs").InProgressArtifact} InProgressArtifact
     * @typedef {import("./stubs.cjs").SrcIdKey} SrcIdKey
     */

    /**used for internal initialization functions */
    const initSym = Symbol("init");
    /**
     * an artifact record backed by a user subpage, if the `use_artifacts` setting
     * is not enabled, the record will exist only in memory
     * @template K key type
     * @template V value type
     */
    class ArtifactRecord {
        /**@type {Record<string,V>} */
        #record = {};
        /**@type {(value:K)=>string} */
        #transformer;
        /**@type {string} */
        #endpoint;
        /**
         * @param {string} endpoint page this artifact record exists on
         * @param {(value:K)=>string} transformer transforms a key object to a string key
         */
        constructor(endpoint, transformer) {
            this.#transformer = transformer;
            this.#endpoint = endpoint;
            Object.freeze(this);
        }
        async [initSym]() {
            if (!PWR.SETTINGS.USE_ARTIFACTS) return;
            this.#record = (await PWR.API.getJSON(this.#endpoint)) ?? {};
        }
        /**
         * checks if a key is in the artifact record
         * @param {K} key artifact key
         * @returns {boolean}
         */
        has(key) {
            return this.#transformer(key) in this.#record;
        }
        /**
         * gets an artifact
         * @param {K} key artifact key
         * @returns {V?}
         */
        get(key) {
            return this.#record[this.#transformer(key)];
        }
        /**
         * updates an artifact, creating it if necessary
         * 
         * may queue a call to {@link ArtifactRecord.sync} or call it directly
         * depending on user settings
         * @param {K} key artifact key
         * @param {V} value artifact
         * @returns {Promise<void>}
         */
        async set(key, value) {
            this.#record[this.#transformer(key)] = value;
        }
        /**
         * writes the in-memory artifact back to its backing page
         * @returns {void}
         */
        async sync() {
            if (!PWR.SETTINGS.USE_ARTIFACTS) return;
        }
    }

    /**
     * the helper function top-level namespace
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
        /**
         * helpers to interact with the MediaWiki API
         */
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
             * @param {boolean} stripPrefix whether to strip prefixes (default true)
             * @returns {Promise<string[]|null>}
             */
            static async getSubpages(page, directOnly, stripPrefix) {
                const sp = new URLSearchParams({"prefix":page});
                if (!stripPrefix) sp.set("stripprefix", "1");
                const doc = await PWR.API.getDocument(`Special:PrefixIndex?${sp.toString()}`);
                if (!doc) return null;
                const subpages = [...doc.querySelectorAll("ul.mw-prefixindex-list > li > a")].map(v => v.textContent);
                return directOnly ? subpages.filter(v => !v.includes("/")) : subpages;
            }
            /**
             * uses the `index.php?action=raw` endpoint
             * 
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
             * uses the `index.php?action=raw&ctype=application/json` endpoint
             * 
             * returns `null` if the page does not exist
             * @template T the expected JSON type
             * @param {string} page page name
             * @param {string?} revid optional revision id
             * @returns {Promise<T|null>}
             */
            static async getJSON(page, revid) {
                const sp = new URLSearchParams({"title":page,"action":"raw","ctype":"application/javascript"});
                if (revid) {
                    sp.set("oldid", revid);
                }
                const res = await fetch(`https://meta.miraheze.org/w/index.php?${sp.toString()}`, {method:"GET"});
                if (res.status !== 200) return null;
                return await res.json();
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
        /**
         * helpers designed to scrape data from rendered HTML
         */
        static Scrape = class {
            /**
             * @param {Document|HTMLElement} parent
             * @param {string} query
             * @param {string|null} value
             * @returns {string|null}
             */
            static select(parent, query, value) {
                const result = ([...(parent.querySelector(query)?.childNodes??[])].map(node => node.textContent).map(v => v.trim()).filter(v => v.length).join("\n"))||null;
                if (result === null) {
                    return value ? null : "DATA NOT FOUND";
                }
                return value ? result === value : result;
            }
            /**
             * scrapes a wiki request
             * @param {string} pageid
             * @returns {Promise<ReqData>}
             */
            static async scrapeRequest(pageid) {
                const doc = await PWR.API.getDocument(`Special:RequestWikiQueue/${pageid}`);
                if (!doc) throw new Error("request fetch failed");
                const select = (query, value) => this.select(doc, query, value);
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
            /**
             * gets the 50 most recent wiki requests with the "In Review" status
             * @returns {Promise<RListData[]>}
             */
            static async scrapeQueue() {
                // 50 most recent requests
                const doc = await PWR.API.getDocument("Special:RequestWikiQueue?sort=cw_timestamp&limit=50&desc=1&status=inreview");
                if (doc === null) return [];
                /**@type {RListData[]} */
                const data = [];
                const tablebody = doc.querySelector("table").tBodies[0];
                tablebody.querySelectorAll("tr").forEach(node => {
                    const select = (query, value) => this.select(node, query, value);
                    data.push({
                        date: select(".TablePager_col_cw_timestamp"),
                        requester: select(".TablePager_col_cw_user bdi"),
                        sitename: select(".TablePager_col_cw_sitename"),
                        url: select(".TablePager_col_cw_url").split(".", 1)[0],
                        source: "Request Queue",
                        id: String(node.querySelector(".TablePager_col_cw_status a").href).match(/[0-9]{5,7}/)[0]
                    });
                });
                return data;
            }
        };
        /**
         * helpers for interacting with review artifacts
         */
        static Artifacts = class {
            /**@type {string} */
            static #ARTIFACT_PATH = `User:${mw.config.get("wgUserName")}/pwr/a`;
            /**
             * @param {SrcIdKey} key
             * @returns {string}
             */
            static #SRCID_TRANSFORMER = (key) => `${key.source}/${key.id}`;
            /**@readonly @type {ArtifactRecord<SrcIdKey,ReviewStatusArtifact>} */
            static REVIEW_STATUS = new ArtifactRecord(`${this.#ARTIFACT_PATH}/reviewed.json`, this.#SRCID_TRANSFORMER);
            /**@readonly @type {ArtifactRecord<SrcIdKey,InProgressArtifact>} */
            static IN_PROGRESS = new ArtifactRecord(`${this.#ARTIFACT_PATH}/in_progress.json`, this.#SRCID_TRANSFORMER);
            static {
                Object.defineProperty(this, "REVIEW_STATUS", {"configurable":false,"writable":false});
                Object.defineProperty(this, "IN_PROGRESS", {"configurable":false,"writable":false});
            }
            static async [initSym]() {
                await Promise.allSettled([
                    this.REVIEW_STATUS[initSym](),
                    this.IN_PROGRESS[initSym]()
                ]);
            }
        };
        /**
         * helpers for interacting with templates
         */
        static Template = class {
            /**
             * an instance of a template being actively rendered
             */
            static TemplateInstance = class TemplateInstance {
                // yes, this is very silly, blame the language server
                /**@type {TemplateInstance} */
                static TYPE;
                static #nop = ()=>{};
                /**@type {HTMLElement} */
                #parent;
                /**
                 * @param {TemplateData} template
                 * @param {ReqData&Record<string,string|null>} artifact
                 */
                constructor(template, artifact) {
                    this.template = template;
                    /**@type {null|(ti:TemplateInstance)=>void} */
                    this.onchange = null;
                    /**@type {HTMLElement[]} */
                    this.elems = [];
                    /**
                     * `v` is the current value (null if default/no value)
                     * `i` is the index of the parameter in the parameter array
                     * `e` is the html element containing this parameter's input
                     * `a` is parameter specific data used to restore disabled parameter state
                     * 
                     * parameters of type `const` only have `v` and `t`
                     * @type {Record<string,{v:string|null,e:HTMLElement,i:number,a:any}}
                     */
                    this.record = {};
                    /**@type {ReqData} */
                    this.canon = {};
                    for (const k of Object.keys(artifact).filter(v => v[0]==="=")) {
                        this.canon[k.slice(1)] = artifact[k];
                    }
                    for (let i = 0; i < template.params.length; i ++) {
                        const param = template.params[i];
                        if (param.type === "const") {
                            this.record[param.name] = {v:param.value};
                            continue;
                        }
                        const ID = this.elems.length;
                        const c = document.createElement("div");
                        this.elems.push(c);
                        c.classList.add("template-parameter");
                        c.id = `tm-param-${ID}`;
                        const l = document.createElement("label");
                        l.htmlFor = `tm-param-${ID}-in`;
                        l.textContent = `${param.display ?? param.name}: `;
                        c.append(l);
                        this.record[param.name] = {e:c,v:null,i};
                        /**@type {()=>string} */
                        let getValue;
                        /**@type {(state:"ro"|"nd",to:boolean)=>void} */
                        let setState;
                        /**@type {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} */
                        let el;
                        switch (param.type) {
                            case "text": {
                                const e = param.multiline ? document.createElement("textarea") : document.createElement("input");
                                if (param.multiline) {
                                    c.append(document.createElement("br"));
                                }
                                getValue = () => {
                                    if (e.value.length === 0 || e.value === param.default) {
                                        return null;
                                    } else {
                                        return e.value;
                                    }
                                };
                                setState = (state, to) => {};
                                if (artifact[param.name]) {
                                    e.value = artifact[param.name];
                                }
                                el = e;
                                break;
                            }
                            case "choice": {
                                const e = document.createElement("select");
                                getValue = () => {
                                    if (e.value.length === 0 || e.value === param.default) {
                                        return null;
                                    } else {
                                        return e.value;
                                    }
                                };
                                setState = (state, to) => {
                                    switch (state) {
                                        case "nd": {
                                            if (param.default) {
                                                e.options.item(param.values.indexOf(param.default)).disabled = to;
                                            }
                                            if (to) {
                                                if (e.selectedIndex === 0) {
                                                    e.selectedIndex = -1;
                                                }
                                            } else {
                                                if (e.selectedIndex === -1) {
                                                    e.selectedIndex = 0;
                                                }
                                            }
                                            return;
                                        }
                                    }
                                };
                                e.append(...param.values.map(val => {
                                    return PWR.make("option", {value:val,textContent:val,defaultSelected:val===param.default});
                                }));
                                if (artifact[param.name]) {
                                    e.value = artifact[param.name];
                                    this.record[param.name].v = artifact[param.name];
                                }
                                el = e;
                                break;
                            }
                            case "checkbox": {
                                const e = document.createElement("input");
                                e.type = "checkbox";
                                getValue = () => {
                                    return (e.checked === param.default)?null:e.checked;
                                };
                                setState = (state, to) => {};
                                e.checked = param.default ?? false;
                                if ((artifact[param.name]??null) !== null) {
                                    e.checked = artifact[param.name];
                                    this.record[param.name].v = artifact[param.name];
                                }
                                el = e;
                                break;
                            }
                        }
                        el.onchange = () => {this.record[param.name].v=getValue();setTimeout(this.onchange??TemplateInstance.#nop,0,this);};
                        /**@type {(pn:string)=>void} */
                        const decide = (pn) => {
                            if (param["ro-if-udf"]?.includes(pn)) {
                                c.hidden = (this.record[pn].v === null);
                                this.record[param.name].v = c.hidden ? null : getValue();
                                setState("ro", c.hidden);
                                if (c.hidden) return;
                            }
                            let nd = null;
                            if (param["nd-if-udf"]?.includes(pn)) {
                                nd = this.record[pn].v === null;
                            } else if (param["nd-if-def"]?.includes(pn)) {
                                nd = this.record[pn].v !== null;
                            }
                            if (nd !== null) {
                                setState("nd", nd);
                            }
                        };
                        (new Set((param["ro-if-udf"]??[]).concat(param["nd-if-def"]??[],param["nd-if-udf"]??[]))).forEach(v => {
                            if (v in this.record) {
                                this.record[v].e.addEventListener("change", ()=>{decide(v);});
                                decide(v);
                            }
                        });
                        el.id = `tm-param-${ID}-in`;
                        c.append(el);
                    }
                }
                /**
                 * @param {string} param
                 * @returns {string|null}
                 */
                #get(param) {
                    if (param[0] === "=") return this.canon[param.slice(1)] ?? null;
                    if (!(param in this.record)) return null;
                    if (!("i" in this.record[param])) return this.record[param].v;
                    const p = this.template.params[this.record[param].i];
                    let def = (p.default??null);
                    if (p.type === "checkbox" && def !== null) {
                        def = p[p.default?"checked":"unchecked"];
                    }
                    if (p.type === "checkbox") {
                        return (this.record[param].v===true?p.checked:(this.record[param].v===false?p.unchecked:null))??def;
                    }
                    return this.record[param].v??def;
                }
                /**
                 * renders the template to a string using the input parameters
                 * @returns {string}
                 */
                render() {
                    return this.template.template.map(content => {
                        if (typeof content === "string") return content;
                        return this.#get(content.param) ?? `**PARAM '${content.param}' UNDEFINED**`;
                    }).join("");
                }
                /**
                 * returns a parameter artifact that takes ownership of the data
                 * calling this function destroys this instance
                 * @returns {Record<string,string|null>}
                 */
                artifact() {
                    const a = {};
                    for (const k in this.record) {
                        a[k] = this.record[k].v;
                    }
                    for (const k in this.canon) {
                        a["="+k] = this.canon[k];
                    }
                    this.record = null;
                    this.canon = null;
                    this.detach();
                    return a;
                }
                /**
                 * @param {HTMLElement} parent
                 */
                attach(parent) {
                    this.#parent = parent;
                    parent.replaceChildren(...this.elems);
                }
                detach() {
                    this.#parent.replaceChildren();
                }
            }
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
                    template: ` ${content} `.split(/(?:(?<=[^{])[{](?=[a-z0-9_\-=:]))|(?:(?<=[a-z0-9_\-=])[}](?=[^}]))/).map((v,i,a)=>i===0?v.slice(1):(i===a.length-1?v.slice(0,v.length-1):v)).map((v,i)=>i%2?{param:v}:v).filter(v=>typeof v !== "string" || v.length),
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
                                case "value":case "default":case "display":
                                case "checked":case "unchecked": {
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
                            case "checkbox": {
                                def.default = def.default === "true";
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
            /**
             * @param {TemplateData} template
             * @param {ReqData&Record<string,string|null>} artifact a parameter artifact
             * @returns {TemplateInstance}
             */
            static renderParams(template, artifact) {
                if (artifact === null || typeof artifact !== "object") throw new TypeError("canon parameters are required");
                return new this.TemplateInstance(template, artifact);
            }
            /**
             * convenience function to load user templates
             * @returns {Promise<Record<string,string>>}
             */
            static async getUserTemplates() {
                const TEMPLATE_PATH = `User:${mw.config.get("wgUserName")}/pwr${PWR.SETTINGS.TEMPLATE_PATH}`;
                const DEFAULT_TEMPlATE = PWR.SETTINGS.DEFAULT_TEMPlATE;
                if (mw.config.get("wgUserName") === null) {
                    const r = {};
                    r[DEFAULT_TEMPlATE] = "User:Person0192837465/pwr/templates/default";
                    return r;
                }
                const templates = Object.fromEntries((await PWR.API.getSubpages(TEMPLATE_PATH, true, false)).map(r => [r, TEMPLATE_PATH+r]));
                if (!(DEFAULT_TEMPlATE in templates)) {
                    templates[DEFAULT_TEMPlATE] = "User:Person0192837465/pwr/templates/default";
                }
                return templates;
            }
        };
        /**
         * stores user settings
         */
        static SETTINGS = class {
            static #initialized = false;
            static uname = mw.config.get("wgUserName");
            static #default_template = "default";
            static #template_path = "/templates/";
            static #curated_path = "/curated/";
            static #review_page = "/PWR";
            static #rp_position_marker = "@next-review";
            static #use_artifacts = false;
            /**
             * whether review artifacts are enabled, defaults to false
             * to prevent unwanted subpages from being created
             * @readonly
             */
            static get USE_ARTIFACTS() {return this.#use_artifacts;}
            /**
             * the name of the default template
             * @readonly
             */
            static get DEFAULT_TEMPlATE() {return this.#default_template;}
            /**
             * the subpath under `USER/pwr` that templates are found in
             * @readonly
             */
            static get TEMPLATE_PATH() {return this.#template_path;}
            /**
             * the subpath under `USER/pwr` that curated scenarios are found in
             * @readonly
             */
            static get CURATED_PATH() {return this.#curated_path;}
            /**
             * the subpath under `USER` that reviews are written to
             * @readonly
             */
            static get REVIEW_PAGE() {return this.#review_page;}
            static async init() {
                if (this.#initialized) return;
                this.#initialized = true;
                if (this.uname === null) return;
                /**@type {SETTINGS} */
                const settings = await PWR.API.getJSON(`User:${this.uname}/pwr/settings.json`);
                if (settings !== null) {
                    // if ("use_artifacts" in settings) this.#use_artifacts = settings.use_artifacts;
                    if ("default_template" in settings) this.#default_template = settings.default_template;
                    if ("template_path" in settings) this.#template_path = settings.template_path;
                    if ("curated_path" in settings) this.#curated_path = settings.curated_path;
                    if ("review_page" in settings) this.#review_page = settings.review_page;
                    if ("rp_position_marker" in settings) this.#rp_position_marker = settings.rp_position_marker;
                }
                // await PWR.Artifacts[initSym]();
            }
        };
        /**@type {import("./stubs/make.cjs").ElementMaker} */
        static make = (tag, options) => {
            options = options ?? {};
            const elem = document.createElement(tag);
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
        // needed to fix the bug where a shared object gets corrupted because rwq_data needs a slightly different format
        /**
         * creates a deep copy of an object
         * @template T
         * @param {T} obj
         * @returns {T}
         */
        static clone(obj) {
            // these are all immutable, so can be returned as-is
            if (obj === null || ["string","number","bigint","boolean","function","symbol","undefined"].includes(typeof obj)) {
                return obj;
            }
            // arrays get special handling so that they come out as arrays instead of records
            if (Array.isArray(obj)) return obj.map(PWR.clone);
            const c = {};
            for (const key in obj) {
                c[key] = PWR.clone(obj[key]);
            }
            return c;
        }
    }
    return PWR;
})();
__PWR_LOAD_CHECK.r();
