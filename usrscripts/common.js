jQuery(function($){
	let title = mw.config.get("wgPageName");
	// title = title.slice(0,title.lastIndexOf("/"));
	if (!title.startsWith("Special:RequestWikiQueue/")) {
		if (title === "User:Person0192837465/pwr-gen") {
			mw.loader.load("/w/index.php?title=User:Person0192837465/PWRGEN.js&action=raw&ctype=text/javascript");
            mw.loader.load("/w/index.php?title=User:Person0192837465/PWRGEN.css&action=raw&ctype=text/css", "text/css")
			return;
		}
		console.log(title);
		return;
	}
	mw.loader.load("/w/index.php?title=User:Person0192837465/PWR.js&action=raw&ctype=text/javascript");
});
