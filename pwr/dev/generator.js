{
    /**
     * @global
     * @type {import("./stubs.cjs").MW}
     */
    let mw = window.mw;
    const $ = document.querySelector.bind(document);
    /**
     * @typedef {import("./stubs.cjs").ReqData} ReqData
     * @typedef {import("./stubs.cjs").TemplateData} TemplateData
     * @typedef {import("./stubs.cjs").RListData} RListData
     * @typedef {import("./stubs.cjs").ReviewStatus} ReviewStatus
     */
	const main_content = document.getElementById("person-pwr-gen-content");
    main_content.setAttribute("data-pwr-state", "select");
    const make = PWR.make;
    const clone = PWR.clone;

    const DEFAULT_TEMPlATE = PWR.SETTINGS.DEFAULT_TEMPlATE;
    
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
                make("input", {value:"Save",type:"button",id:"rwq-save",hidden:true})
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
                    make("select", {id:"template-select",defaultSelected:DEFAULT_TEMPlATE,children:[
                        make("option", {value:DEFAULT_TEMPlATE,textContent:DEFAULT_TEMPlATE})
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
    /**@type {{pageid:string,sitename:string,domain:string,requester:string,private:string,realperson:string,nsfw:string,body:string,comments:{author:string,date:string,body:string}[],ts:string,sig:string,sigts:string}|null} */
    let rwq_data = null;
    /**@type {Record<string,TemplateData|string>} */
    let templates;
    /**@type {typeof PWR.Template.TemplateInstance.TYPE} */
    let template_instance
    /**
     * @type {Record<string,{pos:number,artifact:Record<string,string|null>,render:string,source:string,id:string,template:string,canon:ReqData,params:(string|null)[]}>}
     */
    const review_data = {};
    let review_count = 0;
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
        if (reqid in review_data) {
            const rd = review_data[reqid];
            template_instance = PWR.Template.renderParams(templates[rd.template], rd.artifact);
            await populateTemplate(template_instance.canon, src);
        } else {
            await populateTemplate(id, src);
            template_instance = PWR.Template.renderParams(templates[DEFAULT_TEMPlATE], Object.fromEntries(Object.entries(rwq_data).map(r=>["="+r[0],r[1]])));
        }
        template_instance.attach($("#params-container"));
        main_content.setAttribute("data-pwr-state", "review");
        OUTPUTWIKITEXT.value = template_instance.render();
        template_instance.onchange = (ti) => {
            OUTPUTWIKITEXT.value = ti.render();
        };
    }
    document.getElementById("rwq-discard").onclick = () => {
        transitionToSelect();
    };
    document.getElementById("rwq-draft").onclick = () => {
        saveDraft();
        transitionToSelect();
    };
    document.getElementById("rwq-save").onclick = () => {
        saveDraft();
        transitionToSelect();
    };
    function saveDraft() {
        const key = `${csource}#${RWQ_ID.value}`;
        // const akey = {source:csource,id:RWQ_ID.value};
        let pos;
        if (key in review_data) {
            pos = review_data[key].pos;
        } else {
            pos = review_count ++;
        }
        const render = template_instance.render();
        // PWR.Artifacts.IN_PROGRESS.set(akey, {
        //     date: Date.now(),
        //     template: templsel.value,
        //     artifact: template_instance.artifact()
        // });
        // PWR.Artifacts.REVIEW_STATUS.set(akey, {status:"inprogress"});
        review_data[key] = {
            id: RWQ_ID.value,
            artifact: template_instance.artifact(),
            render,
            source: csource,
            template: templsel.value,
            pos
        };
        template_instance = null;
    }
    function transitionToSelect() {
        main_content.setAttribute("data-pwr-state", "select");
        OUTPUTWIKITEXT.value = Object.values(review_data).sort((a, b) => a.pos-b.pos).map(v => v.render).join("\n\n");
    }

    /**
     * accepts a request id or request data object as a target
     * @param {(string|ReqData)?} target source for paramaters
     * @param {string} src where this request came from
     */
    async function populateTemplate(target, src) {
        /**@type {ReqData} */
        let data;
        if (typeof target !== "object" || target === null) {
            // the pageid input allows for full or partial urls too, strip that stuff
            const pageid = target !== null ? String(target) : (RWQ_ID.value.includes("/") ? RWQ_ID.value.slice(RWQ_ID.value.lastIndexOf("/")+1) : RWQ_ID.value);
            data = await PWR.Scrape.scrapeRequest(pageid);
        } else {
            data = target;
        }
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

    (async () => {
        const uname = mw.config.get("wgUserName")??"Person0192837465";
        await PWR.SETTINGS.init();
        templates = await PWR.Template.getUserTemplates();
        templates[DEFAULT_TEMPlATE] = PWR.Template.parse(await PWR.API.getWikitext(templates[DEFAULT_TEMPlATE]));
        for (const name in templates) {
            if (name === "default") continue;
            templsel.appendChild(make("option", {value:name,textContent:name}));
        }
        templsel.onchange = async () => {
            const tn = templsel.value;
            if (typeof templates[tn] === "string") {
                templates[tn] = PWR.Template.parse(await PWR.API.getWikitext(templates[tn]));
            }
            template_instance = PWR.Template.renderParams(templates[tn], template_instance.artifact());
            template_instance.attach($("#params-container"));
            template_instance.onchange = (ti) => {
                OUTPUTWIKITEXT.value = ti.render();
            };
            OUTPUTWIKITEXT.value = template_instance.render();
        };
        RQL_TABLE.replaceChildren(...(await PWR.Scrape.scrapeQueue()).map(v => makeReqListEntry(v)));
        document.getElementById("populate-button").onclick = populateTemplate;
    })();
}
