var startup_list = [];
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

function is_null(v) {
	if(v==null) {
		return 1
	} else if(v==0) {
		if((v+'').length==1) return 0;
		else return 1;
	} else {
		return 0
	}
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
	for(var k in l1) l.push(l1[k]);
	for(var k in l2) l.push(l2[k]);
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

function ie_refresh(e) { $dh(e); $ds(e); }

