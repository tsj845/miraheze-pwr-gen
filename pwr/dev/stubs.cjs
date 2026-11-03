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
 * @typedef {{"cond":[string,string],"content":TemplateContent[]}} TemplateCond
 * @typedef {{"param":string|CanonParam}} TemplateParam
 */
/**
 * @typedef TemplateContent
 * @type {TemplateString|TemplateCond|TemplateParam}
 */
/**
 * @typedef {{name:string,type:"const",value:string}} TPConst
 * @typedef {{name:string,type:"text",display?:string,default?:string,essay?:boolean,"ro-if-udf"?:string[],"nd-if-udf"?:string[],"nd-if-def"?:string[]}} TPText
 * @typedef {{name:string,type:"choice",display?:string,default?:string,values:string[],"ro-if-udf"?:string[],"nd-if-udf"?:string[],"nd-if-def"?:string[]}} TPChoice
 * @typedef {{name:string,type:"checkbox",display?:string,default?:boolean,checked:string,unchecked:string,"ro-if-udf"?:string[],"nd-if-udf"?:string[],"nd-if-def"?:string[]}} TPCheckbox
 * @typedef {{name:string,type:"list",item:string[]}} TPList
 */

/**
 * @typedef {{type:"item",n:number}} ItemSpecifier
 * @typedef {{type:"range",s:number,e:number}} RangeSpecifier
 * @typedef {ItemSpecifier|RangeSpecifier} PrimaryIndirectionSpecifier
 * @typedef {{target:string,specifiers:[PrimaryIndirectionSpecifier?]}} PropertyIndirection
 */

/**
 * @typedef {{name:string,type:"const",value:string|PropertyIndirection}} IPConst
 * @typedef {{name:string,type:"text",display?:string|PropertyIndirection,default?:string|PropertyIndirection,multiline?:boolean,"ro-if-udf"?:(string|PropertyIndirection)[],"nd-if-udf"?:(string|PropertyIndirection)[],"nd-if-def"?:(string|PropertyIndirection)[]}} IPText
 * @typedef {{name:string,type:"choice",display?:string|PropertyIndirection,default?:string|PropertyIndirection,values:(string|PropertyIndirection)[],"ro-if-udf"?:(string|PropertyIndirection)[],"nd-if-udf"?:(string|PropertyIndirection)[],"nd-if-def"?:(string|PropertyIndirection)[]}} IPChoice
 * @typedef {{name:string,type:"checkbox",display?:string|PropertyIndirection,default?:boolean|PropertyIndirection,checked:string|PropertyIndirection,unchecked:string|PropertyIndirection,"ro-if-udf"?:(string|PropertyIndirection)[],"nd-if-udf"?:(string|PropertyIndirection)[],"nd-if-def"?:(string|PropertyIndirection)[]}} IPCheckbox
 * @typedef {{name:string,type:"list",item:(string|PropertyIndirection)[]}} IPList
 */

/**
 * template parameters before indirection is resolved
 * @typedef IntermediateParamDef
 * @type {IPConst|IPText|IPChoice|IPCheckbox|IPList}
 */

/**
 * @typedef TemplateParamDef
 * @type {TPConst|TPChoice|TPText|TPCheckbox|TPList}
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
 * @typedef ReviewStatus
 * @type {"reviewed"|"ignored"|"inprogress"}
 */

/**
 * @typedef ReviewStatusArtifact
 * @type {object}
 * @prop {ReviewStatus} status
 */

/**
 * @typedef InProgressArtifact
 * @type {object}
 * @prop {number} date
 * @prop {string} template
 * @prop {Record<string,string?>} artifact
 */

/**
 * @typedef SrcIdKey
 * @type {object}
 * @prop {string} source request namespace
 * @prop {string} id request id
 */

/**
 * @typedef PBI
 * @type {object}
 * @prop {boolean} required
 * @prop {"bool"|"str"|"list"} type
 * @prop {boolean} indirection
 */

/**
 * @typedef {Record<string,PBI>} PBIR
 * @typedef {{const:PBIR,text:PBIR,choice:PBIR,checkbox:PBIR,list:PBIR}} PropBehavior
 */

exports.RListData = this.RListData;
exports.ReqData = this.ReqData;
exports.MSG = this.MSG;
exports.TemplateData = this.TemplateData;
exports.TemplateContent = this.TemplateContent;
exports.TemplateParamDef = this.TemplateParamDef;
exports.IntermediateParamDef = this.IntermediateParamDef;
exports.SETTINGS = this.SETTINGS;
exports.ReviewStatus = this.ReviewStatus;
exports.ReviewStatusArtifact = this.ReviewStatusArtifact;
exports.InProgressArtifact = this.InProgressArtifact;
exports.SrcIdKey = this.SrcIdKey;
exports.PropBehavior = this.PropBehavior;
exports.PropertyIndirection = this.PropertyIndirection;
exports.PrimaryIndirectionSpecifier = this.PrimaryIndirectionSpecifier;
