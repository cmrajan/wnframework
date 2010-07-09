_f.FrmHeader = function(parent) {
	var me = this;
	this.bg_color = '#FFF';
	this.wrapper = $a(parent, 'div');
	this.page_head = new PageHeader(this.wrapper);
}
_f.FrmHeader.prototype.show = function() {  $ds(this.wrapper); }
_f.FrmHeader.prototype.hide = function() {  $dh(this.wrapper); }

// toolbar buttons
// =======================================================================

_f.FrmHeader.prototype.refresh= function() {

	var me = this;
	var p = cur_frm.get_doc_perms();
	
	this.page_head.clear_toolbar();

	// Edit
	if(cur_frm.meta.read_only_onload && !cur_frm.doc.__islocal) {
		if(!cur_frm.editable)
				this.page_head.add_button('Edit', function() { 
					cur_frm.edit_doc();
				}, 1, 'ui-icon-document' 
			);
		else
			this.page_head.add_button('Done Editing', function() { 
				cur_frm.is_editable[cur_frm.docname] = 0;				
				cur_frm.refresh(); }, 1, 'ui-icon-document' );	
	}

	
	// Save
	if(cur_frm.editable && cint(cur_frm.doc.docstatus)==0 && p[WRITE])
		this.page_head.add_button('Save', function() { cur_frm.save('Save');}, 1, 'ui-icon-disk');
	
	// Submit
	if(cint(cur_frm.doc.docstatus)==0 && p[SUBMIT] && (!cur_frm.doc.__islocal))
		this.page_head.add_button('Submit', function() { cur_frm.savesubmit(); }, 0, 'ui-icon-locked');
	
	// Cancel
	if(cint(cur_frm.doc.docstatus)==1  && p[CANCEL])
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

	// Trash
	if(cur_frm.meta.allow_trash && cint(cur_frm.doc.docstatus) != 2 && (!cur_frm.doc.__islocal) && p[CANCEL])
		this.page_head.add_button('Trash', function() { cur_frm.savetrash() }, 0, 'ui-icon-trash');			
}

_f.FrmHeader.prototype.show_toolbar = function() { $ds(this.wrapper); this.refresh(); }
_f.FrmHeader.prototype.hide_toolbar = function() { $dh(this.wrapper); }

_f.FrmHeader.prototype.refresh_toolbar = function() {
	var m = cur_frm.meta;
	
	if(m.hide_heading) { 
		// no heading... poof
		this.hide(); 
	} else {
		this.show();
		
		// with or without toolbar?
		if(m.hide_toolbar) { 
			this.hide_toolbar();
		} else {
			this.show_toolbar();
		}
	}
}