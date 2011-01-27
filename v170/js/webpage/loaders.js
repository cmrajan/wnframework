// Load Report
// -------------------------------------------------------------------------------

function loadreport(dt, rep_name, onload, menuitem, reset_report) {
	dt = get_label_doctype(dt);
	
	var show_report_builder = function(rb_con) {
		if(!_r.rb_con) {
			// first load
			_r.rb_con = rb_con;
		}
				
		_r.rb_con.set_dt(dt, function(rb) { 
			if(rep_name) {
				var t = rb.current_loaded;
				rb.load_criteria(rep_name);

				// call onload
				if(onload)
					onload(rb);

				// if loaded, then run
				if((rb.dt) && (!rb.dt.has_data() || rb.current_loaded!=t))
					rb.dt.run();

			} else {
				// reset if from toolbar
				if(reset_report) {
					rb.reset_report();
				}
			}
			
			// show
			if(!rb.forbidden) {
				page_body.change_to('Report Builder');
				nav_obj.open_notify('Report',dt,rep_name);
			}
		} );
	}
	new_widget('_r.ReportContainer', show_report_builder, 1);
}


// Load Doc
// -------------------------------------------------------------------------------

var load_doc = loaddoc;

function loaddoc(doctype, name, onload, menuitem, from_archive) {
	doctype = get_label_doctype(doctype);

	// validate
	if(frms['DocType'] && frms['DocType'].opendocs[doctype]) {
		msgprint("Cannot open an instance of \"" + doctype + "\" when the DocType is open.");
		return;
	}
	
	// reverse validation - do not open DocType when an instance is open
	if(doctype=='DocType' && frms[name]) {
		msgprint("Cannot open DocType \"" + name + "\" when its instance is open.");
		return;
	}

	var show_form = function(f) {
		// load the frm container
		if(!_f.frm_con && f) {
			_f.frm_con = f; //new _f.FrmContainer();
		}		
				
		// case A - frm not loaded
		if(!frms[doctype]) {
			_f.add_frm(doctype, show_doc, name, from_archive);

		// case B - both loaded
		} else if(LocalDB.is_doc_loaded(doctype, name)) {
			show_doc();
		
		// case C - only frm loaded
		} else {
			$c('webnotes.widgets.form.getdoc', {'name':name, 'doctype':doctype, 'user':user, 'from_archive':(from_archive ? 1 : 0) }, show_doc, null, null);	// onload
			page_body.set_status('Loading Document...');
		}
	}
				
	var show_doc = function(r,rt) {
		if(locals[doctype] && locals[doctype][name]) {
			page_body.set_status('Done');
			var frm = frms[doctype];

			// tweets
			if(r && r.no_of_comments) frm.n_comments[name] = r.no_of_comments;
			
			// show
			frm.refresh(name);

			// notify for back button
			if(!frm.in_dialog)
				nav_obj.open_notify('Form',doctype,name);

		} else {
			// nothing, go home - there were errors
			if(r.exc) { msgprint('There were errors while loading ' + doctype + ' ' + name); }
			loadpage('_home');
		}
	}
		
	//// is libary loaded?
	new_widget('_f.FrmContainer', show_form, 1);
}


// New Doc
// -------------------------------------------------------------------------------


function new_doc(doctype, onload, in_dialog, on_save_callback, cdt, cdn, cnic) {
	// cnic = caller not in container (caller is a dialog)
	
	doctype = get_label_doctype(doctype);
	
	if(!doctype) {
		if(cur_frm)doctype = cur_frm.doctype; else return;
	}
	
	var show_doc = function() {
		frm = frms[doctype];

		if (frm.perm[0][CREATE]==1) {

			// load new doc	- create the new doc (if single, just load it)
			if(frm.meta.issingle) {
				var dn = doctype;
				LocalDB.set_default_values(locals[doctype][doctype]);
			} else 
				var dn = LocalDB.create(doctype);

			// call (optional) onload
			if(onload)onload(dn);
			
			
			if(frm.in_dialog) {
				// attach values so that the "new" value is set in the field from which it was set
				var fd = _f.frm_dialog;
				fd.cdt = cdt; 
				fd.cdn = cdn; 
				fd.cnic = cnic;
				fd.on_save_callback = on_save_callback;
			} else {
				nav_obj.open_notify('Form',doctype,dn);
			}
			
			// show the form
			frm.refresh(dn);

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
			_f.add_frm(doctype, show_doc); // load
		else 
			show_doc(frms[doctype]); // directly
		
	}

	new_widget('_f.FrmContainer', show_form, 1);	
}
var newdoc = new_doc;

// Load Page
// -------------------------------------------------------------------------------

var pscript={};
var cur_page;
function loadpage(page_name, call_back, no_history) {
	if(page_name=='_home')
		page_name = home_page;
	var fn = function(r,rt) {
		page_body.set_status('Done');
		if(page_body.pages[page_name]) {
			// loaded
			var p = page_body.pages[page_name]
			
			// show
			page_body.change_to(page_name);

			// call refresh
			try {
				if(pscript['refresh_'+page_name]) pscript['refresh_'+page_name](); // onload
			} catch(e) { 
				submit_error(e); 
			}
		} else {
			// new page
			var p = render_page(page_name);
			if(!p)return;
		}

		// execute callback
		cur_page = page_name;
		if(call_back)call_back();
		
		// scroll to top
		scroll(0,0);

		// update "back"
		nav_obj.open_notify('Page',page_name,'',no_history);
	}
	
	if(get_local('Page', page_name) || page_body.pages[page_name]) 
		fn();
	else {
		page_body.set_status('Loading Page...');
		$c('webnotes.widgets.page.getpage', {'name':page_name}, fn);
	}
}

// Load Script
// -------------------------------------------------------------------------------

function loadscript(src, call_back) {
	set_loading();
	var script = $a('head','script');
	script.type = 'text/javascript';
	script.src = src;
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

// Load DocBrowser
// -------------------------------------------------------------------------------

var doc_browser_page;
function loaddocbrowser(dt, label, fields) {
	dt = get_label_doctype(dt);
	if(!doc_browser_page)
		doc_browser_page = new ItemBrowserPage();
	doc_browser_page.show(dt, label, fields);
	nav_obj.open_notify('DocBrowser',dt,'');
}
