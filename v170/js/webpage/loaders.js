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

// Load Doc
// -------------------------------------------------------------------------------

var load_doc = loaddoc;

function loaddoc(doctype, name, onload, menuitem) {

	// validate
	if(frms['DocType'] && frms['DocType'].opendocs[doctype]) {
		msgprint("Cannot open an instance of \"" + doctype + "\" when the DocType is open.");
		return;
	}

	var show_form = function(f) {
		// load the frm container
		if(!_f.frm_con && f) {
			_f.frm_con = f; //new _f.FrmContainer();
		}		
		
		// case A - frm not loaded
		if(!frms[doctype]) {
			_f.frm_con.add_frm(doctype, show_doc, name);

		// case B - both loaded
		} else if(LocalDB.is_doc_loaded(doctype, name)) {
			show_doc();
		
		// case C - only frm loaded
		} else {
			$c('webnotes.widgets.form.getdoc', {'name':name, 'doctype':doctype, 'user':user}, show_doc, null, null, 'Loading ' + name);	// onload
		}
	}
	
	var show_doc = function(r,rt) {
		if(locals[doctype] && locals[doctype][name]) {
			var frm = frms[doctype];

			// menu item
			if(menuitem) frm.menuitem = menuitem;
			if(onload)onload(frm);
			
			// back button
			nav_obj.open_notify('Form',doctype,name);
			
			// tweets
			if(r && r.n_tweets) frm.n_tweets[name] = r.n_tweets;
			if(r && r.last_comment) frm.last_comments[name] = r.last_comment;

			
			// show
			frm.show(name);

			// show menuitem selected
			if(frm.menuitem) frm.menuitem.show_selected();

		} else {
			msgprint('error:There where errors while loading ' + doctype + ',' + name);
		}
	}
		
	//// is libary loaded?
	new_widget('_f.FrmContainer', show_form, 1);
}


// New Doc
// -------------------------------------------------------------------------------


function new_doc(doctype, onload) {	
	if(!doctype) {
		if(cur_frm)doctype = cur_frm.doctype; else return;
	}
	
	var show_doc = function() {
		frm = frms[doctype];
		// load new doc	
		if (frm.perm[0][CREATE]==1) {
			if(frm.meta.issingle) {
				var d = doctype;
				LocalDB.set_default_values(locals[doctype][doctype]);
			} else 
				var d = LocalDB.create(doctype);
				
			if(onload)onload(d);
			
			nav_obj.open_notify('Form',doctype,d);
			
			frm.show(d);
		} else {
			msgprint('error:Not Allowed To Create '+doctype+'\nContact your Admin for help');
		}
	}

	var show_form = function() {
		// load the frm container
		if(!_f.frm_con) {
			_f.frm_con = new _f.FrmContainer();
		}

		if(!frms[doctype]) 
			_f.frm_con.add_frm(doctype, show_doc); // load
		else 
			show_doc(frms[doctype]); // directly
		
	}

	new_widget('_f.FrmContainer', show_form, 1);
}
var newdoc = new_doc;

// Load Page
// -------------------------------------------------------------------------------
