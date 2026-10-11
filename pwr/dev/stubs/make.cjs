/**
 * @file
 * this entire file is dedicated to the sole purpose of providing the best code
 * completion possible for the `make` function
 */

/**
 * @typedef {{id?:string,classList?:string[],hidden?:boolean,onclick?:(ev:MouseEvent)=>void}} MK_Common_Opts
 */

/**
 * @typedef {{oninput?:(ev:InputEvent)=>void}} _OnInput
 * @typedef {{onchange?:(ev:Event)=>void}} _OnChange
 * @typedef {{autocapitalize?:"none"|"off"|"sentences"|"on"|"words"|"characters"}} _autocapitalize
 * @typedef {{autocomplete?:"off"|"on"}} _autocomplete
 * @typedef {{disabled?:boolean}} _disabled
 * @typedef {{max?:number,min?:number}} _maxmin
 * @typedef {{maxLength?:number,minLength?:number}} _maxminlength
 * @typedef {{name?:string}} _name
 * @typedef {{pattern?:string,placeholder?:string}} _patternplaceholder
 * @typedef {{readOnly?:boolean}} _readonly
 * @typedef {{required?:boolean}} _required
 * @typedef {{size?:number}} _size
 * @typedef {{step?:number}} _step
 */

/**
 * @template T
 * @typedef {{value?:T}} _value<T>
 */


/**
 * @typedef {_disabled&_name&_value<string>} _in_button_Opts
 * @typedef {_disabled&_name&_required&_value<string>&{checked?:boolean}} _in_checkbox_Opts
 * @typedef {_autocapitalize&_autocomplete&_disabled&_name&_value<string>} _in_color_Opts
 * @typedef {_autocapitalize&_autocomplete&_disabled&_maxmin&_name&_readonly&_required&_step&_value<string>} _in_date_Opts
 * @typedef {_autocapitalize&_autocomplete&_disabled&_maxmin&_name&_readonly&_required&_step&_value<string>} _in_datetime_local_Opts
 * @typedef {_autocomplete&_disabled&_maxminlength&_name&_patternplaceholder&_readonly&_required&_size&_value<string>} _in_email_Opts
 * @typedef {_autocapitalize&_autocomplete&_disabled&_name&_readonly&_required&_value<string>&{accept?:string,capture?:"user"|"environment",multiple?:boolean}} _in_file_Opts
 * @typedef {_autocapitalize&_autocomplete&_disabled&_name&_value<string>} _in_hidden_Opts
 * @typedef {_disabled&_name&{alt?:string,height?:number,src?:string,width?:number}} _in_image_Opts
 * @typedef {_autocapitalize&_autocomplete&_disabled&_maxmin&_name&_readonly&_required&_step&_value<number>&{placeholder?:number}} _in_number_Opts
 * @typedef {_autocomplete&_disabled&_maxminlength&_name&_patternplaceholder&_readonly&_required&_size&_step&_value<string>} _in_password_Opts
 * @typedef {_disabled&_name&_required&_value<string>&{checked?:boolean}} _in_radio_Opts
 * @typedef {_disabled&_maxmin&_name&_step&_value<number>} _in_range_Opts
 * @typedef {_autocapitalize&_autocomplete&_disabled&_maxminlength&_name&_patternplaceholder&_readonly&_required&_size&_value<string>} _in_search_Opts
 * @typedef {_autocomplete&_disabled&_maxminlength&_name&_patternplaceholder&_readonly&_required&_size&_value<string>} _in_tel_Opts
 * @typedef {_autocapitalize&_autocomplete&_disabled&_maxminlength&_name&_patternplaceholder&_readonly&_required&_size&_value<string>} _in_text_Opts
 * @typedef {_autocomplete&_disabled&_name&_readonly&_required&_value<string>&{max?:string,min?:string,step?:number|"any"}} _in_time_Opts
 * @typedef {_autocomplete&_disabled&_maxminlength&_name&_patternplaceholder&_readonly&_required&_size&_value<string>} _in_url_Opts
 * @typedef {_autocapitalize&_autocomplete&_disabled&_maxminlength&_name&_readonly&_required&{rows?:number,cols?:number,autocorrect?:"on"|"off",placeholder?:string,spellcheck?:"true"|"false"|"default",wrap?:"hard"|"soft",defaultValue?:string,value?:string}} _in_textarea_Opts
 */

// mutually exclusive content options
/**
 * @typedef {{children?:(HTMLElement|string)[]}} _MK_Content_Children
 * @typedef {{textContent?:string}} _MK_Content_Text
 */

/**
 * @typedef MK_Content_Opts
 * @type {_MK_Content_Children|_MK_Content_Text}
 */

/**
 * @typedef ElementMaker
 * @type {{
 * (tag:"a", options?:MK_Common_Opts&MK_Content_Opts&{href?:string,target?:"_self"|"_blank"|"_parent"|"_top"|"_unfencedTop"}): HTMLAnchorElement;
 * (tag:"br", options?:{}): HTMLBRElement;
 * (tag:"code", options?:MK_Common_Opts&MK_Content_Opts): HTMLElement;
 * (tag:"del", options?:MK_Common_Opts&MK_Content_Opts): HTMLModElement;
 * (tag:"div", options?:MK_Common_Opts&MK_Content_Opts): HTMLDivElement;
 * (tag:"fieldset", options?:MK_Common_Opts&MK_Content_Opts&{disabled?:string,name?:string}): HTMLFieldSetElement;
 * (tag:"h1"|"h2"|"h3"|"h4"|"h5"|"h6", options?:MK_Common_Opts&MK_Content_Opts): HTMLHeadingElement;
 * (tag:"img", options?:MK_Common_Opts&{src:string}): HTMLImageElement;
 * (tag:"input", options?:MK_Common_Opts&_in_text_Opts&{type?:"text"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_button_Opts&{type:"button"}): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_checkbox_Opts&{type:"checkbox"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_color_Opts&{type:"color"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_date_Opts&{type:"date"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_datetime_local_Opts&{type:"datetime-local"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_email_Opts&{type:"email"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_file_Opts&{type:"file",oncancel?:(ev:Event)=>void}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_hidden_Opts&{type:"hidden",onclick:never}): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_image_Opts&{type:"image"}): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_number_Opts&{type:"number"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_password_Opts&{type:"password"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_radio_Opts&{type:"radio"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_range_Opts&{type:"range"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_search_Opts&{type:"search"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_tel_Opts&{type:"tel"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_time_Opts&{type:"time"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"input", options:MK_Common_Opts&_in_url_Opts&{type:"url"}&_OnInput&_OnChange): HTMLInputElement;
 * (tag:"ins", options?:MK_Common_Opts&MK_Content_Opts): HTMLModElement;
 * (tag:"kbd", options?:MK_Common_Opts&MK_Content_Opts): HTMLElement;
 * (tag:"label", options?:MK_Common_Opts&MK_Content_Opts&{for?:string}): HTMLLabelElement;
 * (tag:"legend", options?:MK_Common_Opts&MK_Content_Opts): HTMLLegendElement;
 * (tag:"li", options?:MK_Common_Opts&MK_Content_Opts&{value?:number}): HTMLLIElement;
 * (tag:"ol", options?:MK_Common_Opts&MK_Content_Opts&{type?:"a"|"A"|"i"|"I"|"1",start?:number,reversed?:boolean}): HTMLOListElement;
 * (tag:"optgroup", options?:MK_Common_Opts&{label?:string,disabled?:boolean,children?:HTMLElement[]}): HTMLOptGroupElement;
 * (tag:"option", options?:MK_Common_Opts&{value?:string,disabled?:boolean,textContent?:string,defaultSelected?:boolean}): HTMLOptionElement;
 * (tag:"p", options?:MK_Common_Opts&MK_Content_Opts): HTMLParagraphElement;
 * (tag:"pre", options?:MK_Common_Opts&MK_Content_Opts): HTMLPreElement;
 * (tag:"select", options?:MK_Common_Opts&{children?:HTMLElement[],name?:string,disabled?:boolean,multiple?:boolean,required?:boolean,size?:number}): HTMLSelectElement;
 * (tag:"span", options?:MK_Common_Opts&MK_Content_Opts): HTMLSpanElement;
 * (tag:"table", options?:MK_Common_Opts&MK_Content_Opts): HTMLTableElement;
 * (tag:"tbody"|"thead"|"tfoot", options?:MK_Common_Opts&MK_Content_Opts): HTMLTableSectionElement;
 * (tag:"td", options?:MK_Common_Opts&MK_Content_Opts&{colSpan?:number,rowSpan?:number,headers?:string}): HTMLTableCellElement;
 * (tag:"textarea", options?:MK_Common_Opts&_in_textarea_Opts): HTMLTextAreaElement;
 * (tag:"th", options?:MK_Common_Opts&MK_Content_Opts&{abbr?:string,colSpan?:number,rowSpan?:number,headers?:string,scope?:"row"|"col"|"rowgroup"|"colgroup"}): HTMLTableCellElement;
 * (tag:"tr", options?:MK_Common_Opts&MK_Content_Opts): HTMLTableRowElement;
 * (tag:"ul", options?:MK_Common_Opts&MK_Content_Opts): HTMLUListElement;
 * }}
 */

exports.ElementMaker = this.ElementMaker;

