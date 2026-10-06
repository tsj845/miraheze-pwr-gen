const PWRPATH = "pwr"+(new URL(document.location.href).searchParams.get("pwrdev")!==null?"/dev":"");
jQuery(function () {
    // mw.loader.load("/w/index.php?title=User:Person0192837465/pwr/loader.js&action=raw&ctype=text/javascript");
    mw.loader.load(`/w/index.php?title=User:Person0192837465/${PWRPATH}/loader.js&action=raw&ctype=text/javascript`);
});
