{
    /**
     * @typedef {import("../stubs.cjs").MWCONFIG} MWCONFIG
     */
    /**
     * @global
     * @type {{config:MWCONFIG}}
     * @name mw
     */
    let mw = window.mw;
    const $ = document.querySelector.bind(document);
    /**
     * @typedef {import("../stubs.cjs").MSG} MSG
     * @typedef {import("../stubs.cjs").ReqData} ReqData
     * @typedef {import("../stubs.cjs").TemplateData} TemplateData
     * @typedef {import("../stubs.cjs").RListData} RListData
     */
    // const api = new mw.Api();
	const main_content = document.getElementById("person-pwr-gen-content");
    main_content.setAttribute("data-pwr-state", "select");

    /**@type {{ready:()=>void,data:(data:ReqData)=>void,queue:(data:RListData[])=>void}} */
    const MSG_WAITERS = {};

    /**
     * @param {string} tagname
     * @param {Record<string, any>&{id?:string,classList?:string[],children?:(HTMLElement|string)[],textContent?:string}} options
     * @returns {HTMLElement}
     */
    const make = (tagname, options) => {
        options = options ?? {};
        /**@type {HTMLElement} */
        const tag = document.createElement(tagname);
        if (options.classList) {
            tag.classList.add(...options.classList);
        }
        if (options.children) {
            tag.append(...options.children);
        }
        for (const k in options) {
            if (k === "classList" || k === "children") continue;
            tag[k] = options[k];
        }
        return tag;
    };
    
    main_content.replaceChildren(
        make("div", {id:"request-list",children:[
            make("div", {id:"reqlist-controls",children:[
                make("label", {for:"rlcontrol-show-old",textContent:"Show Reviewed: "}),
                make("input", {type:"checkbox",id:"rlcontrol-show-old"}),
                make("input", {type:"button",value:"Import Practice Requests",id:"rlcontrol-import"})
            ]}),
            make("div", {id:"request-table",classList:["fixed-table"],children:[
                make("div", {classList:["fixed-table-head"],children:[
                    make("span", {textContent:"Date"}),
                    make("span", {textContent:"Requester"}),
                    make("span", {textContent:"Site Name"}),
                    make("span", {textContent:"URL"}),
                    make("span", {textContent:"Source"}),
                    make("span", {textContent:"Actions"})
                ]}),
                make("div", {classList:["fixed-table-body"]})
            ]})
        ]}),
        make("div", {id:"main-content",classList:["populated"],children:[
            make("span", {id:"rwq-container",children:[
                make("input", {type:"text",id:"rwq-id",onkeyup:(ev)=>{if(ev.code==="Return"||ev.code==="Enter")document.getElementById("populate-button").click();},hidden:true}),
                make("input", {type:"button",id:"populate-button",value:"Populate",hidden:true}),
                make("input", {value:"Discard",type:"button",id:"rwq-discard"}),
                make("input", {value:"Save Draft",type:"button",id:"rwq-draft"}),
                make("input", {value:"Save",type:"button",id:"rwq-save"})
            ]}),
            make("div", {id:"prop-comm-cont",children:[
                make("div", {id:"properties",children:[
                    make("b", {textContent:"Request"}),make("br"),
                    make("span", {id:"prop-sitename",textContent:"Sitename: N/A"}),make("br"),
                    make("span", {id:"prop-domain",textContent:"Domain: N/A"}),make("br"),
                    make("span", {id:"prop-private",textContent:"Private: N/A"}),make("br"),
                    make("span", {id:"prop-realperson",textContent:"Real Person: N/A"}),make("br"),
                    make("span", {id:"prop-nsfw",textContent:"NSFW: N/A"}),make("br"),
                    make("span", {textContent:"Body:"}),
                    make("pre", {id:"prop-body",textContent:"N/A"})
                ]}),
                make("div", {id:"comments",children:[
                    make("b", {textContent:"Comments"}),
                    make("div", {id:"comments-container"})
                ]}),
                make("div", {id:"parameters",children:[
                    make("b", {textContent:"Template Fields"}),make("br"),
                    make("label", {for:"template-select",textContent:"Template: "}),
                    make("select", {id:"template-select",defaultSelected:"default",children:[
                        make("option", {value:"default",textContent:"default"})
                    ]}),
                    make("div", {id:"params-container"})
                ]})
            ]})
        ]}),
        make("div", {id:"output-container",children:[
            make("input", {type:"button",value:"Copy WikiText",id:"copy-button",onclick:()=>{navigator.clipboard.writeText(document.getElementById("output").value);}}),make("br"),
            make("textarea", {readonly:true,id:"output",rows:10,cols:50})
        ]})
    );
    /**@type {HTMLSelectElement} */
    const templsel = document.getElementById("template-select");
    /**@type {HTMLDivElement} */
    const RQL_TABLE = document.getElementById("request-table").querySelector("div.fixed-table-body");
    /**@type {HTMLDivElement} */
    const REQ_LIST = document.getElementById("request-list");
    /**@type {HTMLInputElement} */
    const RWQ_ID = document.getElementById("rwq-id");
    /**@type {HTMLTextAreaElement} */
    const OUTPUTWIKITEXT = document.getElementById("output");
    /**@type {TemplateData} */
    let template_data;
    /**@type {Record<string,{e:HTMLElement,v:string|null}>} */
    let template_map = {};
    /**@type {{pageid:string,sitename:string,domain:string,requester:string,private:string,realperson:string,nsfw:string,body:string,comments:{author:string,date:string,body:string}[],ts:string,sig:string,sigts:string}|null} */
    let rwq_data = null;
    /**@type {Record<string,TemplateData>} */
    let templates;
    /**
     * @type {Record<string,{source:string,id:string,template:string,params:(string|null)[]}>}
     */
    const review_data = {};
    let csource = "";
    /**
     * @param {RListData} data
     * @returns {HTMLElement}
     */
    function makeReqListEntry(data) {
        const props = ["date","requester","sitename","url","source"];
        return make("div", {classList:["req-list-entry"],children:props.map(
            k => make("span", {classList:[`req-entry-${k}`],textContent:data[k]})
        ).concat([make("span", {children:[
            // make("input", {type:"button",onclick:()=>{reqListEntryClick(data.id)}})
            make("a", {textContent:"Review",onclick:()=>{reqListEntryClick(`${data.source}#${data.id}`)}})
        ]})])});
    }
    /**
     * @param {string} reqid
     */
    async function reqListEntryClick(reqid) {
        const [src, id] = reqid.split("#");
        csource = src;
        RWQ_ID.value = id;
        main_content.setAttribute("data-pwr-state", "review");
        if (reqid in review_data) {
            template_data = templates[review_data[reqid].template];
            makeTemplateParams(review_data[reqid].params);
            // for (let i = 0; i < review_data[reqid].params.length; i ++) {
            //     document.getElementById("");
            // }
        }
        await populateTemplate(src);
    }
    document.getElementById("rwq-discard").onclick = () => {
        makeTemplateParams();
        main_content.setAttribute("data-pwr-state", "select");
    };
    document.getElementById("rwq-draft").onclick = () => {
        saveDraft();
        makeTemplateParams();
        main_content.setAttribute("data-pwr-state", "select");
    };
    document.getElementById("rwq-save").onclick = () => {
        saveDraft();
        makeTemplateParams();
        main_content.setAttribute("data-pwr-state", "select");
    };
    function saveDraft() {
        review_data[`${csource}#${RWQ_ID.value}`] = {
            id: RWQ_ID.value,
            source: csource,
            template: templsel.value,
            params: template_data.params.map(v => template_map[v.name].v)
        };
    }
    // needed to fix the bug where a shared object gets corrupted because rwq_data needs a slightly different format
    /**
     * creates a deep copy of an object
     * @template T
     * @param {T} obj
     * @returns {T}
     */
    function clone(obj) {
        if (obj === null || ["string","number","bigint","boolean","function","symbol","undefined"].includes(typeof obj)) {
            return obj;
        }
        if (Array.isArray(obj)) return obj.map(clone);
        const c = {};
        for (const key in obj) {
            c[key] = clone(obj[key]);
        }
        return c;
    }
    /**
     * @param {(string|nul)[]} values
     */
    function makeTemplateParams(values) {
        values = values ?? [];
        /**@type {HTMLElement[]} */
        const list = [];
        /**@type {((pname:string)=>void)[]} */
        const changeHooks = [];
        template_map = {};
        let i = 0;
        for (const param of template_data.params) {
            const ID = list.length;
            const c = document.createElement("div");
            template_map[param.name] = {e:c,v:null};
            list.push(c);
            c.classList.add("template-parameter");
            c.id = `tm-param-${ID}`;
            const l = document.createElement("label");
            l.htmlFor = `tm-param-${ID}-in`;
            l.textContent = `${param.display ?? param.name}: `;
            c.append(l);
            /**@type {()=>string} */
            let getValue;
            let el;
            if (param.values) {
                el = document.createElement("select");
                getValue = () => {
                    const ind = Number(el.value);
                    // catches intended -1 from default and NaN from no selection
                    if (!(ind >= 0)) return null;
                    return param.values[ind];
                }
                el.id = `tm-param-${ID}-in`;
                if (param.default) {
                    const o = document.createElement("option");
                    o.value = "-1";
                    o.defaultSelected = true;
                    o.textContent = param.default;
                    el.append(o);
                }
                el.append(...param.values.map((val, i) => {
                    const o = document.createElement("option");
                    o.value = String(i);
                    o.textContent = val;
                    return o;
                }));
                c.append(el);
                if (i < values.length) {
                    const v = values[i];
                    if (v !== null) {
                        el.selectedIndex = param.values.indexOf(v)+1;
                        template_map[param.name] = v;
                    }
                }
            } else {
                if (param.multiline) {
                    el = document.createElement("textarea");
                    c.append(document.createElement("br"));
                } else {
                    el = document.createElement("input");
                }
                getValue = () => el.value;
                el.id = `tm-param-${ID}-in`;
                c.append(el);
                if (i < values.length) {
                    const v = values[i];
                    if (v !== null) {
                        el.value = v;
                        template_map[param.name] = v;
                    }
                }
            }
            el.onchange = () => {template_map[param.name].v=getValue();changeHooks.forEach(hook => {hook(param.name);});};
            // some parameters can be hidden depending on the values of others
            // so this function does that hiding and unhiding
            changeHooks.push((pname) => {
                // hide parameters if we can only accept the default value
                if (param["ro-if-udf"]?.includes(pname)) {
                    c.hidden = param["ro-if-udf"].some(p => template_map[p].v===null);
                    template_map[param.name].v = c.hidden ? null : getValue();
                    // the parameter requiring the default takes precedence
                    if (c.hidden) return;
                }
                // the non default checks only work on parameters with enumerated
                // values
                if (param.values && param.default) {
                    let dis = null;
                    // if either check passes, we do the same thing
                    if (param["nd-if-udf"]?.includes(pname)) {
                        dis = param["nd-if-udf"].some(p => template_map[p].v===null);
                    } else if (param["nd-if-def"]?.includes(pname)) {
                        dis = param["nd-if-def"].some(p => template_map[p].v!==null);
                    }
                    // using null as a sentinel prevents a bug where
                    // the default can be re-enabled by another hook
                    if (dis !== null) {
                        const s = c.querySelector("select");
                        s.options.item(0).disabled = dis;
                        // ensure that the selection is sensible
                        if (dis) {
                            if (s.selectedIndex === 0) {
                                s.selectedIndex = -1;
                            }
                        } else if (s.selectedIndex === -1) {
                            s.selectedIndex = 0;
                        }
                    }
                }
            });
            i ++;
        }
        // pretend we manually inputted all values so that the template doesn't suddenly change
        // a whole bunch
        for (const param of template_data.params) {
            changeHooks.forEach(h => h(param.name));
        }
        // push this now so we aren't uselessly calling renderTemplate
        changeHooks.push(renderTemplate);
        $("#params-container").replaceChildren(...list);
        renderTemplate();
    }
    function renderTemplate() {
        if (rwq_data === null) return;
        OUTPUTWIKITEXT.value = template_data.template.map(content => {
            if (typeof content === "string") {
                return content;
            } else {
                if (content.param[0] === "=") {
                    return rwq_data[content.param.slice(1)];
                }
                // I can't be bothered to do proper support on the render side for
                // unacceptable values, so it'll happily render templates it really shouldn't
                return template_map[content.param].v ?? (template_data.params.find(v => v.name === content.param).default ?? "UNDEFINED");
            }
        }).join("");
    }

    async function populateTemplate() {
        // the pageid input allows for full or partial urls too, strip that stuff
        const pageid = RWQ_ID.value.includes("/") ? RWQ_ID.value.slice(RWQ_ID.value.lastIndexOf("/")+1) : RWQ_ID.value;
        /**@type {ReqData} */
        const data = await scrapeRequest(pageid);
        rwq_data = clone(data);
        // do transformations to get the right data in rwq_data
        for (const key of ["private","realperson","nsfw"]) {
            rwq_data[key] = ["N","Y"][Number(data[key])];
        }
        // because we can't have nice things, we have to use canon template parameters and this
        // dumb hack to avoid expanding the signatures too early
        rwq_data.ts = "~".repeat(5);
        rwq_data.sig = "~".repeat(3);
        rwq_data.sigts = "~".repeat(4);
        // populate the wiki request properties
        $("span#prop-sitename").textContent = `Sitename: ${data.sitename}`;
        $("span#prop-domain").textContent = `Domain: ${data.domain}`;
        $("span#prop-private").textContent = `Private: ${["No","Yes"][Number(data.private)]}`;
        $("span#prop-realperson").textContent = `Real Person: ${["No","Yes"][Number(data.realperson)]}`;
        $("span#prop-nsfw").textContent = `NSFW: ${["No","Yes"][Number(data.nsfw)]}`;
        $("pre#prop-body").textContent = data.body;
        $("div#comments-container").replaceChildren(...data.comments.map(makeComment));
        // render the template
        renderTemplate();
    };
    /**
     * helper function to render a comment
     * @param {{author:string,date:string,body:string}} comment
     * @returns {HTMLElement}
     */
    function makeComment(comment) {
        const d = document.createElement("div");
        d.classList.add("comment");
        const h = document.createElement("b");
        h.classList.add("comment-header");
        h.textContent = `${comment.author} at ${comment.date}`;
        d.append(h);
        const b = document.createElement("pre");
        b.classList.add("comment-body");
        b.textContent = comment.body;
        d.append(b);
        return d;
    }

	const ifr = document.createElement("iframe");
	ifr.sandbox = "allow-scripts allow-same-origin";
	ifr.style.setProperty("display","none");
	main_content.append(ifr);
    /**
     * @param {string} src
     */
    function setIFRSrc(src) {
        const url = new URL(src);
        if (PWRPATH === "pwr/dev") url.searchParams.set("pwrdev", "1");
        ifr.src = url.toString();
    }
	// ifr.src = `https://meta.miraheze.org/wiki/Special:RequestWikiQueue/91956`;
    window.addEventListener("message", /**@param {MessageEvent<MSG>} ev*/(ev) => {
        switch (ev.data.type) {
            case "data": {
                //TODO: have a whole bunch of state checking to make sure we don't wipe any partially filled
                //      template unintentionally
                MSG_WAITERS.data(ev.data.data);
                break;
            }
            case "queue": {
                MSG_WAITERS.queue(ev.data.data);
                break;
            }
            case "ready": {
                if (typeof MSG_WAITERS.ready === "function") {
                    MSG_WAITERS.ready();
                    delete MSG_WAITERS["ready"];
                }
                break;
            }
        }
    });
    /**
     * @param {string} pageid
     * @returns {Promise<ReqData>}
     */
    function scrapeRequest(pageid) {
        return new Promise(async r => {
            MSG_WAITERS.data = r;
            // ifr.src = `https://meta.miraheze.org/wiki/Special:RequestWikiQueue/${pageid}`;
            setIFRSrc(`https://meta.miraheze.org/wiki/Special:RequestWikiQueue/${pageid}`);
            await new Promise(r2 => {MSG_WAITERS.ready=r2;});
            ifr.contentWindow.postMessage({type:"send"});
            // setTimeout(() => {
            //     ifr.contentDocument.onreadystatechange = () => {
            //         if (ifr.contentDocument.readyState === "complete") {
            //             ifr.contentDocument.onreadystatechange = () => {};
            //         }
            //     };
            // }, 1);
        });
    }
    /**
     * gets the 50 most recent wiki requests with the "In Review" status
     * @returns {Promise<RListData[]>}
     */
    function scrapeQueue() {
        // 50 most recent requests
        const uri = "https://meta.miraheze.org/wiki/Special:RequestWikiQueue?sort=cw_timestamp&limit=50&desc=1&status=inreview";
        return new Promise(async r => {
            MSG_WAITERS.queue = r;
            // ifr.src = uri;
            setIFRSrc(uri);
            await new Promise(r2 => {MSG_WAITERS.ready=r2;});
            ifr.contentWindow.postMessage({type:"send"});
        });
    }
    (async () => {
        const uname = mw.config.get("wgUserName")??"Person0192837465";
        const getTemplate = async () => {
            let gdef = uname === "Person0192837465";
            let req;
            req = await fetch(`https://meta.miraheze.org/w/index.php?action=raw&ctype=application/javascript&title=User:${uname}/${PWRPATH}/template.json`, {method:"GET"});
            if (req.status === 404) {
                gdef = true;
                req = await fetch(`https://meta.miraheze.org/w/index.php?action=raw&ctype=application/javascript&title=User:Person0192837465/${PWRPATH}/template.json`, {method:"GET"});
            } else if (req.status !== 200) {
                alert("well that's awkward, the api isn't working, report this to user Person0192837465");
                return true;
            }
            if (req.status !== 200) {
                alert("something went wrong, the global default template couldn't be found, report this to user Person0192837465");
                return true;
            }
            templates = await req.json();
            if (!("default" in templates)) {
                if (gdef) {
                    alert("something went wrong, the global default template couldn't be found, report this to user Person0192837465");
                    return true;
                }
                req = await fetch(`https://meta.miraheze.org/w/index.php?action=raw&ctype=application/javascript&title=User:Person0192837465/${PWRPATH}/template.json`, {method:"GET"});
                if (req.status !== 200) {
                    alert("something went wrong, the global default template couldn't be found, report this to user Person0192837465");
                    return true;
                }
                templates["default"] = (await req.json())["default"];
            }
            // $schema is used to get my (and hopefully your) IDE to flag issues with the templates
            // so it shouldn't be interpreted as a template
            delete templates["$schema"];
            template_data = templates["default"];
            for (const name in templates) {
                if (name === "default") continue;
                templsel.appendChild(make("option", {value:name,textContent:name}));
            }
            templsel.onchange = () => {
                template_data = templates[templsel.value];
                makeTemplateParams();
            };
            makeTemplateParams();
            return false;
        };
        if (await getTemplate()) return;
        RQL_TABLE.replaceChildren(...(await scrapeQueue()).map(v => makeReqListEntry(v)));
        document.getElementById("populate-button").onclick = populateTemplate;
    })();
}
