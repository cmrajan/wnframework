// Load Report
// -------------------------------------------------------------------------------

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

// Load Form
// -------------------------------------------------------------------------------

function loadfrm(call_back) {
	var fn = function() {
		frm_con = new FrmContainer();
		frm_con.init();
		call_back();
	}
	if(!frm_con) fn();
	else call_back();
}


// Load Doc
// -------------------------------------------------------------------------------

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

// Load Page
// -------------------------------------------------------------------------------
