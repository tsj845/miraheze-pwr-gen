const { MWCONFIG, MWUSER } = require("./stubs/mw.cjs");
/**
 * @typedef {{type:"send"}|{type:"data",data:ReqData}|{type:"ready"}|{type:"queue",data:RListData[]}} MSG
 */
/**
 * @typedef {{pageid:string,sitename:string,domain:string,requester:string,private:boolean,realperson:boolean,nsfw:boolean,body:string,comments:{author:string,date:string,body:string}[]}} ReqData
 */
/**
 * @typedef {"=sitename"|"=pageid"|"=body"|"=private"|"=realperson"|"=nsfw"} CanonParam
 * @typedef {string} TemplateString
 * @typedef {{"break":true}} TemplateBreak
 * @typedef {{"param":string|CanonParam}} TemplateParam
 */
/**
 * @typedef TemplateContent
 * @type {TemplateString|TemplateBreak|TemplateParam}
 */
/**
 * @typedef {{name:string,type:"const",value:string}} TPConst
 * @typedef {{name:string,type:"text",display?:string,default?:string,multiline?:boolean,"ro-if-udf"?:string[],"nd-if-udf"?:string[],"nd-if-def"?:string[]}} TPText
 * @typedef {{name:string,type:"choice",display?:string,default?:string,values:string[],"ro-if-udf"?:string[],"nd-if-udf"?:string[],"nd-if-def"?:string[]}} TPChoice
 */
/**
 * @typedef TemplateParamDef
 * @type {TPConst|TPChoice|TPText}
 * @ type {{name:string,type:"const"|"text"|"choice",display?:string,multiline?:boolean,default?:string,"ro-if-udf"?:string[],"nd-if-udf"?:string[],"nd-if-def"?:string[],values?:string[]}}
 */
/**
 * @typedef TemplateData
 * @type {object}
 * @prop {TemplateContent[]} template
 * @prop {TemplateParamDef[]} params
 */

/**
 * @typedef MW
 * @type {object}
 * @prop {MWCONFIG} config
 * @prop {MWUSER} user
 */

/**
 * @typedef RListData
 * @type {object}
 * @prop {string} date
 * @prop {string} requester
 * @prop {string} sitename
 * @prop {string} url
 * @prop {string} source
 * @prop {string} id
 */

/**
 * @typedef SETTINGS
 * @type {object}
 * @prop {string} artifact_subpath the subpath under USER/pwr that artifacts will be placed in
 * @prop {string} default_template the name of the default template
 * @prop {string} template_path the subpath under USER/pwr where template definitions are found
 * @prop {string} curated_path the subpath under USER/pwr where curated requests can be found (used when importing), not finalized
 * @prop {string} review_page the path under USER where reviews will be published to
 * @prop {string} rp_position_marker the contents of the comment that tracks where the next batch of reviews should be inserted
 */

/**
 * @typedef ScrapeBlueprint
 * @type {Record<string,{selector:string,transform?:{type:"gather",default?:string}|{type:"gather-map",default?:any,map:Record<string,any>}|{type:"map-each",blueprint:ScrapeBlueprint}}>}
 */

exports.RListData = this.RListData;
exports.ReqData = this.ReqData;
exports.MSG = this.MSG;
exports.TemplateData = this.TemplateData;
exports.TemplateParamDef = this.TemplateParamDef;
exports.SETTINGS = this.SETTINGS;
exports.ScrapeBlueprint = this.ScrapeBlueprint;
