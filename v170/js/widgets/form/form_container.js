_f.FrmContainer = function() {  
	this.wrapper = page_body.add_page("Forms", function() {}, function() { });
	this.last_displayed = null;
	
	// create hidden
	$dh(this.wrapper);
	$y(this.wrapper,{margin:'4px'});

	this.body = $a(this.wrapper,'div');
		
	// make by twin
	_f.frm_dialog = new _f.FrmDialog();
}


// FrmDialog - twin of FrmContainer
// =======================================================================
_f.frm_dialog = null;
_f.calling_doc_stack = [];
_f.FrmDialog = function() {
	var me = this;
	this.last_displayed = null;

	var d = new Dialog(640, 400, 'Edit Row');
	this.body = $a(d.body, 'div', 'dialog_frm');
	$y(d.body, {backgroundColor:'#EEE'});
	d.done_btn = $a($a(d.body, 'div', '', {margin:'8px'}),'button');
	d.done_btn.innerHTML = 'Done'; 

	// done button
	d.done_btn.onclick = function() { 

		if(me.table_form) {
			// table form, just hide the dialog (saving will be done with the parent)
			me.dialog.hide();
		} else {
			// form in dialog, so save it
			var callback = function(r,rt) {
				// set field value and refresh
				if(me.on_save_callback)
					me.on_save_callback(cur_frm.docname);
				me.dialog.hide();
			}
			cur_frm.save('Save', callback);
		}
	}

	// set title onshow
	// -------------------------------------------
	d.onshow = function() {
		// set the dialog title
		if(me.table_form) {
			d.set_title("Editing Row #" + (_f.cur_grid_ridx+1));
			d.done_btn.innerHTML = 'Done Editing';
		} else {
			d.set_title(cur_frm.doctype + ': ' + cur_frm.docname);
			d.done_btn.innerHTML = 'Save';
		}
	}

	// on hide, refresh grid or call onsave
	// -------------------------------------------
	d.onhide = function() {
		// if called from grid, refresh the row
		if(_f.cur_grid)
			_f.cur_grid.refresh_row(_f.cur_grid_ridx, me.dn);
	}
	this.dialog = d;
}

// Form Factory
// =======================================================================
_f.add_frm = function(doctype, onload, opt_name) {	
	// dont open doctype and docname from the same session
	if(frms['DocType'] && frms['DocType'].opendocs[doctype]) {
		msgprint("error:Cannot create an instance of \"" + doctype+ "\" when the DocType is open.");
		return;
	}

	// form already created, done
	if(frms[doctype]) { 
		return frms[doctype]; 
	}

	// Load Doctype from server
	var callback = function(r,rt) {
		if(!locals['DocType'][doctype]) {
			return;
		}
		
		// show fullpage or in Dialog?
		var meta = locals['DocType'][doctype];
		var in_dialog = false;
		
		// if is table, its in the Dialog!
		if(meta.istable) meta.in_dialog = 1;
		
		if(cint(meta.in_dialog)) {
			var parent = _f.frm_dialog;	
			in_dialog = true;
		} else {
			var parent = _f.frm_con;
		}
		
		// create the object
		var f = new _f.Frm(doctype, parent);
		f.in_dialog = in_dialog;

		if(onload)onload(r,rt);
	}
	
	// check if record is new
	var is_new = 0;
	if(opt_name && locals[doctype] && locals[doctype][opt_name] && locals[doctype][opt_name].__islocal) {
		is_new = 1;
	}
	
	if(opt_name && !is_new) {
		// get both
		$c('webnotes.widgets.form.getdoc', {'name':opt_name, 'doctype':doctype, 'getdoctype':1, 'user':user}, callback);
	} else {
		// get doctype only
		$c('webnotes.widgets.form.getdoctype', args={'doctype':doctype}, callback);
	}
}


