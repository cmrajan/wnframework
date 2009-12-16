function print_doc() {
	frm_con.tbarlinks.selectedIndex = 0;

	if(cur_frm.doc.docstatus==2)  {
		msgprint("Cannot Print Cancelled Documents.");
		return;
	}
	if(cint(cur_frm.doc.docstatus)==0 && cur_frm.perm[0][SUBMIT])  {
	
	}

	if(cur_frm.print_sel.options.length>1) {
		print_doc_dialog.show(); // multiple options
	} else {
		print_format('Standard', print_go);
	}
}

function makeformatselector(frm) {
	fl = getchildren('DocFormat', frm.meta.name, 'formats', 'DocType');
	frm.print_sel = document.createElement('select');
	//frm.print_sel.options[0] = new Option('-- Print Options --', '', false, false);
	frm.print_sel.options[0] = new Option('Standard', 'Standard', false, false);
	for(var i=0;i<fl.length;i++) {
		frm.print_sel.options[frm.print_sel.options.length] 
			= new Option(fl[i].format, fl[i].format, false, false);
	}
	frm.print_sel.selectedIndex==0;
}

var print_doc_dialog;
function makeprintdialog() {
	var d = new Dialog(360, 140, "Print Formats");
	$dh(d.wrapper);
	d.make_body(
		[['HTML','Select']
		,['Button','Go', execute_print]]);
	
	print_doc_dialog = d;
	d.onshow = function() {
		var c = d.widgets['Select'];
		if(c.cur_sel)c.removeChild(c.cur_sel);
		c.appendChild(cur_frm.print_sel);
		c.cur_sel = cur_frm.print_sel;	
	}
}

function execute_print() {
	print_format(sel_val(cur_frm.print_sel), print_go);
}

var email_dialog;

function sendmail(emailto, emailfrom, cc, subject, message, fmt, with_attachments) {
	var fn = function(html) {
		$c('sendmail', {
			'sendto':emailto, 
			'sendfrom': emailfrom?emailfrom:'',
			'cc':cc?cc:'',
			'subject':subject,
			'message':message,
			'body':html,
			'with_attachments':with_attachments ? 1 : 0,
			'dt':cur_frm.doctype,
			'dn':cur_frm.docname
			}, 
			function(r, rtxt) { 
				//
			}
		);
	}
	print_format(fmt, fn);
}


function is_doc_loaded(dt, dn) {
	var exists = false;
	//if(dt=='DocType' && !inList(loaded_doctypes, dn)) alert(dn + ' not in list');
	if(locals[dt] && locals[dt][dn]) exists = true;
	if(exists && dt=='DocType' // if it is a doctype
		&& !locals[dt][dn].__islocal // and not copied
			&& !inList(loaded_doctypes, dn)) // and not loaded
				 exists = false; // reload
	return exists;
}



var dialog_record;
function edit_record(dt, dn) {
	if(!dialog_record) {
		dialog_record = new Dialog(640, 400, 'Edit Row');
		dialog_record.body_wrapper = $a(dialog_record.body, 'div', 'dialog_frm');
		dialog_record.done_btn = $a($a(dialog_record.body, 'div', '', {margin:'8px'}),'button');
		dialog_record.done_btn.innerHTML = 'Done'; dialog_record.done_btn.onclick = function() { dialog_record.hide() }
		dialog_record.onhide = function() {
			if(cur_grid)
				cur_grid.refresh_row(cur_grid_ridx, dialog_record.dn);
		}
	}
	
	if(!frms[dt]) {
		var f = new Frm(dt, dialog_record.body_wrapper);
		f.parent_doctype = cur_frm.doctype;
		f.parent_docname = cur_frm.docname;
		//alert(get_perm(f.parent_doctype,f.parent_docname));
		f.in_dialog = true;
		f.meta.section_style='Simple';
	}
	
	if(dialog_record.cur_frm) { dialog_record.cur_frm.hide(); }
		
	var frm = frms[dt];
	frm.show(dn);

	dialog_record.cur_frm = frm;
	dialog_record.dn = dn;
	dialog_record.set_title("Editing Row #" + (cur_grid_ridx+1));
	dialog_record.show();
}

function Frm(doctype, parent) {
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
	if(!parent)this.parent = frm_con.body; // temp
	this.attachments = {};
	frms[doctype] = this;

	this.setup_meta(doctype);
	
	// notify on rename
	rename_observers.push(this);	
}

Frm.prototype.rename_notify = function(dt, old, name) {
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

Frm.prototype.onhide = function() { if(grid_selected_cell) grid_selected_cell.grid.cell_deselect(); }
Frm.prototype.onshow = function() { }
Frm.prototype.makeprint = function() { makeformatselector(this); }
Frm.prototype.set_heading = function() {

	// main title
	var prnname = this.docname;
	if(this.meta.issingle)prnname = this.doctype;
	
	if(frm_con.main_title.innerHTML != prnname)	
		frm_con.main_title.innerHTML = prnname;
	
	// sub title
	var dt = this.doctype;
	if(this.meta.issingle)dt = '';
	if(frm_con.sub_title.innerHTML != dt)
		frm_con.sub_title.innerHTML = dt;

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
	
	frm_con.status_title.innerHTML = st.bold()+tm;

	// created & modified
	var scrub_date = function(d) {
		if(d)t=d.split(' ');else return '';
		return dateutil.str_to_user(t[0]) + ' ' + t[1];
	}
	
	var t = doc.doctype+'/'+doc.name;
	// tweets
	frm_con.comments_btn.innerHTML = 'Comments (' + cint(n_tweets[t]) + ')';
	
	// lst comment
	this.set_last_comment();
	
	var created_str = repl("Created: %(c_by)s %(c_on)s %(m_by)s %(m_on)s", 
		{c_by:doc.owner
		,c_on:scrub_date(doc.creation ? doc.creation:'')
		,m_by:doc.modified_by?('/ Modified: '+doc.modified_by):''
		,m_on:doc.modified ? ('on '+scrub_date(doc.modified)) : ''} );
	
	// images
	set_user_img(frm_con.owner_img, doc.owner);
	frm_con.owner_img.title = created_str;

	frm_con.last_update_area.innerHTML = '';
	$dh(frm_con.mod_img);
	if(doc.modified_by) {
		frm_con.last_update_area.innerHTML = scrub_date(doc.modified ? doc.modified:'') + ' <span class="link_type" style="margin-left: 8px; font-size: 10px;" onclick="msgprint(\''+created_str.replace('/','<br>')+'\')">Details</span>';
		if(doc.owner != doc.modified_by) {
			$di(frm_con.mod_img);
			set_user_img(frm_con.mod_img, doc.modified_by);
			frm_con.mod_img.title = created_str;
		}
	} 
	
	if(this.heading){
		if(this.meta.hide_heading) $dh(frm_con.head_div);
		else $ds(frm_con.head_div);
	}
}

Frm.prototype.set_last_comment = function() {
	var t = this.doc.doctype+'/'+this.doc.name;
	var lc = last_comments[t]

	// last comment
	if(lc && lc[2]) { 
		frm_con.last_comment.comment.innerHTML = 'Last Comment: <b>'+lc[2]+'</b><div id="comment" style="font-size:11px">By '+lc[1]+' on '+dateutil.str_to_user(lc[0])+'</div>'; 
		$ds(frm_con.last_comment); 
		
		// image
		set_user_img(frm_con.last_comment.img, lc[1]);
	} else { 
		$dh(frm_con.last_comment); 
	}
}

Frm.prototype.setup_meta = function() {
	this.meta = get_local('DocType',this.doctype);
	this.perm = get_perm(this.doctype); // for create
	this.makeprint();
}


// ATTACHMENT
// ------------------------


Frm.prototype.setup_attach = function() {
	var me = this;
	
	this.attach_area = $a(this.layout.cur_row.wrapper, 'div', 'attach_area');
	if(!this.meta.max_attachments)
		this.meta.max_attachments = 10;
	
	var tab = $a($a(this.attach_area, 'div'), 'table');
	tab.insertRow(0);
	var label_area = tab.rows[0].insertCell(0);
	var main_area = tab.rows[0].insertCell(1);

	this.files_area = $a(main_area, 'div');	
	this.btn_area = $a(main_area, 'div');

	$w(label_area, "33%");
	var d = $a(label_area, 'div');
	var img = $a(d, 'img', '', {marginRight:'8px'}); img.src = 'images/icons/paperclip.gif';
	$a(d, 'span').innerHTML = 'File Attachments:';
	
	me.attach_msg = $a(label_area,'div','comment', {padding:'8px', fontSize:'11px'});
	me.attach_msg.innerHTML = "Changes made to the attachments are not permanent until the document is saved";

	// button
	var btn_add_attach = $a(this.btn_area, 'button');
	btn_add_attach.innerHTML = 'Add';
	
	btn_add_attach.onclick = function() {
		me.add_attachment();
		me.sync_attachments(me.docname);
		me.refresh_attachments();
	}
}

Frm.prototype.refresh_attachments = function() {
	if(!this.perm[0][WRITE]) { $dh(this.btn_area); }
	else { $ds(this.btn_area); }

	var nattach = 0;
	for(var dn in this.attachments) {
		for(var i in this.attachments[dn]){
			var a = this.attachments[dn][i];
			if(a.docname!=this.docname)
				a.hide();
			else {
				a.show();
				nattach++;
				if(this.perm[0][WRITE] && this.editable) { $ds(a.delbtn); }
				else { $dh(a.delbtn); }
			}
		}
	}
	if(this.editable) {
		if(nattach >= cint(this.meta.max_attachments))
			$dh(this.btn_area);
		else
			$ds(this.btn_area);
	} else {
		$dh(this.btn_area);
	}
}

Frm.prototype.set_attachments = function() {
	//if(this.meta.issingle) /// why??
	//	return;

	this.attachments[this.docname] = [];	
	var atl = locals[this.doctype][this.docname].file_list;

	if(atl) {
		atl = atl.split('\n');

		// add new document attachments
		for(var i in atl) {
			var a = atl[i].split(',');
			var ff = this.add_attachment(a[0], a[1]);
		}
	}
}

Frm.prototype.add_attachment = function(filename, fileid) {
	var at_id = this.attachments[this.docname].length;
	var ff = new FileField(this.files_area, at_id, this);

	// set name and id if given
	if(filename)ff.filename = filename;
	if(fileid)ff.fileid = fileid;
	ff.docname = this.docname;
	
	this.attachments[this.docname][at_id] = ff;
	
	ff.refresh();
	return ff;
}

Frm.prototype.sync_attachments = function(docname) {
	var fl = [];
	for(var i in this.attachments[docname]) {
		var a = this.attachments[docname][i];
		fl[fl.length] = a.filename + ',' + a.fileid;
	} 
	locals[this.doctype][docname].file_list = fl.join('\n')
}

// Handling File field

function FileField(parent, at_id, frm, addlink) {
	var me = this;
	this.at_id = at_id
	
	this.wrapper = $a(parent, 'div');
	var tab = $a(this.wrapper, 'table');


	tab.insertRow(0);
	var main_area = tab.rows[0].insertCell(0);
	var del_area = tab.rows[0].insertCell(1);
	
	// del button
	
	$w(del_area, '20%');
	this.delbtn = $a(del_area, 'div', 'link_type');
	this.delbtn.innerHTML = 'Remove';

	this.remove = function() {
		var yn = confirm("The document will be saved after the attachment is deleted for the changes to be permanent. Proceed?")
		if(yn) {
			me.wrapper.style.display = 'none';
			var fid = frm.attachments[frm.docname][me.at_id].fileid;
			if(fid) {
				$c('remove_attach', args = {'fid': fid}, function(r,rt) { } );
			}
	
			delete frm.attachments[frm.docname][me.at_id];
			frm.sync_attachments(frm.docname);
			var ret = frm.save('Save');
			if(ret=='Error')msgprint("error:The document was not saved. To make the attachment permanent, you must save the document before closing.");
		}
	}
	
	this.hide = function() { $dh(me.wrapper); }
	this.show = function() { $ds(me.wrapper); }

	this.delbtn.onclick = this.remove;
		
	// upload
	this.upload_div = $a(main_area, 'div');
	this.download_div = $a(main_area, 'div');

	var div = $a(this.upload_div, 'div');
	div.innerHTML = '<iframe id="RSIFrame" name="RSIFrame" src="blank1.html" style="width:400px; height:100px; border:0px"></iframe>';

	// upload form
	var div = $a(this.upload_div,'div');
	div.innerHTML = '<form method="POST" enctype="multipart/form-data" action="'+outUrl+'" target="RSIFrame"></form>';
	var ul_form = div.childNodes[0];
      
	var f_list = [];
  
	// file data
	var inp_fdata = $a_input($a(ul_form,'span'),'file','filedata');

	var inp = $a_input($a(ul_form,'span'),'hidden','cmd'); inp.value = 'uploadfile';
	var inp = $a_input($a(ul_form,'span'),'hidden','__account'); inp.value = account_id;
	if(__sid150)
		var inp = $a_input($a(ul_form,'span'),'hidden','sid150'); inp.value = __sid150;
	var inp = $a_input($a(ul_form,'span'),'submit'); inp.value = 'Upload';
	
	// dt, dn to show
	var inp = $a_input($a(ul_form,'span'),'hidden','doctype'); inp.value = frm.doctype;
	var inp = $a_input($a(ul_form,'span'),'hidden','docname'); inp.value = frm.docname;
	var inp = $a_input($a(ul_form,'span'),'hidden','at_id'); inp.value = at_id;
	
	// download
	this.download_link = $a(this.download_div, 'a', 'link_type');
	
	// fresh
	this.refresh = function() {
		if (this.filename) {
			$dh(this.upload_div);
			this.download_link.innerHTML = this.filename;
			this.download_link.href = outUrl + '?cmd=downloadfile&file_id='+this.fileid+"&__account="+account_id + (__sid150 ? ("&sid150="+__sid150) : '');

			this.download_link.target = "_blank";
			$ds(this.download_div);
		} else {
			$ds(this.upload_div);
			$dh(this.download_div);
		}
	}
}

function file_upload_done(doctype, docname, fileid, filename, at_id) {
	
	var at_id = cint(at_id);
	
	// update file_list
	var frm = frms[doctype];
	var a = frm.attachments[docname][at_id];
	a.filename = filename;
	a.fileid = fileid;

	frm.sync_attachments(docname);
	
	a.refresh();
	var do_save = confirm('File Uploaded Sucessfully. You must save this document for the uploaded file to be registred. Save this document now?');
	if(do_save) {
		var ret = frm.save('Save');
		if(ret=='Error')msgprint("error:The document was not saved. To make the attachment permanent, you must save the document before closing.");
	} else {
		msgprint("error:The document was not saved. To make the attachment permanent, you must save the document before closing.");
	}
}


// PAGING
// ------

Frm.prototype.set_section = function(sec_id) {
	this.sections[this.cur_section[this.docname]].hide();
	this.sections[sec_id].show();
	this.cur_section[this.docname] = sec_id;
}

// TABBED
// ------

Frm.prototype.setup_tabs = function() {
	var me = this;
	$ds(this.tab_wrapper);
	$y(this.tab_wrapper, {marginTop:'8px'});
	this.tabs = new TabbedPage(this.tab_wrapper, 1);
}

// TIPS
// ----

Frm.prototype.setup_tips = function() {
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
// -----

Frm.prototype.setup_std_layout = function() {
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
	
	
	if(isIE&&this.body) {
		this.body.onscroll = function() { refresh_scroll_heads(); }
	}

	// bg colour
	if(this.meta.colour) this.layout.wrapper.style.background = '#'+this.meta.colour.split(':')[1];
	
	// create fields
	this.setup_fields_std();
}

Frm.prototype.setup_fields_std = function() {
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

Frm.prototype.setup_template_layout = function() {
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

Frm.prototype.setup_client_script = function() {
	// setup client obj
	if(this.meta.client_script_core || this.meta.client_script || this.meta.__client_script) {
		this.runclientscript('setup', this.doctype, this.docname);
	}
	this.script_setup = 1;
}

Frm.prototype.setup = function() {

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

/* Client Side Scripting */

function set_multiple(dt, dn, dict, table_field) {
	var d = locals[dt][dn];
	for(var key in dict) {
		d[key] = dict[key];
	    if (table_field)	refresh_field(key, d.name, table_field);     
		else 				refresh_field(key);	
	}
}

function refresh_many(flist, dn, table_field) {
	for(var i in flist) {
		if (table_field) refresh_field(flist[i], dn, table_field);
		else refresh_field(flist[i]);
	}
}

function set_field_tip(n,txt) {
	var df = get_field(cur_frm.doctype, n, cur_frm.docname);
	if(df)df.description = txt;

	if(cur_frm && cur_frm.fields_dict) {
		if(cur_frm.fields_dict[n])
			cur_frm.fields_dict[n].comment_area.innerHTML = replace_newlines(txt);
		else
			errprint('[set_field_tip] Unable to set field tip: ' + n);
	}
}

function refresh_field(n, docname, table_field) {
	if(table_field) { // for table
		if(dialog_record && dialog_record.display) {
			// in dialog
			if(dialog_record.cur_frm.fields_dict[n] && dialog_record.cur_frm.fields_dict[n].refresh)
				dialog_record.cur_frm.fields_dict[n].refresh();
		} else {
			var g = grid_selected_cell;
			if(g) var hc = g.grid.head_row.cells[g.cellIndex];
			
			if(g && hc && hc.fieldname==n && g.row.docname==docname) {
				hc.template.refresh(); // if active
			} else {
				cur_frm.fields_dict[table_field].grid.refresh_cell(docname, n);
			}
		}
	} else if(cur_frm && cur_frm.fields_dict) {
		if(cur_frm.fields_dict[n] && cur_frm.fields_dict[n].refresh)
			cur_frm.fields_dict[n].refresh();
	}
}

function set_field_options(n, txt) {
	var df = get_field(cur_frm.doctype, n, cur_frm.docname);
	if(df)df.options = txt;
	refresh_field(n);
}

function set_field_permlevel(n, level) {
	var df = get_field(cur_frm.doctype, n, cur_frm.docname);
	if(df)df.permlevel = level;
	refresh_field(n);
}

function _hide_field(n,hidden) {
	var df = get_field(cur_frm.doctype, n, cur_frm.docname);
	if(df)df.hidden = hidden; refresh_field(n);
}
function hide_field(n) {
	if(cur_frm) {
		if(n.substr) _hide_field(n,1);
		else { for(var i in n)_hide_field(n[i],1) }
	}
}

function unhide_field(n) {
	if(cur_frm) {
		if(n.substr) _hide_field(n,0);
		else { for(var i in n)_hide_field(n[i],0) }
	}
}
//////

Frm.prototype.hide = function() {
	if(this.layout)this.layout.hide();
	$dh(this.wrapper);
	this.display = 0;
	hide_autosuggest();
}

Frm.prototype.show = function(docname, from_refresh) {
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

Frm.prototype.defocus_rest = function() {
	// deselect others
	mclose();
	if(grid_selected_cell) grid_selected_cell.grid.cell_deselect();
	cur_page = null;
}

// -------- Permissions -------
// Returns global permissions, at all levels
Frm.prototype.get_doc_perms = function() {
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

///// FRM Refresh

Frm.prototype.refresh = function(no_script) {
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
			frm_con.show();

			// show / hide buttons
			frm_con.refresh_toolbar();

			// add to recent
			rdocs.add(this.doctype, this.docname, 1);
			this.set_heading();
		}

		refresh_tabs(this);
		refresh_fields(this);
		refresh_dependency(this);
			
		if(this.layout) this.layout.show();

		if(this.meta.allow_attach) this.refresh_attachments();
		
		// in the end, show
		if(!this.display) this.show(this.docname, 1);
		
	} 
	set_frame_dims();
}

function refresh_tabs(me) {
	if(!me)me = cur_frm;
	if(me.meta.section_style=='Tray'||me.meta.section_style=='Tabbed') {
		for(var i in me.sections) {
			me.sections[i].hide();
		}
		
		me.set_section(me.cur_section[me.docname]);
		if(isIE)refresh_scroll_heads();	
	}
}

function refresh_fields(me) {
	if(!me)me = cur_frm;
	// set fields
	for(fkey in me.fields) {
		var f = me.fields[fkey];
		f.perm = me.perm;
		f.docname = me.docname;
		if(f.refresh)f.refresh();
	}

	// cleanup activities after refresh
	on_refresh_main(me);
}

function on_refresh_main(me) {
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

function refresh_dependency(me) {
	if(!me) return;

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
Frm.prototype.setnewdoc = function(docname) {

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
	
	if(this.doctype=='DocType')
		loaded_doctypes[loaded_doctypes.length] = docname;
}

function edit_doc() {
	// set fields
	cur_frm.is_editable[cur_frm.docname] = true;
	cur_frm.refresh();
}

var validated = true;
var validation_message = '';

Frm.prototype.show_doc = function(dn) {
	this.show(dn);
}

Frm.prototype.save = function(save_action, call_back) {
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

//
// Script
//

// MUST REPLACE

function make_doclist(dt, dn, deleted) {
	var dl = [];
	dl[0] = locals[dt][dn];
	
	// get children
	for(var ndt in locals) { // all doctypes
		if(locals[ndt]) {
			for(var ndn in locals[ndt]) {
				var doc = locals[ndt][ndn];
				if(doc && doc.parenttype==dt && (doc.parent==dn||(deleted&&doc.__oldparent==dn))) {
					dl[dl.length]=doc;
					//if(deleted&&(doc.__oldparent==dn))alert(doc.name+','+doc.__oldparent);
				}
			}
		}
	}
	return dl;
}

Frm.prototype.runscript = function(scriptname, callingfield, onrefresh) {
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

function $c_get_values(args, doc, dt, dn, user_callback) {
	var call_back = function(r,rt) {
		if(!r.message)return;
		if(user_callback) user_callback(r.message);
		
		var fl = args.fields.split(',');
		for(var i in fl) {
			locals[dt][dn][fl[i]] = r.message[fl[i]]; // set value
			if(args.table_field)
				refresh_field(fl[i], dn, args.table_field);
			else
				refresh_field(fl[i]);
		}
	}
	$c('get_fields',args,call_back);
}

function get_server_fields(method, arg, table_field, doc, dt, dn, allow_edit, call_back) {
	if(!allow_edit)freeze('Fetching Data...');
	$c('runserverobj', args={'method':method, 'docs':compress_doclist([doc]), 'arg':arg},
	function(r, rt) {
		if (r.message)  {
			var d = locals[dt][dn];
			var field_dict = eval('var a='+r.message+';a');

			for(var key in field_dict) {
				d[key] = field_dict[key];
				if (table_field) refresh_field(key, d.name, table_field);
				else refresh_field(key);
			}
		}
		if(call_back){
			doc = locals[doc.doctype][doc.name];
			call_back(doc, dt, dn);
		}
		if(!allow_edit)unfreeze();
    }
  );
}

Frm.prototype.runclientscript = function(caller, cdt, cdn) {
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

//
// Form Input
//

function ColumnBreak() {
	this.set_input = function() { };
}

var cur_col_break_width;
ColumnBreak.prototype.make_body = function() {
	if((!this.perm[this.df.permlevel]) || (!this.perm[this.df.permlevel][READ]) || this.df.hidden) {
		// no display
		return;
	}

	this.cell = this.frm.layout.addcell(this.df.width);
	cur_col_break_width = this.df.width;

	var fn = this.df.fieldname?this.df.fieldname:this.df.label;
	// header
	if(this.df&&this.df.label){
		this.label = $a(this.cell.wrapper, 'div', 'columnHeading');
		this.label.innerHTML = this.df.label;
	}

}

ColumnBreak.prototype.refresh = function(layout) {
	if(!this.cell)return; // no perm
	
	var fn = this.df.fieldname?this.df.fieldname:this.df.label;
	if(fn) {
		this.df = get_field(this.doctype, fn, this.docname);
	
		// hidden
		if(this.set_hidden!=this.df.hidden) {
			if(this.df.hidden)
				this.cell.hide();
			else
				this.cell.show();
			this.set_hidden = this.df.hidden;
		}
	}
}

function SectionBreak() {
	this.set_input = function() { };
}

SectionBreak.prototype.make_row = function() {
	this.row = this.frm.layout.addrow();
}

SectionBreak.prototype.make_simple_section = function(static) {
	var head = $a(this.row.header, 'div', '', {margin:'4px 8px 0px 8px'});
	var me = this;

	// colour
	var has_col = false;
	if(this.df.colour) {
		has_col = true;
		var col = this.df.colour.split(':')[1];
		if(col!='FFF') {
			$y(this.row.sub_wrapper, {
				margin:'8px', padding: '0px'
				,border:('1px solid #' + get_darker_shade(col, 0.75))
				//,borderBottom:('2px solid #' + get_darker_shade(col))
				,backgroundColor: ('#' + col)}
			);
		}
	}
		
	if(static) {
		this.label = $a(head, 'div', 'sectionHeading', {margin:'8px 0px'});
		this.label.innerHTML = this.df.label?this.df.label:'';
		return;
	}
	
	if(this.df.label) {
		var t = make_table($a(head,'div'), 1,2, '100%', ['20px',null], {verticalAlign:'middle'});
		$y(t,{borderCollapse:'collapse'});
		
		this.label = $a($td(t,0,1), 'div', 'sectionHeading');
		this.label.innerHTML = this.df.label?this.df.label:'';
		
		// exp / collapse
		this.exp_icon = $a($td(t,0,0),'img','',{cursor:'pointer'}); this.exp_icon.src = min_icon;
		this.exp_icon.onclick = function() { if(me.row.body.style.display.toLowerCase()=='none') me.exp_icon.expand(); else me.exp_icon.collapse(); }
		this.exp_icon.expand = function() { $ds(me.row.body); me.exp_icon.src = min_icon; }
		this.exp_icon.collapse = function() { $dh(me.row.body); me.exp_icon.src = exp_icon; }
		$y(head,{padding:'2px', borderBottom:'1px solid #ccc', margin:'8px'});
		
		// callable functions
		this.collapse = this.exp_icon.collapse;
		this.expand = this.exp_icon.expand;
		
	} else if(!has_col) {
		// divider
		$y(head,{margin:'8px', borderBottom:'2px solid #445'});
	}

}

var cur_sec_header;
SectionBreak.prototype.make_body = function() {
	this.fields = [];
	if((!this.perm[this.df.permlevel]) || (!this.perm[this.df.permlevel][READ]) || this.df.hidden) {
		// no display
		return;
	}
	var me = this;

	// header
	if(this.frm.meta.section_style=='Tabbed') {
		if(this.df.options!='Simple') {
			// IE full page ??
			this.sec_id = this.frm.sections.length;
			this.frm.sections[this.sec_id] = this;
			
			this.mytab = this.frm.tabs.add_tab(me.df.label, 
				function() { me.frm.set_section(me.sec_id);});
						
			this.hide = function() { this.row.hide(); me.mytab.hide(); }
			this.show = function() { 
				this.row.show(); me.mytab.set_selected();
				if(me.df.label && me.df.trigger=='Client' && (!me.in_filter))
					cur_frm.runclientscript(me.df.label, me.doctype, me.docname);
			}
	
			this.make_row();
			this.make_simple_section(1);
			if(!isIE) this.hide();
		} else {
			this.row = this.frm.layout.addsubrow();
			this.make_simple_section();
		}
	} else if(this.frm.meta.section_style=='Tray') {
		if(this.df.options!='Simple') {
			this.sec_id = this.frm.sections.length;
			this.frm.sections[this.sec_id] = this;
			
			var w=$a(this.frm.tray_area, 'div');
			this.header = $a(w, 'div', 'sec_tray_tab');
			this.header.bottom = $a(w, 'div', 'sec_tray_tab_bottom');
			this.header.innerHTML = me.df.label;		
			this.header.onclick = function() { me.frm.set_section(me.sec_id); }
			this.header.onmouseover = function() { 
				if(isIE)return; // ie disappearing table error
				if(cur_sec_header != this) {
					this.className = 'sec_tray_tab tray_tab_mo'; 
					this.bottom.className = 'sec_tray_tab_bottom tray_tab_mo_bottom';
				}
			}
			this.header.onmouseout = function() {
				if(isIE)return;
				if(cur_sec_header != this) {
					this.className = 'sec_tray_tab'; 
					this.bottom.className = 'sec_tray_tab_bottom'; 
				}
			}
			this.hide = function() { 
				this.row.hide();
				this.header.className = 'sec_tray_tab'; 
				this.header.bottom.className = 'sec_tray_tab_bottom'; 
			}
			this.show = function() { 
				this.row.show(); 
				this.header.className = 'sec_tray_tab tray_tab_sel';
				this.header.bottom.className = 'sec_tray_tab_bottom tray_tab_sel_bottom';
				cur_sec_header = this.header;
				if(me.df.label && me.df.trigger=='Client' && (!me.in_filter))
					cur_frm.runclientscript(me.df.label, me.doctype, me.docname);
				if(!isIE)set_frame_dims();
			}
	
			this.make_row();
			this.make_simple_section(1);
			if(!isIE)this.hide();
		} else {
			this.row = this.frm.layout.addsubrow();
			this.make_simple_section();
		}
	} else if(this.df){
		this.row = this.frm.layout.addrow();
		this.make_simple_section();
	}	
}

SectionBreak.prototype.refresh = function(layout) {
	var fn = this.df.fieldname?this.df.fieldname:this.df.label;

	if(fn)
		this.df = get_field(this.doctype, fn, this.docname);

	// hidden
	if((this.frm.meta.section_style!='Tray')&&(this.frm.meta.section_style!='Tabbed')&&this.set_hidden!=this.df.hidden) {
		if(this.df.hidden) {
			if(this.header)this.header.hide();
			if(this.row)this.row.hide();
		} else {
			if(this.header)this.header.show();
			if(this.expanded)
				this.row.show();
		}
		this.set_hidden = this.df.hidden;
	}
}



function get_value(dt, dn, fn) {
	if(locals[dt] && locals[dt][dn]) 
		return locals[dt][dn][fn];	
}

function set_value(dt, dn, fn, v) {
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

function makeinput_popup(me, iconsrc, iconsrc1) {
	me.input = $a(me.input_area, 'div');
	me.input.onchange = function() { /*alert('in_oc'); me.txt.onchange();*/ }
	
	var tab = $a(me.input, 'table');
	$w(tab, '100%');
	tab.style.borderCollapse = 'collapse';
	
	var c0 = tab.insertRow(0).insertCell(0);
	var c1 = tab.rows[0].insertCell(1);
	
	me.txt = $a(c0, 'input');
	$w(me.txt, isIE ? '92%' : '100%');

	c0.style.verticalAlign = 'top';
	$w(c0, "80%");

	me.btn = $a(c1, 'img', 'btn-img');
	me.btn.src = iconsrc;
	if(iconsrc1) // link
		me.btn.setAttribute('title','Search');
	else // date
		me.btn.setAttribute('title','Select Date');
	me.btn.style.margin = '4px 2px 2px 8px';

	if(iconsrc1) {
		$w(c1, '18px');
		me.btn1 = $a(tab.rows[0].insertCell(2), 'img', 'btn-img');
		me.btn1.src = iconsrc1;
		me.btn1.setAttribute('title','Open Link');
		me.btn1.style.margin = '4px 2px 2px 0px';
	}
	
	if(me.df.colour)
		me.txt.style.background = '#'+me.df.colour.split(':')[1];
	me.txt.name = me.df.fieldname;
	tmpid++;
	me.txt.setAttribute('id', 'idx'+tmpid);
	me.txt.id = 'idx'+tmpid;

	me.setdisabled = function(tf) { me.txt.disabled = tf; }
}


var tmpid = 0;


//
// Documents
//

function set_default_values(doc) {
	var doctype = doc.doctype;
	var docfields = fields_list[doctype];
	if(!docfields) {
		return;
	}
	for(var fid=0;fid<docfields.length;fid++) {
		var f = docfields[fid];
		if(!in_list(no_value_fields, f.fieldtype) && doc[f.fieldname]==null) {
			var v = LocalDB.get_default_value(f.fieldname, f.fieldtype, f['default']);
			if(v) doc[f.fieldname] = v;
		}
	}
}

function get_today() {
	var today = new Date();
	var m = (today.getMonth()+1)+'';
	if(m.length==1)m='0'+m;
	var d = today.getDate()+'';
	if(d.length==1)d='0'+d;
	return today.getFullYear()+'-'+m+'-'+d;
}

function copy_doc(onload, from_amend) {
	if(!cur_frm) return;
	
	if(!cur_frm.perm[0][CREATE]) {
		msgprint('You are not allowed to create '+cur_frm.meta.name);
		return;
	}
	
	var dn = cur_frm.docname;
	// copy parent
	var newdoc = LocalDB.copy(cur_frm.doctype, dn, from_amend);

	// do not copy attachments
	if(cur_frm.meta.allow_attach && newdoc.file_list)
		newdoc.file_list = null;
	
	// copy chidren
	var dl = make_doclist(cur_frm.doctype, dn);

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

function is_null(v) {
	if(v==null) {
		return 1
	} else if(v==0) {
		if((v+'').length==1) return 0;
		else return 1;
	} else {
		return 0
	}
}

function check_required(dt, dn) {
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

function savedoc(dt, dn, save_action, onsave, onerr) {
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

function amend_doc() {
	if(!cur_frm.fields_dict['amended_from']) {
		alert('"amended_from" field must be present to do an amendment.');
		return;
	}
    var fn = function(newdoc) {
      newdoc.amended_from = cur_frm.docname;
      if(cur_frm.fields_dict['amendment_date'])
	      newdoc.amendment_date = dateutil.obj_to_str(new Date());
    }
    copy_doc(fn, 1);
}

function savesubmit() {
	var answer = confirm("Permanently Submit "+cur_frm.docname+"?");
	if(answer) save_doc('Submit');
}

function savecancel() {
	var answer = confirm("Permanently Cancel "+cur_frm.docname+"?");
	if(answer) save_doc('Cancel');
}

function save_doc(save_action) {
	if(!cur_frm)return;
	if(!save_action)save_action = 'Save';
	if(cur_frm.cscript.server_validate) {
		// params doc, save_action
		cur_frm.cscript.server_validate(locals[cur_frm.doctype][cur_frm.name], save_action);
	} else {
		cur_frm.save(save_action);
	}
}


// refresh

function refresh_scroll_heads() {
	for(var i=0;i<scroll_list.length;i++) {
		if(scroll_list[i].frm == cur_frm) {
			ie_refresh(scroll_list[i]);
			if(scroll_list[i].check_disp)
				scroll_list[i].check_disp();
		}
		if(scroll_list[i].cs == _cs) {
			ie_refresh(scroll_list[i]);
		}
	}
}
