{
    /**
     * @typedef {import("./stubs.cjs").MWCONFIG} MWCONFIG
     */
    /**
     * @global
     * @type {{config:MWCONFIG}}
     * @name mw
     */
    let mw = window.mw;
    /**
     * @typedef {import("./stubs.cjs").MSG} MSG
     * @typedef {import("./stubs.cjs").ReqData} ReqData
     */
    // const title = mw.config.get("wgTitle");
    let title = mw.config.get("wgPageName");
    const select = (query, value) => {
        const result = ([...(document.querySelector(query)?.childNodes??[])].map(node => node.textContent).map(v => v.trim()).filter(v => v.length).join("\n"))||null;
        if (result === null) {
            return value ? null : "DATA NOT FOUND";
        }
        return value ? result === value : result;
    };
    /**@type {ReqData} */
    const data = {
        "pageid":title,
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
    console.log(data);
    window.addEventListener("message", /**@param {MessageEvent<MSG>} ev*/(ev) => {
        try {
            switch (ev.data.type) {
                case "send": {
                    window.parent.postMessage({type:"data",data,id:ev.data.id});
                    break;
                }
            }
        } catch {}
    });
    window.parent.postMessage({type:"ready"});
}
