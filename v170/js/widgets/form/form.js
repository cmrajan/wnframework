
// Open the Form in a Dialog
_f.frm_dialog = null;
_f.edit_record = function(dt, dn) {
	var d = _f.frm_dialog;
	if(!d) {
		d = new Dialog(640, 400, 'Edit Row');
		d.body_wrapper = $a(frm_dialog.body, 'div', 'dialog_frm');
		d.done_btn = $a($a(frm_dialog.body, 'div', '', {margin:'8px'}),'button');
		d.done_btn.innerHTML = 'Done'; frm_dialog.done_btn.onclick = function() { frm_dialog.hide() }
		d.onhide = function() {
			if(cur_grid)
				cur_grid.refresh_row(cur_grid_ridx, frm_dialog.dn);
		}
		_f.frm_dialog = d;
	}
	
	if(!frms[dt]) {
		var f = new _f.Frm(dt, d.body_wrapper);
		f.parent_doctype = cur_frm.doctype;
		f.parent_docname = cur_frm.docname;
		f.in_dialog = true;
		f.meta.section_style='Simple';
	}
	
	if(d.cur_frm) { d.cur_frm.hide(); }
		
	var frm = frms[dt];
	frm.show(dn);

	d.cur_frm = frm;
	d.dn = dn;
	d.set_title("Editing Row #" + (cur_grid_ridx+1));
	d.show();
}

_f.Frm = function(doctype, parent) {
	this.docname = '';
	this.doctype = doctype;
	this.display = 0;
	this.in_dialog = false;
	var me = this;
	this.is_editable = {};
	this.opendocs = {};
	this.cur_section = {};
	this.sections = [];
	this.grids = [];
	this.cscript = {};
	this.parent = parent;
	if(!parent)this.parent = _f.frm_con.body; // temp
	this.attachments = {};
	
	// comments
	this.last_comments = {};
	this.n_comments = {};

	frms[doctype] = this;

	this.setup_meta(doctype);
	
	// notify on rename
	rename_observers.push(this);	
}

// ======================================================================================

_f.Frm.prototype.rename_notify = function(dt, old, name) {
	if(this.doctype != dt) return;
	
	// sections
	this.cur_section[name] = this.cur_section[old];
	delete this.cur_section[old];

	// editable
	this.is_editable[name] = this.is_editable[old];
	delete this.is_editable[old];

	// attach
	if(this.attachments[old]) {
		this.attachments[name] = this.attachments[old];
		this.attachments[name] = null;
		for(var i in this.attachments[name]){ // rename each attachment
			this.attachments[name][i].docname = name;
		}
	}

	// from form
	if(this.docname == old)
		this.docname = name;	

	// cleanup

	if(this && this.opendocs[doc.localname]) {
		// local doctype copy
		local_dt[doc.doctype][doc.name] = local_dt[doc.doctype][doc.localname];
		local_dt[doc.doctype][doc.localname] = null;
	}
	
	this.opendocs[old] = false;
	this.opendocs[name] = true;
}

_f.Frm.prototype.onhide = function() { if(_f.cur_grid_cell) _f.cur_grid_cell.grid.cell_deselect(); }

// ======================================================================================

_f.Frm.prototype.setup_print = function() { 
	var fl = getchildren('DocFormat', this.meta.name, 'formats', 'DocType');
	var l = [];	
	for(var i=0;i<fl.length;i++) l.push(fl[i].format);
	l.push('Standard');
	this.print_sel = new SelectWidget(null,l);
	this.print_sel.inp.value = 'Standard';
}

_f.Frm.prototype.print_doc = function() {
	if(this.doc.docstatus==2)  {
		msgprint("Cannot Print Cancelled Documents.");
		return;
	}

	if(this.print_sel.options.length>1) {
		_p.show_dialog(); // multiple options
	} else {
		_p.build('Standard', _p.go);
	}
}

// ======================================================================================

_f.Frm.prototype.email_doc = function() {
	// make selector
	sel = this.print_sel;
	var c = $td(_e.dialog.rows['Format'].tab,0,1);
	
	if(c.cur_sel)c.removeChild(c.cur_sel);
	c.appendChild(this.print_sel.wrapper);
	c.cur_sel = this.print_sel.wrapper;

	_e.dialog.widgets['Subject'].value = this.meta.name + ': ' + this.docname;
	_e.dialog.show();
}

// ======================================================================================

_f.Frm.prototype.set_heading = function() {

	// main title
	var prnname = this.docname;
	if(this.meta.issingle)prnname = this.doctype;
	
	if(_f.frm_con.main_title.innerHTML != prnname)	
		_f.frm_con.main_title.innerHTML = prnname;
	
	// sub title
	var dt = this.doctype;
	if(this.meta.issingle)dt = '';
	if(_f.frm_con.sub_title.innerHTML != dt)
		_f.frm_con.sub_title.innerHTML = dt;

	// status
	var doc = locals[this.doctype][this.docname];
	var tn = $i('rec_'+this.doctype+'-'+this.docname);
	//var tn = null;
	var set_st = function(col) { if(tn)$bg(tn,col); }

	var st = "";
	if(doc.__islocal) {
		st = "<span style='color:#f81'>Unsaved Draft</span>";
		set_st('#f81');
	} else if(doc.__unsaved) {
		st = "<span style='color:#f81'>Not Saved</span>";		
		set_st('#f81');
	} else if(cint(doc.docstatus)==0) {
		st = "<span style='color:#0a1'>Saved</span>";
		set_st('#0A1');
	} else if(cint(doc.docstatus)==1) {
		st = "<span style='color:#44f'>Submitted</span>";
		set_st('#44F');
	} else if(cint(doc.docstatus)==2) {
		st = "<span style='color:#f44'>Cancelled</span>";
		set_st('#F44');
	}
	
		
	var tm = '';
	if(is_testing && this.meta.setup_test)
		var tm = '<span style="margin-left: 4px; padding: 4px; color: #FFF; background-color: #F88;">Test Record</span>';
	
	_f.frm_con.status_title.innerHTML = st.bold()+tm;

	// created & modified
	var scrub_date = function(d) {
		if(d)t=d.split(' ');else return '';
		return dateutil.str_to_user(t[0]) + ' ' + t[1];
	}
	
	// tweets
	_f.frm_con.comments_btn.innerHTML = 'Comments (' + cint(this.n_comments[this.docname]) + ')';
	
	// lst comment
	this.set_last_comment();
	
	var created_str = repl("Created: %(c_by)s %(c_on)s %(m_by)s %(m_on)s", 
		{c_by:doc.owner
		,c_on:scrub_date(doc.creation ? doc.creation:'')
		,m_by:doc.modified_by?('/ Modified: '+doc.modified_by):''
		,m_on:doc.modified ? ('on '+scrub_date(doc.modified)) : ''} );
	
	// images
	set_user_img(_f.frm_con.owner_img, doc.owner);
	_f.frm_con.owner_img.title = created_str;

	_f.frm_con.last_update_area.innerHTML = '';
	$dh(_f.frm_con.mod_img);
	if(doc.modified_by) {
		_f.frm_con.last_update_area.innerHTML = scrub_date(doc.modified ? doc.modified:'') + ' <span class="link_type" style="margin-left: 8px; font-size: 10px;" onclick="msgprint(\''+created_str.replace('/','<br>')+'\')">Details</span>';
		if(doc.owner != doc.modified_by) {
			$di(_f.frm_con.mod_img);
			set_user_img(_f.frm_con.mod_img, doc.modified_by);
			_f.frm_con.mod_img.title = created_str;
		}
	} 
	
	if(this.heading){
		if(this.meta.hide_heading) $dh(_f.frm_con.head_div);
		else $ds(_f.frm_con.head_div);
	}
}

_f.Frm.prototype.set_last_comment = function() {
	var lc = this.last_comments[this.docname]

	// last comment
	if(lc && lc[2]) { 
		_f.frm_con.last_comment.comment.innerHTML = 'Last Comment: <b>'+lc[2]+'</b><div id="comment" style="font-size:11px">By '+lc[1]+' on '+dateutil.str_to_user(lc[0])+'</div>'; 
		$ds(_f.frm_con.last_comment); 
		
		// image
		set_user_img(_f.frm_con.last_comment.img, lc[1]);
	} else { 
		$dh(_f.frm_con.last_comment); 
	}
}


// PAGING
// ======================================================================================

_f.Frm.prototype.set_section = function(sec_id) {
	this.sections[this.cur_section[this.docname]].hide();
	this.sections[sec_id].show();
	this.cur_section[this.docname] = sec_id;
}

// TABBED
// ======================================================================================

_f.Frm.prototype.setup_tabs = function() {
	var me = this;
	$ds(this.tab_wrapper);
	$y(this.tab_wrapper, {marginTop:'8px'});
	this.tabs = new TabbedPage(this.tab_wrapper, 1);
}

// TIPS
// ======================================================================================

_f.Frm.prototype.setup_tips = function() {
	var me = this;
	this.tip_box = $a(this.tip_wrapper, 'div', 'frm_tip_box');

	var tab = $a(this.tip_box, 'table');
	var r = tab.insertRow(0);
	var c0 = r.insertCell(0);
	this.c1 = r.insertCell(1);
	
	this.img = $a(c0, 'img');
	this.img.setAttribute('src','images/icons/lightbulb.gif');
	c0.style.width = '24px';
	
	this.set_tip = function(t, icon) {
		me.c1.innerHTML = t; $ds(me.tip_box);
		if(icon) this.img.setAttribute('src','images/icons/'+icon);
	}
	this.append_tip = function(t) {
		if(me.c1.innerHTML) me.c1.innerHTML += '<br><br>';
		me.c1.innerHTML += t;  $ds(me.tip_box);
	}
	this.clear_tip = function() { me.c1.innerHTML = ''; $dh(me.tip_box); }
	$dh(this.tip_box);
}

// SETUP
// ======================================================================================


_f.Frm.prototype.setup_meta = function() {
	this.meta = get_local('DocType',this.doctype);
	this.perm = get_perm(this.doctype); // for create
	this.setup_print();
}

_f.Frm.prototype.setup_std_layout = function() {
	if(this.in_dialog) $w(this.wrapper, '500px');
	//else $w(this.wrapper, pagewidth + 'px');
	
	// headings
	this.header = $a(this.wrapper, 'div', 'frm_header');
	this.heading = $a(this.header, 'div', 'frm_heading');
	this.tab_wrapper = $a(this.header, 'div'); $dh(this.tab_wrapper);

	if(this.meta.section_style=='Tray') {
		var t = $a(this.wrapper,'table','',{tableLayout:'fixed',width:'100%',borderCollapse:'collapse'});
		var r = t.insertRow(0); var c = r.insertCell(0);
		c.className='frm_tray_area';
		this.tray_area = c;
		this.body = $a(r.insertCell(1), 'div', 'frm_body');
	} else {
		this.body = $a(this.wrapper, 'div', 'frm_body');
	}
	
	this.tip_wrapper = $a(this.body, 'div');

	// layout
	if(this.in_dialog) 	this.meta.hide_heading = 1;
	this.layout = new Layout(this.body, '100%');
	
	// setup tips area
	this.setup_tips();
	
	// setup tabbed sections
	if(this.meta.section_style=='Tabbed') 
		this.setup_tabs();
	//else 
		//this.wrapper.style.borderTop = '3px solid #CCC';
	
	// bg colour
	if(this.meta.colour) this.layout.wrapper.style.background = '#'+this.meta.colour.split(':')[1];
	
	// create fields
	this.setup_fields_std();
}

_f.Frm.prototype.setup_fields_std = function() {
	var fl = fields_list[this.doctype]; 

	if(fl[0]&&fl[0].fieldtype!="Section Break") {
		this.layout.addrow(); // default section break
		if(fl[0].fieldtype!="Column Break") // without column too
			this.layout.addcell();
	}

	var sec;
	for(var i=0;i<fl.length;i++) {
		var f=fl[i];
		
		var fn = f.fieldname?f.fieldname:f.label;
		var fld = make_field(f, this.doctype, this.layout.cur_cell, this);
		this.fields[this.fields.length] = fld;
		this.fields_dict[fn] = fld;

		// Add to section break for check mandatory
		if(sec)sec.fields[sec.fields.length] = fld;
		
		if(f.fieldtype=='Section Break')
			sec = fld;
		
		// default col-break after sec-break
		if((f.fieldtype=='Section Break')&&(fl[i+1])&&(fl[i+1].fieldtype!='Column Break')) {
			this.layout.addcell();
		}
	} 
}

_f.Frm.prototype.setup_template_layout = function() {
	this.body = $a(this.wrapper, 'div');
	this.body.innerHTML = this.meta.dt_template;
	var dt = this.doctype.replace(/ /g, '');

	// no heading
	this.meta.hide_heading = 1;
	
	// fields
	var fl = fields_list[this.doctype];

	for(var i=0;i<fl.length;i++) {
		var f=fl[i];
		
		var fn = f.fieldname?f.fieldname:f.label;		
		var field_area = $i('frm_'+dt+'_'+fn);

		if(field_area) {
			var fld = make_field(f, this.doctype, field_area, this, 0, 1);			
			this.fields[this.fields.length] = fld;
			this.fields_dict[fn] = fld;
		}
	}
}

_f.Frm.prototype.setup_client_script = function() {
	// setup client obj
	if(this.meta.client_script_core || this.meta.client_script || this.meta.__client_script) {
		this.runclientscript('setup', this.doctype, this.docname);
	}
	this.script_setup = 1;
}

_f.Frm.prototype.setup = function() {

	var me = this;
	this.fields = [];
	this.fields_dict = {};

	if(this.in_dialog) this.wrapper = $a(this.parent, 'div');
	else this.wrapper = $a(this.parent, 'div', 'frm_wrapper');
	
	if(this.meta.use_template) {
		// template layout
		this.setup_template_layout();
	} else {
		// standard layout
		this.setup_std_layout();	
	}

	// setup attachments
	if(this.meta.allow_attach)
		this.setup_attach();

	this.setup_done = true;	
}

// ======================================================================================

_f.Frm.prototype.hide = function() {
	$dh(this.wrapper);
	this.display = 0;
	hide_autosuggest();
}

_f.Frm.prototype.show = function(docname, from_refresh) {
	if(!this.in_dialog && cur_frm && cur_frm != this) {
		this.defocus_rest();
		cur_frm.hide();
	}
	if(docname)this.docname = docname;
	$ds(this.wrapper);
	this.display = 1;
	if(!this.in_dialog) cur_frm = this;
	if(!from_refresh) this.refresh();
}

_f.Frm.prototype.defocus_rest = function() {
	// deselect others
	mclose();
	if(_f.cur_grid_cell) _f.cur_grid_cell.grid.cell_deselect();
	cur_page = null;
}

// -------- Permissions -------
// Returns global permissions, at all levels
// ======================================================================================

_f.Frm.prototype.get_doc_perms = function() {
	var p = [0,0,0,0,0,0];
	for(var i=0; i<this.perm.length; i++) {
		if(this.perm[i]) {
			if(this.perm[i][READ]) p[READ] = 1;
			if(this.perm[i][WRITE]) p[WRITE] = 1;
			if(this.perm[i][SUBMIT]) p[SUBMIT] = 1;
			if(this.perm[i][CANCEL]) p[CANCEL] = 1;
			if(this.perm[i][AMEND]) p[AMEND] = 1;
		}
	}
	return p;
}

// refresh
// ======================================================================================

_f.Frm.prototype.refresh = function(no_script) {
	if(this.docname) { // document to show

		// get perm
		var dt = this.parent_doctype?this.parent_doctype : this.doctype;
		var dn = this.parent_docname?this.parent_docname : this.docname;
		this.perm = get_perm(dt, dn);
				  
		// do setup
		if(!this.setup_done) this.setup();

		// client script must be called after "setup" - there is no fields_dict attached to the frm otherwise
		if(!this.script_setup)
			this.setup_client_script();

		this.runclientscript('set_perm',dt,dn);

	  	if(!this.perm[0][READ]) { msgprint('No Read Permission'); nav_obj.show_last_open(); return; }
	
		// set doc
		this.doc = get_local(this.doctype, this.docname);	  
		  
		if(!this.opendocs[this.docname]) {
			this.setnewdoc(this.docname);
		}

		// editable
		if(this.doc.__islocal) this.is_editable[this.docname] = 1; // new is editable
		this.editable = this.is_editable[this.docname];
		
		if(!this.in_dialog) {
 			// Client Script
			set_title(this.meta.issingle ? this.doctype : this.docname);

 			if(!no_script) this.runclientscript('refresh');
			page_body.change_to('Forms');

			// show / hide buttons
			_f.frm_con.refresh_toolbar();

			// add to recent
			if(page_body.wntoolbar) page_body.wntoolbar.rdocs.add(this.doctype, this.docname, 1);
			this.set_heading();
		}

		this.refresh_tabs();
		this.refresh_fields();
		this.refresh_dependency();

		if(this.layout) this.layout.show();

		if(this.meta.allow_attach) this.refresh_attachments();
		
		// in the end, show
		if(!this.display) this.show(this.docname, 1);
		
	} 
	//set_frame_dims();
}

_f.Frm.prototype.refresh_tabs = function() {
	var me = this;
	if(me.meta.section_style=='Tray'||me.meta.section_style=='Tabbed') {
		for(var i in me.sections) {
			me.sections[i].hide();
		}
		
		me.set_section(me.cur_section[me.docname]);
	}
}

_f.Frm.prototype.refresh_fields = function() {
	var me = this;
	// set fields
	for(fkey in me.fields) {
		var f = me.fields[fkey];
		f.perm = me.perm;
		f.docname = me.docname;
		if(f.refresh)f.refresh();
	}

	// cleanup activities after refresh
	me.cleanup_refresh(me);
}

_f.Frm.prototype.cleanup_refresh = function() {
	var me = this;
	if(me.fields_dict['amended_from']) {
		if (me.doc.amended_from) {
			unhide_field('amended_from'); unhide_field('amendment_date');
		} else {
			hide_field('amended_from'); hide_field('amendment_date');
		}
	}
	if(me.meta.autoname && me.meta.autoname.substr(0,6)=='field:' && !me.doc.__islocal) {
		var fn = me.meta.autoname.substr(6);
		set_field_permlevel(fn,1); // make it readonly / hidden
	}
}

_f.Frm.prototype.refresh_dependency = function() {
	var me = this;

	// build dependants' dictionary	
	var dep_dict = {};
	var has_dep = false;
	
	for(fkey in me.fields) { 
		var f = me.fields[fkey];
		f.dependencies_clear = true;
		var guardian = f.df.depends_on;
		if(guardian) {
			if(!dep_dict[guardian])
				dep_dict[guardian] = [];
			dep_dict[guardian][dep_dict[guardian].length] = f;
			has_dep = true;
		}
	}
	if(!has_dep)return;
	
	var d = locals[me.doctype][me.docname];
	function all_dependants_clear(f) {
		if(d[f.df.fieldname])return false;
		var l = dep_dict[f.df.fieldname];
		if(l) {
			for(var i=0;i<l.length;i++) {
				if(!l[i].dependencies_clear) { // dependant not clear
					return false;
				}
				var v = d[l[i].df.fieldname];
				if(v || (v==0 && !v.substr)) { // dependant has a value
					return false;
				}
			}
		}
		return true;
	}

	for(var i=me.fields.length-1;i>=0;i--) { 
		var f = me.fields[i];
		f.guardian_has_value = true;
		if(f.df.depends_on) {
			var v = d[f.df.depends_on];
			if(f.df.depends_on.substr(0,3)=='fn:') {
				f.guardian_has_value = cur_frm.runclientscript(f.df.depends_on.substr(3), cur_frm.doctype, cur_frm.docname);
			} else {	
				if(v || (v==0 && !v.substr)) { 
					// guardian has value
				} else { 
					f.guardian_has_value = false;
				}
			}
		}
		f.dependencies_clear = all_dependants_clear(f);	
		//if(f.guardian_has_value || (!f.dependencies_clear)) {
		if(f.guardian_has_value) {
			if(f.grid)f.grid.show(); else $ds(f.wrapper);		
		} else {
			if(f.grid)f.grid.hide(); else $dh(f.wrapper);		
		}
		
		// show red to indicate dependency missing
		if(!f.guardian_has_value && !f.dependencies_clear) {
			if(f.input)f.input.style.color = "RED";
		} else {
			if(f.input)f.input.style.color = "BLACK";		
		}
	}
}

// setnewdoc is called when a record is loaded for the first time
// ======================================================================================

_f.Frm.prototype.setnewdoc = function(docname) {

	// if loaded
	if(this.opendocs[docname]) { // already exists
		this.docname=docname;
		return;
	}

	//if(!this.meta)
	//	this.setup_meta();

	// make a copy of the doctype for client script settings
	// each record will have its own client script
	Meta.make_local_dt(this.doctype,docname);

	this.docname = docname;
	var me = this;
	
	var viewname = docname;
	if(this.meta.issingle)
		viewname = this.doctype;

	var iconsrc = 'page.gif';
	if(this.meta.smallicon) 
		iconsrc = this.meta.smallicon;

	// Client Script
	this.runclientscript('onload', this.doctype, this.docname);
	
	this.is_editable[docname] = 1;
	if(this.meta.read_only_onload)
		this.is_editable[docname] = 0;
		
	// Section Type
	if(this.meta.section_style=='Tray'||this.meta.section_style=='Tabbed') {
		this.cur_section[docname] = 0;
	}

	if(this.meta.allow_attach)
		this.set_attachments();

	this.opendocs[docname] = true;
}

_f.Frm.prototype.edit_doc = function() {
	// set fields
	this.is_editable[cur_frm.docname] = true;
	this.refresh();
}


_f.Frm.prototype.show_doc = function(dn) {
	this.show(dn);
}

// ======================================================================================

_f.Frm.prototype.save = function(save_action, call_back) {
	//alert(save_action);
	if(!save_action) save_action = 'Save';
	var me = this;
	if(this.savingflag) {
		msgprint("Document is currently saving....");
		return; // already saving (do not double save)
	}

	if(save_action=='Submit') {
		locals[this.doctype][this.docname].submitted_on = dateutil.full_str();
		locals[this.doctype][this.docname].submitted_by = user;
	}
	if(save_action=='Cancel') {
		var reason = prompt('Reason for cancellation (mandatory)', '');
		if(!strip(reason)) {
			msgprint('Reason is mandatory, not cancelled');
			return;
		}
		locals[this.doctype][this.docname].cancel_reason = reason;
		locals[this.doctype][this.docname].cancelled_on = dateutil.full_str();
		locals[this.doctype][this.docname].cancelled_by = user;
	} else { // no validation for cancellation
		validated = true;
		validation_message = '';
		this.runclientscript('validate', cur_frm.doctype, cur_frm.docname);
	
		if(!validated) {
			if(validation_message)
				msgprint('Validation Error: ' + validation_message);
			this.savingflag = false;
			return 'Error';
		}
	}
	
	var ret_fn = function(r) {
		cur_frm.refresh();
		if(call_back){
			if(call_back == 'home'){ loadpage('_home'); return; }
			call_back();
		}
	}

	var me = this;
	var ret_fn_err = function() {
		var doc = locals[me.doctype][me.docname];
		me.savingflag = false;	
		ret_fn();
	}
	
	this.savingflag = true;
	if(this.docname && validated) {
		return savedoc(this.doctype, this.docname, save_action, ret_fn, ret_fn_err);
	}
}

// ======================================================================================

_f.Frm.prototype.runscript = function(scriptname, callingfield, onrefresh) {
	var me = this;
	if(this.docname) {
		// make doc list
		var doclist = compress_doclist(make_doclist(this.doctype, this.docname));
		// send to run
		if(callingfield)callingfield.input.disabled = true;
		$c('runserverobj', {'docs':doclist, 'method':scriptname }, 
			function(r, rtxt) { 
				if(onrefresh)onrefresh(r,rtxt);
				me.show();
				if(callingfield)callingfield.input.disabled = false;
				//if(r.message)alert(r.message);
			}
		);
	}
}

// ======================================================================================

_f.Frm.prototype.runclientscript = function(caller, cdt, cdn) {
	var _dt = this.parent_doctype ? this.parent_doctype : this.doctype;
	var _dn = this.parent_docname ? this.parent_docname : this.docname;
	var doc = get_local(_dt, _dn);

	if(!cdt)cdt = this.doctype;
	if(!cdn)cdn = this.docname;

	var ret = null;
	try {
		if(this.cscript[caller])
			ret = this.cscript[caller](doc, cdt, cdn);
		// for product
		if(this.cscript['custom_'+caller])
			ret += this.cscript['custom_'+caller](doc, cdt, cdn);
	} catch(e) {
		submit_error(e);
	}

	if(caller && caller.toLowerCase()=='setup') {
		var doctype = get_local('DocType', this.doctype);
		var cs = doctype.__client_script ? doctype.__client_script : (doctype.client_script_core + doctype.client_script);
		if(cs) {
			try {
				var tmp = eval(cs);
			} catch(e) {
				submit_error(e);
			}
		}
		
		// ---Client String----
		if(doctype.client_string) { // split client string
			cur_frm.cstring = {};
			var elist = doctype.client_string.split('---');
			for(var i=1;i<elist.length;i=i+2) {
				cur_frm.cstring[strip(elist[i])] = elist[i+1];
			}
		}
	}
	return ret;
}


// ======================================================================================

_f.Frm.prototype.copy_doc = function(onload, from_amend) {
	
	if(!this.perm[0][CREATE]) {
		msgprint('You are not allowed to create '+this.meta.name);
		return;
	}
	
	var dn = this.docname;
	// copy parent
	var newdoc = LocalDB.copy(this.doctype, dn, from_amend);

	// do not copy attachments
	if(this.meta.allow_attach && newdoc.file_list)
		newdoc.file_list = null;
	
	// copy chidren
	var dl = make_doclist(this.doctype, dn);

	// table fields dict - for no_copy check
	var tf_dict = {};

	for(var d in dl) {
		d1 = dl[d];
		
		// get tabel field
		if(!tf_dict[d1.parentfield]) {
			tf_dict[d1.parentfield] = get_field(d1.parenttype, d1.parentfield);
		}
		
		if(d1.parent==dn && cint(tf_dict[d1.parentfield].no_copy)!=1) {
			var ch = LocalDB.copy(d1.doctype, d1.name, from_amend);
			ch.parent = newdoc.name;
			ch.docstatus = 0;
			ch.owner = user;
			ch.creation = '';
			ch.modified_by = user;
			ch.modified = '';
		}
	}

	newdoc.__islocal = 1;
	newdoc.docstatus = 0;
	newdoc.owner = user;
	newdoc.creation = '';
	newdoc.modified_by = user;
	newdoc.modified = '';

	if(onload)onload(newdoc);

	loaddoc(newdoc.doctype, newdoc.name);
}

// ======================================================================================

_f.Frm.prototype.reload_doc = function() {
	var me = this;
	if(frms['DocType'] && frms['DocType'].opendocs[me.doctype]) {
		msgprint("error:Cannot refresh an instance of \"" + me.doctype+ "\" when the DocType is open.");
		return;
	}

	var ret_fn = function(r, rtxt) {
		// n tweets and last comment
		if(r.n_comments) this.n_comments[me] = r.n_comments;
		if(r.last_comment) this.last_comments[me] = r.last_comment;
		
		me.runclientscript('setup', me.doctype, me.docname);
		me.refresh();
	}

	if(me.doc.__islocal) { 
		// reload only doctype
		$c('webnotes.widgets.form.getdoctype', {'doctype':me.doctype }, ret_fn, null, null, 'Refreshing ' + me.doctype + '...');
	} else {
		// delete all unsaved rows
		var gl = me.grids;
		for(var i = 0; i < gl.length; i++) {
			var dt = gl[i].df.options;
			for(var dn in locals[dt]) {
				if(locals[dt][dn].__islocal && locals[dt][dn].parent == me.docname) {
					var d = locals[dt][dn];
					d.parent = '';
					d.docstatus = 2;
					d.__deleted = 1;
				}
			}
		}
		// reload doc and docytpe
		$c('webnotes.widgets.form.getdoc', {'name':me.docname, 'doctype':me.doctype, 'getdoctype':1, 'user':user}, ret_fn, null, null, 'Refreshing ' + me.docname + '...');
	}
}

// ======================================================================================

_f.Frm.prototype.check_required = function(dt, dn) {
	var doc = locals[dt][dn];
	if(doc.docstatus>1)return true;
	var fl = fields_list[dt];
	
	if(!fl)return true; // no doctype loaded
	
	var all_clear = true;
	var errfld = [];
	for(var i=0;i<fl.length;i++) {
		var key = fl[i].fieldname;
		var v = doc[key];
		
		if(fl[i].reqd && is_null(v)) {
			errfld[errfld.length] = fl[i].label;
			if(all_clear)all_clear = false;
		}
	}
	if(errfld.length)msgprint('<b>Following fields are required:</b>\n' + errfld.join('\n'));
	return all_clear;
}

_f.Frm.prototype.savedoc = function(dt, dn, save_action, onsave, onerr) {
	var doc = locals[dt][dn];
	var doctype = locals['DocType'][dt];
	
	var tmplist = [];
	
	// make doc list
	var doclist = make_doclist(dt, dn, 1);
	var all_clear = true;
	
	if(save_action!='Cancel') {
		for(var n in doclist) {
			// type / mandatory checking
			var tmp = check_required(doclist[n].doctype, doclist[n].name);
			if(doclist[n].docstatus+''!='2'&&all_clear) // if not deleted
				all_clear = tmp;
		}
	}
		
	var f = frms[dt];
	if(!all_clear) { // has errors
		if(f)f.savingflag = false;
		return 'Error';
	}
	
	var _save = function() {
		var out = compress_doclist(doclist);
		//if(user=='Administrator')errprint(out);
		
		$c('savedocs', {'docs':out, 'docname':dn, 'action': save_action, 'user':user }, 
			function(r, rtxt) {
				if(f){ f.savingflag = false;}
				if(r.saved) {
					if(onsave)onsave(r);
				} else {
					if(onerr)onerr(r);
				}
			}, function() {
				if(f){ f.savingflag = false; } /*time out*/ 
			},0,(f ? 'Saving...' : '')
		);
	}

	// ask for name
	if(doc.__islocal && (doctype && doctype.autoname && doctype.autoname.toLowerCase()=='prompt')) {
		var newname = prompt('Enter the name of the new '+ dt, '');
		if(newname) { 
				doc.__newname = strip(newname); _save();
		} else {
			msgprint('Not Saved'); onerr();
		}
	} else {
		_save();
	}
}

_f.Frm.prototype.savesubmit = function() {
	var answer = confirm("Permanently Submit "+cur_frm.docname+"?");
	if(answer) this.save_doc('Submit');
}

_f.Frm.prototype.savecancel = function() {
	var answer = confirm("Permanently Cancel "+cur_frm.docname+"?");
	if(answer) this.save_doc('Cancel');
}

// ======================================================================================

_f.Frm.prototype.amend_doc = function() {
	if(!this.fields_dict['amended_from']) {
		alert('"amended_from" field must be present to do an amendment.');
		return;
	}
    var fn = function(newdoc) {
      newdoc.amended_from = this.docname;
      if(this.fields_dict['amendment_date'])
	      newdoc.amendment_date = dateutil.obj_to_str(new Date());
    }
    this.copy_doc(fn, 1);
}

// ======================================================================================

_f.get_value = function(dt, dn, fn) {
	if(locals[dt] && locals[dt][dn]) 
		return locals[dt][dn][fn];	
}

_f.set_value = function(dt, dn, fn, v) {
	var d = locals[dt][dn];

	if(!d) 
		show_alert('Trying to set a value for "'+dt+','+dn+'" which is not found');
	if(d[fn] != v) {
		d[fn] = v;
		d.__unsaved = 1;
		var frm = frms[d.doctype];
		try {
			if(d.parent && d.parenttype) {
				locals[d.parenttype][d.parent].__unsaved = 1;
				frm = frms[d.parenttype];
			}
		} catch(e) {
			if(d.parent && d.parenttype)
			errprint('Setting __unsaved error:'+d.name+','+d.parent+','+d.parenttype);
		}
		if(frm && frm==cur_frm) {
			frm.set_heading();
		}
	}
}
