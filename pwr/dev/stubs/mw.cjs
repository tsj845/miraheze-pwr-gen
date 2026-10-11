/**
 * @file
 * this file contains stubs for the global `mw` object
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


/**
 * @typedef MWUSERTOKENSGET
 * @type {{
 * (token:"csrfToken")=>string;
 * }}
 */


/**
 * @typedef MWUSER
 * @type {object}
 * @prop {{get:MWUSERTOKENSGET}} tokens
 */


exports.MWCONFIG = this.MWCONFIG;
exports.MWUSER = this.MWUSER;
