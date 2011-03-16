// Navigation Object

var nav_obj = {}

nav_obj.observers = [];
nav_obj.add_observer = function(o) { nav_obj.observers.push(o); }

nav_obj.ol = [];

//
// notify my history so that it gets added to the back button history
//
nav_obj.open_notify = function(t, dt, dn, no_history) {
	// last should not be this (refresh)
	if(nav_obj.ol.length) {
		var tmp = nav_obj.ol[nav_obj.ol.length-1];
		if(tmp && tmp[0]==t && tmp[1]==dt && tmp[2]==dn) return;
	}

	if(!no_history) {

		// remove from history (if exists so that we can put it back on top)
		var tmp = [];
		for(var i in nav_obj.ol)
			if(!(nav_obj.ol[i][0]==t && nav_obj.ol[i][1]==dt && nav_obj.ol[i][2]==dn)) tmp.push(nav_obj.ol[i]);
		nav_obj.ol = tmp;
	
		// add to top
		nav_obj.ol.push([t, dt, dn])	
		
		// encode
		en_t = encodeURIComponent(t);
		en_dt = encodeURIComponent(dt);
		en_dn = dn ? encodeURIComponent(dn) : '';
		
		if(en_t=='Page') {
			var id = en_dt + (dn ? ('/'+en_dn): '')
		} else {
			var id = en_t+'/'+ en_dt + (dn ? ('/'+en_dn): '')
		}

		// option to add to analytics engine
		if(nav_obj.on_open)
			nav_obj.on_open(id);
		
		// add to "back" history
		dhtmlHistory.add('!' + id,'');
	}
	
	nav_obj.notify_observers(t, dt, dn);

}

// Notify observers
// =========================================

nav_obj.notify_observers = function(t, dt, dn) {
	// notify observers (for menu?)
	for(var i=0; i<nav_obj.observers.length; i++) {
		var o = nav_obj.observers[i];
		if(o && o.notify) o.notify(t, dt, dn);
	}
}

// Remame links (for save - name change)
// =========================================

nav_obj.rename_notify = function(dt, oldn, newn) {
	for(var i=0;i<nav_obj.ol.length;i++) {
		var o = nav_obj.ol[i];
		if(o[1]==dt && o[2]==oldn) o[2]=newn;
	}
} 

nav_obj.show_last_open = function() {
	var l = nav_obj.ol[nav_obj.ol.length-2];
	delete nav_obj.ol[nav_obj.ol.length-1]; // delete current open

	if(!l) loadpage('_home');
	else if(l[0]=='Page') { 
		loadpage(l[1]);
	} else if(l[0]=='Report') {
		loadreport(l[1],l[2]);
	} else if(l[0]=='Form') {
		loaddoc(l[1],l[2]);
	} else if(l[0]=='DocBrowser') {
		loaddocbrowser(l[1]);
	}
}

var _history_current;

function history_get_name(t) {
	var parts = [];
	if(t.length>=3) {
		// combine all else
		for(var i=2; i<t.length; i++) {
			parts.push(t[i]);
		}
	}
	return parts.join('/')
}

//
// get the page details from the location
//
nav_obj.get_page = function(loc) {
	if(!loc) loc = window.location.hash;
	
	// remove exclamation for hash-bangs
	if(loc.substr(0,1)=='#') { loc = loc.substr(1); }
	if(loc.substr(0,1)=='!') { loc = loc.substr(1); }

	if(!in_list(['Page/', 'Form/', 'Repor', 'DocBr'], loc.substr(0,5))) {
		loc = 'Page/' + loc;	
	}
	return loc.split('/');	
}
//
// function called when page is updated
//
function historyChange(newLocation, historyData) {
	var t = nav_obj.get_page(newLocation)

	for(var i=0;i<t.length;i++) 
		t[i] = decodeURIComponent(t[i]);

	// re-opening the same page?
	if(nav_obj.ol.length) {
		var c = nav_obj.ol[nav_obj.ol.length-1];

		if(t.length==2)	{
			if(c[0]==t[0] && c[1]==t[1]) return;
		} else {
			if(c[0]==t[0] && c[1]==t[1] && c[2]==t[2]) return;
		}
	}
	
	if(t[2])
		var docname = history_get_name(t);
	
	if(t[0]=='Form') {
		_history_current = newLocation;
		if(docname.substr(0, 3)=='New') {
			newdoc(t[1]);
		} else {
			loaddoc(t[1], docname);
		}
	} else if(t[0]=='Report') {
		_history_current = newLocation;
		loadreport(t[1], docname);
	} else if(t[0]=='Page') {
		_history_current = newLocation;
		loadpage(t[1]);
	} else if(t[0]=='Application') {
		_history_current = newLocation;
		loadapp(t[1]);
	} else if(t[0]=='DocBrowser') {
		_history_current = newLocation;
		loaddocbrowser(t[1]);
	} 
};
