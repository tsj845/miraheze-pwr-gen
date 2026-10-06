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
    /**
     * @typedef {import("../stubs.cjs").MSG} MSG
     * @typedef {import("../stubs.cjs").ReqData} ReqData
     * @typedef {import("../stubs.cjs").RListData} RListData
     */
    // const title = mw.config.get("wgTitle");
    let title = mw.config.get("wgPageName");
    /**
     * @param {string} query
     * @param {string|null} value
     * @param {Document|HTMLElement} parent
     * @returns {string}
     */
    const select_ = (parent, query, value) => {
        const result = ([...(parent.querySelector(query)?.childNodes??[])].map(node => node.textContent).map(v => v.trim()).filter(v => v.length).join("\n"))||null;
        if (result === null) {
            return value ? null : "DATA NOT FOUND";
        }
        return value ? result === value : result;
    };
    if (title.includes("/")) {
        const select = (query, value) => select_(document, query, value);
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
        window.addEventListener("message", /**@param {MessageEvent<MSG>} ev*/(ev) => {
            try {
                switch (ev.data.type) {
                    case "send": {
                        window.parent.postMessage({type:"data",data});
                        break;
                    }
                }
            } catch {}
        });
        window.parent.postMessage({type:"ready"});
    } else {
        /**@type {RListData[]} */
        const data = [];
        const tablebody = document.querySelector("table").tBodies[0];
        tablebody.querySelectorAll("tr").forEach(node => {
            const select = (query, value) => select_(node, query, value);
            data.push({
                date: select(".TablePager_col_cw_timestamp"),
                requester: select(".TablePager_col_cw_user bdi"),
                sitename: select(".TablePager_col_cw_sitename"),
                url: select(".TablePager_col_cw_url").split(".", 1)[0],
                source: "Request Queue",
                id: String(node.querySelector(".TablePager_col_cw_status a").href).match(/[0-9]{5,7}/)[0]
            });
        });
        window.addEventListener("message", /**@param {MessageEvent<MSG>} ev*/(ev) => {
            try {
                switch (ev.data.type) {
                    case "send": {
                        window.parent.postMessage({type:"queue",data});
                        break;
                    }
                }
            } catch {}
        });
        window.parent.postMessage({type:"ready"});
    }
}
