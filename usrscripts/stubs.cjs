/**@module stubs */
/**
 * @typedef {{type:"send",id:string}|{type:"data",data:ReqData,id:string}} MSG
 */
/**
 * @typedef {{pageid:string,sitename:string,domain:string,requester:string,private:boolean,realperson:boolean,nsfw:boolean,body:string,comments:{author:string,date:string,body:string}[]}} ReqData
 */

// const mw = {
//     Api: class {
//         constructor(){}
//     }
// };

class API {
    constructor() {}
}
/**
 * @typedef MW
 * @type {object}
 * @prop {typeof API} Api
 */

exports.MW = this.MW;
exports.ReqData = this.ReqData;
exports.MSG = this.MSG;
