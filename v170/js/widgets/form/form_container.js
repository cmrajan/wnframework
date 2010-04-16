_f.FrmContainer = function() {  
	this.wrapper = page_body.add_page("Forms", function() {}, function() { });
	
	// create hidden
	$dh(this.wrapper);
	$y(this.wrapper,{margin:'4px'});
	
	this.make_head();
	this.make_toolbar();
}


_f.FrmContainer.prototype.make_head = function() {
	var me = this;
	this.bg_color = '#FFF';
	this.head = $a(this.wrapper, 'div', '', {margin:'0px 0px 4px 0px'});
	this.body = $a(this.wrapper,'div');

	this.page_head = new PageHeader(this.head);
}

_f.FrmContainer.prototype.show_head = function() { 
	$ds(this.head); 
}

_f.FrmContainer.prototype.hide_head = function() { 
	$dh(this.head); 
}

_f.FrmContainer.prototype.make_toolbar = function() {
}

_f.FrmContainer.prototype.refresh_btns= function() {

	var me = this;
	var p = cur_frm.get_doc_perms();
	
	this.page_head.clear_toolbar();

	// Edit
	if(cur_frm.meta.read_only_onload && !cur_frm.doc.__islocal) {
		if(!cur_frm.editable)
			this.page_head.add_button('Edit', function() { cur_frm.edit_doc() }, 1, 'ui-icon-document' );
		else
			this.page_head.add_button('Done Editing', function() { 
				cur_frm.is_editable[cur_frm.docname] = 0;
				cur_frm.refresh(); }, 1, 'ui-icon-document' );	
	}

	
	// Save
	if(cur_frm.editable && cint(cur_frm.doc.docstatus)==0 && p[WRITE])
		this.page_head.add_button('Save', function() { cur_frm.save('Save');}, 1, 'ui-icon-disk');
	
	// Submit
	if(cur_frm.editable && cint(cur_frm.doc.docstatus)==0 && p[SUBMIT] && (!cur_frm.doc.__islocal))
		this.page_head.add_button('Submit', function() { cur_frm.savesubmit(); }, 0, 'ui-icon-locked');
	
	// Cancel
	if(cur_frm.editable && cint(cur_frm.doc.docstatus)==1  && p[CANCEL])
		this.page_head.add_button('Cancel', function() { cur_frm.savecancel() }, 0, 'ui-icon-closethick');

	// Amend
	if(cint(cur_frm.doc.docstatus)==2  && p[AMEND])
		this.page_head.add_button('Amend', function() { cur_frm.amend_doc() }, 0, 'ui-icon-scissors');
	
	// New
	this.page_head.add_button('New', function() { new_doc() }, 0, 'ui-icon-document');
	
	// Refresh
	this.page_head.add_button('Refresh', function() { cur_frm.reload_doc(); }, 0, 'ui-icon-refresh');
	
	// Print
	if(!cur_frm.meta.allow_print)
		this.page_head.add_button('Print', function() { cur_frm.print_doc(); }, 0, 'ui-icon-print');
	
	// Email
	if(!cur_frm.meta.allow_email)
		this.page_head.add_button('Email', function() { cur_frm.email_doc(); }, 0, 'ui-icon-mail-closed');
	
	// Copy
	if(!cur_frm.meta.allow_copy)
		this.page_head.add_button('Copy', function() { cur_frm.copy_doc(); }, 0, 'ui-icon-copy');
			
}

_f.FrmContainer.prototype.show_toolbar = function() {
	//for(var i=0; i<this.head_elements.length; i++) this.head_elements[i].is_inline ? $di(this.head_elements[i]) : $ds(this.head_elements[i]);

	this.refresh_btns();
}

_f.FrmContainer.prototype.hide_toolbar = function() {
	//for(var i=0; i<this.head_elements.length; i++) $dh(this.head_elements[i]);
}

_f.FrmContainer.prototype.refresh_toolbar = function() {
	var m = cur_frm.meta;
	
	if(m.hide_heading) { 
		this.hide_head(); 
	} else {
		this.show_head();
		
		if(m.hide_toolbar) { 
			this.hide_toolbar();
		} else {
			this.show_toolbar();
		}
	}
}

_f.add_frm = function(doctype, onload, opt_name, parent) {
	if(parent) parent = _f.frm_con.body;
	
	// dont open doctype and docname from the same session
	if(frms['DocType'] && frms['DocType'].opendocs[doctype]) {
		msgprint("error:Cannot create an instance of \"" + doctype+ "\" when the DocType is open.");
		return;
	}

	if(frms[doctype]) { 
		return frms[doctype]; 
	}

	// Load Doctype from server
	var callback = function(r,rt) {
		if(!locals['DocType'][doctype]) {
			return;
		}
		new _f.Frm(doctype, parent);

		if(onload)onload(r,rt);
	}
	if(opt_name && (!LocalDB.is_doc_loaded(doctype, opt_name))) {
		// get both
		$c('webnotes.widgets.form.getdoc', {'name':opt_name, 'doctype':doctype, 'getdoctype':1, 'user':user}, callback);
	} else {
		// get doctype only
		$c('webnotes.widgets.form.getdoctype', args={'doctype':doctype}, callback);
	}
}