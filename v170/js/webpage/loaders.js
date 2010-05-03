// Load Report
// -------------------------------------------------------------------------------

function loadreport(dt, rep_name, onload, menuitem, reset_report) {
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

				// set menu item
				if(menuitem) rb.menuitems[rep_name] = menuitem;

				// reset if from toolbar
				if(reset_report) {
					rb.reset_report();
				}

				// if loaded, then run
				if((rb.dt) && (!rb.dt.has_data() || rb.current_loaded!=t))
					rb.dt.run();
				
				// high light menu item
				if(rb.menuitems[rep_name]) 
					rb.menuitems[rep_name].show_selected();

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

function loaddoc(doctype, name, onload, menuitem) {

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
			_f.add_frm(doctype, show_doc, name);

		// case B - both loaded
		} else if(LocalDB.is_doc_loaded(doctype, name)) {
			show_doc();
		
		// case C - only frm loaded
		} else {
			$c('webnotes.widgets.form.getdoc', {'name':name, 'doctype':doctype, 'user':user}, show_doc, null, null);	// onload
		}
	}
				
	var show_doc = function(r,rt) {
		if(locals[doctype] && locals[doctype][name]) {
			var frm = frms[doctype];

			// menu item
			if(menuitem) frm.menuitem = menuitem;
			if(onload)onload(frm);
						
			// tweets
			if(r && r.n_tweets) frm.n_tweets[name] = r.n_tweets;
			if(r && r.last_comment) frm.last_comments[name] = r.last_comment;

			
			// show
			frm.show(name, null, _f.frm_con.body, 0);

			// back button
			nav_obj.open_notify('Form',doctype,name);

			// show menuitem selected
			if(frm.menuitem) frm.menuitem.show_selected();

		} else {
			msgprint('error:There were errors while loading ' + doctype + ',' + name);
		}
	}
		
	//// is libary loaded?
	new_widget('_f.FrmContainer', show_form, 1);
}


// New Doc
// -------------------------------------------------------------------------------


function new_doc(doctype, onload, in_dialog, on_save_callback, cdt, cdn, cnic) {	
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
			
			// no-dialog for doctype of more than 8 fields
			if(fields_list[doctype] && fields_list[doctype].length>2) {
				in_dialog = 0;	
			}
			
			if(in_dialog) {
				_f.edit_record(doctype, d, 0, on_save_callback, cdt, cdn, cnic);
			} else {
				nav_obj.open_notify('Form',doctype,d);
				frm.show(d, null, _f.frm_con.body, 0);
			}
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
function loadpage(page_name, call_back, menuitem) {
	if(page_name=='_home' || page_name=='Home')
		page_name = home_page;
	var fn = function(r,rt) {
		if(page_body.pages[page_name]) {
			// loaded
			var p = page_body.pages[page_name]
			
			// show
			page_body.change_to(page_name);

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

		// select menu
		if(p.menuitem) p.menuitem.show_selected();

		// execute callback
		cur_page=page_name;
		if(call_back)call_back();
		
		// scroll to top
		scroll(0,0);

		// update "back"
		nav_obj.open_notify('Page',page_name,'');
	}
	
	if(get_local('Page', page_name) || page_body.pages[page_name]) 
		fn();
	else 
		$c('webnotes.widgets.page.getpage', {'name':page_name}, fn );
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

function loaddocbrowser(dt, label, fields) {
	var show = function() {
		doc_browser.show(dt, label, fields);
		nav_obj.open_notify('DocBrowser',dt,'');
	}
	
	if(doc_browser) 
		show();
	else
		new_widget('DocBrowser', function(b) { doc_browser = b; show(); });
		
}
