// My HTTP Request

var outUrl = "cgi-bin/run.cgi";

// check response of HTTP request, only if ready
function checkResponse(r, on_timeout, no_spinner, freeze_msg) {
	try {
	 	if (r.readyState==4 && r.status==200) return true; else return false; 
	} catch(e) {
		// $i("icon_loading").style.visibility = "hidden"; WAINING MESSAGE
		msgprint("error:Request timed out, try again");
		if(on_timeout)
			on_timeout();

		hide_loading();

		if(freeze_msg)
			unfreeze();
		return false;
	}
}

var pending_req = 0;

// new XMLHttpRequest object
function newHttpReq() { 
	if (!isIE) 
 		var r=new XMLHttpRequest(); 
	else if (window.ActiveXObject) 
		var r=new ActiveXObject("Microsoft.XMLHTTP"); 
	return r;
}

// call execute serverside request        
function $c(command, args, fn, on_timeout, no_spinner, freeze_msg) {
	var req=newHttpReq();
	ret_fn=function() {
		if (checkResponse(req, on_timeout, no_spinner, freeze_msg)) {
			var rtxt = req.responseText;
			if(!no_spinner)hide_loading(); // Loaded
			rtxt = rtxt.replace(/'\^\\x05\*'/g, 'null');
			//alert(rtxt);
			var r = eval("var a="+rtxt+";a")
			if(r.exc && r.__redirect_login) {
				msgprint(r.exc, 0, function() { document.location = login_file });
				// logout
				return;
			}
			// unfreeze
			if(freeze_msg)unfreeze();
			if(r.exc) { errprint(r.exc); };
			if(r.server_messages) { msgprint(r.server_messages);};
			if(r.docs) { LocalDB.sync(r.docs); }
			saveAllowed = true;
			if(fn)fn(r, rtxt);
		}
	}
	req.onreadystatechange=ret_fn;
	req.open("POST",outUrl,true);
	req.setRequestHeader("ENCTYPE", "multipart/form-data");
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
	args['cmd']=command;
	//alert(makeArgString(args));
	req.send(makeArgString(args)); 
	if(!no_spinner)set_loading(); // Loading
	if(freeze_msg)freeze(freeze_msg,1);
}

// For calling an object
function $c_obj(doclist, method, arg, call_back, no_spinner, freeze_msg) {
	// single
	if(doclist.substr) {
		$c('runserverobj',{
			'doctype':doclist,
			'method':method, 
			'arg':arg}, call_back);	
	} else {
	// doclist
		$c('runserverobj',{
			'docs':compress_doclist(doclist), 
			'method':method, 
			'arg':arg}, call_back, no_spinner, freeze_msg);
	}
}

// For loading a matplotlib Plot
function $c_graph(img, control_dt, method, arg) {
	img.src = outUrl + '?' + makeArgString({cmd:'get_graph', dt:control_dt, method:method, arg:arg});
}

function my_eval(co) {
	var w = window;

	// Evaluate script
	if (!w.execScript) {
		if (/Gecko/.test(navigator.userAgent)) {
			eval(co, w); // Firefox 3.0
		} else {
			eval.call(w, co);
		}
	} else {
		w.execScript(co); // IE
	}
}

// For loading javascript file on demand using AJAX
function $c_js(fn, callback) {
	var req=newHttpReq();

	ret_fn=function() {
		if (checkResponse(req, function() { }, 1, null)) {
			if(req.responseText.substr(0,9)=='Not Found') {
				alert(req.responseText);
				return;	
			}
			my_eval(req.responseText);
			callback();
		}
	}

	req.onreadystatechange=ret_fn;
	req.open("POST",'cgi-bin/getjsfile.cgi',true);
	req.setRequestHeader("ENCTYPE", "multipart/form-data");
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
	req.send(makeArgString({filename:fn})); 
}

function makeArgString(dict) {
	var varList = [];

	for(key in dict){
		varList[varList.length] = key + '=' + encodeURIComponent(dict[key]);
	}
	return varList.join('&');
}
