/**
 * @file
 * stubs for `api.php` endpoints
 */

/**
 * @typedef Revision
 * @type {object}
 * @prop {number} revid
 * @prop {number} parentid
 * @prop {boolean} minor
 * @prop {string} user
 * @prop {string} timestamp
 * @prop {string} comment
 */

/**
 * @typedef PageInfo
 * @type {object}
 * @prop {number} pageid
 * @prop {number} ns
 * @prop {string} title
 */

/**
 * @typedef EditData
 * @type {object}
 * @prop {string} title
 * @prop {number} pageid
 * @prop {string|number|"new"} section
 * @prop {string} sectiontitle
 * @prop {string} text
 * @prop {string} prependtext
 * @prop {string} appendtext
 * @prop {string} summary
 * @prop {"1"} [minor]
 * @prop {"1"} [notminor]
 * @prop {"1"} [bot]
 * @prop {number} baserevid
 * @prop {string} basetimestamp
 * @prop {string} starttimestamp
 * @prop {"1"} [recreate]
 * @prop {"1"} [createonly]
 * @prop {"1"} [nocreate]
 */

exports.Revision = this.Revision;
exports.PageInfo = this.PageInfo;
exports.EditData = this.EditData;
