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

	// Row 1 - title / btns / toolbar
	// -----------------------

	var div = $a(this.head, 'div', '');
	this.tbartab = make_table(div, 1, 3, '100%', ['35%','20%','45%'],{ paddingTop:'2px' });
	$y(this.tbartab, {tableLayout:'fixed'});
	
	$y($td(this.tbartab,0,0),{padding:'4px'});
	this.main_title = $a($td(this.tbartab,0,0), 'h1', '',{margin:'0px'});

	// buttons
	this.button_area = $a($td(this.tbartab,0,1), 'div', '');

	// buttons 2
	this.tbar_div = $a($td(this.tbartab,0,2),'div','',{marginRight:'8px', textAlign:'right'})

	// Row 2 - images  / details
	// -------------------------

	this.tbartab2 = make_table($a(this.head, 'div'), 1, 2, '100%', ['50%','50%']);

	// created / modified
	this.owner_img = $a($td(this.tbartab2,0,0), 'img','',{margin:'4px',width:'40px',display:'inline'});
	this.owner_img.is_inline = 1;

	this.mod_img = $a($td(this.tbartab2,0,0), 'img','',{margin:'4px',width:'40px',display:'inline'});
	this.mod_img.is_inline = 1;
		
	// details
	$y($td(this.tbartab2,0,1),{textAlign:'right', paddingRight:'12px'});
	this.sub_title = $a($td(this.tbartab2, 0, 1), 'div','',{display:'inline', color:'#888'});
	this.sub_title.is_inline = 1;
	this.status_title = $a($td(this.tbartab2, 0, 1), 'span','',{marginLeft:'8px'});
	this.status_title.is_inline = 1;
	this.last_update_area = $a($td(this.tbartab2, 0, 1), 'span','',{marginLeft:'8px', color:'#888'});
	this.last_update_area.is_inline = 1;


	// header elements
	this.head_elements = [this.button_area, this.tbar_div, this.owner_img, this.mod_img, this.sub_title, this.status_title, this.last_update_area];
	
}

_f.FrmContainer.prototype.show_head = function() { 
	$ds(this.head); 
}

_f.FrmContainer.prototype.hide_head = function() { 
	$dh(this.head); 
}

_f.FrmContainer.prototype.make_toolbar = function() {
}

_f.FrmContainer.prototype.refresh_save_btns= function() {

	var me = this;
	var frm = cur_frm;
	var p = frm.get_doc_perms();
	
	me.button_area.innerHTML = '';

	var makebtn = function(label, fn, bold, icon) {
		var btn = $a(me.button_area,'button');
		btn.innerHTML = label; 
		btn.onclick = fn;
		if(bold)$y(btn, {fontWeight: 'bold'});
		$(btn).button({icons:{ primary: icon }});
	}

	if(!cur_frm.editable)
		makebtn('Edit', function() { cur_frm.edit_doc(), 0, 'ui-icon-document' });
	
	if(cur_frm.editable && cint(frm.doc.docstatus)==0 && p[WRITE])
		makebtn('Save', function() { cur_frm.save('Save');}, 1, 'ui-icon-disk');
	
	if(cur_frm.editable && cint(frm.doc.docstatus)==0 && p[SUBMIT] && (!frm.doc.__islocal))
		makebtn('Submit', function() { cur_frm.savesubmit(); }, 0, 'ui-icon-locked');
	
	if(cur_frm.editable && cint(frm.doc.docstatus)==1  && p[CANCEL])
		makebtn('Cancel', function() { cur_frm.savecancel() }, 0, 'ui-icon-closethick');

	if(cint(frm.doc.docstatus)==2  && p[AMEND])
		makebtn('Amend', function() { cur_frm.amend_doc() }, 0, 'ui-icon-scissors');
	
	$(this.button_area).buttonset();
}

_f.FrmContainer.prototype.refresh_opt_btns = function() {
	var frm = cur_frm;
	
	// clear
	this.tbar_div.innerHTML = '';
	var div = $a(this.tbar_div,'div');

	var makebtn = function(label, fn, icon) {
		var btn = $($a(div,'button')).html(label).click(fn);
		$(btn).button({icons:{ primary: icon }});		
		/*var btn = $a(div,'button')
		btn.innerHTML = label
		btn.onclick = fn;*/
	}

	makebtn('New', function() { new_doc() }, 'ui-icon-document');
	makebtn('Refresh', function() { cur_frm.reload_doc(); }, 'ui-icon-refresh');
	if(!frm.meta.allow_print)makebtn('Print', function() { cur_frm.print_doc(); }, 'ui-icon-print');
	if(!frm.meta.allow_email)makebtn('Email', function() { cur_frm.email_doc(); }, 'ui-icon-mail-closed');
	if(!frm.meta.allow_copy)makebtn('Copy', function() { cur_frm.copy_doc(); }, 'ui-icon-copy');
	
	// close
	makebtn('Close', function() { nav_obj.show_last_open(); }, 'ui-icon-close');
	$(div).buttonset();
}

_f.FrmContainer.prototype.show_toolbar = function() {
	for(var i=0; i<this.head_elements.length; i++) this.head_elements[i].is_inline ? $di(this.head_elements[i]) : $ds(this.head_elements[i]);

	this.refresh_save_btns();
	this.refresh_opt_btns();
}

_f.FrmContainer.prototype.hide_toolbar = function() {
	for(var i=0; i<this.head_elements.length; i++) $dh(this.head_elements[i]);
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

	if(frms[doctype]) { return frms[doctype]; }

	// Load Doctype from server
	var callback = function(r,rt) {
		if(!locals['DocType'][doctype]) {
			return;
		}
		new _f.Frm(doctype, parent);

		if(onload)onload(r,rt);
	}
	if(locals['DocType'] && locals['DocType'][doctype]) {
		callback();
	} else if(opt_name && (!LocalDB.is_doc_loaded(doctype, opt_name))) {
		// get both
		$c('webnotes.widgets.form.getdoc', {'name':opt_name, 'doctype':doctype, 'getdoctype':1, 'user':user}, callback);
	} else {
		// get doctype only
		$c('webnotes.widgets.form.getdoctype', args={'doctype':doctype}, callback);
	}
}