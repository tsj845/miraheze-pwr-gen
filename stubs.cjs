const indexphp = require("./stubs/indexphp.cjs");
/**
 * @typedef {{type:"send",id:string}|{type:"data",data:ReqData,id:string}|{type:"ready"}} MSG
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
 * @typedef TemplateParamDef
 * @type {{name:string,display?:string,multiline?:boolean,default?:string,"ro-if-udf"?:string[],"nd-if-udf"?:string[],"nd-if-def"?:string[],values?:string[]}}
 */
/**
 * @typedef TemplateData
 * @type {object}
 * @prop {TemplateContent[]} template
 * @prop {TemplateParamDef[]} params
 */

/**
 * @typedef MWCONFIGGET
 * @type {{
 * (selection:"debug")=>number;
 * (selection:"skin")=>string;
 * (selection:"stylepath")=>string;
 * (selection:"wgArticlePath")=>string;
 * (selection:"wgCaseSensitiveNamespaces")=>number[];
 * (selection:"wgContentLanguage")=>string;
 * (selection:"wgContentNamespaces")=>number[];
 * (selection:"wgDBName")=>string;
 * (selection:"wgWikiID")=>string;
 * (selection:"wgExtensionAssetsPath")=>string;
 * (selection:"wgFormattedNamespaces")=>Record<number,string>;
 * (selection:"wgNamespaceIds")=>Record<string,number>;
 * (selection:"wgScript")=>string;
 * (selection:"wgScriptPath")=>string;
 * (selection:"wgServer")=>string;
 * (selection:"wgServerName")=>string;
 * (selection:"wgSiteName")=>string;
 * (selection:"wgVariantArticlePath")=>string|false;
 * (selection:"wgVersion")=>string;
 * (selection:"wgMFMode")=>string|null;
 * (selection:"wgAction")=>indexphp.ACTION;
 * (selection:"wgArticleID")=>number;
 * (selection:"wgCanonicalNamespace")=>string;
 * (selection:"wgCanonicalSpecialPageName")=>string|false;
 * (selection:"wgCategories")=>string[];
 * (selection:"wgCurRevisionId")=>number;
 * (selection:"wgIsArticle")=>boolean;
 * (selection:"wgIsProbablyEditable")=>boolean;
 * (selection:"wgIsRedirect")=>boolean;
 * (selection:"wgNamespaceNumber")=>number;
 * (selection:"wgPageContentLanguage")=>string;
 * (selection:"wgPageContentModel")=>"wikitext"|"javascript"|"css"|"Scribunto";
 * (selection:"wgPageName")=>string;
 * (selection:"wgPageParseReport")=>Record<string,Record<string,any>>&{"limitreport":unknown};
 * (selection:"wgRedirectedFrom")=>string|null;
 * (selection:"wgRelevantPageName")=>string;
 * (selection:"wgRelevantUserName")=>string|null;
 * (selection:"wgRelevantPageIsProbablyEditable")=>boolean;
 * (selection:"wgRestrictionEdit")=>string[]|null;
 * (selection:"wgRestrictionMove")=>string[];
 * (selection:"wgRevisionId")=>number;
 * (selection:"wgSearchType")=>string|null;
 * (selection:"wgTitle")=>string;
 * (selection:"wgUserEditCount")=>number|null;
 * (selection:"wgUserGroups")=>string[]|null;
 * (selection:"wgUserId")=>number|null;
 * (selection:"wgUserLanguage")=>string;
 * (selection:"wgUserName")=>string|null;
 * (selection:"wgUserRegistration")=>number|null;
 * (selection:"wgIsMainPage")=>true|null;
 * (selection:"wgUserVariant")=>string|null;
 * (selection:"wgPostEdit")=>"saved"|"created"|"restored"|null;
 * (selection:"wgDiffOldId")=>number|null;
 * (selection:"wgDiffNewId")=>number|null;
 * }}
 */

/**
 * @typedef MWCONFIG
 * @type {object}
 * @prop {MWCONFIGGET} get
 */

exports.ReqData = this.ReqData;
exports.MSG = this.MSG;
exports.TemplateData = this.TemplateData;
exports.MWCONFIG = this.MWCONFIG;
