function addEvent(ev, fn) {
	if(isIE) {
		document.attachEvent('on'+ev, function() { 
			fn(window.event, window.event.srcElement); 
		});
	} else {
		document.addEventListener(ev, function(e) { fn(e, e.target); }, true);
	}
}

// set out of 100
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

// set gradient
function set_gradient(ele, from, to) {
	// gradient
	var no_gradient=0;
	
	if(isIE)no_gradient=1;
	if(isFF && ffversion < 3.6)no_gradient=1;

	if(no_gradient) {
		$y(ele, {backgroundColor: '#' + cint(cint(from.substr(1)) - cint(to.substr(1)) / 2)});
	} else {
		$y(ele, {background: '-webkit-gradient(linear, left top, left bottom, from('+from+'), to('+to+'))'});
		$y(ele, {background: '-moz-linear-gradient(top, '+from+', '+to+')'});		
	}
}
$gr = set_gradient;
$br = function(ele, r) { $(ele).css('-moz-border-radius',r).css('-webkit-border-radius',r); }

// Dom

function empty_select(s) {
	if(s.custom_select) { s.empty(); return; }
	if(s.inp)s = s.inp;
	if(s) { 
		var tmplen = s.length; for(var i=0;i<tmplen; i++) s.options[0] = null; 
	} 
}

function sel_val(s) { 
	if(s.custom_select) {
		return s.inp.value ? s.inp.value : '';
	}
	if(s.inp)s = s.inp;
	try {
		if(s.selectedIndex<s.options.length) return s.options[s.selectedIndex].value;
		else return '';
	} catch(err) { return ''; /* IE fix */ }
}

function add_sel_options(s, list, sel_val, o_style) {
	if(s.custom_select) {
		s.set_options(list)
		if(sel_val) s.inp.value = sel_val;
		return;
	}
	if(s.inp)s = s.inp;
	for(var i=0; i<list.length; i++) {
		var o = new Option(list[i], list[i], false, (list[i]==sel_val? true : false));
		if(o_style) $y(o, o_style);
		s.options[s.options.length] = o;	
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
	if(parent && parent.substr)parent = $i(parent);
	var c = document.createElement(newtag);
	if(parent)
		parent.appendChild(c);
	if(className)c.className = className;
	if(cs)$y(c,cs);
	return c;
}
function $a_input(p, in_type, attributes, cs) {
	if(!attributes) attributes = {};
	if(in_type) attributes.type = in_type 
	if(isIE) {
		var s= '<input ';
		for(key in attributes)
			s+= ' ' + key + '="'+ attributes[key] + '"';
		s+= '>'
		p.innerHTML = s
		var o = p.childNodes[0];
	} else {
		var o = $a(p, 'input'); 
		for(key in attributes)
			o.setAttribute(key, attributes[key]);
	}
	if(cs)$y(o,cs);
	return o;
}

function $dh(d) { 
	if(d && d.substr)d=$i(d); 
	if(d && d.style.display.toLowerCase() != 'none') d.style.display = 'none'; 
}
function $ds(d) { 
	if(d && d.substr)d=$i(d); 
	var t = 'block';
	if(d && in_list(['span','img','button'], d.tagName.toLowerCase())) 
		t = 'inline'
	if(d && d.style.display.toLowerCase() != t) 
		d.style.display = t; 
}
function $di(d) { if(d && d.substr)d=$i(d); if(d)d.style.display = 'inline'; }
function $i(id) { 
	if(!id) return null; 
	if(id && id.appendChild)return id; // already an element
	return document.getElementById(id); 
}
function $t(parent, txt) { 	if(parent.substr)parent = $i(parent); return parent.appendChild(document.createTextNode(txt)); }
function $w(e,w) { if(e && e.style && w)e.style.width = w; }
function $h(e,h) { if(e && e.style && h)e.style.height = h; }
function $bg(e,w) { if(e && e.style && w)e.style.backgroundColor = w; }
function $fg(e,w) { if(e && e.style && w)e.style.color = w; }
function $op(e,w) { if(e && e.style && w) { set_opacity(e,w); } }

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

function append_row(t, at) {
	var r = t.insertRow(at ? at : t.rows.length);
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

function objpos(obj){
  if(obj.substr)obj = $i(obj);
  var p = $(obj).offset();
  return {x : cint(p.left), y : cint(p.top) }
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

// get full page size
function get_page_size(){
	if (window.innerHeight && window.scrollMaxY) {// Firefox
		yh = window.innerHeight + window.scrollMaxY;
		xh = window.innerWidth + window.scrollMaxX;
	} else if (document.body.scrollHeight > document.body.offsetHeight){ // all but Explorer Mac
		yh = document.body.scrollHeight;
		xh = document.body.scrollWidth;
	} else { // works in Explorer 6 Strict, Mozilla (not FF) and Safari
		yh = document.body.offsetHeight;
		xh = document.body.offsetWidth;
  	}
	r = [xh, yh];
	//alert( 'The height is ' + yh + ' and the width is ' + xh );
	return r;
}

// get scroll top
function get_scroll_top() {
	var st = 0;
	if(document.documentElement && document.documentElement.scrollTop)
		st = document.documentElement.scrollTop;
	else if(document.body && document.body.scrollTop)
		st = document.body.scrollTop;
	return st;
}

function get_url_arg(name) {
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	if( results == null )
		return "";
	else
		return decodeURIComponent(results[1]);
}

function get_url_dict() {
	var d = {}
	var t = window.location.href.split('?')[1];
	if(t.indexOf('#')!=-1) t = t.split('#')[0];
	t = t.split('&');
	for(var i=0; i<t.length; i++) {
		var a = t[i].split('=');
		d[decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
	}
	return d;
}

function get_cookie(c) {
	var t=""+document.cookie;
	var ind=t.indexOf(c);
	if (ind==-1 || c=="") return ""; 
	var ind1=t.indexOf(';',ind);
	if (ind1==-1) ind1=t.length; 
	return unescape(t.substring(ind+c.length+1,ind1));
}

// add space holder
add_space_holder = function(parent,cs){
	if(!cs) cs = {margin:'170px 0px'}	
	$y(space_holder_div,cs);
	parent.appendChild(space_holder_div);
}

// remove space holder
remove_space_holder = function(){
	if(space_holder_div.parentNode)
		space_holder_div.parentNode.removeChild(space_holder_div);
}

// set user image
var user_img = {}

set_user_img = function(img, username, get_latest) {

	function set_it() {
		if(user_img[username]=='no_img_m')
			img.src = 'images/ui/no_img/no_img_m.gif';
		else if(user_img[username]=='no_img_f')
			img.src = 'images/ui/no_img/no_img_f.gif'; // no image
		else
			img.src = repl('cgi-bin/getfile.cgi?ac=%(ac)s&name=%(fn)s', {fn:user_img[username],ac:session.account_name});

	}

	if(get_latest){
		$c('webnotes.profile.get_user_img',{username:username},function(r,rt) { user_img[username] = r.message; set_it(); }, null, 1);
	}
	else{
		if(user_img[username]) {
			set_it();
		}

		else{
			$c('webnotes.profile.get_user_img',{username:username},function(r,rt) { user_img[username] = r.message; set_it(); }, null, 1);
		}
	}

}
