/* Copyright 2005-2008, Rushabh Mehta (RMEHTA _AT_ GMAIL) 

    Web Notes Framework is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    For a copy of the GNU General Public License see 
    <http://www.gnu.org/licenses/>.
    
    Web Notes Framework is also available under a commercial license with
    patches, upgrades and support. For more information see 
    <http://webnotestech.com>
*/


var fixh = 50;
var fixw = 182;
var toolbarh = 24;
var select_register = [];
var account_id = '';
var pagewidth = 480;
var NULL_CHAR = '^\5*';
var startup_lst = [];
var login_file = 'login.html';
var datatables = {} // deprecated
var __sid150; // session id required to store here for cross domain logins
var tinyMCE;
var editAreaLoader;

// Globals
var calendar; var Calendar; 
var GraphViewer;
var text_dialog;

try {
 document.execCommand('BackgroundImageCache', false, true);
} catch(e) {}

/*
IE DETECT
*/

var agt=navigator.userAgent.toLowerCase();
var appVer = navigator.appVersion.toLowerCase();
var is_minor = parseFloat(appVer);
var is_major = parseInt(is_minor);
var iePos = appVer.indexOf('msie');
if (iePos !=-1) {
	is_minor = parseFloat(appVer.substring(iePos+5,appVer.indexOf(';',iePos)))
	is_major = parseInt(is_minor);
}
var isIE = (iePos!=-1);
var isIE6 = (isIE && is_major <= 6);
var isIE7 = (isIE && is_minor >= 7);
if (/Firefox[\/\s](\d+\.\d+)/.test(navigator.userAgent)){ //test for Firefox/x.x or Firefox x.x (ignoring remaining digits);
	var isFF = 1;
	var ffversion=new Number(RegExp.$1) // capture x.x portion and store as a number
	if (ffversion>=3) var isFF3 = 1;
	else if (ffversion>=2) var isFF2 = 1;
	else if (ffversion>=1) var isFF1 = 1;
}
/*

History 

*/

var _history_current;
function historyChange(newLocation, historyData) {
	//if(newLocation == _history_current) // already there
		//return;
		
	if(window.location.href.search('iwebnotes.com')!=-1) return; // no history for iwebnotes
	
	var t = newLocation.replace(/\%20/g, ' ');
	t = t.split('~~~');

	var c = nav_obj.ol[nav_obj.ol.length-1];

	if(t.length==2)	{
		if(c[0]==t[0] && c[1]==t[1]) return;
	} else {
		if(c[0]==t[0] && c[1]==t[1] && c[2]==t[2]) return;
	}
	
	if(t[0]=='DocType') {
		_history_current = newLocation;
		loaddoc(t[1], t[2]);
	} else if(t[0]=='Report') {
		_history_current = newLocation;
		loadreport(t[1], t[2]);
	} else if(t[0]=='Page') {
		_history_current = newLocation;
		loadpage(t[1]);
	} else if(t[0]=='Application') {
		_history_current = newLocation;
		loadapp(t[1]);
	}
	
};

/* 

Utility

*/

// URL Parameters

function get_url_param(name) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	if( results == null )
		return "";
	else
		return results[1];
}

// Load Script

function loadscript(src, call_back) {
	set_loading();
	var script = $a('head','script');
	script.type = 'text/javascript';
	script.src = src+'?v=160.43';
	script.onload = function() { 
		if(call_back)call_back(); hide_loading(); 
	}
	// IE 6 & 7
	script.onreadystatechange = function() {
		if (this.readyState == 'complete' || this.readyState == 'loaded') {
			hide_loading();
			call_back();
		}
	}
}

// Applications

var apps=[]; var cur_app; var last_app; var frame_adj = 0;
function Application(app_name) {
	var me = this;
	this.name = app_name;
	this.cont = new Container(app_name);
	this.cont.init();
	this.cont.has_frame = 1;
	this.cont.onhide = function() {
		//if(isFF && user=='rushabh@webnotestech.com') { // to save firefox from perpetually reloading
		//	$y(me.frame,{height:'0px'});
		//}
	}
	this.cont.onshow = function() {
		if(!this.frame_loaded)
			this.body.appendChild(me.frame);
		this.frame_loaded = 1;
	}
	apps[app_name] = this;
	return this;
}

function loadapp(app_name, sub_id) {
	if(apps[app_name]) {
		apps[app_name].cont.show();
		set_title(app_name);
		nav_obj.open_notify('Application',app_name,'');

		cur_page = null;
		cur_app = apps[app_name];
	} else {
		callback = function(r,rt) {
			if(r.exc) { msgprint(r.exc); return; }

			var app = new Application(app_name);
			app.frame = document.createElement('iframe');
			app.frame.className = 'app_frame';
			app.frame.app_name = app_name;
			app.frame.frameBorder = 0;

			// session details
			args={sid150:r.sid}; if(r.dbx)args.dbx=r.dbx; if(r.__account)args.__account=r.__account;
			nav_obj.open_notify('Application',app_name,'');
			app.frame.src = 'http://'+r.url+ '/index.cgi?'+makeArgString(args,1);
			cur_app = app;
			cur_app.cont.show();
			set_frame_dims();
			set_title(app_name);
			
		}
		var args = {'app_name':app_name}; if(sub_id) args.sub_id = sub_id;
		$c("login_app",args,callback);
	}
}

// My HTTP Request

var outUrl = "cgi-bin/run.cgi";

// check response of HTTP request, only if ready
function checkResponse(r, on_timeout, no_loading, freeze_msg) {
	try {
	 	if (r.readyState==4 && r.status==200) return true; else return false; 
	} catch(e) {
		// $i("icon_loading").style.visibility = "hidden"; WAINING MESSAGE
		msgprint("error:Request timed out, try again");
		if(on_timeout)on_timeout();
		hide_loading();
		if(freeze_msg)unfreeze();
		return false;
	}
}

var pending_req = 0;

// new XMLHttpRequest object
function newHttpReq() { 
 if (!isIE) var r=new XMLHttpRequest(); 
	else if (window.ActiveXObject) var r=new ActiveXObject("Microsoft.XMLHTTP"); 
	return r;
}

// call execute serverside request        
function $c(command, args, fn, on_timeout, no_loading, freeze_msg) {
	var req=newHttpReq();
	ret_fn=function() {
		if (checkResponse(req, on_timeout, no_loading, freeze_msg)) {
			var rtxt = req.responseText;
			if(!no_loading)hide_loading(); // Loaded
			rtxt = rtxt.replace(/'\^\\x05\*'/g, 'null')
			rtxt = rtxt.replace(/"\^\\x05\*"/g, 'null')
			//alert(rtxt);
			r = eval("var a="+rtxt+";a")
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
			if(r.docs1) { LocalDB.sync(r.docs1); }
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
	if(!no_loading)set_loading(); // Loading
	if(freeze_msg)freeze(freeze_msg,1);
}

function $c_obj(doclist, method, arg, call_back, no_loading, freeze_msg) {
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
			'arg':arg}, call_back, no_loading, freeze_msg);
	}
}

function $c_graph(img, control_dt, method, arg) {
	img.src = outUrl + '?' + makeArgString({cmd:'get_graph', dt:control_dt, method:method, arg:arg});
}

function makeArgString(dict,no_account) {
	var varList = [];
	if(!no_account) {
		dict['__account'] = account_id; // for multiple logins on same domain
		if(__sid150)dict['sid150'] = __sid150; // for cross domain login
	}
 
	for(key in dict){
		varList[varList.length] = key + '=' + encodeURIComponent(dict[key]);
	}
	return varList.join('&');
}

// Events

function addEvent(ev, fn) {
	if(isIE) {
		document.attachEvent('on'+ev, function() { 
			fn(window.event, window.event.srcElement); 
		});
	} else {
		document.addEventListener(ev, function(e) { fn(e, e.target); }, true);
	}
}

// Dom

function empty_select(s) {
if(s) { var tmplen = s.length; for(var i=0;i<tmplen; i++) s.options[0] = null; } }

function sel_val(sel) { 
	try {
		if(sel.selectedIndex<sel.options.length) return sel.options[sel.selectedIndex].value;
		else return '';
	} catch(err) { return ''; /* IE fix */ }
}

function add_sel_options(s, list, sel_val, o_style) {
	for(var i in list){
		var o = new Option(list[i], list[i], false, (list[i]==sel_val? true : false));
		if(o_style) $y(o, o_style);
		s.options[s.options.length] = o				
	}
}

function cint(v, def) { v=v+''; v=lstrip(v, ['0',]); v=parseInt(v); if(isNaN(v))v=def?def:0; return v; }
function validate_email(id) { if(strip(id).search("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")==-1) return 0; else return 1; }
	
function d2h(d) {return d.toString(16);}
function h2d(h) {return parseInt(h,16);} 

function get_darker_shade(col, factor) {
	if(!factor) factor = 0.5;
	if(col.length==3) { var r = col[0]; var g=col[1]; var b=col[2] }
	else if(col.length==6) { var r = col.substr(0,2); var g = col.substr(2,2); var b = col.substr(4,2) }
	else return col;
	return "" + d2h(cint(h2d(r)*factor)) + d2h(cint(h2d(g)*factor)) + d2h(cint(h2d(b)*factor));
}

var $n = '\n';
var $f_lab = '<div style="padding: 4px; color: #888;">Fetching...</div>';

var my_title = 'Home'; var title_prefix = '';
function set_title(t) {
	document.title = (title_prefix ? (title_prefix + ' - ') : '') + t;
}

function $a(parent, newtag, className, cs) {
	if(!parent)alert("Error in adding to DOM element:"+ newtag+','+className);
	if(parent.substr)parent = $i(parent);
	var c = document.createElement(newtag);
	parent.appendChild(c);
	if(className)c.className = className;
	if(cs)$y(c,cs);
	return c;
}
function $a_input(p,in_type,in_name) {
	if(isIE) {
		p.innerHTML = repl('<input type="%(in_type)s" %(in_name)s>',{in_type:in_type,in_name:(in_name ? ('name="'+in_name+'"') : '')}); // IE fix
		var o = p.childNodes[0];
	} else {
		var o = $a(p, 'input'); 
		o.setAttribute('type', in_type);
		if(in_name)o.setAttribute('name', in_name);
	}
	return o;
}

function $dh(d) { if(d && d.substr)d=$i(d); if(d && d.style.display.toLowerCase() != 'none') d.style.display = 'none'; }
function $ds(d) { if(d && d.substr)d=$i(d); if(d && d.style.display.toLowerCase() != 'block') d.style.display = 'block'; }
function $di(d) { if(d && d.substr)d=$i(d); if(d)d.style.display = 'inline'; }
function $i(id) { if(!id) return null; if(id && id.appendChild)return id; return document.getElementById(id); }
function $t(parent, txt) { 	if(parent.substr)parent = $i(parent); return parent.appendChild(document.createTextNode(txt)); }
function $y(ele, s) { if(ele && s) { for(var i in s) ele.style[i]=s[i]; }}
function $yt(tab, r, c, s) { /// set style on tables with wildcards
	var rmin = r; var rmax = r;
	if(r=='*') { rmin = 0; rmax = tab.rows.length-1; }
	if(r.search && r.search('-')!= -1) {
	  r = r.split('-');
	  rmin = cint(r[0]); rmax = cint(r[1]);
	}

	var cmin = c; var cmax = c;
	if(c=='*') { cmin = 0; cmax = tab.rows[0].cells.length-1; }
	if(c.search && c.search('-')!= -1) {
	  c = c.split('-');
	  rmin = cint(c[0]); rmax = cint(c[1]);
	}
	
	for(var ri = rmin; ri<=rmax; ri++) {
		for(var ci = cmin; ci<=cmax; ci++)
			$y($td(tab,ri,ci),s);
	}
}

// add css classes etc

function set_style(txt) {
	var se = document.createElement('style');
	se.type = "text/css";
	if (se.styleSheet) {
		se.styleSheet.cssText = txt;
	} else {
		se.appendChild(document.createTextNode(txt));
	}
	document.getElementsByTagName('head')[0].appendChild(se);	
}

// Make table

function make_table(parent, nr, nc, table_width, widths, cell_style) {
	var t = $a(parent, 'table');
	t.style.borderCollapse = 'collapse';
	if(table_width) t.style.width = table_width;
	if(cell_style) t.cell_style=cell_style;
	for(var ri=0;ri<nr;ri++) {
		var r = t.insertRow(ri);
		for(var ci=0;ci<nc;ci++) {
			var c = r.insertCell(ci);
			if(ri==0 && widths && widths[ci]) {
				// set widths
				c.style.width = widths[ci];
			}
			if(cell_style) {
			  for(var s in cell_style) c.style[s] = cell_style[s];
			}
		}
	}
	t.append_row = function() { return append_row(this); }
	return t;
}

function append_row(t) {
	var r = t.insertRow(t.rows.length);
	if(t.rows.length>1) {
		for(var i=0;i<t.rows[0].cells.length;i++) {
			var c = r.insertCell(i);
			if(t.cell_style) {
				for(var s in t.cell_style) c.style[s] = t.cell_style[s];
			}
		}
	}
	return r
}

function $td(t,r,c) { 
	if(r<0)r=t.rows.length+r;
	if(c<0)c=t.rows[0].cells.length+c;
	return t.rows[r].cells[c]; 
}
// sum of values in a table column
function $sum(t, cidx) {
	var s = 0;
	if(cidx<1)cidx = t.rows[0].cells.length + cidx;
	for(var ri=0; ri<t.rows.length; ri++) {
		var c = t.rows[ri].cells[cidx];
		if(c.div) s += flt(c.div.innerHTML);
		else if(c.value) s+= flt(c.value);
		else s += flt(c.innerHTML);
	}
	return s;
}

function $s(ele, v, ftype, fopt) { 	
	if(v==null)v='';
					
	if(ftype =='Text'|| ftype =='Small Text') {
		ele.innerHTML = v?v.replace(/\n/g, '<br>'):'';
	} else if(ftype =='Date') {
		v = dateutil.str_to_user(v);
		if(v==null)v=''
		ele.innerHTML = v;
	} else if(ftype =='Link' && fopt) {
		ele.innerHTML = '';
		doc_link(ele, fopt, v);
	} else if(ftype =='Currency') {
		ele.style.textAlign = 'right';
		ele.innerHTML = fmt_money(v);
	} else if(ftype =='Int') {
		ele.style.textAlign = 'right';
		ele.innerHTML = v;
	} else if(ftype == 'Check') {
		if(v) ele.innerHTML = '<img src="images/ui/tick.gif">';
		else ele.innerHTML = '';
	} else {
		ele.innerHTML = v;
	}
}

function clean_smart_quotes(s) {
	if(s) {
	    s = s.replace( /\u2018/g, "'" );
	    s = s.replace( /\u2019/g, "'" );
	    s = s.replace( /\u201c/g, '"' );
	    s = s.replace( /\u201d/g, '"' );
	    s = s.replace( /\u2013/g, '-' );
	    s = s.replace( /\u2014/g, '--' );
	}
    return s;
}

function copy_dict(d) {
	var n = {};
	for(var k in d) n[k] = d[k];
	return n;
}

function $p(ele,top,left) {
 ele.style.position = 'absolute';
 ele.style.top = top+'px';
 ele.style.left = left+'px';
}
function replace_newlines(t) {
	return t?t.replace(/\n/g, '<br>'):'';
}

function cstr(s) {
	if(s==null)return '';
	return s+'';
}
function flt(v,decimals) { 
	if(v==null || v=='')return 0;
	v=(v+'').replace(/,/g,'');

	v=parseFloat(v); 
	if(isNaN(v))
		v=0; 
	if(decimals!=null)
		return v.toFixed(decimals);
	return v; 
}

// style short-cuts)
function $w(e,w) { if(e && e.style && w)e.style.width = w; }
function $h(e,h) { if(e && e.style && h)e.style.height = h; }
function $bg(e,w) { if(e && e.style && w)e.style.backgroundColor = w; }
function $fg(e,w) { if(e && e.style && w)e.style.color = w; }
function $pd(e,w) { if(e && e.style && w)e.style.padding = w; }
function $mg(e,w) { if(e && e.style && w)e.style.margin = w; }
function $fsize(e,w) { if(e && e.style && w)e.style.fontSize = w; }
function $op(e,w) { if(e && e.style && w) { set_opacity(e,w); } }

function esc_quotes(s) { if(s==null)s=''; return s.replace(/'/, "\'");}
function strip(s, chars) {
	s = lstrip(s, chars);
	s = rstrip(s, chars);
	return s;
}
function lstrip(s, chars) {
	if(!chars) chars = ['\n', '\t', ' '];
	// strip left
	var first_char = s.substr(0,1);
	while(in_list(chars, first_char)) {
		s = s.substr(1);
		first_char = s.substr(0,1);
	}
	return s;
}

function rstrip(s, chars) {
	if(!chars) chars = ['\n', '\t', ' '];
	var last_char = s.substr(s.length-1);
	while(in_list(chars, last_char)) {
		s = s.substr(0, s.length-1);
		last_char = s.substr(s.length-1);
	}
	return s;
}
function repl_all(s, s1, s2) {
	var idx = s.indexOf(s1);
	while (idx != -1){
		s = s.replace(s1, s2);
	 	idx = s.indexOf(s1);
	}
	return s;
}
function repl(s, dict) {
	if(s==null)return '';
	for(key in dict) s = repl_all(s, '%('+key+')s', dict[key]);
	return s;
}
// Date

function same_day(d1, d2) {
	if(d1.getFullYear()==d2.getFullYear() && d1.getMonth()==d2.getMonth() && d1.getDate()==d2.getDate())return true; else return false;
}
var month_list = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var month_last = {1:31,2:28,3:31,4:30,5:31,6:30,7:31,8:31,9:30,10:31,11:30,12:31}
var month_list_full = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function int_to_str(i, len) {
	i = ''+i;
	if(i.length<len)for(c=0;c<(len-i.length);c++)i='0'+i;
	return i
}

function DateFn() {
	this.str_to_obj = function(d) { 
		if(!d) return new Date(); 
		if(d.search('-')!=-1) {
			var t = d.split('-'); return new Date(t[0],t[1]-1,t[2]); 
		} else if(d.search('/')!=-1) {
			var t = d.split('/'); return new Date(t[0],t[1]-1,t[2]); 
		} else {
			return new Date();
		}
	}
	this.obj_to_str = function(d) { return d.getFullYear() + '-' + int_to_str(d.getMonth()+1,2) + '-' + int_to_str(d.getDate(),2); }
	this.obj_to_user = function(d) { return dateutil.str_to_user(dateutil.obj_to_str(d)); }
	this.get_diff = function(d1, d2) { return ((d1-d2) / 86400000); }
	this.add_days = function(d, days) { d.setTime(d.getTime()+(days*24*60*60*1000)); return d}
	this.month_start = function() { 
		var d = new Date();
		return d.getFullYear() + '-' + int_to_str(d.getMonth()+1,2) + '-01';
	}
	this.month_end = function() { 
		var d = new Date(); var m = d.getMonth() + 1; var y = d.getFullYear();
		last_date = month_last[m];
		if(m==2 && (y % 4)==0 && ((y % 100)!=0 || (y % 400)==0)) // leap year test
			last_date = 29;
		return y+'-'+int_to_str(m,2)+'-'+last_date;
	}
	this.str_to_user = function(val, no_time_str) {
		var user_fmt = locals['Control Panel']['Control Panel'].date_format;
		var time_str = '';
		//alert(user_fmt);
		
		if(!user_fmt) user_fmt = 'dd-mm-yyyy';
		
		if(val==null||val=='')return null;
		
		// separate time string if there
		if(val.search(':')!=-1) {
			var tmp = val.split(' ');
			if(tmp[1])
				time_str = ' ' + tmp[1];
			var d = tmp[0];
		} else {
			var d = val;
		}

		if(no_time_str)time_str = '';

		// set to user fmt
		d = d.split('-');
		if(d.length==3) {
			if(user_fmt=='dd-mm-yyyy')
				val =  d[2]+'-'+d[1]+'-'+d[0] + time_str;
			else if(user_fmt=='dd/mm/yyyy')
				val =  d[2]+'/'+d[1]+'/'+d[0] + time_str;
			else if(user_fmt=='yyyy-mm-dd')
				val =  d[0]+'-'+d[1]+'-'+d[2] + time_str;
			else if(user_fmt=='mm/dd/yyyy')
				val =  d[1]+'/'+d[2]+'/'+d[0] + time_str;
			else if(user_fmt=='mm-dd-yyyy')
				val =  d[1]+'-'+d[2]+'-'+d[0] + time_str;
		}

		return val;
	}
	this.full_str = function() { 
		var d = new Date();
		return d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate() + ' '
		+ d.getHours()  + ':' + d.getMinutes()   + ':' + d.getSeconds();
	}
}

var dateutil = new DateFn();
var date = dateutil;
var reversedate = dateutil.str_to_user;

function only_date(val) {
	if(val==null||val=='')return null;
	if(val.search(':')!=-1) {
		var tmp = val.split(' ');
		var d = tmp[0].split('-');
	} else {
		var d = val.split('-');
	}
	if(d.length==3) 
		val =  d[2]+'-'+d[1]+'-'+d[0];
	return val;
}
// Time

function time_to_ampm(v) {
	if(!v) {
		var d = new Date();
		var t = [d.getHours(), cint(d.getMinutes()/5)*5]
	} else {
		var t = v.split(':');
	}
	
	
	if(t.length!=2){
		show_alert('[set_time] Incorect time format');
		return;
	}
	if(cint(t[0]) == 0) var ret = ['12', t[1], 'AM'];
	else if(cint(t[0]) < 12) var ret = [cint(t[0]) + '', t[1], 'AM'];
	else if(cint(t[0]) == 12) var ret = ['12', t[1], 'PM'];
	else var ret = [(cint(t[0]) - 12) + '', t[1], 'PM'];
		
	return ret;
}

function time_to_hhmm(hh,mm,am) {
	if(am == 'AM' && hh=='12') {
		hh = '00';
	} else if(am == 'PM' && hh!='12') {
		hh = cint(hh) + 12;
	}
	return hh + ':' + mm;
}
	
function btn_dis(d, tf) { d.disabled = tf?true: false; }

function objpos(obj){
  if(obj.substr)obj = $i(obj);
  var acc_lefts = 0; var acc_tops = 0;
  if(!obj)show_alert("No Object Specified");
  var co={};
  while (obj){ 
  	acc_lefts += obj.offsetLeft; acc_tops += obj.offsetTop;

	if(isIE) {
	    if (obj!= window.document.body){
    		acc_tops -= obj.scrollTop; acc_lefts -= obj.scrollLeft;
    	}
    } else { // only for ff
	    var op = obj.offsetParent
	    var scr_obj = obj;
	    
	    while(scr_obj&&(scr_obj!=op)&&(scr_obj!=window.document.body)) { // scan all elements for scrolls
		    acc_tops -= scr_obj.scrollTop; 
		    acc_lefts -= scr_obj.scrollLeft;
			scr_obj = scr_obj.parentNode;
		}
	}
	obj = obj.offsetParent;
  }
  co.x=acc_lefts, co.y=acc_tops; return co;
}

function get_screen_dims() {
  var d={};
  d.w = 0; d.h = 0;
  if( typeof( window.innerWidth ) == 'number' ) {
    //Non-IE
    d.w = window.innerWidth;
    d.h = window.innerHeight;
  } else if( document.documentElement && ( document.documentElement.clientWidth || document.documentElement.clientHeight ) ) {
    //IE 6+ in 'standards compliant mode'
    d.w = document.documentElement.clientWidth;
    d.h = document.documentElement.clientHeight;
  } else if( document.body && ( document.body.clientWidth || document.body.clientHeight ) ) {
    //IE 4 compatible
    d.w = document.body.clientWidth;
    d.h = document.body.clientHeight;
  }	
  return d
}

function get_content_dims() {
	var d = get_screen_dims();
	d.h = (d.h - fixh) + 'px';
	d.w = (d.w - fixw - 30) + 'px';
	return d;
}

function fmt_money(v){
	if(v==null || v=='')return '0.00'; // no nulls
	v = (v+'').replace(/,/g, ''); // remove existing commas
	v = parseFloat(v);
	if(isNaN(v)) {
		return ''; // not a number
	} else {
		v = v.toFixed(2);
		var delimiter = ","; // replace comma if desired
		amount = v+'';
		var a = amount.split('.',2)
		var d = a[1];
		var i = parseInt(a[0]);
		if(isNaN(i)) { return ''; }
		var minus = '';
		if(v < 0) { minus = '-'; }
		i = Math.abs(i);
		var n = new String(i);
		var a = [];
		while(n.length > 3)
		{
			var nn = n.substr(n.length-3);
			a.unshift(nn);
			n = n.substr(0,n.length-3);
		}
		if(n.length > 0) { a.unshift(n); }
		n = a.join(delimiter);
		if(d.length < 1) { amount = n; }
		else { amount = n + '.' + d; }
		amount = minus + amount;
		return amount;
	}
}

//// document loading



// CHANGE NOTE ! redesign to observer pattern

function rename_from_local(doc) {
	// when a document is newly saved, it gets its localname from the server
	// as doc.localname

	if(doc.localname) { 
		// delete from local
		
		try {
			var old = locals[doc.doctype][doc.localname]; 
			old.parent = null; old.__deleted = 1;
		} catch(e) {
			alert("[rename_from_local] No Document for: "+ doc.localname);
		}

		var frm = frms[doc.doctype];

		if(frm && frm.opendocs[doc.localname]) {
			// local doctype copy
			local_dt[doc.doctype][doc.name] = local_dt[doc.doctype][doc.localname];
			local_dt[doc.doctype][doc.localname] = null;
			
			// update recent
			rdocs.remove(doc.doctype, doc.localname);
			rdocs.add(doc.doctype, doc.name, 1);

			// sections
			frm.cur_section[doc.name] = frm.cur_section[doc.localname];
			delete frm.cur_section[doc.localname];

			// editable
			frm.is_editable[doc.name] = frm.is_editable[doc.localname];
			delete frm.is_editable[doc.localname];

			// attach
			if(frm.attachments[doc.localname]) {
				frm.attachments[doc.name] = frm.attachments[doc.localname];
				frm.attachments[doc.localname] = null;
				for(var i in frm.attachments[doc.name]){ // rename each attachment
					frm.attachments[doc.name][i].docname = doc.name;
				}
			}

			// from form
			if(frm.docname == doc.localname)
				frm.docname = doc.name;	

			nav_obj.rename_notify(doc.doctype, doc.localname, doc.name)

			// cleanup
			frm.opendocs[doc.localname] = false;
			frm.opendocs[doc.name] = true;
		}
		
		// calendar
		if(calendar && calendar.has_event[doc.localname])
			calendar.has_event[doc.localname] = false;
		
		// todo
		if(todo && todo.docs[doc.localname]) {
			todo.docs[doc.name] = todo.docs[doc.localname];
			todo.docs[doc.name].docname = doc.name;
			todo.docs[doc.localname] = null;
		}
		delete doc.localname;
	}
}
	
///// dict type

function keys(obj) { var mykeys=[];for (key in obj) mykeys[mykeys.length]=key;return mykeys;}
function values(obj) { var myvalues=[];for (key in obj) myvalues[myvalues.length]=obj[key];return myvalues;}
function seval(s) { return eval('var a='+s+';a'); }

function in_list(list, item) {
	for(var i=0;i<list.length;i++) {
		if(list[i]==item) return true;
	}
	return false;
}
function has_common(list1, list2) {
	if(!list1 || !list2) return false;
	for(var i=0; i<list1.length; i++) {
		if(in_list(list2, list1[i]))return true;
	}
	return false;
}
var inList = in_list; // bc
function add_lists(l1, l2) {
	var l = [];
	for(var k in l1) l[l.length] = l1[k];
	for(var k in l2) l[l.length] = l2[k];
	return l;
}

function docstring(obj)  {
	var l = [];
	for(key in obj) {
		var v = obj[key];
		if(v!=null) {
			if(typeof(v)==typeof(1)) {
				l[l.length] = "'"+ key + "':" + (v + '');
			} else {
	   			v = v+''; // convert to string
   				l[l.length] = "'"+ key + "':'" + v.replace(/'/g, "\\'").replace(/\n/g, "\\n") + "'";
   			}
   		}
	}
	return  "{" + l.join(',') + '}';
}

function compress_doclist(list) {
	var kl = {}; var vl = []; var flx = {};
	for(var i=0; i<list.length;i++) {
		var o = list[i];
		var fl = [];
		if(!kl[o.doctype]) { // make key only once # doctype must be first
			var tfl = ['doctype', 'name', 'docstatus', 'owner', 'parent', 'parentfield', 'parenttype', 'idx', 'creation', 'modified', 'modified_by', '__islocal', '__deleted','__newname', '__modified'];  // for text
			var fl =  ['doctype', 'name', 'docstatus', 'owner', 'parent', 'parentfield', 'parenttype', 'idx', 'creation', 'modified', 'modified_by', '__islocal', '__deleted','__newname', '__modified'];  // for unique

			for(key in fields[o.doctype]) { // all other values
				if((!in_list(fl, key)) && (!in_list(no_value_fields, fields[o.doctype][key].fieldtype))) {
					fl[fl.length] = key; // save value list
					tfl[tfl.length] = key.replace(/'/g, "\\'").replace(/\n/g, "\\n");
				}
			}
			flx[o.doctype] = fl;
			kl[o.doctype] = "['"+tfl.join("', '")+"']";
		}
		var nl = [];
		var fl = flx[o.doctype];
		// check all
		for(var j=0;j<fl.length;j++) {
			var v = o[fl[j]];
			if(v==null) 
				v = NULL_CHAR;
			if(typeof(v)==typeof(1)) { // for numbers
				nl[nl.length] = v+'';
			} else {
	   			v = v+''; // convert to string
				nl[nl.length] = "'"+v.replace(/'/g, "\\'").replace(/\n/g, "\\n")+"'";
   			}
		}
		vl[vl.length] = '['+nl.join(', ')+']';
	}
	var sk = [];
	var kls = [];
	for(key in kl) kls[kls.length] = "'"+key+"':" + kl[key];

	var kls = '{'+kls.join(',')+'}';
	var vl = '['+vl.join(',')+']';
	
	//alert("{'_vl':"+vl+",'_kl':"+kls+"}");
	return "{'_vl':"+vl+",'_kl':"+kls+"}";
}

function expand_doclist(docs) {
	var l = [];
	for(var i=0;i<docs._vl.length;i++) 
		l[l.length] = zip(docs._kl[docs._vl[i][0]], docs._vl[i]);
	return l;
}
function zip(k,v) {
	var obj = {};
	for(var i=0;i<k.length;i++) {
		obj[k[i]] = v[i];
	}
	return obj;
}


//
// Layout
//

function ie_refresh(e) { $dh(e); $ds(e); }

function Layout(parent, width) { 
	if(parent&&parent.substr) { parent = $i(parent); }

	if(parent)
		this.wrapper = $a(parent, 'div', 'layoutDiv');
	else {
		this.wrapper = document.createElement('div')
		this.wrapper.className = 'layoutDiv';
	}

	$w(this.wrapper, width?width:(pagewidth + 'px'));
	this.width = this.wrapper.style.width;
	
	this.myrows = [];
}

Layout.prototype.addrow = function() {
	this.cur_row = new LayoutRow(this, this.wrapper);
	this.myrows[this.myrows.length] = this.cur_row;
	return this.cur_row
}

Layout.prototype.addsubrow = function() {
	this.cur_row = new LayoutRow(this, this.cur_row.wrapper);
	this.myrows[this.myrows.length] = this.cur_row;
	return this.cur_row
}

Layout.prototype.addcell = function(width) {
	return this.cur_row.addCell(width);
}

Layout.prototype.setcolour = function(col) { $bg(cc,col); }

Layout.prototype.show = function() { $ds(this.wrapper); }
Layout.prototype.hide = function() { $dh(this.wrapper); }
Layout.prototype.close_borders = function() {
	if(this.with_border) {
		this.myrows[this.myrows.length-1].wrapper.style.borderBottom = '1px solid #000';
	}
}

function LayoutRow(layout, parent) {
	this.layout = layout;
	this.wrapper = $a(parent,'div','layout_row');
	
	// for sub rows
	this.sub_wrapper = $a(this.wrapper,'div');

	if(layout.with_border) {
		this.wrapper.style.border = '1px solid #000';
		this.wrapper.style.borderBottom = '0px';
	}
	
	this.header = $a(this.sub_wrapper, 'div');
	this.body = $a(this.sub_wrapper,'div');
	this.table = $a(this.body, 'table', 'layout_row_table');
	this.row = this.table.insertRow(0);
	
	this.mycells = [];
}

LayoutRow.prototype.hide = function() { $dh(this.wrapper); }
LayoutRow.prototype.show = function() { $ds(this.wrapper); }

LayoutRow.prototype.addCell = function(wid) {
	var lc = new LayoutCell(this.layout, this, wid);
	this.mycells[this.mycells.length] = lc;
	return lc;
}

function LayoutCell(layout, layoutRow, width) {
	if(width) { // add '%' if user has forgotten
		var w = width + '';
		if(w.substr(w.length-2, 2) != 'px') {
			if(w.substr(w.length-1, 1) != "%") {width = width + '%'};
		}
	}

	this.width = width;
	this.layout = layout;
	var cidx = layoutRow.row.cells.length;
	this.cell = layoutRow.row.insertCell(cidx);
	//if((layout.with_border)&&(cidx>0)) 
	//	layoutRow.row.cells[cidx-1].style.borderRight = '1px solid #000';

	this.cell.style.verticalAlign = 'top';
	if(width)
		this.cell.style.width = width;
	
	var h = $a(this.cell, 'div');	
	this.wrapper = $a(this.cell, 'div','',{padding:'8px'});
	
	layout.cur_cell = this.wrapper;
	layout.cur_cell.header = h;
}

LayoutCell.prototype.show = function() { $ds(this.wrapper); }
LayoutCell.prototype.hide = function() { $dh(this.wrapper); }


/// Report Page
var Finder;

function ReportPage(parent) {
	var me = this;
	this.finders = {};

	// tool bar

	var div = $a(parent, 'div','',{margin:'8px'});
	var htab = make_table($a(div,'div'), 1,2, '100%', ['80%','20%']);
	
	this.main_title = $a($td(htab,0,0),'div','standard_title');
	this.button_area = $a($td(htab,0,0),'div');
	
	$y($td(htab,0,1),{textAlign:'right'});
	
	// close button

	this.close_btn = $a($a($td(htab,0,1),'p','',{padding: '0px 0px 8px 0px', margin:'0px'}), 'img', '', {cursor:'pointer'});
	this.close_btn.src="images/ui/close_btn.gif";
	this.close_btn.onclick = function() { nav_obj.show_last_open(); }

	this.button_area2 = $a($td(htab,0,1),'div',{marginTop:'8px'});

	// new
	if(has_common(['Administrator', 'System Manager'], user_roles)) {
		// save
		var savebtn = $a(this.button_area2,'span','link_type',{marginRight:'8px'});
		savebtn.innerHTML = 'Save';
		savebtn.onclick = function() {if(me.cur_finder) me.cur_finder.save_criteria(); };
		
		// advanced
		var advancedbtn = $a(this.button_area2,'span','link_type');
		advancedbtn.innerHTML = 'Advanced';
		advancedbtn.onclick = function() { 
			if(me.cur_finder) {
				if(!me.cur_finder.current_loaded) {
					msgprint("error:You must save the report before you can set Advanced features");
					return;
				}
				loaddoc('Search Criteria', me.cur_finder.sc_dict[me.cur_finder.current_loaded]);
			}
		};
	}
	
	// buttons
	var runbtn = $a(this.button_area, 'button');
	runbtn.innerHTML = 'Run'.bold();
	runbtn.onclick = function() { if(me.cur_finder){
		me.cur_finder.dt.start_rec = 1;
		me.cur_finder.dt.run();} 
	}
	$dh(this.button_area);
	
	this.finder_area = $a(parent, 'div');

	// set a type
	this.set_dt = function(dt, onload) {
		// show finder
		$dh(me.home_area);
		$ds(me.finder_area);
		$ds(me.button_area);
		my_onload = function(f) {
			me.cur_finder = f;
			me.cur_finder.mytabs.tabs['Result'].show();
			if(onload)onload(f);
		}
	
		if(me.cur_finder)
			me.cur_finder.hide();
		if(me.finders[dt]){
			me.finders[dt].show(my_onload);
		} else {
			me.finders[dt] = new Finder(me.finder_area, dt, my_onload);
		}

	}
}
function loadreport(dt, rep_name, onload, menuitem) {
	var cb2 = function() { _loadreport(dt, rep_name, onload, menuitem); }

	if(Finder) { cb2(); }
	else loadscript('js/widgets/report_table.js', cb2);
}
function _loadreport(dt, rep_name, onload, menuitem) {
	search_page.set_dt(dt, function(finder) { 
		if(rep_name) {
			var t = finder.current_loaded;
			finder.load_criteria(rep_name);
			if(onload)onload(finder);
			if(menuitem) finder.menuitems[rep_name] = menuitem;
			if((finder.dt) && (!finder.dt.has_data() || finder.current_loaded!=t))finder.dt.run();
			if(finder.menuitems[rep_name]) finder.menuitems[rep_name].show_selected();
		}
		nav_obj.open_notify('Report',dt,rep_name);
	} );
	if(cur_page!='_search')loadpage('_search');
}

/// SQL Table --- DEPRECATED will be removed

function show_data_table(html_field, user_query, ht) {
  if(html_field.substr){ html_field = get_field(cur_frm.doctype, html_field, cur_frm.docname); }
  
  html_field.options = $f_lab;
  refresh_field(html_field.label);
  
  var show_sql_data_result = function(r, rt) {
   	html_field.options = get_SQL_table_HTML(r.values, eval(r.colnames), eval(r.coltypes), eval(r.coloptions), '', 0, eval(r.colwidths), ht);
   	refresh_field(html_field.label);
  }
  
  // alert(q);
  if(user_query) {
	  $c('runquery', { 
	  		'query':user_query, 
	  		'report_name': 'DataTable', 
			'defaults':pack_defaults(),
			'roles':'["'+user_roles.join('","')+'"]'
		} , show_sql_data_result);
  }
}

function scroll_head(ele) {
	var h = ele.childNodes[0];
	h.style.top = cint(ele.scrollTop) + 'px';
}

function get_SQL_table_HTML(rset, colnames, coltypes, coloptions, ttype, start, colwidths, ht) {
  var get_width = function(i) {
    if(colwidths && colwidths[i])var w = cint(colwidths[i]) +'px';
    else var w = '100px';
    return w;
  }

  var total_width = 30;
  for(var i=0;i<colnames.length;i++) {
  	total_width += cint(get_width(i));
  }

  if(ht)var ht_style = 'height: '+cint(ht)+'px;'
  else ht_style = '';
  //var h = '<div style="background-color: #EEE; padding: 2px; text-align: right"><img src="images/icons/page_excel.gif" /></div>';
  var h = '<div class="report_tab" style="'+ht_style+'" onscroll="scroll_head(this)">';
  
  if(rset.length) {
	  h+= '<div class="report_head_wrapper"><table style="width:'+total_width+'px;">';
	  
	  // heads
	  // -----

	  h+='<tr><td class="report_head_cell" style="width: 30px;"><div>Sr</div></td>';
	  for(var i=0;i<colnames.length;i++) {	
	    h+='<td class="report_head_cell" style="width: '+get_width(i)+';"><div>' + colnames[i]+ '</div></td>';
	  }
	  h+='</tr>';
	  h+='</table></div>';

	  // values
	  // ------
	  	  
	  if(!start)start=0;
  	  h += '<div class="report_tab_wrapper" style="top: 24px;"><table style="width:'+total_width+'px;">';
	  for(var vi=0;vi< rset.length;vi++) {
	  	start ++;
	    
	    //if(vi % 2)var bc = ' background-color: '+BG2+';';
	    if(vi % 2)var bc = 'background-color: #DEF;';
	    else var bc = '';
	
	    var style = ' style="'+bc+' width: 30px"'; // for first one
	    
	    if(rset[vi]) {
	     h+= '<tr><td'+ style +'>' + start + '</td>';
	     for(var ci=0;ci< rset[vi].length;ci++) {
	      var style = ' style="width:'+get_width(ci)+';'+bc+'"';
	      if(coltypes[ci]=='Link') {
	        if(ttype=='Selector')
		      v = '<a href = \'javascript:setlinkvalue("'+ rset[vi][ci]+'")\'>' + rset[vi][ci] + '</a>';
	        else
		      v = '<a href = "javascript:loaddoc('+"'"+ coloptions[ci] + "','" + rset[vi][ci] + "'" + ')">' + rset[vi][ci] + '</a>';
	      } else if(coltypes[ci]=='Date') {
	        v = dateutil.str_to_user(rset[vi][ci]);
	        if(v==null)v='';
	      } else if(coltypes[ci]=='Currency') {
	        v = fmt_money(rset[vi][ci]);
	        if(v==null)v='';
	      } else {
	        v = rset[vi][ci];
	      }
	      h+='<td'+ style +'><div>' + v + '</div></td>';
	     }
	     h+= '</tr>';
	    }
	  }
	  h+='</table></div>';
  } else {
  	h+='<div style="margin: 20px; text-align: center;">No Records Found</div>';
  }
  return h;
}

//Rounded corners
//---------------

function make_rounded(ele, corners) {
	if(!corners)corners = [1,1,1,1];
	if(corners[0]) $a(ele, 'div', 'rctl');
	if(corners[1]) { var tmp = $a(ele, 'div', 'rctr'); }
	if(corners[2]) { var tmp = $a(ele, 'div', 'rcbr'); }	
	if(corners[3]) { var tmp = $a(ele, 'div', 'rcbl');
		//if(isIE)tmp.style.bottom = '-1px';
	}

}

function addImg(parent, src, cls, w, h, opt_id) {
	var extn = src.split('.');
	extn = extn[1];
	if(isIE&&(extn.toLowerCase()=='png')) {
		var sp = $a(parent, 'span', cls);
		if(opt_id)opt_id = ' id="'+opt_id+'" ';
		else opt_id = '';
		var newhtml = "<span class=\""+cls+"\" style=\"width: "+w+"; height: "+h+"; filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(src=\'" + src + "\', sizingMethod='scale');\""+opt_id+"></span>";
		//alert(newhtml);
		sp.outerHTML = newhtml;
    	return sp;
    } else {
    	var im = $a(parent, 'img', cls);
    	im.src = src;
    	return im;
    }
}

//
// Popup box
//

var cur_dialog; var top_index=91;
function Dialog(w, h, title, content) {
	this.wrapper = $a('dialogs', 'div', 'dialog_wrapper');
	this.w = w;
	this.h = h;

	$w(this.wrapper,w + 'px');
	//$h(this.wrapper,h + 'px');
	
	this.head = $a(this.wrapper, 'div', 'dialog_head');
	this.body = $a(this.wrapper, 'div', 'dialog_body');
	
	this.make_head(title);
	if(content)this.make_body(content);

	this.onshow = '';
	this.oncancel = '';
	this.display = false;
	var me = this;
	
	// shaded border
	//this.my_border = RUZEE.ShadedBorder.create({ corner:4, border: 2, shadow:(isIE6 ? 0 : 0) });
}

Dialog.prototype.make_head = function(title) {
	var t = make_table(this.head,1,2,'100%',['100%','16px'],{padding:'3px'});
	
	$y(t,{borderBottom:'1px solid #DDD'});
	$y($td(t,0,0),{paddingLeft:'16px',fontWeight:'bold',fontSize:'14px',textAlign:'center'});
	$y($td(t,0,1),{textAlign:'right'});	

	var img = $a($td(t,0,01),'img','',{cursor:'pointer'});
	img.src='images/icons/cancel.gif';
	this.title_text = $td(t,0,0);
	if(!title)title='';
	this.title_text.innerHTML = title;

	var me = this;
	img.onclick = function() {
		if(me.oncancel)me.oncancel();
		me.hide();
	}
	this.cancel_img = img;
}

Dialog.prototype.show = function() {
	freeze();
	var d = get_screen_dims();
	
	this.wrapper.style.left  = ((d.w - this.w)/2) + 'px';
	this.wrapper.style.top = (get_scroll_top() + ((d.h - this.h)/2)) + 'px';

	top_index++;
	$y(this.wrapper,{zIndex:top_index});

	$ds(this.wrapper);
	//this.my_border.render(this.wrapper);

	this.display = true;
	cur_dialog = this;

	if(this.onshow)this.onshow();	
}

Dialog.prototype.hide = function() {
	var me = this;
	unfreeze();
	if(this.onhide)this.onhide();
	$dh(this.wrapper);
	this.display = false;
	cur_dialog = null;
}

Dialog.prototype.set_title = function(title) { if(!title)title=''; this.title_text.innerHTML = title.bold(); }

// to add widget dialog.make_body([[type,label,comment/ onclick],..])
// this.widgets[label] will be the widget
// types - Data, Select, HTML, Button, Text

Dialog.prototype.make_body = function(content) {
	this.rows = {}; this.widgets = {};
	for(var i in content) this.make_row(content[i]);
}

Dialog.prototype.make_row = function(d) {
	var me = this;
	
	this.rows[d[1]] = $a(this.body, 'div', 'dialog_row');
	var row = this.rows[d[1]];

	if(d[0]!='HTML') {
		var t = make_table(row,1,2,'100%',['30%','70%']);
		row.tab = t;
		var c1 = $td(t,0,0);
		var c2 = $td(t,0,1);
		if(d[0]!='Check' && d[0]!='Button')
			$t(c1, d[1]);
	}
	
	if(d[0]=='HTML') {
		if(d[2])row.innerHTML = d[2];
		this.widgets[d[1]]=row;
	} else if(d[0]=='Check') {
		var i = $a_input(c2, 'checkbox');
		$y(c2,{textAlign:'left'});
		c1.innerHTML = d[1];
		this.widgets[d[1]] = i;
	} else if(d[0]=='Data') {
		c1.innerHTML = d[1];
		c2.style.overflow = 'auto';
		this.widgets[d[1]] = $a(c2, 'input');
		if(d[2])$a(c2, 'div', 'comment').innerHTML = d[2];
	} else if(d[0]=='Password') {
		c1.innerHTML = d[1];
		c2.style.overflow = 'auto';
		this.widgets[d[1]] = $a_input(c2, 'password');
		if(d[3])$a(c2, 'div', 'comment').innerHTML = d[3];
	} else if(d[0]=='Select') {
		c1.innerHTML = d[1];
		this.widgets[d[1]] = $a(c2, 'select');		
		if(d[2])$a(c2, 'div', 'comment').innerHTML = d[2];
	} else if(d[0]=='Text') {
		c1.innerHTML = d[1];
		c2.style.overflow = 'auto';
		this.widgets[d[1]] = $a(c2, 'textarea');		
		if(d[2])$a(c2, 'div', 'comment').innerHTML = d[2];
	} else if(d[0]=='Button') {
		c2.style.height = '32px';
		c2.style.textAlign = 'right';
		var b = $a(c2, 'button');
		b.innerHTML = d[1];
		b.dialog = me;
		if(d[2]){
			b._onclick = d[2];
			b.onclick = function() { this._onclick(me); }
		}
		this.widgets[d[1]] = b;
	}
}


function hide_selects() {
	if(!isIE6)return;
	$dh('form_newsel');
	for(var i=0;i<select_register.length;i++) {
		select_register[i].style.visibility = 'hidden';
	}
}

function show_selects() {
	if(!isIE6)return;
	$ds('form_newsel');
	for(var i=0;i<select_register.length;i++) {
		select_register[i].style.visibility = 'visible';
	}
}

var fcount = 0;
var frozen = 0;
//var fmessage;

function get_scroll_top() {
	var st = 0;
	if(document.documentElement && document.documentElement.scrollTop)
		st = document.documentElement.scrollTop;
	else if(document.body && document.body.scrollTop)
		st = document.body.scrollTop;
	return st;
}

function set_loading() {
	var d = $i('loading_div')
	if(!d)return;
	d.style.top = (get_scroll_top()+10)+'px';
	$ds(d);
	pending_req++;
}
function hide_loading() {
	var d = $i('loading_div')
	if(!d)return;
	pending_req--;
	if(!pending_req)$dh(d);
}

var msg_dialog;
function msgprint(msg, static, callback) {

	if(!msg_dialog) {
		msg_dialog = new Dialog(300, 200, "Message");
		msg_dialog.make_body([['HTML','Msg'],])
		msg_dialog.onhide = function() {
			msg_dialog.msg_area.innerHTML = '';
			$dh(msg_dialog.msg_icon);
			if(msg_dialog.custom_onhide) msg_dialog.custom_onhide();
		}
		var t = make_table(msg_dialog.rows['Msg'], 1, 2, '100%',['20px','250px'],{padding:'2px',verticalAlign: 'Top'});
		msg_dialog.msg_area = $td(t,0,1);
		msg_dialog.msg_icon = $a($td(t,0,0),'img');
	}

	// blur bg
	if(!msg_dialog.display) msg_dialog.show();

	// set message content
	var has_msg = msg_dialog.msg_area.innerHTML ? 1 : 0;

	var m = $a(msg_dialog.msg_area,'div','');
	if(has_msg)$y(m,{marginTop:'4px'});

	$dh(msg_dialog.msg_icon);
	if(msg.substr(0,6).toLowerCase()=='error:') {
		msg_dialog.msg_icon.src = 'images/icons/error.gif'; $di(msg_dialog.msg_icon); msg = msg.substr(6);
	} else if(msg.substr(0,8).toLowerCase()=='message:') {
		msg_dialog.msg_icon.src = 'images/icons/application.gif'; $di(msg_dialog.msg_icon); msg = msg.substr(8);
	} else if(msg.substr(0,3).toLowerCase()=='ok:') {
		msg_dialog.msg_icon.src = 'images/icons/accept.gif'; $di(msg_dialog.msg_icon); msg = msg.substr(3);
	}

	m.innerHTML = replace_newlines(msg);
	
	msg_dialog.custom_onhide = callback;
	
}

function freeze(msg, do_freeze) {
	// show message
	if(msg) {
		var div = $i('dialog_message');

		var d = get_screen_dims();
		div.style.left = ((d.w - 250)/2) + 'px';
		div.style.top  = (get_scroll_top() + 200) + 'px';
		
		div.innerHTML = '<div style="font-size:16px; color: #444; font-weight: bold; text-align: center;">'+msg+'</div>';
		$ds(div);
	} 
	
	// blur
	hide_selects();	
	$ds($i('dialog_back'));
	$h($i('dialog_back'), document.body.offsetHeight+'px');
	fcount++;
	frozen = 1;
}
function unfreeze() {
	$dh($i('dialog_message'));
	if(!fcount)return; // anything open?
	fcount--;
	if(!fcount) {
		$dh($i('dialog_back'));
		show_selects();
		frozen = 0;
	}
}
// Floating Message

function FloatingMessage() {
	if($i('fm_cancel')) {
		$i('fm_cancel').onclick = function() {
			$dh($i('floating_message'));	
		}
		this.show = function(content) {
			$i('fm_content').innerHTML = content;
			$ds($i('floating_message'));
		}
	}
}

// Error Console:

var err_console;
var err_list = [];

function errprint(t) {
	err_list[err_list.length] = ('<pre style="font-family: Courier, Fixed; font-size: 11px; border-bottom: 1px solid #AAA; overflow: auto; width: 90%;">'+t+'</pre>');
}
function show_errors() {
	msgprint(err_list.join('\n'));
}

function submit_error(e) {
	if(isIE) {
		var t = 'Explorer: ' + e + '\n' + e.description;
	} else {
		var t = 'Mozilla: ' + e.toString() + '\n' + e.message + '\nLine Number:' + e.lineNumber;// + '\nStack:' + e.stack;
	}
	$c('client_err_log', args ={'error':t});
	errprint(e + '\nLine Number:' + e.lineNumber + '\nStack:' + e.stack);
}

function setup_err_console() {
	err_console = new Dialog(640, 480, 'Error Console')
	err_console.make_body([
		['HTML', 'Error List'],
		['Button', 'Ok'],
		['Button', 'Clear']
	]);
	err_console.widgets['Ok'].onclick = function() {
		err_console.hide();
	}
	err_console.widgets['Clear'].onclick = function() {
		err_list = [];
		err_console.rows['Error List'].innerHTML = '';
	}
	err_console.onshow = function() {
		about_dialog.hide();
		err_console.rows['Error List'].innerHTML = '<div style="padding: 16px; height: 360px; width: 90%; overflow: auto;">' 
			+ err_list.join('<div style="height: 10px; margin-bottom: 10px; border-bottom: 1px solid #AAA"></div>') + '</div>';
	}
}
startup_lst[startup_lst.length] = setup_err_console;
function show_alert(m) { fm.show(m); }

// Container
var cur_cont = '';
var containers = [];

function Container(name) { }

Container.prototype.init = function() {
	this.wrapper = $a(cont_area, 'div', 'container_div');
	if(isFF) {
		$dh(this.wrapper);
		$y(this.wrapper,{overflow:'hidden'});
	}
	this.head = $a(this.wrapper, 'div', 'container_head');
	this.body = $a(this.wrapper, 'div', 'container_body');
	if(this.oninit)this.oninit();
}

Container.prototype.show = function() {
	if(this.onshow)	this.onshow();
	if(cur_cont)cur_cont.hide();
	cur_cont = this;
	if(this.wrapper.style.display.toLowerCase()=='none') {
		$ds(this.wrapper);
		return;
	}
	//$ds(this.wrapper);
	if(isFF && this.has_frame) {
		$y(this.wrapper,{height:null})
	} else {
		$ds(this.wrapper); 
	}
}

Container.prototype.hide = function() { 
	if(this.onhide)	this.onhide();
	if(isFF && this.has_frame) {
		$y(this.wrapper,{height:'0px'})
	} else {
		$dh(this.wrapper); 
	}
	
	// hide autosuggest
	hide_autosuggest();
	cur_cont = ''; 
}

// Toolbar

function make_tbar_link(parent, label, fn, icon, isactive) {
	var div = $a(parent,'div','',{cursor:'pointer'});
	var t = make_table(div, 1, 2, '90%', ['20px',null]);
	var img = $a($td(t,0,0),'img');
	img.src = 'images/icons/'+icon;
	var l = $a($td(t,0,1),'span','link_type');
	l.style.fontSize = '11px';
	l.innerHTML = label;
	div.onclick = fn;
	div.show = function() { $ds(this); }
	div.hide = function() { $dh(this); }

	$td(t,0,0).isactive = isactive;
	$td(t,0,1).isactive = isactive;
	l.isactive = isactive;
	div.isactive = isactive;

	return div;
}

function Tool_Bar(parent, bottom_rounded, in_grid, btn_col) {
	this.body = $a(parent, 'div', 'tbar_body');
	this.buttons= {};
	this.btn_col = btn_col;
	this.in_grid = in_grid;
	
	if(bottom_rounded) {
		make_rounded(this.body, [0,0,1,1]);
	}

	this.hide = function() { $dh(this.body) }
	this.show = function() { $ds(this.body) }
}

Tool_Bar.prototype.make_button = function(name, onclick, imagesrc, w, bg, border) {
	var btn = $a(this.body, 'div');
	btn.my_class = 'tbar_button';
	if(!w)w=60;
	if(bg)$bg(btn,bg);
	if(border)$b(btn);
	$w(btn, w + 'px');
	
	if(imagesrc) {
		var t = $a(btn, 'table');
		var r = t.insertRow(0);r.insertCell(0); r.insertCell(1);
		$w(r.cells[0], '20px');
		btn.img = $a(r.cells[0], 'img');
		btn.img.src = 'images/icons/' + imagesrc;
		btn.my_class = 'tbar_imgbutton';
		r.cells[1].innerHTML = name;
		if(this.btn_col)
			r.cells[1].style.color = this.btn_col;
		btn.img.btn = btn;
		btn.img.isactive = this.in_grid;
		r.cells[0].isactive = this.in_grid;
		r.cells[1].isactive = this.in_grid;

	} else { btn.innerHTML = name; }

	btn.className = btn.my_class;
	btn.isactive = this.in_grid;

	btn.user_onclick = onclick;
	btn.onclick = function() { if(!this.is_disabled) { this.user_onclick(this); } };
	btn.set_disabled = function() { this.className = this.my_class + ' tbar_btn_disabled'; this.is_disabled = true; }
	btn.set_enabled = function() { this.className = this.my_class; this.is_disabled = false; }
	btn.onmouseover = function() { if(!this.is_disabled) { this.className = this.my_class + ' tbar_btn_over'; } }
 	btn.onmouseout = function() { if(!this.is_disabled) { this.className = this.my_class; } }
 	btn.onmousedown = function() { if(!this.is_disabled) { this.className = this.my_class + ' tbar_btn_down'; } }
 	btn.onmouseup = function() { if(!this.is_disabled) { this.className = this.my_class + ' tbar_btn_over'; } }
	btn.hide = function() { $dh(this); }
	btn.show = function() { $ds(this); }

	if(btn.img)btn.img.onclick = function() { if(!btn.is_disabled) this.btn.user_onclick(btn); }
	
	this.buttons[name] = btn;
	return btn;
}


function execJS(node)
{
  var bSaf = (navigator.userAgent.indexOf('Safari') != -1);
  var bOpera = (navigator.userAgent.indexOf('Opera') != -1);
  var bMoz = (navigator.appName == 'Netscape');

  if (!node) return;

  /* IE wants it uppercase */
  var st = node.getElementsByTagName('SCRIPT');
  var strExec;

  for(var i=0;i<st.length; i++) {
    if (bSaf) {
      strExec = st[i].innerHTML;
      st[i].innerHTML = "";
    } else if (bOpera) {
      strExec = st[i].text;
      st[i].text = "";
    } else if (bMoz) {
      strExec = st[i].textContent;
      st[i].textContent = "";
    } else {
      strExec = st[i].text;
      st[i].text = "";
    }

    try {
      var x = document.createElement("script");
      x.type = "text/javascript";

      /* In IE we must use .text! */
      if ((bSaf) || (bOpera) || (bMoz))
        x.innerHTML = strExec;
      else x.text = strExec;

      document.getElementsByTagName("head")[0].appendChild(x);
    } catch(e) {
      alert(e);
    }
  }
}


function set_message(t) { byId('messages').innerHTML = t; }

var known = {
    0: 'zero',
    1: 'one',
    2: 'two',
    3: 'three',
    4: 'four',
    5: 'five',
    6: 'six',
    7: 'seven',
    8: 'eight',
    9: 'nine',
    10: 'ten',
    11: 'eleven',
    12: 'twelve',
    13: 'thirteen',
    14: 'fourteen',
    15: 'fifteen',
    16: 'sixteen',
    17: 'seventeen',
    18: 'eighteen',
    19: 'nineteen',
    20: 'twenty',
    30: 'thirty',
    40: 'forty',
    50: 'fifty',
    60: 'sixty',
    70: 'seventy',
    80: 'eighty',
    90: 'ninety'
    }

function in_words(n) {
    n=cint(n)
    if(known[n]) return known[n];
    var bestguess = n + '';
    var remainder = 0
    if(n<=20)
    	alert('Error while converting to words');
    else if(n<100) {
        return in_words(Math.floor(n/10)*10) + '-' + in_words(n%10);
    } else if(n<1000) {
        bestguess= in_words(Math.floor(n/100)) + ' ' + 'hundred';
        remainder = n%100;
    } else if(n<100000) {
        bestguess= in_words(Math.floor(n/1000)) + ' ' + 'thousand';
        remainder = n%1000;
    } else if(n < 10000000) {
        bestguess= in_words(Math.floor(n/100000)) + ' ' + 'lakh';
        remainder = n%100000;
    } else {
        bestguess= in_words(Math.floor(n/10000000)) + ' ' + 'crore'
        remainder = n%10000000
    }
    if(remainder) {
        if(remainder >= 100) comma = ','
        else comma = ''
        return bestguess + comma + ' ' + in_words(remainder);
    } else {
        return bestguess;
    }
}


/* adapted from: Timothy Groves - http://www.brandspankingnew.net */
var cur_autosug;
function hide_autosuggest() { if(cur_autosug)cur_autosug.clearSuggestions(); } 
var bsn;

if (typeof(bsn) == "undefined") _b = bsn = {};

if (typeof(_b.Autosuggest) == "undefined") _b.Autosuggest = {};
else alert("Autosuggest is already set!");

_b.AutoSuggest = function (id, param)
{
	this.fld = $i(id);
	if (!this.fld) {return 0; alert('AutoSuggest: No ID');}

	// init variables
	//
	this.sInp 	= "";
	this.nInpC 	= 0;
	this.aSug 	= [];
	this.iHigh 	= 0;

	// parameters object
	this.oP = param ? param : {};
	
	// defaults	
	var k, def = {minchars:1, meth:"get", varname:"input", className:"autosuggest", timeout:5000, delay:1000, offsety:-5, shownoresults: true, noresults: "No results!", maxheight: 250, cache: true, maxentries: 25};
	for (k in def)
	{
		if (typeof(this.oP[k]) != typeof(def[k]))
			this.oP[k] = def[k];
	}
		
	// set keyup handler for field
	// and prevent autocomplete from client
	var p = this;
	
	// NOTE: not using addEventListener because UpArrow fired twice in Safari
	//_b.DOM.addEvent( this.fld, 'keyup', function(ev){ return pointer.onKeyPress(ev); } );
	
	this.fld.onkeypress 	= function(ev){ if(!(text_dialog && text_dialog.display) && !selector.display) return p.onKeyPress(ev); };
	this.fld.onkeyup 		= function(ev){ if(!(text_dialog && text_dialog.display) && !selector.display) return p.onKeyUp(ev); };
	
	this.fld.setAttribute("autocomplete","off");
};

_b.AutoSuggest.prototype.onKeyPress = function(ev)
{
	
	var key = (window.event) ? window.event.keyCode : ev.keyCode;

	// set responses to keydown events in the field
	// this allows the user to use the arrow keys to scroll through the results
	// ESCAPE clears the list
	// TAB sets the current highlighted value
	//
	var RETURN = 13;
	var TAB = 9;
	var ESC = 27;
	
	var bubble = 1;

	switch(key)
	{
		case TAB:
			this.setHighlightedValue();
			bubble = 0; break;
		case RETURN:
			this.setHighlightedValue();
			bubble = 0; break;
		case ESC:
			this.clearSuggestions(); break;
	}

	return bubble;
};



_b.AutoSuggest.prototype.onKeyUp = function(ev)
{
	var key = (window.event) ? window.event.keyCode : ev.keyCode;
	// set responses to keydown events in the field

	var ARRUP = 38; var ARRDN = 40;
	var bubble = 1;

	switch(key)
	{
		case ARRUP:
			this.changeHighlight(key);
			bubble = 0; break;
		case ARRDN:
			this.changeHighlight(key);
			bubble = 0; break;
		default:
			this.getSuggestions(this.fld.value);
	}

	return bubble;
};


_b.AutoSuggest.prototype.getSuggestions = function (val)
{
	
	// if input stays the same, do nothing
	if (val == this.sInp) return 0;
	
	// kill list
	if(this.body && this.body.parentNode)
		this.body.parentNode.removeChild(this.body);

	this.sInp = val;

	// input length is less than the min required to trigger a request
	// do nothing
	if (val.length < this.oP.minchars)
	{
		this.aSug = [];
		this.nInpC = val.length;
		return 0;
	}
	
	var ol = this.nInpC; // old length
	this.nInpC = val.length ? val.length : 0;

	// if caching enabled, and user is typing (ie. length of input is increasing)
	// filter results out of aSuggestions from last request
	var l = this.aSug.length;
	if (this.nInpC > ol && l && l<this.oP.maxentries && this.oP.cache)
	{
		var arr = [];
		for (var i=0;i<l;i++)
		{
			if (this.aSug[i].value.substr(0,val.length).toLowerCase() == val.toLowerCase())
				arr.push( this.aSug[i] );
		}
		this.aSug = arr;
		
		this.createList(this.aSug);
		return false;
	}
	else
	// do new request
	{
		var pointer = this;
		var input = this.sInp;
		clearTimeout(this.ajID);
		this.ajID = setTimeout( function() { pointer.doAjaxRequest(input) }, this.oP.delay );
	}

	return false;
};

_b.AutoSuggest.prototype.doAjaxRequest = function (input)
{
	// check that saved input is still the value of the field
	if (input != this.fld.value)
		return false;

	var pointer = this;
	
	var q = '';

	this.oP.link_field.set_get_query();
	if(this.oP.link_field.get_query) {
		if(cur_frm)var doc = locals[cur_frm.doctype][cur_frm.docname];
		q = this.oP.link_field.get_query(doc);
	}
	$c('search_link', args={
		'txt': this.fld.value, 
		'dt':this.oP.link_field.df.options,
		'defaults':pack_defaults(),
		'query':q,
		'roles':'["'+user_roles.join('","')+'"]' }, function(r,rt) {
		pointer.setSuggestions(r, rt, input);
	});
	
	return;
};


_b.AutoSuggest.prototype.setSuggestions = function (r, rt, input)
{
	// if field input no longer matches what was passed to the request
	// don't show the suggestions
	if (input != this.fld.value)
		return false;
		
	this.aSug = [];
	
	if (this.oP.json) {
		//var jsondata = eval('(' + req.responseText + ')');
		var jsondata = eval('(' + rt + ')');
		
		for (var i=0;i<jsondata.results.length;i++) {
			this.aSug.push(  { 'id':jsondata.results[i].id, 'value':jsondata.results[i].value, 'info':jsondata.results[i].info }  );
		}
	}
	
	this.createList(this.aSug);
};

_b.AutoSuggest.prototype.createList = function(arr)
{
	var pointer = this;
	
	var pos = _b.DOM.getPos(this.fld);
	if(pos.x <= 0 || pos.y <= 0) return; // field hidden
	
	// get rid of old list and clear the list removal timeout
	if(this.body && this.body.parentNode)
		this.body.parentNode.removeChild(this.body);
	this.killTimeout();
	
	// if no results, and shownoresults is false, do nothing
	if (arr.length == 0 && !this.oP.shownoresults)
		return false;
	
	// create holding div
	var div = _b.DOM.cE("div", {className:this.oP.className});	
	div.style.zIndex = 95;
	div.isactive = 1;

	// create and populate ul
	this.ul = _b.DOM.cE("ul", {id:"as_ul"}); var ul = this.ul;

	// loop throught arr of suggestionscreating an LI element for each suggestion
	for (var i=0;i<arr.length;i++) {
		// format output with the input enclosed in a EM element
		// (as HTML, not DOM)
		//
		var val = arr[i].value;
		var st = val.toLowerCase().indexOf( this.sInp.toLowerCase() );
		var output = val.substring(0,st) + "<em>" + val.substring(st, st+this.sInp.length) + "</em>" + val.substring(st+this.sInp.length);

		var span = _b.DOM.cE("span", {}, output, true);
		span.isactive = 1;
		if (arr[i].info != "")
		{
			var small = _b.DOM.cE("small", {}, arr[i].info);
			span.appendChild(small);
			small.isactive = 1
		}
		
		var a 			= _b.DOM.cE("a", { href:"#" });
		
		a.appendChild(span);
		
		a.name = i+1;
		a.onclick = function (e) { 
			pointer.setHighlightedValue(); return false; 
		};
		a.onmouseover = function () { pointer.setHighlight(this.name); };
		a.isactive = 1;
		
		var li = _b.DOM.cE(  "li", {}, a  );
		
		ul.appendChild( li );
	}
	
	// no results
	//
	if (arr.length == 0 && this.oP.shownoresults) {
		var li = _b.DOM.cE(  "li", {className:"as_warning"}, this.oP.noresults);
		ul.appendChild( li );
	}
	div.appendChild( ul );
	// get position of target textfield
	// set width of holding div to width of field
	//
	
	var mywid = cint(this.fld.offsetWidth);
	if(cint(mywid) < 300) mywid = 300;
	var left = pos.x - ((mywid - this.fld.offsetWidth)/2);
	if(left<0) {
		mywid = mywid + (left/2); left = 0;
	}
	
	div.style.left 		= left + "px";
	div.style.top 		= ( pos.y + this.fld.offsetHeight + this.oP.offsety ) + "px";
	div.style.width 	= mywid + 'px'; //this.fld.offsetWidth + "px";

	// set mouseover functions for div
	// when mouse pointer leaves div, set a timeout to remove the list after an interval
	// when mouse enters div, kill the timeout so the list won't be removed
	//
	div.onmouseover 	= function(){ pointer.killTimeout() };
	div.onmouseout 		= function(){ pointer.resetTimeout() };

	// add DIV to document
	//
	//document.getElementsByTagName("body")[0].appendChild(div);	
	$i('body_div').appendChild(div);
	
	// currently no item is highlighted
	//
	this.iHigh = 0;
	this.changeHighlight(40); // hilight first
	
	// remove list after an interval
	//
	var pointer = this;
	this.toID = setTimeout(function () { pointer.clearSuggestions() }, this.oP.timeout);
	cur_autosug = this;
	this.body = div;

};

_b.AutoSuggest.prototype.changeHighlight = function(key)
{	
	var list = this.ul;
	if (!list)
		return false;

	var n;
	if (key == 40)
		n = this.iHigh + 1;
	else if (key == 38)
		n = this.iHigh - 1;

	if (n > list.childNodes.length)
		n = list.childNodes.length;
	if (n < 1)
		n = 1;
	this.setHighlight(n);
};



_b.AutoSuggest.prototype.setHighlight = function(n)
{
	var list = this.ul;
	if (!list)
		return false;
	
	if (this.iHigh > 0)
		this.clearHighlight();
	
	this.iHigh = Number(n);
	
	list.childNodes[this.iHigh-1].className = "as_highlight";

	this.killTimeout();
};


_b.AutoSuggest.prototype.clearHighlight = function()
{
	var list = this.ul;
	if (!list)
		return false;
	if (this.iHigh > 0) {
		list.childNodes[this.iHigh-1].className = "";
		this.iHigh = 0;
	}
};

_b.AutoSuggest.prototype.setHighlightedValue = function ()
{
	if (this.iHigh) {
		if(this.custom_select)
			this.sInp = this.fld.value = this.custom_select(this.fld.value, this.aSug[ this.iHigh-1 ].value);
		else
			this.sInp = this.fld.value = this.aSug[ this.iHigh-1 ].value;
		
		// move cursor to end of input (safari)
		//
		try {
			this.fld.focus();
			if (this.fld.selectionStart)
				this.fld.setSelectionRange(this.sInp.length, this.sInp.length);
		} catch(e) { 
			return; // pass
		}
		this.clearSuggestions();
		this.killTimeout();
		
		// pass selected object to callback function, if exists
		//
		if (typeof(this.oP.callback) == "function")
			this.oP.callback( this.aSug[this.iHigh-1] );
			
		if (this.fld.onchange)
			this.fld.onchange();
	}
};

_b.AutoSuggest.prototype.killTimeout = function() {
	cur_autosug = this;
	clearTimeout(this.toID);
};

_b.AutoSuggest.prototype.resetTimeout = function() {
	cur_autosug = this;
	clearTimeout(this.toID);
	var pointer = this;
	this.toID = setTimeout(function () { pointer.clearSuggestions() }, 1000);
};

_b.AutoSuggest.prototype.clearSuggestions = function () {
	this.killTimeout();
	var pointer = this;
	if (this.body) { $dh(this.body); }
	if(this.ul)
		delete this.ul;
	cur_autosug = null;
};

// DOM PROTOTYPE _____________________________________________

if (typeof(_b.DOM) == "undefined")
	_b.DOM = {};

/* create element */
_b.DOM.cE = function ( type, attr, cont, html )
{
	var ne = document.createElement( type );
	if (!ne) return 0;

	for (var a in attr) ne[a] = attr[a];
	
	var t = typeof(cont);
	
	if (t == "string" && !html) ne.appendChild( document.createTextNode(cont) );
	else if (t == "string" && html) ne.innerHTML = cont;
	else if (t == "object") ne.appendChild( cont );

	return ne;
};

/* get position */
_b.DOM.getPos = function ( e ) {
	var p = objpos(e)
	p.y = p.y + 5;
	return p;
};

function set_opacity(ele, ieop) {
	var op = ieop / 100;
	if (ele.filters) { // internet explorer
		try { 
			ele.filters.item("DXImageTransform.Microsoft.Alpha").opacity = ieop;
		} catch (e) { 
			ele.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(opacity='+ieop+')';
		}
	} else  { // other browsers 
		ele.style.opacity = op; 
	}
}

function animate(ele, style_key, from, to, callback) {
	steps = 10; intervals = 20; powr = 0.5
    if (ele.animateMemInt) {
    	window.clearInterval(ele.animateMemInt);
    }
    var actStep = 0;
    ele.animateMemInt = window.setInterval(
		function() { 
		  ele.currentAnimateVal = easeInOut(cint(from),cint(to),steps,actStep,powr);
		  if(in_list(['width','height','top','left'],style_key)) 
		  	ele.currentAnimateVal = ele.currentAnimateVal + "px";
		  if(style_key=='opacity')
		  	set_opacity(ele, ele.currentAnimateVal);
		  else
		  	ele.style[style_key] = ele.currentAnimateVal;
		  	
		  actStep++;
		  if (actStep > steps) {
		  	window.clearInterval(ele.animateMemInt);
		  	if(callback)callback(ele);
		  }
		} 
		,intervals
	)
}

function easeInOut(minValue,maxValue,totalSteps,actualStep,powr) { 
	var delta = maxValue - minValue; 
	var stepp = minValue+(Math.pow(((1 / totalSteps) * actualStep), powr) * delta); 
	return Math.ceil(stepp) 
} 

// Listing
// -----------------------

list_opts = {
	cell_style : {padding:'3px 2px',borderRight:'1px solid #CCC'},
	alt_cell_style : {backgroundColor:'#F2F2FF'},
	head_style : {backgroundColor:'#F2F2F2',height:'20px',overflow:'hidden',verticalAlign:'middle',textAlign:'center',fontWeight:'bold',padding:'1px'},
	head_main_style : {padding:'0px', borderRight:'1px solid #CCC'},
	hide_export : 0,
	hide_print : 0,
	hide_refresh : 0,
	hide_rec_label: 0,
	show_calc: 1,
	show_empty_tab : 1,
	show_bottom_paging: 1,
	round_corners: 1,
	no_border: 0
};
function Listing(head_text, no_index) {
	this.start = 0; 
	this.page_len = 20;
	this.paging_len = 5;
	this.filters_per_line = 3;
	this.head_text = head_text ? head_text : 'Result';
	this.keyword = 'records';
	this.no_index = no_index;
	this.underline = 1;
	
	// interfaces
	// show_cell(cell, cell_id, data) - override cell display
	// show_result() 
	// server_call(srs, call_back) - override query function

	this.show_cell = null;
	this.show_result = null;
	this.colnames = null; // sr num is required
	this.colwidths = null;
	this.coltypes = null;
	this.coloptions = null;
	
	this.filters = {};
	this.sort_list = {};
	this.sort_order_dict = {};
	
	this.is_std_query = false;
	this.server_call = null;
	
	this.opts = copy_dict(list_opts);
}

Listing.prototype.make = function(parent) {
	var me = this;
	
	this.wrapper = parent;
	
	// filter
	this.filter_wrapper = $a(parent, 'div', 'srs_filter_wrapper');
	this.filter_area = $a(this.filter_wrapper, 'div', 'srs_filter_area');
	$dh(this.filter_wrapper);

	this.btn_area = $a(parent, 'div', '', {margin:'8px 0px'});
	this.body_area = $a(parent,'div','srs_body_area');

	// paging area
	var div = $a(this.body_area,'div','srs_paging_area');
	this.body_head = make_table(div, 1, 2, '100%', ['50%','50%'], {verticalAlign:'middle'});
	$y(this.body_head,{borderCollapse:'collapse'});
	this.rec_label = $td(this.body_head,0,0);

	if(this.opts.hide_rec_label) {
		$y($td(this.body_head,0,0),{width:'0%'}); 
		$y($td(this.body_head,0,1),{width:'100%'});
	}

	// results
	this.results = $a($a(this.body_area, 'div','srs_results_area'),'div');
	this.fetching_area = $a(this.body_area, 'div','',{height:'120px', background:'url("images/ui/square_loading.gif") center no-repeat', display:'none'});

	if(this.opts.show_empty_tab)
		this.make_result_tab();
	
	this.bottom_div = $a(this.body_area,'div','',{paddingTop:'8px',height:'22px'});
	
	// buttons
	var t = make_table(me.btn_area, 1,12, '',['20px','','20px','','20px','','20px','','20px','','20px',''],{height: '36px', verticalAlign:'middle'});
	var cnt = 0;
	this.btns = {};
	var make_btn = function(label,src,onclick,bold) {
		$w($td(t,0,cnt+1), (20 + 6*label.length) + 'px');
		var img = $a($td(t,0,cnt+0), 'img', ''); img.src = "images/icons/"+src+".gif";
		var span = $a($td(t,0,cnt+1),'span','link_type',{margin:'0px 8px 0px 4px'});
		if(bold)$y(span,{fontSize: '14px', fontWeight: 'bold'});
		span.innerHTML = label;
		span.onclick = onclick;
		me.btns[label] = [img,span]; // link
	}
	
	
	// refresh btn
	var tmp = 0;
	if(!this.opts.hide_refresh) {
		make_btn('Refresh','page_refresh',function() {me.run();},1); cnt+=2;
	}

	// new
	if(this.opts.show_new) {
		make_btn('New ','page_add',function() { new_doc(me.dt); },1); cnt+=2;
	}

	// report
	if(this.opts.show_report) {
		make_btn('Report Builder','table',function() { loadreport(me.dt); },0); cnt+=2;
	}
	
	// export
	if(!this.opts.hide_export) {
		make_btn('Export','page_excel',function() {me.do_export();}); cnt +=2;
	}

	// print
	if(!this.opts.hide_print) {
		make_btn('Print','printer',function() {me.do_print();}); cnt+=2;
	}
	
	// calc
	if(this.opts.show_calc) {
		make_btn('Calc','calculator',function() {me.do_calc();}); cnt+=2;
		$dh(this.btns['Calc'][0]); $dh(this.btns['Calc'][1]);
	}
	
	if(!cnt)$dh(this.btn_area);
	
	this.paging_nav = {};
	this.make_paging_area('top',$td(this.body_head,0,1));
	if(this.opts.show_bottom_paging) 
		this.make_paging_area('bottom',this.bottom_div);
	
}

Listing.prototype.do_print = function() {
	this.build_query();
	if(!this.query) { alert('No Query!'); return; }
	
	args = {
		query:this.query,
		title:this.head_text,
		colnames:this.colnames,
		colwidths:this.colwidths,
		coltypes:this.coltypes,
		has_index:(this.no_index ? 0 : 1),
		has_headings: 1,
		check_limit:1,
		is_simple:1
	}
	print_query(args);
}

Listing.prototype.do_calc = function() {
	show_calc(this.result_tab, this.colnames, this.coltypes, 0)
}

ListPaging = function(id, list, p) {
	var mo_bg = '#FFF';
	this.list = list;
	this.wrapper = $a(p,'div','paging_area');
	$dh(this.wrapper);
	var cw = ['15px','50px'];
	for(var i=0;i<list.paging_len;i++) cw[cw.length]='20px';
	cw[cw.length]='35px'; cw[cw.length]='15px'
	var pt = make_table(this.wrapper,1,cw.length,null,cw)

	var me = this;
	var make_link = function(p,label,onclick,rtborder) {
		p.innerHTML = label; 
		p.style.cursor='pointer';
		p.onmouseover = function() { if(!this.disabled) { this.className = 'srs_paging_item srs_paging_item_mo'} }
		p.onmouseout = function() { this.className = 'srs_paging_item'; }
		p.user_onclick = onclick;
		p.onclick = function() { this.user_onclick(); }
		p.disable = function(b) { if(!b)$op(this,30); p.style.cursor='default'; this.disabled=1; }
		p.enable = function() { $op(this,100); p.style.cursor='pointer'; this.disabled=0; }
		p.rtborder = rtborder;
		if(rtborder)p.style.borderRight = '1px solid #CCC';
		return p;
	}

	var goto_rec = function(t,st) { if(!t.disabled) {list.start=st;list.run(1);} }

	this.prev1 = make_link($td(pt,0,0),'<img src="images/ui/prev_pointer.gif">',function() { goto_rec(this,me.list.start - me.list.page_len); });
	this.prev2 = make_link($td(pt,0,1),'Previous',function() { goto_rec(this,me.list.start - me.list.page_len); });

	for(var i=0;i<list.paging_len;i++) {
		this['p_'+i] = make_link($td(pt,0,i+2),'',function() { goto_rec(this,this.st); },((i==list.paging_len-1)?0:1));
	}
	this.next1 = make_link($td(pt,0,cw.length-2),'Next',function() { goto_rec(this,me.list.start + me.list.page_len); });
	this.next2 = make_link($td(pt,0,cw.length-1),'<img src="images/ui/next_pointer.gif">',function() { goto_rec(this,me.list.start + me.list.page_len); });

	list.paging_nav[id] = this;
}

ListPaging.prototype.refresh = function(nr) {
	var lst = this.list;
	if(cint(lst.max_len) <= cint(lst.page_len)) {
		$dh(this.wrapper); return;
	}
	$ds(this.wrapper);
	var last = 0; var cpage = 1; var page_from = 1;
	if((lst.start + nr) == lst.max_len) last = 1;
	
	if(lst.start>0) {
		this.prev1.enable(); this.prev2.enable(); 
		cpage = cint(lst.start / lst.page_len)+1;
		if(cpage > 3) page_from = cpage - 2;
	} else { 
		this.prev1.disable(); this.prev2.disable(); 
	}
	
	// set pages
	for(var i=0;i<lst.paging_len;i++) {
		var st = ((page_from-1)+i)* lst.page_len;
		var p = this['p_'+i];
		if((page_from+i)==cpage) {
			p.innerHTML = ((page_from+i)+'').bold();
			p.disable(1);
		} else if (st> lst.max_len) {
			p.innerHTML = (page_from+i)+'';	
			p.disable();
		} else {
			p.innerHTML = (page_from+i)+'';	
			p.enable();	
			p.st = st;
		}
	}
	if(!last) { this.next1.enable();this.next2.enable(); } else { this.next1.disable();this.next2.disable(); }
}


Listing.prototype.make_paging_area = function(id, p) { new ListPaging(id,this,p); }
Listing.prototype.refresh_paging = function(nr) { for(var i in this.paging_nav) this.paging_nav[i].refresh(nr);}
Listing.prototype.hide_paging = function() { for(var i in this.paging_nav) $dh(this.paging_nav[i].wrapper); }

Listing.prototype.add_filter = function(label, ftype, options, tname, fname, cond) {
	if(!this.filter_area){alert('[Listing] make() must be called before add_filter');}
	var me = this;

	// create filter area
	if(!this.filter_set) {
		// actual area
		var h = $a(this.filter_area, 'div', '', {fontSize:'14px', fontWeight:'bold', marginBottom:'4px'}); 
		h.innerHTML = 'Apply Filters';
		this.filter_area.div = $a(this.filter_area, 'div'); 
				
		this.perm = [[1,1],]
		this.filters = {};
	}
	
	$ds(this.filter_wrapper);

	// create new table (or new line)
	if((!this.inp_tab) || (this.inp_tab.rows[0].cells.length==this.filters_per_line)) {
		this.inp_tab = $a(this.filter_area.div, 'table','',{width:'100%'});
		this.inp_tab.insertRow(0);	
	}

	
	var c= this.inp_tab.rows[0].insertCell(this.inp_tab.rows[0].cells.length);
	$y(c,{width:cint(100/this.filters_per_line) + '%',textAlign:'left',verticalAlign:'top'});
	
	var d1= $a(c,'div'); d1.innerHTML = label; $y(d1,{marginBottom:'2px'});
	var d2= $a(c,'div');
	
	// create the filter
	if(ftype=='Text')ftype='Data';
	var inp = make_field({fieldtype:ftype, 'label':label, 'options':options}, '', d2, this, 0, 1);
	inp.in_filter = 1;
	inp.report = this;

	// filter style
	inp.df.single_select = 1;
	inp.parent_cell = c;
	inp.parent_tab = this.input_tab;
	$y(inp.wrapper,{width:'140px'});
	inp.refresh();$y(inp.input,{width:'100%'});
	inp.tn = tname; inp.fn = fname; inp.condition = cond;
	
	var me = this;
	inp.onchange = function() { me.start = 0; }
	this.filters[label] = inp;
	this.filter_set = 1;
}

Listing.prototype.remove_filter = function(label) {
	var inp = this.filters[label];
	inp.parent_tab.rows[0].deleteCell(inp.parent_cell.cellIndex);
	delete this.filters[label];
}

Listing.prototype.remove_all_filters = function() {
	for(var k in this.filters) this.remove_filter(k);
	$dh(this.filter_wrapper);
}

Listing.prototype.add_sort = function(ci, field_name) { this.sort_list[ci]=field_name;	}
Listing.prototype.has_data = function() { return this.n_records; }

Listing.prototype.set_default_sort = function(fieldname, sort_order) {
	this.sort_order = sort_order;
	this.sort_order_dict[fieldname] = sort_order;
	this.sort_by = fieldname;
}
Listing.prototype.set_sort = function(cell, ci, field_name) {
	var me = this;
	$y(cell.sort_cell,{width:'18px'});
	cell.sort_img = $a(cell.sort_cell, 'img');
	cell.sort_img.src = 'images/icons/sort_desc.gif';
	cell.field_name = field_name;
	$dh(cell.sort_img);

	$y(cell.label_cell,{textDecoration:'underline',color:'#44A',cursor:'pointer'});

	cell.onmouseover = function() { $di(this.sort_img); }
	cell.onmouseout = function() { $dh(this.sort_img); }
	cell.onclick = function() {
		me.sort_by = this.field_name;
		if(me.sort_order_dict[field_name]=='ASC') { 
			me.sort_order = 'ASC'; 
			me.sort_order_dict[field_name] = 'DESC';
			this.sort_img.src = 'images/icons/sort_desc.gif';
		} else { 
			me.sort_order = 'DESC'; 
			me.sort_order_dict[field_name] = 'ASC'; 
			this.sort_img.src = 'images/icons/sort_asc.gif';
		}
		me.run();
	}
}
Listing.prototype.do_export = function() {
	this.build_query();
	var cn = [];
	if(this.no_index)
		cn = this.colnames; // No index
	else {
		for(var i=1;i<this.colnames.length;i++) cn.push(this.colnames[i]); // Ignore the SR label
	}
	var q = export_ask_for_max_rows(this.query, function(query) { export_csv(query, this.head_text, null, 1, null, cn); });
}

Listing.prototype.build_query = function() {
	if(this.get_query)this.get_query(this);
	if(!this.query) { alert('No Query!'); return; }

	// add filters
	var cond = [];
	for(var i in this.filters) {
		var f = this.filters[i];
		var val = f.get_value();
		var c = f.condition;
		if(!c)c='=';
		if(val && c.toLowerCase()=='like')val += '%';
		if(f.tn && val && !in_list(['All','Select...',''],val)) 
			cond.push(repl(' AND `tab%(dt)s`.%(fn)s %(condition)s "%(val)s"', {dt:f.tn, fn:f.fn, condition:c, val:val}));
	}

	if(cond) {
		this.query += NEWLINE + cond.join(NEWLINE)
		this.query_max += NEWLINE + cond.join(NEWLINE)
	}

    // add grouping
	if(this.group_by)
		this.query += ' ' + this.group_by + ' ';	

	// add sorting
	if(this.sort_by && this.sort_order) {
		this.query += NEWLINE + ' ORDER BY ' + this.sort_by + ' ' + this.sort_order;
	}
	if(this.show_query) msgprint(this.query);
}
Listing.prototype.set_rec_label = function(total, cur_page_len) {
	if(this.opts.hide_rec_label) 
		return;
	else if(total==-1)
		this.rec_label.innerHTML = 'Fetching...'
	else if(total > 0)
		this.rec_label.innerHTML = repl('Total %(total)s %(keyword)s. Showing %(start)s to %(end)s', {total:total,start:cint(this.start)+1,end:cint(this.start)+cint(cur_page_len), keyword:this.keyword});
	else if(total==null)
		this.rec_label.innerHTML = ''
	else if(total==0)
		this.rec_label.innerHTML = 'No Result'
}

Listing.prototype.run = function(from_page) {
	this.build_query();
	
	var q = this.query;
	var me = this;

	// add limits
	if(this.max_len && this.start>=this.max_len) this.start-= this.page_len;
	if(this.start<0 || (!from_page)) this.start = 0;
	
	q += ' LIMIT ' + this.start + ',' + this.page_len;
	
	// callback
	var call_back = function(r,rt) {
		// show results
		me.clear_tab();
		me.max_len = r.n_values;
		if(r.values && r.values.length) {
			me.n_records = r.values.length;
			var nc = r.values[0].length;
			if(me.colwidths) nc = me.colwidths.length-(me.no_index?0:1); // -1 for sr no
			if(!me.show_empty_tab) {
				me.remove_result_tab();
				me.make_result_tab(r.values.length);
			}
			me.refresh(r.values.length, nc, r.values);
			me.total_records = r.n_values;
			me.set_rec_label(r.n_values, r.values.length);
		} else { // no result
			me.n_records = 0;
			me.set_rec_label(0);
			if(!me.show_empty_tab) {
				me.remove_result_tab();
				me.make_result_tab(0);
			} else {
				me.clear_tab();
			}
		}
		$ds(me.results);
		if(me.onrun) me.onrun();
	}
	
	// run
	this.set_rec_label(-1);
	if(this.server_call) 
		{ this.server_call(this, call_back); }
	else {
		args={query_max: this.query_max
			,'defaults':pack_defaults()
			,'roles':'["'+user_roles.join('","')+'"]'}
		if(this.is_std_query) args.query = q;
		else args.simple_query = q;
		$c('runquery', args, call_back);
	}
}

Listing.prototype.remove_result_tab = function() {
	if(!this.result_tab) return;
	this.result_tab.parentNode.removeChild(this.result_tab);
	delete this.result_tab;
}

Listing.prototype.reset_tab = function() {
	this.remove_result_tab();
	this.make_result_tab();
}

Listing.prototype.make_result_tab = function(nr) {
	if(this.result_tab)return;
	if(!this.colwidths) alert("Listing: Must specify column widths");
	var has_headrow = this.colnames ? 1 : 0;
	if(nr==null)nr = this.page_len;
	nr += has_headrow;
	var nc = this.colwidths.length;
		
	var t=make_table(this.results, nr, nc, '100%', this.colwidths,{padding:'0px'});
	t.className = 'srs_result_tab'; this.result_tab = t;
	$y(t,{borderCollapse:'collapse'});
	
	// display headings
	if(has_headrow) 
		this.make_headings(t,nr,nc);

	for(var ri=(has_headrow?1:0); ri<t.rows.length; ri++) {
		for(var ci=0; ci<t.rows[ri].cells.length; ci++) {
			if(this.opts.cell_style)$y($td(t,ri,ci), this.opts.cell_style);
			if(this.opts.alt_cell_style && (ri % 2))$y($td(t,ri,ci), this.opts.alt_cell_style);	
			if(this.opts.show_empty_tab)$td(t, ri, ci).innerHTML = '&nbsp;';
		}
	}

	if(this.opts.no_border == 1) {
		$y(t,{border:'0px'});
	}	

	this.result_tab = t;
}
Listing.prototype.clear_tab = function() {
	$dh(this.results);
	if(this.result_tab) {
		var nr = this.result_tab.rows.length;
		for(var ri=(this.colnames?1:0); ri<nr; ri++)
			for(var ci=0; ci< this.result_tab.rows[ri].cells.length; ci++)
				$td(this.result_tab, ri, ci).innerHTML = (this.opts.show_empty_tab ? '&nbsp;' : '');
	}
}
Listing.prototype.clear = function() {
	this.rec_label.innerHTML = '';
	this.clear_tab();
}

Listing.prototype.refresh_calc = function() {
	if(!this.opts.show_calc) return;
	if(has_common(this.coltypes, ['Currency','Int','Float'])) {
		$di(this.btns['Calc'][0]); $di(this.btns['Calc'][1]);
	}
}

Listing.prototype.refresh = function(nr, nc, d) {

	this.refresh_paging(nr);
	this.refresh_calc();
	
	if(this.show_result) 
		this.show_result();
	
	else { 
		if(nr) {
			// Standard Result Display
			var has_headrow = this.colnames ? 1 : 0;	
	
			// display results
			for(var ri=0 ; ri<nr ; ri++) {
				var c0 = $td(this.result_tab,ri+has_headrow,0);
				if(!this.no_index) { // show index
					c0.innerHTML = cint(this.start) + cint(ri) + 1;
				}
				for(var ci=0 ; ci<nc ; ci++) {
					var c = $td(this.result_tab,ri+has_headrow,ci+(this.no_index?0:1));
					if(c) {
						c.innerHTML = ''; // clear
						if(this.show_cell) this.show_cell(c, ri, ci, d);
						else this.std_cell(d, ri, ci);
					}
				}
			}

		}
	}
}

Listing.prototype.make_headings = function(t,nr,nc) {
	for(var ci=0 ; ci<nc ; ci++) { 
	
		var tmp = make_table($td(t,0,ci),1,2,'100%',['','0px'],this.opts.head_style);
		$y(tmp,{tableLayout:'fixed',borderCollapse:'collapse'});
		$y($td(t,0,ci),this.opts.head_main_style); // right border on main table
		$td(t,0,ci).sort_cell = $td(tmp,0,1);
		$td(t,0,ci).label_cell = $td(tmp,0,0);
		$td(tmp,0,1).style.padding = '0px';
		
		$td(tmp,0,0).innerHTML = this.colnames[ci]?this.colnames[ci]:'&nbsp;'; 
	
		if(this.sort_list[ci])this.set_sort($td(t,0,ci), ci, this.sort_list[ci]);
					
		var div = $a($td(t,0,ci), 'div');
		div.style.borderBottom ='1px solid #CCC';
		
		if(this.coltypes && this.coltypes[ci] && in_list(['Currency','Float','Int'], this.coltypes[ci])) $y($td(t,0,ci).label_cell,{textAlign:'right'})
	}
}

Listing.prototype.std_cell = function(d, ri, ci) {
	var has_headrow = this.colnames ? 1 : 0;
	var c = $td(this.result_tab,ri+has_headrow,ci+(this.no_index?0:1));
	c.div = $a(c, 'div');
	$s(
		c.div, 
		d[ri][ci], 
		this.coltypes ? this.coltypes[ci+(this.no_index?0:1)] : null, 
		this.coloptions ? this.coloptions[ci+(this.no_index?0:1)] : null
	);
}


// Tabbed Page

function TabbedPage(parent, only_labels) { 
	this.tabs = {};
	this.cur_tab = null;

	var lw = $a(parent, 'div','box_label_wrapper'); // for border
	var lb = $a(lw, 'div', 'box_label_body'); // for height
	this.label_area = $a(lb, 'ul', 'box_tabs');
	if(!only_labels)this.body_area = $a(parent, 'div');
	else this.body_area = null;
}

TabbedPage.prototype.add_tab = function(n, onshow) { 

	var tab = $a(this.label_area, 'li');
	tab.label = $a(tab,'a');
	tab.label.innerHTML = n;
	
	if(this.body_area){
		tab.tab_body = $a(this.body_area, 'div', 'box_tabs_body');
		$dh(tab.tab_body);
	} else { tab.tab_body = null; }
	tab.onshow = onshow;
	var me = this;

	tab.hide = function() { 
		if(this.tab_body)$dh(this.tab_body); this.className = '';
		hide_autosuggest();
	}
	tab.set_selected = function() { 
		if(me.cur_tab) me.cur_tab.hide();
		this.className = 'box_tab_selected';
		$op(this, 100); 
		me.cur_tab = this;
	}
	tab.show = function(arg) { 
		this.set_selected(); 
		if(this.tab_body) $ds(this.tab_body);
		if(this.onshow)this.onshow(arg); 
	}
	tab.onmouseover = function() { 
		if(me.cur_tab!=this) $op(this, 60);
		//this.className = 'box_tab_mouseover'; 
	}
	tab.onmouseout = function() {
		$op(this, 100); 
		//else this.className = 'box_tab_selected'; 
	}
	tab.onclick = function() { this.show(); }
	this.tabs[n] = tab;
	return tab;
}

TabbedPage.prototype.disable_tab = function(n) {
	if(this.cur_tab==this.tabs[n]) this.tabs[n].hide();
	$dh(this.tabs[n]) // hide label
}
TabbedPage.prototype.enable_tab = function(n) {
	$di(this.tabs[n]) // show label
}

/// OLD APP 2

var READ = 0; var WRITE = 1; var CREATE = 2; var SUBMIT = 3; var CANCEL = 4; var AMEND = 5;
var NEWLINE = '\n';

var exp_icon = "images/ui/right-arrow.gif"; 
var min_icon = "images/ui/down-arrow.gif";

var FG1 = "#FFFFAA";
var FG2 = "#DDDDDD";
var BG1 = "#FFFFFF";
var BG2 = "#F8F8F8";

var user;
var frms = {};
var frm_con;
var session = {};
var cal;
var selector;
var is_testing = false;
var tree;
var user_defaults; var user_roles; var user_fullname; var user_recent; var user_email;
var recent_docs = [];
session.al = [];
var max_dd_rows;
var cur_frm;
var popup_list = [];
var scroll_list=[];
var grid_selected_cell;
var cont_area;

var tables_parents;
var no_value_fields = ['Section Break', 'Column Break', 'HTML', 'Table', 'FlexTable', 'Button', 'Image'];

function makeui(r, rt) {
	// load data

	if(r.exc) { msgprint(r.exc); return; }

	if(!user) {
		msgprint('Not Logged In',0,logout);
		return;
	}

	// check if password has expired
	check_pwd_expiry();

	session.al = r.al;
	user_recent = r.recent_documents;
	
	if(cint(r.testing_mode)) {
		alert(r.testing_mode);
		is_testing = true;
	}

	// exec startup functions;
	for(var i=0;i<startup_lst.length;i++) {
		startup_lst[i]();
	}
	
	if(session.from_gateway) { $dh('user_div')}
	$i('user_id').innerHTML = user_fullname ? user_fullname : user;
	$ds('body_div');
	
	// force vertical scroll for IE * except in Gateway account
	if(isIE)$y(document.getElementsByTagName('html')[0],{overflowY:'scroll'});
	$dh('startup_div');
	if(isIE) {
		$i('dialog_back').style['filter'] = 'alpha(opacity=60)';
	}
	
	// display
	window.onresize = set_frame_dims;
	set_frame_dims();

	loadpage('_home');
	
	if(sys_defaults.login_file)login_file = sys_defaults.login_file;	
}

var export_dialog;
function export_ask_for_max_rows(query, callback) {

	if(!export_dialog) {
		var d = new Dialog(400, 300, "Export...");
		d.make_body([
			['Data', 'Max rows', 'Blank to export all rows'],
			['Button', 'Go'],
		]);	
		d.widgets['Go'].onclick = function() {
			export_dialog.hide();
			n = export_dialog.widgets['Max rows'].value;
			if(cint(n))
				export_dialog.query += ' LIMIT 0,' + cint(n);
			callback(export_dialog.query);
		}
		d.onshow = function() {
			this.widgets['Max rows'].value = '500';
		}
		export_dialog = d;
	}
	export_dialog.query = query;
	export_dialog.show();
}

function open_url_post(URL, PARAMS) {
	var temp=document.createElement("form");
	temp.action=URL;
	temp.method="POST";
	temp.style.display="none";
	for(var x in PARAMS) {
		var opt=document.createElement("textarea");
		opt.name=x;
		opt.value=PARAMS[x];
		temp.appendChild(opt);
	}
	document.body.appendChild(temp);
	temp.submit();
	return temp;
}

function export_csv(q, report_name, sc_id, is_simple, filter_values, colnames) {
	var args = {}
	args.cmd = 'runquery_csv';
	args.__account = account_id;
	if(__sid150) args.sid150 = __sid150;
    if(is_simple) args.simple_query = q; else args.query = q;
    args.sc_id = sc_id ? sc_id : '';
    args.filter_values = filter_values ? filter_values: '';
    if(colnames) args.colnames = colnames.join(',');
	args.report_name = report_name ? report_name : '';
	args.defaults = pack_defaults();
	args.roles = '["'+user_roles.join('","')+'"]';
	open_url_post(outUrl, args);
}

var print_dialog;
function show_print_dialog(args) {
	if(!print_dialog) {
		var d = new Dialog(400, 300, "Print");
		d.make_body([
			['Data', 'Max rows', 'Blank to print all rows'],
			['Data', 'Rows per page'],
			['Button', 'Go'],
		]);	
		d.widgets['Go'].onclick = function() {
			print_dialog.hide();
			go_print_query(print_dialog.args, cint(print_dialog.widgets['Max rows'].value), cint(print_dialog.widgets['Rows per page'].value))
		}
		d.onshow = function() {
			this.widgets['Rows per page'].value = '35';
			this.widgets['Max rows'].value = '500';
		}
		print_dialog = d;
	}
	print_dialog.args = args;
	print_dialog.show();
}

function print_query(args) { show_print_dialog(args); }

function go_print_query(args, max_rows, page_len) {
 //q, title, colnames, colwidths, coltypes, has_index, check_limit, is_simple
 
	// limit for max rows
    if(cint(max_rows)!=0) args.query += ' LIMIT 0,' + cint(max_rows);

	if(!args.query) return;

	var callback = function(r,rt) {

		if(!r.values) { return; }
		if(!page_len) page_len = r.values.length;

		// add serial num column
				
		if(r.colnames && r.colnames.length) 
			args.colnames = args.has_index ? add_lists(['Sr'],r.colnames) : r.colnames;
		if(r.colwidths && r.colwidths.length) 
			args.colwidths = args.has_index ? add_lists(['25px'],r.colwidths) : r.colwidths;
		if(r.coltypes) 
			args.coltypes = args.has_index ? add_lists(['Data'],r.coltypes) : r.coltypes;

		if(args.coltypes) {
			for(var i in args.coltypes) 
				if(args.coltypes[i]=='Link') args.coltypes[i]='Data';
		}

		// fix widths to %
		if(args.colwidths) {
			var tw = 0;
			for(var i=0; i<args.colwidths.length; i++) tw+=cint(args.colwidths[i] ? args.colwidths[i]: 100);
			for(var i=0; i<args.colwidths.length; i++) args.colwidths[i]= cint(cint(args.colwidths[i] ? args.colwidths[i] : 100) / tw * 100) + '%';
		}
		

		var has_heading = args.colnames ? 1 : 0;
		if(!args.has_headings) has_heading = 0;
		
		var tl = []
		for(var st=0; st< r.values.length; st = st + page_len) {
			tl.push(print_query_table(r, st, page_len, has_heading, args.finder))
		}
		
		var html = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">'
			+ '<html><head>'
			+'<title>'+args.title+'</title>'
			+'<style>'+def_print_style+'</style>'
			+'</head><body>'
			+ (r.header_html ? r.header_html : '')
			+ tl.join('\n<div style="page-break-after: always;"></div>\n')
			+ (r.footer_html ? r.footer_html : '')
			+'</body></html>';
		print_go(html)    
	}
	var out_args = copy_dict(args);
	if(args.is_simple) {
		out_args.simple_query = args.query;
		delete out_args.query;
	} else {
		out_args.defaults = pack_defaults();
		out_args.roles = '["'+user_roles.join('","')+'"]';
	}
	// add filter values
	if(args.filter_values) 
		out_args.filter_values = args.filter_values;
	$c('runquery', out_args, callback);
}

function print_query_table(r, start, page_len, has_heading, finder) {
	// print a table
	var div = document.createElement('div');
	
	if(!r.page_template) {
		var head = $a(div,'div',null,{fontSize:'20px', fontWeight:'bold', margin:'16px 0px', borderBottom: '1px solid #CCC', paddingBottom:'8px'});
		head.innerHTML = args.title;
	}

	var m = start + page_len;
	if(m>r.values.length) m = r.values.length
		
	var t = make_table(div, m + has_heading - start, r.values[0].length + args.has_index, '100%', null);
	t.className = 'simpletable';
	if(args.colwidths)
		$y(t,{tableLayout:'fixed'});

	if(has_heading) {
		for(var i=0; i < args.colnames.length; i++) {
			$td(t,0,i).innerHTML = args.colnames[i].bold();
			if(args.colwidths && args.colwidths[i]) {
				$w($td(t,0,i),args.colwidths[i]);
			}
		}
	}

	for(var ri=start; ri<m; ri++) {
		// Sr No
		if(args.has_index)
			$td(t,ri+has_heading-start,0).innerHTML=ri+1;
		for(var ci=0; ci<r.values[0].length; ci++) {
			if(ri-start==0 && args.colwidths && args.colwidths[i]){
				$w($td(t,0,i), args.colwidths[i]); // colwidths for all
			}
			var c = $td(t,ri+has_heading-start,ci + args.has_index)
			c.div = $a(c, 'div');
			$s(
				c.div, 
				r.values[ri][ci],
				args.coltypes ? args.coltypes[ci + args.has_index] : null
			);
		}
	}

	// user style
	if(r.style) {
		for(var i=0;i<r.style.length;i++) {
			$yt(t,r.style[i][0],r.style[i][1],r.style[i][2]);
		}
	}

	if(finder && finder.aftertableprint) {
		finder.aftertableprint(t);
	}
		
	if(r.page_template) return repl(r.page_template, {table:div.innerHTML});
	else return div.innerHTML;

}
var wn_toolbar;
var left_sidebar_width = 0;
var right_sidebar_width = 0;
var header_height = 40;
var footer_height = 0;
var overall_width = 0;
var home_page;
var hide_webnotes_toolbar = false;

function setup_display() {
	var cp = locals['Control Panel']['Control Panel'];
	
	// top menu
	wn_toolbar = new MenuToolbar($i('topmenu_div'))
	
	// background
	if(cp.background_color) {
		$y($i('center_div'),{backgroundColor:cp.background_color});
		$y($i('menu_div'),{backgroundColor:cp.background_color});
		$y($i('footer_div'),{backgroundColor:cp.background_color});
	}
	
	// header
	if(cint(cp.header_height)) {
		header_height = cint(cp.header_height);
	}

	// header
	if(cint(cp.footer_height)) {
		footer_height = cint(cp.footer_height);
		if(cp.footer_html)$i('footer_div').innerHTML = cp.footer_html;
	}

	// left sidebar
	if(cint(cp.left_sidebar_width)) {
		left_sidebar_width = cint(cp.left_sidebar_width);
	}
	
	// right sidebar
	if(cint(cp.right_sidebar_width)) {
		right_sidebar_width = cint(cp.right_sidebar_width);
	}

	// webnotes toolbar
	hide_webnotes_toolbar = cint(user_defaults.hide_webnotes_toolbar)
	
	if(!hide_webnotes_toolbar)
		hide_webnotes_toolbar = cint(cp.hide_webnotes_toolbar);
		
	if(user=='Administrator') hide_webnotes_toolbar = false;
	
	if(hide_webnotes_toolbar) { $dh('wn_toolbar'); }
	
	// container area
	cont_area = $a('center_div','div','center_area');
		
	// client logo
	if(cp.client_logo){
		var img = $a('head_banner', 'img');
		img.src = 'images/' +cp.client_logo;
		img.setAttribute('height','40px');
	} else if(cp.client_name) {
		$i('head_banner').innerHTML = cp.client_name;
	}

	// width
	if(cp.page_width) {
		set_overall_width(cp.page_width);
		pagewidth = overall_width - left_sidebar_width - right_sidebar_width - 32;
	} else {
		pagewidth = screen.width - left_sidebar_width - right_sidebar_width - cint(screen.width * 0.1);
	}
	max_dd_rows = 15;
	
	// selector
	if(cint(cp.new_style_search))
		makeselector2();
	else
		makeselector();
		
	// startup
	if(cp.startup_code)
		eval(cp.startup_code)
	if(pscript.client_startup)
		pscript.client_startup();
	
}
startup_lst[startup_lst.length] = setup_display;

function set_overall_width(w) {
	overall_width = cint(w);
	pagewidth = overall_width - left_sidebar_width - right_sidebar_width - 32;
}

// Quick Search
var search_sel;
function setup_search_select() { 
	// Set Quick Search
	search_sel = $a('qsearch_sel', 'select');
	add_sel_options(search_sel, session.m_rt);
	search_sel.selectedIndex = 0;
	search_sel.onchange = function() { open_quick_search(); }
	select_register[select_register.length] = search_sel;

	var search_btn = $a('qsearch_btn', 'button');
	search_btn.innerHTML = 'Search';
	search_btn.onclick = function() { open_quick_search(); }
}
function open_quick_search() {
	selector.set_search(sel_val(search_sel));
	search_sel.disabled = 1;
	selector.show();
}
startup_lst[startup_lst.length] = setup_search_select;

var load_todo = function() { 
	loadpage('_todo');
}
var load_cal = function() { 
	loadpage('_calendar');
}

// Start
function setup_more() {

	//if(!session.mi.length)return;
	
	var tm = wn_toolbar.add_top_menu('Start', function() { });
	
	var fn = function() {
		if(this.dt=='Page')
			loadpage(this.dn);
		else
			loaddoc(this.dt, this.dn);
		mclose();
	}

	wn_toolbar.add_item('Start','To Do', load_todo);
	wn_toolbar.add_item('Start','Calendar', load_cal);

	// add menu items
	session.mi.sort(function(a,b){return (a[4]-b[4])});
	for(var i=0;i< session.mi.length;i++) {
		var d = session.mi[i];
		var mi = wn_toolbar.add_item('Start',d[1], fn);
		mi.dt = d[0]; mi.dn = d[5]?d[5]:d[1];
	}
}

startup_lst[startup_lst.length] = setup_more;

// home
function setup_home() {
	wn_toolbar.add_top_menu('Home', function() { loadpage(home_page); } );
}

startup_lst[startup_lst.length] = setup_home;

// new docs
function setup_new_docs() {
	wn_toolbar.add_top_menu('New', function() {  } );

	var fn = function() {
		new_doc(this.dt);
		mclose();
	}
	
	// add menu items
	for (var i=0;i<session.nt.length;i++) {
		var mi = wn_toolbar.add_item('New',session.nt[i], fn);
		mi.dt = session.nt[i];
	}
}

startup_lst[startup_lst.length] = setup_new_docs;

// recent docs
var rdocs;
function setup_recent_docs() {

	rdocs = wn_toolbar.add_top_menu('Recent', function() { /*loadpage('_recent');*/ } );
	rdocs.items = {};

	var fn = function() { // recent is only for forms
		loaddoc(this.dt, this.dn);
		mclose();
	}
	
	rdocs.add = function(dt, dn, on_top) {
		if(!in_list(['Start Page','ToDo Item','Event','Search Criteria'], dt)) {

			// if there in list, only bring it to top
			if(this.items[dt+'-'+dn]) {
				var mi = this.items[dt+'-'+dn];
				mi.bring_to_top();
				return;
			}

			var tdn = dn;
			//if(dn.length>20)tdn = dn.substr(0,20) + '...';
			var rec_label = '<table style="width: 100%" cellspacing=0><tr>'
				+'<td style="width: 10%; vertical-align: middle;"><div class="status_flag" id="rec_'+dt+'-'+dn+'"></div></td>'
				+'<td style="width: 50%; text-decoration: underline; color: #22B; padding: 2px;">'+tdn+'</td>'
				+'<td style="font-size: 11px;">'+dt+'</td></tr></table>';
		
			var mi = wn_toolbar.add_item('Recent',rec_label,fn, on_top);
			mi.dt = dt; mi.dn = dn;	
			this.items[dt+'-'+dn] = mi;
			if(pscript.on_recent_update)pscript.on_recent_update();
		}
	}
	rdocs.remove = function(dt, dn) {
		var it = rdocs.items[dt+'-'+dn];
		if(it)$dh(it);
		if(pscript.on_recent_update)pscript.on_recent_update();
	}
	// add menu items
	var rlist = user_recent.split('\n');
	var m = rlist.length;
	if(m>15)m=15;
	for (var i=0;i<m;i++) {
		var t = rlist[i].split('~~~');
		if(t[1]) {
			var dn = t[0]; var dt = t[1];
			rdocs.add(dt, dn, 0);
		}
	}
}

startup_lst[startup_lst.length] = setup_recent_docs;

// Reports
var search_page;
function setup_search_page() {

	var tmp = new Page('_search');
	tmp.cont.body.style.height = '100%'; // IE FIX
	search_page = new ReportPage(tmp.cont.body);

	wn_toolbar.add_top_menu('Report Builder', function() {  } );

	var fn = function() {
		loadreport(this.dt);
		mclose();
	}
	
	// add menu items
	for (var i=0;i<session.rt.length;i++) {
		var mi = wn_toolbar.add_item('Report Builder',session.rt[i], fn);
		mi.dt = session.rt[i];
	}
}

startup_lst[startup_lst.length] = setup_search_page;

// start To Do
var ToDoList;
var todo;
function setup_todo() {
	var hpage = new Page('_todo');
	hpage.cont.body.style.height = '100%'; // IE FIX
	hpage.cont.onshow = function() { 
		if(!todo) todo = new ToDoList(hpage.cont.body); 
		todo.organize_by_priority();
	}
}
startup_lst[startup_lst.length] = setup_todo;

// calendar
function setup_calendar() {
	calpage = new Page('_calendar');
	calpage.cont.body.style.height = '100%'; // IE FIX
	calpage.cont.onshow = function() { 
		if(!calendar) {
			calendar = new Calendar();
			calendar.init(calpage.cont.body);
		}
	}
}
startup_lst[startup_lst.length] = setup_calendar;

// Back Link
var has_back_link = 0;
function setup_back_link() {
	if($i('back_link')) {
		has_back_link = 1;
		$i('back_link').onclick = function() {
			nav_obj.show_last_open();
		}
	}
}

startup_lst[startup_lst.length] = setup_back_link;

// Navigation Object

var nav_obj = {}
nav_obj.ol = [];
nav_obj.open_notify = function(t, dt, dn) {
	// last should not be this (refresh)
	if(nav_obj.length) {
		var tmp = nav_obj[nav_obj.length-1];
		if(tmp[0]==t && tmp[1]==dt && tmp[2]==dn) return;
	}

	// remove from list (if exists)
	var tmp = [];
	for(var i in nav_obj.ol)
		if(!(nav_obj.ol[i][0]==t && nav_obj.ol[i][1]==dt && nav_obj.ol[i][2]==dn)) tmp.push(nav_obj.ol[i]);
	nav_obj.ol = tmp;

	// add to top
	nav_obj.ol.push([t, dt, dn])	
	
	// add to "back" history
	dhtmlHistory.add(t+'~~~'+ dt + (dn ? ('~~~'+dn): ''),'');

	// update back link
	if(!(has_back_link && dt)) return;
	var l = $i('back_link');
	var tmp = nav_obj.ol[nav_obj.ol.length-2];
	if(tmp)
		l.innerHTML = ('<< Back to '+(tmp[0]=='Page' ? tmp[1] : (tmp[1] + ' ' + tmp[2]))).bold();
	else
		l.innerHTML = '';
}

nav_obj.rename_notify = function(dt, oldn, newn) {
	for(var i in nav_obj.ol)
		if(nav_obj.ol[i][1]==dt && nav_obj.ol[i][2]==oldn) nav_obj.ol[i][2]=newn;
} 

nav_obj.show_last_open = function() {
	var l = nav_obj.ol[nav_obj.ol.length-2];
	delete nav_obj.ol[nav_obj.ol.length-1]; // delete current open

	if(!l) loadpage('_home');
	else if(l[0]=='Page') { 
		loadpage(l[1]);
	} else if(l[0]=='Report') {
		loadreport(l[1],l[2]);
	} else if(l[0]=='DocType') {
		loaddoc(l[1],l[2]);
	} else if(l[0]=='Application') {
		loadapp(l[1]);
	}
}

// PAGE

var pages=[];
function Page(page_name, content) {	
	this.name = page_name;
	this.cont = new Container(page_name);
	this.cont.init();
	if(content)this.cont.body.innerHTML = content;
	pages[page_name] = this;
	if(page_name == home_page)pages['_home'] = this;
	this.cont.page = this;
	this.cont.onshow = function() {
		try {
			if(pscript['onshow_'+this.page.name]) pscript['onshow_'+this.page.name](); // onload
		} catch(e) { submit_error(e); }
		set_title(this.page.name);
	}
	return this;
}

var pscript={};
var cur_page;
function loadpage(page_name, call_back, menuitem) {
	//if(cur_page==page_name) return;
	if(page_name=='_home')page_name = home_page;
	var fn = function(r,rt) {
		if(pages[page_name]) {
			// loaded
			var p = pages[page_name]
			
			// call refresh
			try {
				if(pscript['refresh_'+page_name]) pscript['refresh_'+page_name](menuitem); // onload
			} catch(e) { 
				submit_error(e); 
			}
		} else {
			// new page
			var p = render_page(page_name, menuitem);
			if(menuitem) p.menuitem = menuitem;
			if(!p)return;
		}

		// show
		p.cont.show();
		
		// select menu
		if(p.menuitem) p.menuitem.show_selected();

		// execute callback
		cur_page=page_name;
		if(call_back)call_back();

		// update "back"		
		if(page_name!='_search')
			nav_obj.open_notify('Page',page_name,'');
	}
	
	if(get_local('Page', page_name) || pages[page_name]) fn();
	else $c('getdoc', {'name':page_name, 'doctype':"Page", 'user':user, 'is_page':1}, fn);
}

function render_page(page_name, menuitem) {
	if(!page_name)return;
	if((!locals['Page']) || (!locals['Page'][page_name])) {
		alert(page_name + ' not found'); return;
	}
	var pdoc = locals['Page'][page_name];

	// style
	if(pdoc.style) set_style(pdoc.style)

	// script
	var script = pdoc.__script ? pdoc.__script : pdoc.script;
	if(script)
		try { eval(script); } catch(e) { submit_error(e); }		
		
	var p = new Page(page_name, pdoc.__content?pdoc.__content:pdoc.content);

	try {
		if(pscript['onload_'+page_name]) pscript['onload_'+page_name](menuitem); // onload
	} catch(e) { submit_error(e); }
		
	return p;
}

function refresh_page(page_name) {
	var fn = function(r, rt) {
		render_page(page_name)	
	}
	$c('getdoc', {'name':page_name, 'doctype':"Page", 'user':user, 'is_page':1}, fn)
}

function check_perm_match(p, dt, dn) {
	if(!dn) return true;
	var out =false;
	if(p.match) {
		if(user_defaults[p.match]) {
			for(var i=0;i<user_defaults[p.match].length;i++) {
				 // user must have match field in defaults
				if(user_defaults[p.match][i]==locals[dt][dn][p.match]) {
				    // must match document
		  			return true;
				}
			}
			return false;
		} else if(!locals[dt][dn][p.match]) { // blanks are true
			return true;
		} else {
			return false;
		}
	} else {
		return true;
	}
}

/*

Note: Submitted docstatus overrides the permissions. To ignore submit condition
pass ignore_submit=1

*/

function get_perm(doctype, dn, ignore_submit) {

	var perm = [[0,0],];
	if(in_list(user_roles, 'Administrator')) perm[0][READ] = 1;
	var plist = getchildren('DocPerm', doctype, 'permissions', 'DocType');
	for(var pidx in plist) {
		var p = plist[pidx];
		var pl = cint(p.permlevel?p.permlevel:0);
		// if user role
		if(in_list(user_roles, p.role)) {
			// if field match
			if(check_perm_match(p, doctype, dn)) { // new style
				if(!perm[pl])perm[pl] = [];
				if(!perm[pl][READ]) { 
					if(cint(p.read))  perm[pl][READ]=1;   else perm[pl][READ]=0;
				}
				if(!perm[pl][WRITE]) { 
					if(cint(p.write)) { perm[pl][WRITE]=1; perm[pl][READ]=1; }else perm[pl][WRITE]=0;
				}
				if(!perm[pl][CREATE]) { 
					if(cint(p.create))perm[pl][CREATE]=1; else perm[pl][CREATE]=0;
				}
				if(!perm[pl][SUBMIT]) { 
					if(cint(p.submit))perm[pl][SUBMIT]=1; else perm[pl][SUBMIT]=0;
				}
				if(!perm[pl][CANCEL]) { 
					if(cint(p.cancel))perm[pl][CANCEL]=1; else perm[pl][CANCEL]=0;
				}
				if(!perm[pl][AMEND]) { 
					if(cint(p.amend)) perm[pl][AMEND]=1;  else perm[pl][AMEND]=0;
				}
			}
		}
	}

	if((!ignore_submit) && dn && locals[doctype][dn].docstatus>0) {
		for(pl in perm)
			perm[pl][WRITE]=0; // read only
	}
	return perm;
}

//
// Startup
//

var grid_click_event;
function startup() {
	fm = new FloatingMessage();

	//initialize our DHTML history
	dhtmlHistory.initialize();

	//subscribe to DHTML history change events
	dhtmlHistory.addListener(historyChange);

	// click on empty space
	addEvent('click', function(e, target) {
		if(target.className.substr(0,2)!='cp') {
			if(grid_click_event)grid_click_event(e, target);
			for (var i=0; i<popup_list.length; i++) { // clear all calendars
				if (popup_list[i]) { popup_list[i].hideIfNotClicked(e); show_selects(); }
			}
		}
	});
	
	addEvent('keydown', function(e, target) {
		if(isIE)var kc = window.event.keyCode;
		else var kc = e.keyCode;
		if(grid_selected_cell){ grid_selected_cell.grid.cell_keypress(e, kc); }
		
		// execute search on enter key ??
		if(kc==13 && cur_cont && cur_cont.page && cur_cont.page.name=='_search') {
			if(search_page.cur_finder 
				&& search_page.cur_finder.dt && (!selector.display)
						&& inList(['Result', 'Set Filters', 'Select Columns'], search_page.cur_finder.mytabs.cur_tab.label.innerHTML)) {
				search_page.cur_finder.dt.run();
				search_page.cur_finder.mytabs.tabs['Result'].show();
			}
		}
		
		// escape
		if(kc==27 && cur_dialog) cur_dialog.hide();
	});

	// Call backs
	// ----------
	var call_back1 = function(r,rt) {

		if(r.exc) { msgprint(r.exc); return; }

		// globals
		user = r.user;
		user_fullname = r.user_fullname;
		user_defaults = r.defaults;
		user_roles = r.roles;
		user_email = r.user_email;
		sys_defaults = r.sysdefaults;
		
		session.startup = r.startup;
		session.rt = r.rt;
		session.m_rt = r.m_rt;
		session.nt = r.nt;
		session.mi = eval(r.mi);
		session.from_gateway = r.from_gateway;
		session.n_online = r.n_online;
		account_id = r.account; // db_name
		session.account_name = r.account_id; // account name (from control panel)

		// home page
		home_page = r.home_page;

		makeui(r,rt);
	}


	var args = {}; 
	if(get_url_param('sid150')) { 
		args.sid150 = get_url_param('sid150'); 
		__sid150 = args.sid150; 
	}
	if(get_url_param('dbx')) args['dbx']=get_url_param('dbx');
	if(get_url_param('__account')) account_id = get_url_param('__account');
	$c('initdata', args, call_back1);
	window.onscroll = function() { $i('loading_div').style.top = (get_scroll_top()+10)+'px'; }
}

function set_frame_dims() {
	var d = get_screen_dims();

	var toolbar_height = 26;
	if(hide_webnotes_toolbar) toolbar_height = 0;

	var main_top = header_height + toolbar_height;
	var head_h = main_top ? (main_top + 1) : 0;
	if(isIE && head_h)head_h = head_h + 1;
	
	// overall width
	if(overall_width) { 
		d.w = overall_width;
		if(isIE) { d.w = d.w - 1; }
		
		$w($i('main_div'), d.w + 'px');
		$w($i('head_div'), d.w + 'px');
		$w($i('center_div'), (d.w - left_sidebar_width - right_sidebar_width) + 'px');
	}
	
	// set heights
	$h($i('head_div'), head_h + 'px');
	if(footer_height)
		$h($i('footer_div'), footer_height + 'px');

	// set widths
	
	if(left_sidebar_width) 	$w($i('menu_div'), left_sidebar_width + 'px');
	else					$w($i('menu_div'), '0px');

	if(right_sidebar_width) $w($i('right_sidebar_div'), right_sidebar_width + 'px');
	else					$w($i('right_sidebar_div'), '0px');
	
	// set app iframe dims
	if(cur_app) {
		var footer_buff = 4;
		$y(cont_area,{margin:'0px',border:'0px'});
		$y(cur_app.frame,{height:(d.h - main_top - footer_height - footer_buff - frame_adj) + 'px'})
	}
}

function edit_profile() { loaddoc("Profile", user); }
function logout() {
	$c('logout', args = {}, function() { window.location = login_file; });
}

// ABOUT
var about_dialog;
function make_about() {
	var d = new Dialog(360,480, 'About')

	d.make_body([
		['HTML', 'info']
	]);
	
	var reset_testing_html = '';
	if(has_common(user_roles,['Administrator','System Manager'])) {
		reset_testing_html = "<br><div onclick='setup_testing()' class='link_type'>Reset Testing Mode (Old testing data will be lost)</div>"
			+"<br><div onclick='download_backup()' class='link_type'>Download Backup</div>";
	}

	d.rows['info'].innerHTML = "<div style='padding: 16px;'><center>"
		+"<div style='text-align: center'><img src = 'images/ui/webnotes30x120.gif'></div>"
		+"<br><br>&copy; 2007-08 Web Notes Technologies Pvt. Ltd."
		+"<p><span style='color: #888'>Customized Web Based Solutions and Products</span>"
		+"<br>51 / 2406, Nishigandha, Opp MIG Cricket Club,<br>Bandra (East),<br>Mumbai 51</p>"
		+"<p>Phone: +91-22-6526-5364 (M-F 9-6)"
		+"<br>Email: info@webnotestech.com"
		+"<br><b>Customer Support: support@webnotestech.com</b></p>"
		+"<p><a href='http://www.webnotestech.com'>www.webnotestech.com</a></p></center>"
		+"<div style='background-color: #DFD; padding: 16px;'>"
		+"<div id='testing_mode_link' onclick='enter_testing()' class='link_type'>Enter Testing Mode</div>"
		+reset_testing_html
		+"<br><div onclick='err_console.show()' class='link_type'><b>Error Console</b></div>"
		+"</div>"
		+"</div>";

	if(is_testing)$i('testing_mode_link').innerHTML = 'End Testing';

	about_dialog = d;
}
function download_backup() {
  window.location = outUrl + "?cmd=backupdb&read_only=1&__account="+account_id
    + (__sid150 ? ("&sid150="+__sid150) : '')
	+ "&db_name="+account_id;
}

function enter_testing() {
	about_dialog.hide();
	if(is_testing) {
		end_testing();
		return;
	}
	var a  = prompt('Type in the password', '');
	if(a=='start testing') {
		$c('start_test',args={}, function() {
				$ds('testing_div'); 
				is_testing = true;
				$i('testing_mode_link').innerHTML = 'End Testing';
			}
		);
	} else {
		msgprint('Sorry, only administrators are allowed use the testing mode.');	
	}
}

function setup_testing() {
	about_dialog.hide();
	$c('setup_test',args={}, function() { } );
}

function end_testing() {
	$c('end_test',args={}, function() {
			$dh('testing_div'); 
			is_testing = false;
			$i('testing_mode_link').innerHTML = 'Enter Testing Mode'; 
		} 
	);
}

startup_lst[startup_lst.length] = make_about;

search_fields = {};

// Search Selector 2.0
// -------------------

function makeselector2() {
	var d = new Dialog(600,440, 'Search');

	d.make_body([
		['HTML', 'List']
	]);

	d.loading_div = $a(d.widgets.List,'div','comment',{margin:'8px 0px', display:'none'}); d.loading_div.innerHTML = 'Setting up...';
	d.ls = new Listing("Search", 1);
	d.ls.opts = {
		cell_style : {padding:'3px 2px',border:'0px'},
		alt_cell_style : {backgroundColor:'#FFFFFF'},
		hide_export : 1,
		hide_print : 1,
		hide_refresh : 0,
		hide_rec_label: 0,
		show_calc: 0,
		show_empty_tab : 0,
		show_bottom_paging: 0,
		round_corners: 0,
		no_border: 1
	}
	d.ls.is_std_query = 1;

	// make
	d.ls.colwidths=[''];
	d.ls.make(d.widgets.List);
	$y(d.ls.results, {height:'200px',overflowY:'auto'});
	
	d.ls.get_query = function() {

					
		if(d.input && d.input.get_query) {
			var doc = {};
			if(cur_frm) doc = locals[cur_frm.doctype][cur_frm.docname];
			this.query = d.input.get_query(doc);
			this.query_max = 'SELECT COUNT(*) FROM ' + this.query.split(' FROM ')[1]; // custom query -- NO QUERY MAX

		} else {

			var q = {};
			var fl = []
			q.table = repl('`tab%(dt)s`', {dt:d.sel_type});
			for(var i in d.fields) 
				fl.push(q.table+'.`'+d.fields[i][0]+'`')
	
			q.fields = fl.join(', ');
			q.conds = q.table + '.docstatus < 2 ';
			this.query = repl("SELECT %(fields)s FROM %(table)s WHERE %(conds)s", q);
			this.query_max = repl("SELECT COUNT(*) FROM %(table)s WHERE %(conds)s", q);
		}

	}

	d.ls.show_cell = function(cell,ri,ci,dat) {
		var l = $a($a(cell,'div','',{borderBottom:'1px dashed #CCC',paddingBottom:'4px'}), 'span','link_type'); l.innerHTML = dat[ri][0];
		l.d = d;
		l.onclick = function() {
			if(this.d.style=='Search')
				loaddoc(this.d.sel_type, this.innerHTML);
			else
				setlinkvalue(this.innerHTML);
		}
		var l = $a(cell, 'div','comment'); var tmp = [];
		for(var i=1;i<dat[ri].length;i++) tmp.push(dat[ri][i]);
		l.innerHTML = tmp.join(', ');
	}

	// called from search
	d.set_search = function(dt) {
		if(d.style!='Search') {
			d.ls.clear();
		}
		d.style = 'Search';
		if(d.input) { d.input = null; sel_type = null; } // clear out the linkfield refrences
		d.sel_type = dt;
		d.title_text.innerHTML = 'Search for ' + dt;
	}
	
	// called from link
	d.set = function(input, type, label) {
		d.sel_type = type; d.input = input;
		if(d.style!='Link') {
			d.ls.clear();
		}
		d.style = 'Link';
		if(!d.sel_type)d.sel_type = 'Value';
		d.title_text.innerHTML = 'Select a "'+ d.sel_type +'" for field "'+label+'"';
	}
	
	// on show
	d.onshow = function() {
		if(d.sel_type!='Value' && !search_fields[d.sel_type]) {
			$dh(d.ls.wrapper);
			$ds(d.loading_div);
			 // de focus selector
			// get search fields
			$c('getsearchfields', {doctype:d.sel_type}, function(r,rt) { search_fields[d.sel_type] = r.searchfields; d.show_lst(); })
		} else {
			d.show_lst();
		}
	}
	d.onhide = function() {
		search_sel.disabled = 0;
	}
	d.show_lst = function() {
		$ds(d.ls.wrapper);
		$dh(d.loading_div);
		d.fields = search_fields[d.sel_type];
		if(d.sel_type=='Value') {
			d.fields = []; // for customized query with no table - NO FILTERS
		}

		if(d.sel_type!=d.set_doctype) {
			// clear filters
			d.ls.clear();
			d.ls.remove_all_filters();
			for(var i=0;i< (d.fields.length>4 ? 4 : d.fields.length);i++) {
				if(d.fields[i][2]=='Link')d.fields[i][2]='Data';  // no link-in-link
				d.ls.add_filter(d.fields[i][1], d.fields[i][2], d.fields[i][3], d.sel_type, d.fields[i][0], (in_list(['Data','Text','Link'], d.fields[i][2]) ? 'LIKE' : ''));
			}
		}
		d.set_doctype = d.sel_type;
		if(d.ls.filters['ID'].input)d.ls.filters['ID'].input.focus();
		
		//d.ls.show_query = 1;
	}	
	selector = d;
}
//startup_lst[startup_lst.length] = makeselector2;

// Link Selector
// -------------


function makeselector() {
	var d = new Dialog(540,440, 'Search');

	d.make_body([
		['Data', 'Beginning With', 'Tip: You can use wildcard "%"'],
		['Select', 'Search By'],
		['Button', 'Search'],
		['HTML', 'Result']
	]);	
	d.wrapper.style.zIndex = 93;
	
	// search with
	var inp = d.widgets['Beginning With'];
	var field_sel = d.widgets['Search By'];
	var btn = d.widgets['Search'];

	// result
	d.sel_type = '';
	d.values_len = 0;
	d.set = function(input, type, label) {
		d.sel_type = type; d.input = input;
		if(d.style!='Link') {
			d.rows['Result'].innerHTML ='';
			d.values_len = 0;
		}
		d.style = 'Link';
		if(!d.sel_type)d.sel_type = 'Value';
		d.title_text.innerHTML = 'Select a "'+ d.sel_type +'" for field "'+label+'"';
	}
	d.set_search = function(dt) {
		if(d.style!='Search') {
			d.rows['Result'].innerHTML ='';
			d.values_len = 0;
		}		
		d.style = 'Search';
		if(d.input) { d.input = null; sel_type = null; }
		d.sel_type = dt;
		d.title_text.innerHTML = 'Quick Search for ' + dt;
	}
	
	inp.onkeydown = function(e) { 
		if(isIE)var kc = window.event.keyCode;
		else var kc = e.keyCode;

		if(kc==13) if(!btn.disabled)btn.onclick(); 
	}

	var _add_sel_options = function(s, list) {
		for(var i in list){
			s.options[s.options.length] = 
				new Option(list[i][1], list[i][0], false, false);
		}
		//if(s.options.length>1)s.selectedIndex = 1; // select first
	}

	d.onshow = function() { 
		if(d.set_doctype!=d.sel_type) {
			d.rows['Result'].innerHTML ='';
			d.values_len = 0;
		}
	
		inp.value = '';		
		if(d.input && d.input.txt.value) {
			inp.value = d.input.txt.value;
		}
		try{inp.focus();} catch(e){}
		
		if(d.input) d.input.set_get_query();
	
		// set fields
		$ds(d.rows['Search By']);
		
		if(search_fields[d.sel_type]) {
			empty_select(field_sel);
			_add_sel_options(field_sel, search_fields[d.sel_type]);
		} else {
			// set default select by
			empty_select(field_sel);
			_add_sel_options(field_sel, [['name','ID']]);

			$c('getsearchfields', {'doctype':d.sel_type}, function(r,rt) {
				search_fields[d.sel_type] = r.searchfields;
				empty_select(field_sel);
				_add_sel_options(field_sel, search_fields[d.sel_type]);
				field_sel.selectedIndex = 0;
			} );
		}
	}
	d.onhide = function() {
		search_sel.disabled = 0;
	}

	btn.onclick = function() {
		btn_dis(btn, true);
		d.set_doctype = d.sel_type;
		var q = '';
		if(d.input && d.input.get_query) {
			var doc = {};
			if(cur_frm) doc = locals[cur_frm.doctype][cur_frm.docname];
			var q = d.input.get_query(doc);
			if(!q) { return ''; }
		}
		
		$c('search2', 
			args = {'txt':strip(inp.value), 'doctype':d.sel_type, 'defaults':pack_defaults(),
				'query':q,
				'searchfield':sel_val(field_sel),
				'defaults':pack_defaults(),
				'roles':'["'+user_roles.join('","')+'"]' }, 
			function(r, rtxt) {
				btn_dis(btn, false);
				if(r.coltypes)r.coltypes[0]='Link'; // first column must always be selectable even if it is not a link
				d.values_len = r.values.length;
				d.set_result(r);
			}, function() { btn_dis(btn, false); });
	}
	
	d.set_result = function(r) {
		d.rows['Result'].innerHTML = '';
		var c = $a(d.rows['Result'],'div','comment',{paddingBottom:'4px',marginBottom:'4px',borderBottom:'1px solid #CCC', marginLeft:'4px'});
		if(r.values.length==50)
			c.innerHTML = 'Showing max 50 results. Use filters to narrow down your search';
		else
			c.innerHTML = 'Showing '+r.values.length+' resuts.';

		var w = $a(d.rows['Result'],'div','',{height:'240px',overflow:'auto',margin:'4px'});
		for(var i=0; i<r.values.length; i++) {
			var div = $a(w,'div','',{marginBottom:'4px',paddingBottom:'4px',borderBottom:'1px dashed #CCC'});

			// link
			var l = $a(div,'div','link_type'); l.innerHTML = r.values[i][0]; l.link_name = r.values[i][0]; l.dt = r.coloptions[0];
			if(d.input)
				l.onclick = function() { setlinkvalue(this.link_name); }
			else
				l.onclick = function() { loaddoc(this.dt, this.link_name); }

			// support
			var cl = []
			for(var j=1; j<r.values[i].length; j++) cl.push(r.values[i][j]);
			var c = $a(div,'div','comment',{marginTop:'2px'}); c.innerHTML = cl.join(', ');
		}
		
	}
	
	d.wrapper.style.zIndex = '95';
	
	selector = d;	
}
//startup_lst[startup_lst.length] = makeselector;

function DocLink(p, doctype, name, onload) {
	var a = $a(p,'span','link_type'); a.innerHTML = a.dn = name; a.dt = doctype;
	a.onclick=function() { loaddoc(this.dt,this.dn,onload) }; return a;
}
var doc_link = DocLink;

function page_link(p, name, onload) {
	var a = $a(p,'span','link_type'); a.innerHTML = a.pn = name;
	a.onclick=function() { loadpage(this.pn,onload) }; return a;
}

function setlinkvalue(name) {
	selector.hide();
	selector.input.set(name);// in local
	selector.input.set_input(name); // on screen
	if(selector.input.txt)selector.input.txt.onchange();
}

function pack_defaults() {
	myd = [];
	for(var d in user_defaults) {
		myd[myd.length] = '"'+d+'":["' + user_defaults[d].join('", "') + '"]';
	}
	return '{'+myd.join(',')+'}';
}

// Calculator 
// ----------
var calc_dialog;
function show_calc(tab, colnames, coltypes, add_idx) {
	if(!add_idx) add_idx = 0;
	if(!tab || !tab.rows.length) { msgprint("No Data"); return; }
	
	if(!calc_dialog) {
		var d = new Dialog(400,400,"Calculator")
		d.make_body([
			['Select','Column']
			,['Data','Sum']
			,['Data','Average']
			,['Data','Min']
			,['Data','Max']
		])
		d.widgets['Sum'].readonly = 'readonly';
		d.widgets['Average'].readonly = 'readonly';
		d.widgets['Min'].readonly = 'readonly';
		d.widgets['Max'].readonly = 'readonly';
		d.widgets['Column'].onchange = function() {
			d.set_calc();
		}
		d.set_calc = function() {
			// get the current column of the data table
			var cn = sel_val(this.widgets['Column']);
			var cidx = 0; var sum=0; var avg=0; var minv = null; var maxv = null;
			for(var i=0;i<this.colnames.length;i++) {if(this.colnames[i]==cn){ cidx=i+add_idx; break; } }
			for(var i=0; i<this.datatab.rows.length; i++) {
				var c = this.datatab.rows[i].cells[cidx];
				var v = c.div ? flt(c.div.innerHTML) : flt(c.innerHTML);
				sum += v;
				if(minv == null) minv = v;
				if(maxv == null) maxv = v;
				if(v > maxv)maxv = v;
				if(v < minv)minv = v;
			}
			d.widgets['Sum'].value = fmt_money(sum);
			d.widgets['Average'].value = fmt_money(sum / this.datatab.rows.length);
			d.widgets['Min'].value = fmt_money(minv);
			d.widgets['Max'].value = fmt_money(maxv);
			calc_dialog = d;
		}
		d.onshow = function() {
			// set columns
			var cl = []; 
			for(var i in calc_dialog.colnames) {
				if(in_list(['Currency','Int','Float'],calc_dialog.coltypes[i])) 
					cl.push(calc_dialog.colnames[i]);
			}
			if(!cl.length) {
				this.hide();
				alert("No Numeric Column");
				return;
			}
			var s = this.widgets['Column'];
			empty_select(s);
			add_sel_options(s, cl); s.selectedIndex = 0;
			this.set_calc();
		}
		calc_dialog = d;
	}
	calc_dialog.datatab = tab;
	calc_dialog.colnames = colnames;
	calc_dialog.coltypes = coltypes;
	calc_dialog.show();
}


/* Document */

// RENAME

function rename_doc() {
	if(!cur_frm)return; var f = cur_frm;
	new_name = prompt('Enter a new name for ' + f.docname, '');
	if(new_name) {
		$c('rename', args = {'dt': f.doctype, 'old':f.docname, 'new':new_name}, 
		function(r, rtxt) { f.refresh(); });
	}
}

// NEW
function new_doc(doctype, onload) {
	loadfrm(function() { _new_doc(doctype, onload); });
}

function _new_doc(doctype, onload) {	
	if(!doctype) {
		if(cur_frm)doctype = cur_frm.doctype; else return;
	}
	
	var fn = function() {
		frm = frms[doctype];
		// load new doc	
		if (frm.perm[0][CREATE]==1) {
			if(frm.meta.issingle) {
				var d = doctype;
				set_default_values(locals[doctype][doctype]);
			} else 
				var d = LocalDB.create(doctype);
				
			if(onload)onload(d);
			nav_obj.open_notify('DocType',doctype,d);
			frm.show(d);
		} else {
			msgprint('error:Not Allowed To Create '+doctype+'\nContact your Admin for help');
		}
	}
	
	if(!frms[doctype]) frm_con.add_frm(doctype, fn); // load
	else fn(frms[doctype]); // directly
}
var newdoc = new_doc;

// RELOAD

function reload_doc() {
	if(frms['DocType'] && frms['DocType'].opendocs[cur_frm.doctype]) {
		msgprint("error:Cannot refresh an instance of \"" + cur_frm.doctype+ "\" when the DocType is open.");
		return;
	}

	var ret_fn = function(r, rtxt) {
		// n tweets and last comment
		var t = cur_frm.doctype + '/' + cur_frm.docname;
		if(r.n_tweets) n_tweets[t] = r.n_tweets;
		if(r.last_comment) last_comments[t] = r.last_comment;
		
		cur_frm.runclientscript('setup', cur_frm.doctype, cur_frm.docname);
		cur_frm.refresh();
	}

	if(cur_frm.doc.__islocal) { 
		// reload only doctype
		$c('getdoctype', {'doctype':cur_frm.doctype }, ret_fn, null, null, 'Refreshing ' + cur_frm.doctype + '...');
	} else {
		// delete all unsaved rows
		var gl = cur_frm.grids;
		for(var i = 0; i < gl.length; i++) {
			var dt = gl[i].df.options;
			for(var dn in locals[dt]) {
				if(locals[dt][dn].__islocal && locals[dt][dn].parent == cur_frm.docname) {
					var d = locals[dt][dn];
					d.parent = '';
					d.docstatus = 2;
					d.__deleted = 1;
				}
			}
		}
		// reload doc and docytpe
		$c('getdoc', {'name':cur_frm.docname, 'doctype':cur_frm.doctype, 'getdoctype':1, 'user':user}, ret_fn, null, null, 'Refreshing ' + cur_frm.docname + '...');
	}
}

// LOADDOC

function loadfrm(call_back) {
	var fn = function() {
		frm_con = new FrmContainer();
		frm_con.init();
		call_back();
	}
	if(!frm_con) fn();
	else call_back();
}

function loaddoc(doctype, name, onload, menuitem) {
	loadfrm(function() { _loaddoc(doctype, name, onload, menuitem); });
}
function _loaddoc(doctype, name, onload, menuitem) {

	selector.hide(); // if loaded	
	if(!name)name = doctype; // single
	
	var fn = function(r,rt) {

		if(locals[doctype] && locals[doctype][name]) {
			var frm = frms[doctype];
			// menu item
			if(menuitem) frm.menuitem = menuitem;
			if(onload)onload(frm);
			
			// back button
			nav_obj.open_notify('DocType',doctype,name);
			
			// tweets
			if(r && r.n_tweets) n_tweets[doctype+'/'+name] = r.n_tweets;
			if(r && r.last_comment) last_comments[doctype+'/'+name] = r.last_comment;

			
			// show
			frm.show(name);

			// show menuitem selected
			if(frm.menuitem) frm.menuitem.show_selected();
			cur_page = null;
		} else {
			msgprint('error:There where errors while loading ' + doctype + ',' + name);
		}
	}
	
	// dont open doctype and docname from the same session
	if(frms['DocType'] && frms['DocType'].opendocs[doctype]) {
		msgprint("Cannot open an instance of \"" + doctype + "\" when the DocType is open.");
		return;
	}
	
	if(!frms[doctype]) {
		frm_con.add_frm(doctype, fn, name); // load
	} else {		
		if(is_doc_loaded(doctype, name)) {
			// DocTypes must always be reloaded (because their instances may not have scripts)
			fn(); // directly	
		} else {
			$c('getdoc', {'name':name, 'doctype':doctype, 'user':user}, fn, null, null, 'Loading ' + name);	// onload
		}
	}
}
var load_doc = loaddoc;
var loaded_doctypes = [];


window.onload = startup;

// Local DB 
//-----------

var locals = {};
var fields = {}; // fields[doctype][fieldname]
var fields_list = {}; // fields_list[doctype]
var LocalDB={};

LocalDB.getchildren = function(child_dt, parent, parentfield, parenttype) { 
	var l = []; 
	for(var key in locals[child_dt]) {
		var d = locals[child_dt][key];
		if((d.parent == parent)&&(d.parentfield == parentfield)) {
			if(parenttype) {
				if(d.parenttype==parenttype)l.push(d);
			} else { // ignore for now
				l.push(d);
			}
		}
	} 
	l.sort(function(a,b){return (cint(a.idx)-cint(b.idx))}); return l; 
}

// Add Doc

LocalDB.add=function(dt, dn) {
	if(!locals[dt]) locals[dt] = {}; if(locals[dt][dn]) delete locals[dt][dn];
	locals[dt][dn] = {'name':dn, 'doctype':dt, 'docstatus':0};
	return locals[dt][dn];
}

// Delete Doc

LocalDB.delete_doc=function(dt, dn) {
	var doc = get_local(dt, dn);

	for(var ndt in locals) { // all doctypes
		if(locals[ndt]) {
			for(var ndn in locals[ndt]) {
				var doc = locals[ndt][ndn];
				if(doc && doc.parenttype==dt && (doc.parent==dn||doc.__oldparent==dn)) {
					locals[ndt][ndn];
				}
			}
		}
	}
	delete locals[dt][dn];
}

function get_local(dt, dn) { return locals[dt] ? locals[dt][dn] : null; }

// Sync Records from Server

LocalDB.sync = function(list) {
	if(list._kl)list = expand_doclist(list);
	for(var i=0;i<list.length;i++) {
		var d = list[i];
		if(!d.name) // get name (local if required)
			d.name = LocalDB.get_localname(d.doctype);

		LocalDB.add(d.doctype, d.name);
		locals[d.doctype][d.name] = d;

		// cleanup for a second-loading
		if(d.doctype=='DocType') {
			fields_list[d.name] = [];
		} else if(d.doctype=='DocField') { // field dictionary / list 
			if(!fields_list[d.parent])fields_list[d.parent] = [];
			fields_list[d.parent][fields_list[d.parent].length] = d;

			if(d.fieldname) {
				if(!fields[d.parent])fields[d.parent] = {};	
				fields[d.parent][d.fieldname] = d;
			} else if(d.label) {
				if(!fields[d.parent])fields[d.parent] = {};	
				fields[d.parent][d.label] = d;
			}
		} else if(d.doctype=='Event') {
			if((!d.localname) && calendar && (!calendar.has_event[d.name]))
				calendar.set_event(d);
		}
		rename_from_local(d);
	}
}

// Get Local Name
local_name_idx = {};
LocalDB.get_localname=function(doctype) {
	if(!local_name_idx[doctype]) local_name_idx[doctype] = 1;
	var n = 'Unsaved '+ doctype + '-' + local_name_idx[doctype];
	local_name_idx[doctype]++;
	return n;
}

// Create Local Doc
LocalDB.create= function(doctype, n) {
	if(!n) n = LocalDB.get_localname(doctype);
	var doc = LocalDB.add(doctype, n)
	doc.__islocal=1; doc.owner = user;	
	set_default_values(doc);
	return n;
}

LocalDB.get_default_value = function(fn, ft, df) {
	if(df=='_Login' || df=='__user')
		return user;
	else if(df=='_Full Name')
		return user_fullname;
	else if(ft=='Date'&& (df=='Today' || df=='__today')) {
		return get_today(); }
	else if(df)
		return df;
	else if(user_defaults[fn])
		return user_defaults[fn][0];
	else if(sys_defaults[fn])
		return sys_defaults[fn];
}

LocalDB.add_child = function(doc, childtype, parentfield) {
	// create row doc
	var n = LocalDB.create(childtype);
	var d = locals[childtype][n];
	d.parent = doc.name;
	d.parentfield = parentfield;
	d.parenttype = doc.doctype;
	return d;
}

LocalDB.no_copy_list = ['amended_from','amendment_date','cancel_reason'];
LocalDB.copy=function(dt, dn, from_amend) {
	var newdoc = LocalDB.create(dt);
	for(var key in locals[dt][dn]) {
		if(key!=='name' && key.substr(0,2)!='__') { // dont copy name and blank fields
			locals[dt][newdoc][key] = locals[dt][dn][key];
		}
		//if(user_defaults[key]) {
		//	locals[dt][newdoc][key] = user_defaults[key][0];
		//}
		var df = get_field(dt, key);
		if(df && ((!from_amend && cint(df.no_copy)==1) || in_list(LocalDB.no_copy_list, df.fieldname))) { // blank out 'No Copy'
			locals[dt][newdoc][key]='';
		}
	}
	return locals[dt][newdoc];
}
// Meta Data
//----------

var Meta={};
var local_dt = {};

// Make Unique Copy of DocType for each record for client scripting
Meta.make_local_dt = function(dt, dn) {
	var dl = make_doclist('DocType', dt);
	if(!local_dt[dt]) 	  local_dt[dt]={};
	if(!local_dt[dt][dn]) local_dt[dt][dn]={};
	for(var i=0;i<dl.length;i++) {
		var d = dl[i];
		if(d.doctype=='DocField') {
			var key = d.fieldname ? d.fieldname : d.label; 
			local_dt[dt][dn][key] = copy_dict(d);
		}
	}
}

Meta.get_field=function(dt, fn, dn) { 
	if(dn && local_dt[dt]&&local_dt[dt][dn]){
		return local_dt[dt][dn][fn];
	} else {
		if(fields[dt]) var d = fields[dt][fn];
		if(d) return d;
	}
	return {};
}
Meta.set_field_property=function(fn, key, val, doc) {
	if(!doc && (cur_frm.doc))doc = cur_frm.doc;
	try{
		local_dt[doc.doctype][doc.name][fn][key] = val;
		refresh_field(fn);
	} catch(e) {
		alert("Client Script Error: Unknown values for " + doc.name + ',' + fn +'.'+ key +'='+ val);
	}
}
// Globals (Backward Compatibility)
//----------

var getchildren = LocalDB.getchildren;
var get_field = Meta.get_field;
var createLocal = LocalDB.create;

// Menu Bar

function MenuToolbar(parent) {
	this.ul = $a(parent, 'ul', 'menu_toolbar');
	this.cur_top_menu = null;
	this.max_rows = 10;
	this.dropdown_width = '280px';
	this.top_menus = {};

	this.top_menu_style = 'top_menu';
	this.top_menu_mo_style = 'top_menu_mo';
	
}
MenuToolbar.prototype.add_top_menu = function(label, onclick) {
	var li = $a(this.ul, 'li');
	var a = $a(li, 'a', this.top_menu_style);
	var me = this;
	a.onclick = function() { /*this.set_selected();*/ onclick(); } ;
	a.innerHTML = label;
	a.onmouseover = function() { 
		if(this!=me.cur_top_menu) this.className = me.top_menu_style+' '+me.top_menu_mo_style;
		if(a.my_mouseover)a.my_mouseover(this);
	}
	a.onmouseout = function() { 
		if(a.my_mouseout)a.my_mouseout(this);
		if(this!=me.cur_top_menu)
			this.className = me.top_menu_style;
	}
	a.set_unselected = function() {
		this.className = me.top_menu_style;
		me.is_active = 0;
	}
	a.set_selected = function() { 
		if(me.cur_top_menu)me.cur_top_menu.set_unselected();
		this.className = me.top_menu_style+' '+me.top_menu_mo_style;
		me.cur_top_menu = this;
		me.is_active = 1;
	}
	this.top_menus[label] = a;
	return a;
}

var closetimer;
function mclose() { // close all active
	for(var i=0;i<all_dropdowns.length;i++) {
		if(all_dropdowns[i].is_active)
			all_dropdowns[i].hide();
	}
}
function mclosetime() { closetimer = window.setTimeout(mclose, 500); }
function mcancelclosetime() { if(closetimer) { window.clearTimeout(closetimer); closetimer = null; } }

MenuToolbar.prototype.make_dropdown = function(tm) {
	var me = this;
	var dropdown = new DropdownMenu(tm.parentNode, this.dropdown_width);

	tm.dropdown = dropdown;
	
	// triggers on top menu
	tm.my_mouseover = function() {
		this.dropdown.show();
	}
	tm.my_mouseout = function() {
		this.dropdown.clear();
	}
}

MenuToolbar.prototype.add_item = function(top_menu_label, label, onclick, on_top) {
	var me = this;
	var tm = this.top_menus[top_menu_label];
	if(!tm.dropdown) 
		this.make_dropdown(tm, this.dropdown_width);
	
	return tm.dropdown.add_item(label, onclick, on_top);
}

var all_dropdowns = [];
function DropdownMenu(label_ele, width) {
	this.body = $a(label_ele, 'div', 'menu_toolbar_dropdown', {width:(width ? width : '140px')});
	this.label = label_ele;
	this.items = {};
	this.item_style = 'dd_item';
	this.item_mo_style = 'dd_item_mo';
		
	var me = this;
	
	this.body.onmouseout = function() { me.clear(); }
	this.body.onmouseover = function() { mcancelclosetime(); } // re-entered

	this.show = function() {
		// close others
		mclose();
		
		// clear menu timeout
		mcancelclosetime();
		
		hide_selects(); 
		$ds(me.body); // show
		
		// events on label
		if(me.label.set_selected)
			me.label.set_selected();
		
		me.is_active = 1;
	}

	this.hide = function() {
		$dh(me.body); // hide
		if(!frozen)show_selects();
		
		// clear from active list
		me.is_active = 0;
		
		// events on label
		if(me.label.set_unselected)
			me.label.set_unselected();		
	}

	this.clear = function() {
		mcancelclosetime();
		mclosetime();
	}
	all_dropdowns.push(me);
}

DropdownMenu.prototype.add_item = function(label, onclick, on_top) {
	var me = this;
	
	if(on_top) {
		var mi = document.createElement('div');
		me.body.insertBefore(mi, me.body.firstChild);
		mi.className = this.item_style;
	} else {
		var mi = $a(this.body, 'div', this.item_style);
	}
	
	mi.innerHTML = label;
	mi.onclick = onclick;
	mi.onmouseover = function() {
		this.className = me.item_style + ' ' + me.item_mo_style;
		me.cur_mi=this;
	}
	mi.onmouseout = function() { this.className = me.item_style; }
	mi.bring_to_top = function() { me.body.insertBefore(this, me.body.firstChild); }

	var nitems = this.body.childNodes.length;
	if(nitems>max_dd_rows)nitems = max_dd_rows;
	$h(this.body, (nitems * 23) + 'px');
	
	this.items[label] = mi;

	return mi;
}

// Tree
// ---------------------------------

function Tree(parent, width, do_animate) {
  this.width = width;
  this.nodes = {};
  this.allnodes = {};
  this.cur_node;
  this.is_root = 1;
  this.do_animate = do_animate;
  var me = this;
  this.exp_img = 'images/icons/plus.gif';
  this.col_img = 'images/icons/minus.gif';
  
  this.body = $a(parent, 'div');
  if(width)$w(this.body, width);

  this.addNode = function(parent, id, imagesrc, onclick, onexpand, opts, label) {
    var t = new TreeNode(me, parent, id, imagesrc, onclick, onexpand, opts, label);
    
    if(!parent) {
      me.nodes[id]=t; // add to roots
    } else {
      parent.nodes[id]=t; // add to the node
    }
    me.allnodes[id] = t;

    // note: this will only be for groups
    if(onexpand)
      t.create_expimage();
    t.expanded_once = 0;

    return t;
    
  }
  var me = this;
  this.collapseall = function() {
    for(n in me.allnodes) {
      me.allnodes[n].collapse();
    }
  }
}

function TreeNode(tree, parent, id, imagesrc, onclick, onexpand, opts, label) {
  var me = this;
  if(!parent) parent = tree;
  this.parent = parent;
  this.nodes = {};
  this.onclick = onclick;
  this.onexpand = onexpand;
  this.text = label ? label : id;
  this.tree = tree;

  if(opts) 
  	this.opts = opts;
  else 
  	this.opts = {
  		show_exp_img:1
  		,show_icon:1
  		,label_style:{padding:'2px', cursor: 'pointer', fontSize:'11px'}
		,onselect_style:{fontWeight: 'bold'}
		,ondeselect_style:{fontWeight: 'normal'}
  	} // only useful for 1st node in the tree

  var tc = 1;
  if(this.opts.show_exp_img) tc+=1;

  if(!this.parent.tab) {
  	this.parent.tab = make_table(this.parent.body, 2, tc, '100%');
  	$y(this.parent.tab,{tableLayout:'fixed',borderCollapse: 'collapse'});
  } else {
    this.parent.tab.append_row(); this.parent.tab.append_row();
  } 
  
  var mytab = this.parent.tab;
  
  // expand / collapse
  if(this.opts.show_exp_img) {
    this.exp_cell=$td(mytab,mytab.rows.length-2, 0);
    $y(this.exp_cell, {cursor:'pointer', textAlign:'center', verticalAlign:'middle',width:'20px'});
    this.exp_cell.innerHTML = '&nbsp;';
  } else {
    // pass
  }
  this.create_expimage = function() {
  	if(!me.opts.show_exp_img) return; // no expand image
    if(!me.expimage) {
      me.exp_cell.innerHTML='';
      me.expimage = $a(me.exp_cell, 'img');
      me.expimage.src = me.exp_img ? me.exp_img : me.tree.exp_img;
      me.expimage.onclick = me.toggle;
    }
  }
  
  // label
  this.label = $a($td(mytab, mytab.rows.length-2, tc-1), 'div');
  $y(this.label, this.opts.label_style);
  
  // image
  if(this.opts.show_icon) { // for second row, where children will come icon to be included
    var t2 = make_table($a(this.label,'div'), 1, 2, '100%', ['20px',null]);
    $y(t2,{borderCollapse:'collapse'});
    this.img_cell = $td(t2, 0, 0);
    $y(this.img_cell, {cursor:'pointer',verticalAlign:'middle',width:'20px'});
    if(!imagesrc) imagesrc = "images/icons/folder.gif";
    this.usrimg = $a(this.img_cell, 'img');
    this.usrimg.src = imagesrc;
    
    this.label = $td(t2, 0, 1);
    $y(this.label,{verticalAlign:'middle'});
  }  

  this.loading_div = $a($td(mytab, mytab.rows.length-1, this.opts.show_exp_img ? 1 : 0), "div", "comment", {fontSize:'11px'});
  $dh(this.loading_div);  
  this.loading_div.innerHTML = 'Loading...';

  this.body = $a($td(mytab, mytab.rows.length-1, this.opts.show_exp_img ? 1 : 0), "div", '', {overflow:'hidden', display:'none'});

  this.select = function() {
    me.show_selected();
    if(me.onclick)me.onclick(me);
  }

  this.show_selected = function() {
    if(me.tree.cur_node)me.tree.cur_node.deselect();
  	if(me.opts.onselect_style) $y(me.label,me.opts.onselect_style)
    //me.label.style.fontWeight = 'bold';
    me.tree.cur_node = me;
  }
  
  this.deselect = function() {
  	if(me.opts.ondeselect_style) $y(me.label,me.opts.ondeselect_style)
    //me.label.style.fontWeight = 'normal';
    me.tree.cur_node=null
  }
	
  this.expanded = 0;
  this.toggle = function() {
    if(me.expanded)
    	me.collapse();
    else 
    	me.expand();
  }
  this.collapse = function() {
  	me.body.orig_height = cint(me.body.clientHeight);
  	if(me.tree.do_animate)
	  	animate(me.body, 'height', cint(me.body.clientHeight), 0, function(ele) { $dh(ele); ele.style.height = null;} );
    else
	    $dh(me.body);
    if(me.expimage && me.expimage.src)me.expimage.src = me.exp_img ? me.exp_img : me.tree.exp_img;
    me.expanded = 0;
  }
  this.expand = function() {
    if(me.onexpand && !me.expanded_once){
    	me.onexpand(me);
    	if(!me.tree.do_animate) me.show_expanded(); // else to be called from expand (for animation)
   	} else {
   		me.show_expanded();
   	}
    me.expanded = 1;
    me.expanded_once = 1;
  }
  this.show_expanded = function() {
  	if(me.tree.do_animate && (!keys(me.nodes).length)) return; // no children
	$ds(me.body);
  	if(!me.body.orig_height)
  		me.body.orig_height = me.body.clientHeight;
  	if(me.tree.do_animate) {
  		$y(me.body,{height:'0px'});
  		animate(me.body, 'height', 0, (me.body.orig_height ? me.body.orig_height : cint(me.body.clientHeight)), function(ele) { ele.style.height = null;} );
  	}
    if(me.opts.show_exp_img && me.expimage && me.expimage.src) {
    	me.expimage.src = me.col_img ? me.col_img : me.tree.col_img;
    }  	
  }

  this.setlabel = function(l) {
    me.label.value = l;
    me.label.innerHTML = l;
  }

  this.setlabel(this.text);

  this.setcolor = function(c) {
    this.backColor = c;
	  if(cur_node!=this)
	  $bg(this.body,this.backColor);
  }
  
  this.label.onclick= function(e) { me.select(); }
  this.label.ondblclick = function(e) { me.select(); if(me.ondblclick)me.ondblclick(me); }
  
  this.clear_child_nodes = function() {
    if(this.tab){
      this.tab.parentNode.removeChild(this.tab);
      delete this.tab;
    }
    this.expanded_once = 0;
  }
}

// Password Expiry
// --------------------------------

check_pwd_expiry = function(){
	var check_pwd_callback = function(r,rt){
		if(r.message != 'Yes') return;
		var d = show_reset_pwd_dialog();
		d.widgets['Heading'].innerHTML = 'Your password has expired, please set a new password';
		$dh(d.cancel_img);
	}
	$c_obj('Profile Control','has_pwd_expired','',check_pwd_callback)
}

var reset_pwd_dialog;
function show_reset_pwd_dialog(){
	if(!reset_pwd_dialog) {
		var p = new Dialog(300,400,'Reset Password');
  
		p.make_body([
			['HTML','Heading',''],
			['Password','New Password','Enter New Password'],
			['HTML','','<div id="pwd_new" class="comment" style="margin-left:30%; color: RED"></div>'],
			['Password','Retype New Password'],
			['HTML','','<div id="pwd_retype" class="comment" style="margin-left:30%; color: RED"></div>'],
			['Button','Reset']
		]);
  
		//hide Reset button
		p.onshow = function(){
			$y(p.widgets['Retype New Password'],{backgroundColor: '#FFF'});
			p.widgets['Retype New Password'].value = '';
			p.widgets['New Password'].value = '';
			p.widgets['Reset'].disabled=true;
		}
  
		p.widgets['New Password'].onchange = function(){
			validatePassword(p.widgets['New Password'].value, {
				length: [6, Infinity], lower: 1, upper: 1, numeric: 1, badWords: ["password", "admin"], badSequenceLength: 4
			});
		}
    
		p.widgets['Retype New Password'].onchange = function(){
			if(p.widgets['New Password'].value == p.widgets['Retype New Password'].value && p.widgets['New Password'].value != ''){
				p.widgets['Reset'].disabled=false;
				$i('pwd_retype').innerHTML = '';
				$y(p.widgets['Retype New Password'],{backgroundColor: '#DFD'})
			} else{
				p.widgets['Reset'].disabled=true;
				$y(p.widgets['Retype New Password'],{backgroundColor: '#FFF'})
				$i('pwd_retype').innerHTML = 'Passwords do not matching, Try again';
			}
		}
  
		p.widgets['Reset'].onclick = function(){
			if(p.widgets['New Password'].value == p.widgets['Retype New Password'].value && p.widgets['New Password'].value != ''){
				var reset_pwd_callback = function(r,rt){
					if(r.exc) msgprint(r.exc);
					if(r.message=='ok') {
						p.hide();
						msgprint('ok:Your password has been updated. Please login using the new password');
					} else {
						$i('pwd_new').innerHTML = r.message; // Error
					}
				}
				var pwd = p.widgets['New Password'].value;
				$c_obj('Profile Control','reset_password',pwd,reset_pwd_callback)
			}
		}
  
		reset_pwd_dialog = p;
	}
  
	reset_pwd_dialog.show();
	return p;
}

//function pwd validator
function validatePassword (pw, options) {

	// default options (allows any password)
	var o = {
		lower:    0,
		upper:    0,
		alpha:    0, /* lower + upper */
		numeric:  0,
		special:  0,
		length:   [0, Infinity],
		custom:   [ /* regexes and/or functions */ ],
		badWords: [],
		badSequenceLength: 0,
		noQwertySequences: false,
		noSequential:      false
	};

	for (var property in options)
		o[property] = options[property];

	var	re = {
			lower:   /[a-z]/g,
			upper:   /[A-Z]/g,
			alpha:   /[A-Z]/gi,
			numeric: /[0-9]/g,
			special: /[\W_]/g
		},
		rule, i;

	// enforce min/max length
	if (pw.length < o.length[0] || pw.length > o.length[1]) {
		$i('pwd_new').innerHTML = 'Password must be atleast 6 characters long.';
	} else if(!/[A-Z]/.test(pw) || !/[0-9]/.test(pw) || !/[a-z]/.test(pw)) {
		$i('pwd_new').innerHTML = 'Password must contain atleast one capital letter, one small letter and one number.';
	} else {
		$i('pwd_new').innerHTML = '';
	}
}

// Sidebar Menu
function SidebarMenu() {
	this.menu_items = {};	
	this.menu_lists = {};
	this.menu_dt_details = {};
	this.menu_page = new Page('_menu');
	this.menu_page.cont.onshow = function() {
		if(sidebar_menu.cur_node) sidebar_menu.cur_node.show_selected();
	}
	this.wrapper = $a(this.menu_page.cont.body,'div','',{margin:'8px'});
	this.head = $a(this.wrapper, 'div', 'standard_title');
	this.body = $a(this.wrapper, 'div');
  
	// make tree
	this.tree_wrapper = $a($i('menu_div'),'div','center_area',{padding:'4px',paddingBottom:'0px',marginRight:'0px'});
	this.menu_tree = new Tree($a(this.tree_wrapper,'div'),'100%',1);
}

// Menu Click
// ----------

SidebarMenu.prototype.menu_click = function(n) {
  if(n.menu_item.menu_item_type == 'DocType') {
    sidebar_menu.cur_node = n;
    sidebar_menu.show_listing(n.menu_item.name);
  } else if(n.menu_item.menu_item_type == 'New') {
  	newdoc(n.menu_item.link_id);
  } else if(n.menu_item.menu_item_type == 'Single') {
    loaddoc(n.menu_item.link_id, n.menu_item.link_id, null, n); 
    n.toggle();
  } else if(n.menu_item.menu_item_type == 'Page') {
    loadpage(n.menu_item.link_id, n.onload, n); 
    n.toggle();
  } else if(n.menu_item.menu_item_type == 'Report') {
    loadreport(n.menu_item.link_id, n.menu_item.criteria_name, n.onload, n);
  } else
    n.toggle();
}

// Make Menu
// ----------

pscript.set_menu_style = function(level) {
	var opt = {}
	if(level==0) {
		opt = {
			show_exp_img:0, show_icon:0 
			,label_style:{padding:'4px', cursor: 'pointer',color:'#222',marginBottom:'4px',fontSize:'14px',borderBottom:'1px solid #CCC',fontWeight: 'bold', backgroundColor:'#EEE'}
			//,onselect_style:{color: '#56C'}
			//,ondeselect_style:{color: '#000'}
		}
	} else if(level==1) {
		opt = {
			show_exp_img:0, show_icon:0
			,label_style:{padding:'4px', paddingTop:'0px', marginBottom:'4px', cursor: 'pointer',borderBottom:'1px solid #CCC',fontSize:'12px',marginLeft:'8px'}
			,onselect_style:{fontWeight: 'bold'}
			,ondeselect_style:{fontWeight: 'normal'}
		}
	} if(level>=2) {
		opt = {
			show_exp_img:0, show_icon:0 
			,label_style:{padding:'4px', paddingTop:'0px', marginBottom:'4px', cursor: 'pointer',borderBottom:'1px dashed #EEE',fontSize:'11px',marginLeft:'12px'}
			,onselect_style:{fontWeight: 'bold'}
			,ondeselect_style:{fontWeight: 'normal'}
		}
	}
	return opt
}

SidebarMenu.prototype.make_menu = function(parent_node) {
  var me = sidebar_menu;
  var callback = function(r,rt) {
  	// style
  	// -----
  	var level = 0
  	if(parent_node) level = parent_node.level;
  	var opt = pscript.set_menu_style(level);

    // add nodes
    // ---------
    for(var i=0;i<r.message.length;i++) {
      var n = me.menu_tree.addNode(
      	parent_node,
      	r.message[i].menu_item_label,
      	(r.message[i].icon ? 'images/icons/' + r.message[i].icon : ''),
      	me.menu_click,
      	(r.message[i].has_children ? me.make_menu : null),
      	opt);

      n.menu_item = r.message[i];
      if(n.menu_item.onload) {
      	n.onload = eval('var a='+n.menu_item.onload+';a'); // set function
      }
      if(n.menu_item.menu_item_type=='DocType')
        me.menu_items[n.menu_item.name] = n.menu_item;
      // level
      // -----
      if(parent_node) n.level = parent_node.level + 1;
      else n.level = 1;
      
      // callback parent tree
    }
    if(parent_node) { parent_node.show_expanded(); }
  }
  $c_obj('Menu Control','get_children',parent_node ? parent_node.menu_item.name : '', callback);
}

SidebarMenu.prototype.show_listing = function(mid) {
  // get DocType Details
  // -------------------
  loadpage('_menu');
  var me = sidebar_menu;
  var mi = me.menu_items[mid];
  if(!me.menu_dt_details[mid]) {
    $c_obj('Menu Control', 'get_dt_details', mi.link_id + '~~~' + mi.doctype_fields, 
      function(r,rt) { me.menu_dt_details[mi.name] = r.message; if(r.message) me.show_listing(mi.name); });
    return;
  }

  me.head.innerHTML = mi.menu_item_label;

  if(me.cur_menu_lst) 
    $dh(me.cur_menu_lst.wrapper);

  if(!me.menu_lists[mi.name]) {

    var lst = new Listing(mi.menu_item_label);
    lst.cl = me.menu_dt_details[mi.name].columns;
    lst.dt = mi.link_id;

    lst.opts = {
		cell_style : {padding:'3px 2px',borderBottom:'1px dashed #CCC'},
		alt_cell_style : {backgroundColor:'#FFFFFF'},
		head_style : {height:'20px',overflow:'hidden',verticalAlign:'middle',fontWeight:'bold',padding:'1px'},
		head_main_style : {padding:'0px'},
		hide_export : 1,
		hide_print : 1,
		hide_refresh : 0,
		hide_rec_label: 0,
		show_calc: 0,
		show_empty_tab : 0,
		show_bottom_paging: 0,
		round_corners: 0,
		no_border: 1,
		show_new: 1,
		show_report: 1
    }
    
    if(user_defaults.hide_report_builder) lst.opts.show_report = 0;
    
    lst.is_std_query = 1;
    lst.get_query = function() {
      q = {};
      var fl = [];
      q.table = repl('`tab%(dt)s`', {dt:this.dt});
      
      for(var i=0;i<this.cl.length;i++) fl.push(q.table+'.`'+this.cl[i][0]+'`')
      q.fields = fl.join(', ');
      q.conds = q.table + '.docstatus < 2 ';
      this.sort_order = in_list(this.coltypes, 'Date') ? 'DESC' : 'ASC';
      this.sort_by = 'name';
      this.query = repl("SELECT %(fields)s FROM %(table)s WHERE %(conds)s", q);
      this.query_max = repl("SELECT COUNT(*) FROM %(table)s WHERE %(conds)s", q);
    }
  
    lst.colwidths=['5%']; lst.colnames=['Sr']; lst.coltypes=['Data']; lst.coloptions = [''];

    for(var i=0;i < lst.cl.length;i++) {
      lst.colwidths[i+1] = cint(100/lst.cl.length) + '%';
      lst.colnames[i+1] = lst.cl[i][1];
      lst.coltypes[i+1] = lst.cl[i][2];
      lst.coloptions[i+1] = lst.cl[i][3];
    }

    lst.make($a(this.body, 'div', '', {display:'none'}));

    var sf = me.menu_dt_details[mi.name].filters;
    for(var i=0;i< sf.length;i++) {
      if(in_list(['Int','Currency','Float','Date'], sf[i][2])) {
        lst.add_filter('From '+sf[i][1], sf[i][2], sf[i][3], mi.link_id, sf[i][0], '>=');
        lst.add_filter('To '+sf[i][1], sf[i][2], sf[i][3], mi.link_id, sf[i][0], '<=');
      } else {
        lst.add_filter(sf[i][1], sf[i][2], sf[i][3], mi.link_id, sf[i][0], (in_list(['Data','Text','Link'], sf[i][2]) ? 'LIKE' : ''));
      }
    }

    me.menu_lists[mi.name] = lst;
    lst.run();
  }

  $ds(me.menu_lists[mi.name].wrapper);
  me.cur_menu_lst = me.menu_lists[mi.name];
  
}
var sidebar_menu;
function setup_side_bar() {
  if(!left_sidebar_width) return;
  sidebar_menu = new SidebarMenu();	
  sidebar_menu.make_menu('');
}

startup_lst[startup_lst.length] = setup_side_bar;

// Tweets
var n_tweets = {}; var last_comments = {};
function Tweets(parent) {
	
	this.tag = null; this.last_comment = '';
	this.wrapper = $a(parent, 'div', '', {padding:'8px'});
	
	// header
	var ht = make_table($a(this.wrapper,'div'),1,1,'100%',['100%'],{textAlign:'center', verticalAlign:'middle'})

	// label
	this.label = $a($td(ht,0,0),'div'); this.label.innerHTML = 'Write Something';
	
	// input
	this.inp = $a($a($td(ht,0,0),'div'),'input','',{width:'180px', margin:'4px 0px'});
	
	// send button
	var me = this;
	this.btn = $a($td(ht,0,0),'button'); this.btn.innerHTML = 'Send'; this.btn.onclick = function() {
		if(strip(me.inp.value)) {
			$c_obj('Home Control','send_tweet',(me.inp.value+'~~~'+(me.tag?me.tag:'')), 
				function(r,rt) { me.tweet_lst.run(); });
		}
		me.comment_added = 1;
		me.last_comment = me.inp.value;
		me.inp.value = ''; // clear
	}
	
	var lst = new Listing('Tweets',1);
	lst.opts.hide_export = 1;
	lst.opts.hide_print = 1;
	lst.opts.hide_refresh = 1;
	lst.opts.no_border = 1;
	lst.opts.hide_rec_label = 1;
	lst.opts.show_calc = 0;
	lst.opts.round_corners = 0;
	lst.opts.alt_cell_style = {};
	lst.opts.cell_style = {padding:'3px'};

	lst.page_len = 10;
	lst.colwidths = ['100%'];
	lst.coltypes = ['Data'];

	lst.get_query = function() {
		var tag_cond = '';
		if(me.tag) tag_cond = ' and t1.`tag`="' + me.tag + '" ';
		
		this.query = repl('select t1.creation, t1.by, t1.comment, t2.file_list from tabTweet t1, tabProfile t2 where t1.by = t2.name %(tag_cond)s order by t1.name desc',{tag_cond:tag_cond});
		this.query_max = repl('select count(*) from tabTweet t1 where docstatus<2 %(tag_cond)s', {tag_cond:tag_cond});
	}

	// show weet
	lst.show_cell = function(cell, ri, ci, d) {
		var div = $a(cell,'div','', {paddingBottom:'2px',marginBottom:'2px',borderBottom:'1px dashed #CCC'});
		var t = make_table(div, 1,2, '100%', ['10%','90%'],{textAlign:'left'});

		// show image
		if(d[ri][3]) {
			var img = $a($td(t,0,0),'img','',{width:'40px'});
			var img_src = d[ri][3].split(NEWLINE)[0].split(',')[0];
			img.src = repl('cgi-bin/getfile.cgi?ac=%(ac)s&name=%(fn)s&thumbnail=40',{fn:img_src,ac:account_id});
		} else {
			var div = make_table($td(t,0,0),1,1,'40px',['100%']);
			var np_div = $td(div,0,0);
			np_div.innerHTML = 'No Picture';
			$y(np_div, {color:'#AAA', fontSize:'11px',padding:'2px',verticalAlign:'middle',textAlign:'center',border:'1px solid #AAA'});
		}
		
		// text
		$td(t,0,1).innerHTML = repl('<div class="comment" style="font-size:11px">%(by)s: %(on)s</div><div style="font-size: 12px;">%(comment)s</div>',
			{'by':d[ri][1], 'on':dateutil.str_to_user(d[ri][0]), 'comment':d[ri][2]});
	}

	// enter
	this.inp.onkeypress = function(e) {
		if(isIE)var kc = window.event.keyCode;
		else var kc = e.keyCode;
		if(kc==13) me.btn.onclick();
	}

	lst.make(this.wrapper);
	this.tweet_lst = lst;
	
	// show message
	this.msg_area = $a(this.wrapper, 'div', '', {margin:'4px 0px'});
	lst.onrun = function() {
		if(!this.total_records) me.msg_area.innerHTML = 'No comments yet. Be the first one to comment!';
		else me.msg_area.innerHTML = '';
	}
	
	// show
	this.show = function(tag) {
		me.tag = tag;
		me.tweet_lst.run();
	}
}

var tweet_dialog;
function setup_tweets() {
	tweet_dialog = document.createElement('div');
	$y(tweet_dialog,{height:'360px', width:'240px'})

	// Tweets object
	tweet_dialog.tweets = new Tweets(tweet_dialog);
	
	// onshow
	tweet_dialog.show = function() {
		//this.title_text.innerHTML = 'Comments for ' + this.dt + ' ' + this.dn;
		this.tweets.comment_added = false;
		this.tweets.show(cur_frm.doctype+'/'+cur_frm.docname);
	}
	
	// onclose
	tweet_dialog.hide = function() {
		n_tweets[tweet_dialog.tweets.tag] = cint(tweet_dialog.tweets.tweet_lst.total_records);
		last_comments[tweet_dialog.tweets.tag] = [dateutil.full_str(),user,tweet_dialog.tweets.last_comment];
		frm_con.comments_btn.innerHTML = 'Comments (' + n_tweets[tweet_dialog.tweets.tag] + ')';
		if(tweet_dialog.tweets.comment_added)
			cur_frm.set_last_comment();
	}
}
 startup_lst[startup_lst.length] = setup_tweets;