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
