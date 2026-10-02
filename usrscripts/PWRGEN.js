{
    /**
     * @typedef {import("./stubs.cjs").MSG} MSG
     * @typedef {import("./stubs.cjs").ReqData} ReqData
     */
    // const api = new mw.Api();
	const main_content = document.getElementById("person-pwr-gen-content");

    /**@type {Record<string,(data:ReqData)=>void>} */
    const DATA_REQ_MAP = {};

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
    
    main_content.append(
        make("div",{id:"main-content",classList:["populated"],children:[
            make("span", {id:"rwq-container",children:[
                make("input", {type:"text",id:"rwq-id",onkeyup:(ev)=>{if(ev.code==="Return"||ev.code==="Enter")document.getElementById("populate-button").click();}}),
                make("input", {type:"button",id:"populate-button",value:"Populate"})
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
                    make("b", {textContent:"Template Fields"}),make("be")
                ]})
            ]})
        ]}),
        make("div", {id:"output-container",children:[
            make("input", {type:"button",value:"Copy WikiText",id:"copy-button",onclick:()=>{navigator.clipboard.writeText(document.getElementById("output").value);}}),make("br"),
            make("textarea", {readonly:true,id:"output",rows:10,cols:50})
        ]})
    );
    const RWQ_ID = document.getElementById("rwq-id");

    document.getElementById("populate-button").onclick = async () => {
        // the pageid input allows for full or partial urls too, strip that stuff
        const pageid = RWQ_ID.value.includes("/") ? RWQ_ID.value.slice(RWQ_ID.value.lastIndexOf("/")+1) : RWQ_ID.value;
        // scrape the page
        // const resp = await fetch(`https://${document.location.hostname}/pwr/scrape?id=${pageid}`, {method:"GET"});
        // // error from the server, oh well
        // if (resp.status !== 200) {
        //     alert(`Could not load request data: Error ${resp.status}\n${await resp.text()}`);
        //     return;
        // }
        // /**@type {ReqData} */
        // const data = await resp.json();
        // rwq_data = clone(data);
        // // do transformations to get the right data in rwq_data
        // rwq_data.pageid = `Special:RequestWikiQueue/${pageid}`;
        // for (const key of ["private","realperson","nsfw"]) {
        //     rwq_data[key] = ["N","Y"][Number(data[key])];
        // }
        const data = await scrape(pageid);
        const $ = document.querySelector.bind(document);
        // populate the wiki request properties
        $("span#prop-sitename").textContent = `Sitename: ${data.sitename}`;
        $("span#prop-domain").textContent = `Domain: ${data.domain}`;
        $("span#prop-private").textContent = `Private: ${["No","Yes"][Number(data.private)]}`;
        $("span#prop-realperson").textContent = `Real Person: ${["No","Yes"][Number(data.realperson)]}`;
        $("span#prop-nsfw").textContent = `NSFW: ${["No","Yes"][Number(data.nsfw)]}`;
        $("pre#prop-body").textContent = data.body;
        $("div#comments-container").replaceChildren(...data.comments.map(makeComment));
        // render the template
        // renderTemplate();
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
	ifr.src = `https://meta.miraheze.org/wiki/Special:RequestWikiQueue/91956`;
    window.addEventListener("message", /**@param {MessageEvent<MSG>} ev*/(ev) => {
        switch (ev.data.type) {
            case "data": {
                //TODO: have a whole bunch of state checking to make sure we don't wipe any partially filled
                //      template unintentionally
                DATA_REQ_MAP[ev.data.id](ev.data.data);
                break;
            }
            case "ready": {
                if (typeof DATA_REQ_MAP["ready"] === "function") {
                    DATA_REQ_MAP["ready"]();
                }
                break;
            }
        }
    });
    let dreq_id = 0;
    /**
     * @param {string} pageid
     * @returns {Promise<ReqData>}
     */
    function scrape(pageid) {
        return new Promise(async r => {
            const id = `dreq-${dreq_id++}`;
            DATA_REQ_MAP[id] = r;
            ifr.src = `https://meta.miraheze.org/wiki/Special:RequestWikiQueue/${pageid}`;
            await new Promise(r2 => {DATA_REQ_MAP["ready"]=r2;});
            ifr.contentWindow.postMessage({type:"send",id});
            // setTimeout(() => {
            //     ifr.contentDocument.onreadystatechange = () => {
            //         if (ifr.contentDocument.readyState === "complete") {
            //             ifr.contentDocument.onreadystatechange = () => {};
            //         }
            //     };
            // }, 1);
        });
    }
}