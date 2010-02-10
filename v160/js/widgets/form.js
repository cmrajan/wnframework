/* Copyright 2005-2008, Rushabh Mehta (RMEHTA _AT_ GMAIL) 

    Web Notes Framework is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    For a copy of the GNU General Public License see 
    <http://www.gnu.org/licenses/>.
    
    Web Notes Framework is also available under a commercial license with
    patches, upgrades and support. For more information see 
    <http://webnotestech.com>
*/
// Form.js

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
	for(var i=0;i<fl.length;i++) {
		frm.print_sel.options[frm.print_sel.options.length] 
			= new Option(fl[i].format, fl[i].format, false, false);
	}
	frm.print_sel.options[frm.print_sel.options.length] = new Option('Standard', 'Standard', false, false);
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
// EMAIL

function email_doc() {
	if(!cur_frm)return;
	// make selector
	sel = makeformatselector(cur_frm);
	$td(email_dialog.rows['Format'].tab,0,1).innerHTML = '';
	$td(email_dialog.rows['Format'].tab,0,1).appendChild(cur_frm.print_sel);
	email_dialog.widgets['Subject'].value = cur_frm.meta.name + ': ' + cur_frm.docname;
	email_dialog.show();
	frm_con.tbarlinks.selectedIndex = 0;
}

var email_as_field = 'email_id';
var email_as_dt = 'Contact';
var email_as_in = 'email_id,contact_name';

function makeemail() {
	var d = new Dialog(440, 440, "Send Email");
	$dh(d.wrapper);

	var email_go = function() {
		var emailfrom = d.widgets['From'].value;
		var emailto = d.widgets['To'].value;
		
		if(!emailfrom)
			emailfrom = user_email;
		
		// validate email ids
		var email_list = emailto.split(/[,|;]/);
		var valid = 1;
		for(var i=0;i<email_list.length;i++){
			if(!validate_email(email_list[i])) {
				msgprint('error:'+email_list[i] + ' is not a valid email id');
				valid = 0;
			}
		}
		
		// validate from
		if(emailfrom && !validate_email(emailfrom)) {
			msgprint('error:'+ emailfrom + ' is not a valid email id. To change the default please click on Profile on the top right of the screen and change it.');
			return;
		}
		
		if(!valid)return;
			
		var cc= emailfrom;
		
		if(!emailfrom) { 
			emailfrom = locals['Control Panel']['Control Panel'].auto_email_id; 
			cc = ''; 
		}
		sendmail(emailto, emailfrom, emailfrom, d.widgets['Subject'].value, d.widgets['Message'].value, sel_val(cur_frm.print_sel), d.widgets['Send With Attachments'].checked);
		email_dialog.hide();
	}

	d.onhide = function() {
		hide_autosuggest();
	}

	d.make_body([
		 ['Data','To','Example: abc@hotmail.com, xyz@yahoo.com']
		,['Data','Format']
		,['Data','Subject']
		,['Data','From','Optional']
		,['Check','Send With Attachments','Will send all attached documents (if any)']
		,['Text','Message']
		,['Button','Send',email_go]]
	);

	d.widgets['From'].value = (user_email ? user_email:'');
	
    // ---- add auto suggest ---- 
    var opts = { script: '', json: true, maxresults: 10 };
    
    var as = new bsn.AutoSuggest(d.widgets['To'], opts);
    as.custom_select = function(txt, sel) {
      // ---- add to the last comma ---- 
      var r = '';
      var tl = txt.split(',');
      for(var i=0;i<tl.length-1;i++) r=r+tl[i]+',';
      r = r+(r?' ':'')+sel;
      if(r[r.length-1]==NEWLINE) r=substr(0,r.length-1);
      return r;
    }
    
    // ---- override server call ---- 
    as.doAjaxRequest = function(txt) {
      var pointer = as; var q = '';
      
      // ---- get last few letters typed ---- 
      var last_txt = txt.split(',');
      last_txt = last_txt[last_txt.length-1];
      
      // ---- show options ---- 
      var call_back = function(r,rt) {
        as.aSug = [];
        if(!r.cl) return;
        for (var i=0;i<r.cl.length;i++) {
          as.aSug.push({'id':r.cl[i], 'value':r.cl[i], 'info':''});
        }
        as.createList(as.aSug);
      }
      $c('get_contact_list',{'select':email_as_field, 'from':email_as_dt, 'where':email_as_in, 'txt':(last_txt ? strip(last_txt) : '%')},call_back);
      return;
    }
	
	var sel;

	email_dialog = d;
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

function FrmContainer() {  }

FrmContainer.prototype = new Container()
FrmContainer.prototype.oninit = function() {
	this.make_head();
	this.make_toolbar();
	make_text_dialog();
}

FrmContainer.prototype.make_head = function() {
	this.head_div = $a(this.head, 'div', '', {borderBottom:'1px solid #AAA', margin:'0px 4px'});

	// Row 1
	// ------------------

	this.tbartab = make_table($a(this.head_div, 'div'), 1, 2, '100%', ['50%','50%'],{backgroundColor: "#DDD"});

	// left side - headers
	// -------------------
	$y($td(this.tbartab,0,0),{padding:'4px'});
	this.main_title = $a($td(this.tbartab,0,0), 'h2', '',{margin: '0px 8px', display:'inline'});
	this.sub_title = $a($td(this.tbartab,0,0), 'div','',{display:'inline'});
	this.sub_title.is_inline = 1;
	this.status_title = $a($td(this.tbartab,0,0), 'span','',{marginLeft:'8px'});
	this.status_title.is_inline = 1;
	
	// right side - actions, comments & close btn
	// ------------------------------------------
	this.tbar_div = $a($td(this.tbartab,0,1),'div','',{marginRight:'8px', textAlign:'right'})
	var tab2 = make_table(this.tbar_div, 1, 4, '400px', ['60px','120px','160px','60px'], {textAlign: 'center', padding:'3px', verticalAlign:'middle'}); 
	$y(tab2,{cssFloat:'right'});


	// (Tweets) Comments
	// -----------------
	$y($td(tab2,0,0),{textAlign:'right'});
	var comm_img = $a($td(tab2,0,0),'img','',{marginRight:'4px', paddingTop:'2px'});
	comm_img.src = 'images/icons/comments.gif';

	var c = $td(tab2,0,1); 
	this.comments_btn = $a(c,'div','link_type',{padding:'0px 2px',position:'relative',display:'inline'});
	
	$y(c,{textAlign:'left'});
	this.comments_btn.dropdown = new DropdownMenu(c, '240px'); // Tweets Dropdown
	$y(this.comments_btn.dropdown.body, {height:'400px'});

	c.set_unselected = function() { // called by dropdown on hide
		tweet_dialog.hide();
	}
	this.comments_btn.onmouseover = function() { // custom mouseover
		$y(c,{backgroundColor:'#EEE'});
		if(cur_frm.doc.__islocal) {
			return;
		}
		this.dropdown.body.appendChild(tweet_dialog);
		this.dropdown.show();
		tweet_dialog.show(); 
	}
	this.comments_btn.onmouseout = function() {
		$y(c,{backgroundColor:'#DDD'});
		this.dropdown.clear();
	}
		
	this.comments_btn.innerHTML = 'Comments';

	// Actions...
	// -------------
	this.tbarlinks = $a($td(tab2,0,2),'select','',{width:'120px'});
	select_register[select_register.length] = this.tbarlinks; // for IE 6

	// close button
	// ---------------
	$y($td(tab2,0,3),{padding:'6px 0px 2px 0px', textAlign:'right'});
	this.close_btn = $a($td(tab2,0,3), 'img','',{cursor:'pointer'}); this.close_btn.src="images/icons/close.gif";
	this.close_btn.onclick = function() { nav_obj.show_last_open(); }

	// Row 2
	// ------------------

	this.tbartab2 = make_table($a(this.head_div, 'div'), 1, 2, '100%', ['50%','50%']);
	var t = make_table($a($td(this.tbartab2,0,0),'div'),1,2,'100%',['38%','62%'])
	
	// buttons
	this.button_area = $a($td(t,0,1), 'div', '', {margin:'4px'});
	this.last_update_area = $a($td(t,0,1), 'div', '', {margin:'0px 4px 4px 4px',color:"#888"});
	
	// created / modified
	this.owner_img = $a($td(t,0,0), 'img','',{margin:'4px 8px 4px 0px',width:'40px',display:'inline'});
	this.owner_img.is_inline = 1;
	this.mod_img = $a($td(t,0,0), 'img','',{margin:'4px 8px 4px 0px',width:'40px',display:'inline'});
	this.mod_img.is_inline = 1;

	// last comment area
	// -----------------
	this.last_comment = $a($td(this.tbartab2,0,1),'div','',{display:'none', paddingTop:'4px'});
	
	var t = make_table(this.last_comment,1,2,'100%',['40px','']);
	this.last_comment.img = $a($td(t,0,0), 'img','',{width:'40px',marginBottom:'8px'});
	this.last_comment.comment = $a($td(t,0,1),'div','',{backgroundColor:'#FFFAAA', padding:'4px', height:'32px'})


	// header elements
	this.head_elements = [this.button_area, this.tbar_div, this.owner_img, this.mod_img, this.sub_title, this.status_title, this.last_update_area];
	
}

FrmContainer.prototype.show_head = function() { 
	$ds(this.head_div); 
}

FrmContainer.prototype.hide_head = function() { 
	$dh(this.head_div); 
}

FrmContainer.prototype.refresh = function() { }

FrmContainer.prototype.make_toolbar = function() {
	this.btns = {};
	var me = this;
	var makebtn = function(label, fn, bold) {
		var btn = $a(me.button_area,'button');
		btn.l_area = $a(btn,'span');
		btn.l_area.innerHTML = label; btn.onclick = fn;
		if(bold)$y(btn.l_area, {fontWeight: 'bold'});
		btn.show = function() { 
			if(isFF)$y(this,{display:'-moz-inline-box'});
			else $y(this,{display:'inline-block'});
		}
		btn.hide = function() { $dh(this); }
		me.btns[label] = btn;
	}

	makebtn('Edit', edit_doc);
	makebtn('Save', function() { save_doc('Save');}, 1);
	makebtn('Submit', savesubmit);
	makebtn('Cancel', savecancel);
	makebtn('Amend', amend_doc);
	
	me.tbarlinks.onchange= function() {
		var v = sel_val(this);
		if(v=='New') new_doc();
		else if(v=='Refresh') reload_doc();
		else if(v=='Print') print_doc();
		else if(v=='Email') email_doc();
		else if(v=='Copy') copy_doc();
	}
	// make email dialog
	makeemail();
	makeprintdialog();
}

FrmContainer.prototype.refresh_save_btns= function() {
	var frm = cur_frm;
	var p = frm.get_doc_perms();

	if(cur_frm.editable) this.btns['Edit'].hide();
	else this.btns['Edit'].show();
	
	if(cur_frm.editable && cint(frm.doc.docstatus)==0 && p[WRITE]) this.btns['Save'].show();
	else this.btns['Save'].hide();

	if(cur_frm.editable && cint(frm.doc.docstatus)==0 && p[SUBMIT] && (!frm.doc.__islocal)) this.btns['Submit'].show();
	else this.btns['Submit'].hide();

	if(cur_frm.editable && cint(frm.doc.docstatus)==1  && p[CANCEL]) this.btns['Cancel'].show();
	else this.btns['Cancel'].hide();

	if(cint(frm.doc.docstatus)==2  && p[AMEND]) this.btns['Amend'].show();
	else this.btns['Amend'].hide();
}

FrmContainer.prototype.refresh_opt_btns = function() {
	var frm = cur_frm;

	var ol = ['Actions...','New','Refresh'];

	if(!frm.meta.allow_print) ol.push('Print');
	if(!frm.meta.allow_email) ol.push('Email');
	if(!frm.meta.allow_copy) ol.push('Copy');

	empty_select(this.tbarlinks);
	add_sel_options(this.tbarlinks, ol, 'Actions...');
}

FrmContainer.prototype.show_toolbar = function() {
	for(var i=0; i<this.head_elements.length; i++) this.head_elements[i].is_inline ? $di(this.head_elements[i]) : $ds(this.head_elements[i]);

	this.refresh_save_btns();
	this.refresh_opt_btns();
}

FrmContainer.prototype.hide_toolbar = function() {
	for(var i=0; i<this.head_elements.length; i++) $dh(this.head_elements[i]);
}

FrmContainer.prototype.refresh_toolbar = function() {
	var frm = cur_frm;
	if(frm.meta.hide_heading) { this.hide_head(); }
	else {
		this.show_head();
		
		if(frm.meta.hide_toolbar) { 
			this.hide_toolbar();
		} else {
			this.show_toolbar();
		}
	}
}

FrmContainer.prototype.add_frm = function(doctype, onload, opt_name) {
	// dont open doctype and docname from the same session
	if(frms['DocType'] && frms['DocType'].opendocs[doctype]) {
		msgprint("error:Cannot create an instance of \"" + doctype+ "\" when the DocType is open.");
		return;
	}

	if(frms[doctype]) { return frms[doctype]; }

	// Load Doctype from server
	var me = this;
	var fn = function(r,rt) {
		if(!locals['DocType'][doctype]) {
			return;
		}
		new Frm(doctype, me.body);

		if(onload)onload(r,rt);
	}
	if(opt_name && (!is_doc_loaded(doctype, opt_name))) {
		// get both
		$c('getdoc', {'name':opt_name, 'doctype':doctype, 'getdoctype':1, 'user':user}, fn, null, null, 'Loading ' + opt_name);
	} else {
		// get doctype only
		$c('getdoctype', args={'doctype':doctype}, fn, null, null, 'Loading ' + doctype);
	}
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
			dialog_record.cur_frm = null;
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
	
	this.attach_area = $a(this.layout ? this.layout.cur_row.wrapper : this.body, 'div', 'attach_area');
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
	div.innerHTML = '<iframe id="RSIFrame" name="RSIFrame" src="blank1.html" style="width:400px; border:0px"></iframe>';

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
	this.layout = null;
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


function Field() {	}

Field.prototype.make_body = function() { 
	if(this.parent)
		this.wrapper = $a(this.parent, 'div');
	else
		this.wrapper = document.createElement('div');
			
	if(!this.with_label) {
		this.label_area = $a(this.wrapper, 'div');
		$dh(this.label_area);
		this.comment_area = $a(this.wrapper, 'div', 'comment');
		$dh(this.comment_area);
		this.input_area = $a(this.wrapper, 'div');
		this.disp_area = $a(this.wrapper, 'div');
	} else {
		var t = $a(this.wrapper, 'table', 'frm_field_table');
		var r = t.insertRow(0); this.r = r;
		var lc = r.insertCell(0); this.input_cell = r.insertCell(1);
		lc.className='datalabelcell'; this.input_cell.className = 'datainputcell';
		
		var lt = make_table($a(lc,'div'),1,2,'100%',[null,'20px']);
		this.label_icon = $a($td(lt,0,1),'img'); $dh(this.label_icon);
		this.label_icon.src = 'images/icons/error.gif';
		this.label_cell= $td(lt,0,0)
		this.input_area = $a(this.input_cell, 'div', 'input_area');
		this.disp_area = $a(this.input_cell, 'div');
		this.comment_area = $a(this.input_cell, 'div', 'comment');
	}
	if(this.onmake)this.onmake();
}

Field.prototype.onresize = function() { }

Field.prototype.set_label = function() {
	if(this.label_cell&&this.label!=this.df.label) { 
		this.label_cell.innerHTML = this.df.label;this.label = this.df.label; 
	}
	if(this.df.description) {
		this.comment_area.innerHTML = replace_newlines(this.df.description);
		$ds(this.comment_area);
	} else {
		this.comment_area.innerHTML = '';
		$dh(this.comment_area);
	}
}

Field.prototype.get_status = function() {
	// if used in filters
	if(this.in_filter) {
		return 'Write';
	}
	
	var fn = this.df.fieldname?this.df.fieldname:this.df.label;
	this.df = get_field(this.doctype, fn, this.docname);

	var p = this.perm[this.df.permlevel];
	var ret;

	// permission level
	if(cur_frm.editable && p && p[WRITE])ret='Write';
	else if(p && p[READ])ret='Read';
	else ret='None';

	// binary
	if(this.df.fieldtype=='Binary')
		ret = 'None'; // no display for binary

	// hidden
	if(cint(this.df.hidden))
		ret = 'None';

	// for submit
	if(ret=='Write' && cint(cur_frm.doc.docstatus) > 0) ret = 'Read';

	// allow on submit
	var a_o_s = this.df.allow_on_submit;
	
	if(a_o_s && (this.in_grid || (this.frm && this.frm.in_dialog))) {
		a_o_s = null;
		if(this.in_grid) a_o_s = this.grid.field.df.allow_on_submit; // take from grid
		if(this.frm && this.frm.in_dialog) { a_o_s = cur_grid.field.df.allow_on_submit;} // take from grid
	}
	
	if(cur_frm.editable && a_o_s && cint(cur_frm.doc.docstatus)>0 && !this.df.hidden) {
		tmp_perm = get_perm(cur_frm.doctype, cur_frm.docname, 1);
		if(tmp_perm[this.df.permlevel] && tmp_perm[this.df.permlevel][WRITE])ret='Write';
	}

	return ret;
}

Field.prototype.activate = function(docname) {
	this.docname = docname;
	this.refresh();

	if(this.input) {
		this.input.isactive = true;
		var v = get_value(this.doctype, this.docname, this.df.fieldname);
		this.last_value=v;
		// set input value

		if(this.input.onchange && this.input.value!=v) {
			if(this.validate)
				this.input.value = this.validate(v);
			else 
				this.input.value = (v==null)?'':v;
			if(this.format_input)this.format_input();
		}
		
		if(this.input.focus){
			try{this.input.focus();} catch(e){} // IE Fix - Unexpected call???
		}
	}
	if(this.txt) {
		try{this.txt.focus();} catch(e){} // IE Fix - Unexpected call???
		this.txt.isactive = true;
		this.btn.isactive = true;
	}
}
Field.prototype.refresh_mandatory = function() { 
	if(this.in_filter)return;

	// mandatory changes
	if(this.label_cell) {
		if(this.df.reqd) {
			this.label_cell.style.color= "#d22";
			if(this.txt)$bg(this.txt,"#FFFED7");
			else if(this.input)$bg(this.input,"#FFFED7");
		} else {
			this.label_cell.style.color= "#222";
			if(this.txt)$bg(this.txt,"#FFF");
			else if(this.input)$bg(this.input,"#FFF");
		}
	}
	this.set_reqd = this.df.reqd;
}

Field.prototype.refresh_display = function() {
	// from permission
	if(this.set_status!=this.disp_status) { // status changed
		if(this.disp_status=='Write') { // write
			if(this.make_input&&(!this.input)) { // make input if reqd
				this.make_input();
			}
			$ds(this.wrapper);
			if(this.input) { // if there, show it!
				$ds(this.input_area);
				$dh(this.disp_area);
				if(this.input.refresh)this.input.refresh();
			} else { // no widget
				$dh(this.input_area);
				$ds(this.disp_area);
			}
		} else if(this.disp_status=='Read') { // read
			$ds(this.wrapper);
			$dh(this.input_area);
			$ds(this.disp_area);
		} else { // None
			$dh(this.wrapper);
		}
		this.set_status = this.disp_status;
	}
}

Field.prototype.refresh = function() { 
	// get status
	this.disp_status = this.get_status();

	// if there is a special refresh in case of table, then this is not valid
	if(this.in_grid 
		&& this.table_refresh 
			&& this.disp_status == 'Write') 
				{ this.table_refresh(); return; }

	this.set_label();
	this.refresh_display();
	this.refresh_mandatory();
	this.refresh_label_icon();
	
	// further refresh
	if(this.onrefresh) this.onrefresh();
	if(this.input&&this.input.refresh) this.input.refresh(this.df);

	if(!this.in_filter)
		this.set_input(get_value(this.doctype,this.docname,this.df.fieldname));
}

Field.prototype.refresh_label_icon = function() {
	if(this.in_filter)return;
	
	// mandatory
	if(this.label_icon && this.df.reqd) {
		var v = get_value(this.doctype, this.docname, this.df.fieldname);
	 	if(is_null(v)) 
	 		$di(this.label_icon);
	 	else 
	 		$dh(this.label_icon);
	} else { $dh(this.label_icon) }
}

Field.prototype.set = function(val) {
	if(this.in_filter)
		return;		
	if((!this.docname) && this.grid) {
		this.docname = this.grid.add_newrow(); // new row
	}
	// cleanup ms word quotes
	if(in_list(['Data','Text','Small Text','Code'], this.df.fieldtype))
		val = clean_smart_quotes(val);
	
	var set_val = val;
	if(this.validate)set_val = this.validate(val);
	set_value(this.doctype, this.docname, this.df.fieldname, set_val);
	this.value = val; // for return
}

Field.prototype.set_input = function(val) {
	this.value = val;
	if(this.input&&this.input.set_input) {
		if(val==null)this.input.set_input('');
		else this.input.set_input(val); // in widget
	}
	var disp_val = val;
	if(val==null) disp_val = ''; 
	this.set_disp(disp_val); // text
}

Field.prototype.run_trigger = function() {
	if(this.in_filter) {
		if(this.report)
			this.report.run();
		return;
	}
	if(this.df.trigger=='Client')
		cur_frm.runclientscript(this.df.fieldname, this.doctype, this.docname);
	refresh_dependency(cur_frm);
	this.refresh_label_icon();
}

Field.prototype.set_disp_html = function(t) {
	if(this.disp_area){
		this.disp_area.innerHTML = (t==null ? '' : t);
		if(t)this.disp_area.className = 'disp_area';
		if(!t)this.disp_area.className = 'disp_area_no_val';
	}
}

Field.prototype.set_disp = function(val) { 
	this.set_disp_html(val);
}

function DataField() { } DataField.prototype = new Field();
DataField.prototype.with_label = 1;
DataField.prototype.make_input = function() {
	var me = this;
	this.input = $a(this.input_area, 'input');

	if(this.df.fieldtype=='Password') {
		if(isIE) {
			this.input_area.innerHTML = '<input type="password">'; // IE fix
			this.input = this.input_area.childNodes[0];
		} else {
			this.input.setAttribute('type', 'password');
		}
	}

	this.get_value= function() {
		var v = this.input.value;
		if(this.validate)v = this.validate(v);
		return v;
	}

	this.input.name = this.df.fieldname;
	this.input.onchange = function() {
		if(!me.last_value)me.last_value='';
		if(me.validate)
			me.input.value = me.validate(me.input.value);
		me.set(me.input.value);
		if(me.format_input)
			me.format_input();
		if(in_list(['Currency','Float','Int'], me.df.fieldtype)) {
			if(flt(me.last_value)==flt(me.input.value)) {
				me.last_value = me.input.value;
				return; // do not run trigger
			}
		}
		me.last_value = me.input.value;
		me.run_trigger();
	}
	this.input.set_input = function(val) { 
		if(val==null)val='';
		me.input.value = val; 
		if(me.format_input)me.format_input();
	}
}
DataField.prototype.onrefresh = function() {
	if(this.input&&this.df.colour) {
		var col = '#'+this.df.colour.split(':')[1];
		$bg(this.input,col);
	}
}

function ReadOnlyField() { } ReadOnlyField.prototype = new Field();
ReadOnlyField.prototype.with_label = 1;

function HTMLField() { } HTMLField.prototype = new Field();
HTMLField.prototype.set_disp = function(val) { this.disp_area.innerHTML = val; }
HTMLField.prototype.set_input = function(val) { if(val) this.set_disp(val); }
HTMLField.prototype.onrefresh = function() { this.set_disp(this.df.options?this.df.options:''); }

// Image field definition

function get_image_src(doc) {
	if(doc.file_list) {
		file = doc.file_list.split(',');
		// if image
		extn = file[0].split('.');
		extn = extn[extn.length - 1].toLowerCase();
		var img_extn_list = ['gif', 'jpg', 'bmp', 'jpeg', 'jp2', 'cgm',  'ief', 'jpm', 'jpx', 'png', 'tiff', 'jpe', 'tif'];

		if(in_list(img_extn_list, extn)) {
			var src = outUrl + "?cmd=downloadfile&file_id="+file[1]+"&__account="+account_id + (__sid150 ? ("&sid150="+__sid150) : '');
		}
	} else {
		var src = "";
	}
	return src;
}

function ImageField() { this.images = {}; }
ImageField.prototype = new Field();
ImageField.prototype.onmake = function() {
	this.no_img = $a(this.wrapper, 'div','no_img');
	this.no_img.innerHTML = "No Image";
	$dh(this.no_img);
}
ImageField.prototype.onrefresh = function() { 
	var me = this;
	if(!this.images[this.docname]) this.images[this.docname] = $a(this.wrapper, 'img');
	else $di(this.images[this.docname]);
	
	var img = this.images[this.docname]
	
	// hide all other
	for(var dn in this.images) if(dn!=this.docname)$dh(this.images[dn]);

	var doc = locals[this.frm.doctype][this.frm.docname];
	
	if(!this.df.options) var src = get_image_src(doc);
	else var src = outUrl + '?cmd=get_file&fname='+this.df.options+"&__account="+account_id + (__sid150 ? ("&sid150="+__sid150) : '');

	
	if(src) {
		$dh(this.no_img);
		if(img.getAttribute('src')!=src) img.setAttribute('src',src);
		canvas = this.wrapper;
		canvas.img = this.images[this.docname];
		canvas.style.overflow = "auto";
		$w(canvas, "100%");
	
		if(!this.col_break_width)this.col_break_width = '100%';
		var allow_width = cint(pagewidth * (cint(this.col_break_width)-10) / 100);

		if((!img.naturalWidth) || cint(img.naturalWidth)>allow_width)
			$w(img, allow_width + 'px');

	} else {
		$ds(this.no_img);
	}
}
ImageField.prototype.set_disp = function (val) { }
ImageField.prototype.set = function (val) { }


function DateField() { } DateField.prototype = new Field();
DateField.prototype.with_label = 1;
DateField.prototype.make_input = function() {

	this.user_fmt = locals['Control Panel']['Control Panel'].date_format;
	if(!this.user_fmt)this.user_fmt = 'dd-mm-yyyy';

	makeinput_popup(this, 'images/icons/calendar.gif');
	var me = this;

	me.btn.onclick = function() {
		hide_selects();
		var user_fmt = me.user_fmt.replace('mm', 'MM');
		if(!cal)cal = new CalendarPopup('caldiv');
		cal.select(me.txt, me.txt.getAttribute('id'), user_fmt);
		if(isIE) {
    		window.event.cancelBubble = true;
	 	   	window.event.returnValue = false;
		}
	}
	
	me.txt.onchange = function() {
		// input as dd-mm-yyyy
		me.set(dateutil.str_to_user(me.txt.value));
		me.run_trigger();
	}
	me.input.set_input = function(val) {
		val=dateutil.str_to_user(val);
		if(val==null)val='';
		me.txt.value = val;
	}
	me.get_value = function() {
		return dateutil.str_to_user(me.txt.value);
	}
}
DateField.prototype.set_disp = function(val) {
	var v = dateutil.str_to_user(val);
	if(v==null)v = '';
	this.set_disp_html(v);
}
DateField.prototype.validate = function(v) {
	if(!v) return;
	var me = this;
	this.clear = function() {
		msgprint ("Date must be in format " + this.user_fmt);
		me.input.set_input('');
		return '';
	}
	var t = v.split('-');
	if(t.length!=3) { return this.clear(); }
	else if(cint(t[1])>12 || cint(t[1])<1) { return this.clear(); }
	else if(cint(t[2])>31 || cint(t[2])<1) { return this.clear(); }
	return v;
};

var _last_link_value=null;
function LinkField() { } LinkField.prototype = new Field();
LinkField.prototype.with_label = 1;
LinkField.prototype.make_input = function() { 
	makeinput_popup(this, 'images/icons/magnifier.gif', 'images/icons/arrow_right.gif');
	var me = this;

	me.btn.onclick = function() {
		selector.set(me, me.df.options, me.df.label);
		selector.show(me.txt);
	}
	
	if(me.btn1)me.btn1.onclick = function() {
		if(me.txt.value && me.df.options) { loaddoc(me.df.options, me.txt.value); }
	}

	me.txt.onchange = function() { 
		// check values are not set in quick succession due to un intentional event call
		if(_last_link_value)
			return
			
		if(me.as && me.as.ul) {
			// still setting value
		} else {
			me.set(me.txt.value);
			_last_link_value = me.txt.value
			setTimeout('_last_link_value=null', 100);
			
			me.run_trigger();
		}
	}
	
	me.input.set_input = function(val) {
		if(val==undefined)val='';
		me.txt.value = val;
	}
	me.get_value = function() {
		return me.txt.value;
	}
	if((!me.in_filter) && in_list(session.nt, me.df.options)) {
		me.new_link_area = $a(me.input_area,'div','',{display:'none',textAlign:'right',width:'81%'});
		var sp = $a(me.new_link_area, 'span', 'link_type',{fontSize:'11px'});
		sp.innerHTML = 'New ' + me.df.options;
		sp.onclick = function() { new_doc(me.df.options); }
	}

	me.onrefresh = function() {
		if(me.new_link_area) {
			if(cur_frm.doc.docstatus==0) $ds(me.new_link_area);
			else $dh(me.new_link_area);
		}
	}
	
	// add auto suggest
	var opts = {
		script: '',
		json: true,
		maxresults: 10,
		link_field: me
	};
	this.as = new bsn.AutoSuggest(me.txt.id, opts);
	
}
LinkField.prototype.set_get_query = function() { 
	if(this.get_query)return;

	// if from dialog
	if(dialog_record && dialog_record.display) {
		// find if there is a twin as template?
		var gl = cur_frm.grids;
		for(var i = 0; i < gl.length; i++) {
			if(gl[i].grid.doctype = this.df.parent) {
				// found the grid
				var f = gl[i].grid.get_field(this.df.fieldname);
				if(f.get_query) this.get_query = f.get_query;
				break;
			}
		}
	}
}

LinkField.prototype.set_disp = function(val) {
	var t = null; 
	if(val)t = "<a href=\'javascript:loaddoc(\""+this.df.options+"\", \""+val+"\")\'>"+val+"</a>";
	this.set_disp_html(t);
}

function IntField() { } IntField.prototype = new DataField();
IntField.prototype.validate = function(v) {
	var v= parseInt(v); if(isNaN(v))return null;
	return v;
}; 
IntField.prototype.format_input = function() {
	if(this.input.value==null) this.input.value='';
}

function FloatField() { } FloatField.prototype = new DataField();
FloatField.prototype.validate = function(v) {
	var v= parseFloat(v); if(isNaN(v))return null;
	return v;
};
FloatField.prototype.format_input = function() {
	if(this.input.value==null) this.input.value='';
}

function CurrencyField() { } CurrencyField.prototype = new DataField();
CurrencyField.prototype.format_input = function() { 
	var v = fmt_money(this.input.value); 
	if(!flt(this.input.value)) v = ''; // blank in filter
	this.input.value = v;
}

CurrencyField.prototype.validate = function(v) { 
	if(v==null || v=='')return 0; return flt(v,2); 
}
CurrencyField.prototype.set_disp = function(val) { 
	var v = fmt_money(val); 
	this.set_disp_html(v);
}
CurrencyField.prototype.onmake = function() {
	if(this.input)this.input.onfocus = function() {
		if(flt(this.value)==0)this.value=''; 
	}
}

function CheckField() { } CheckField.prototype = new Field();
CheckField.prototype.with_label = 1;
CheckField.prototype.validate = function(v) {
	var v= parseInt(v); if(isNaN(v))return 0;
	return v;
}; 
CheckField.prototype.onmake = function() {
	this.checkimg = $a(this.disp_area, 'div');
	var img = $a(this.checkimg, 'img');
	img.src = 'images/ui/tick.gif';
	$dh(this.checkimg);
}

CheckField.prototype.make_input = function() { var me = this;
	this.input = $a_input(this.input_area,'checkbox');
	$y(this.input, {width:"16px", border:'0px', margin:'2px'}); // no specs for checkbox
	this.input.onchange = function() {
		me.set(this.checked?1:0);
		me.run_trigger();
	}
	if(isIE)this.input.onclick = this.input.onchange;
	this.input.set_input = function(v) {
		v = parseInt(v); if(isNaN(v)) v = 0;
		if(v) me.input.checked = true;
		else me.input.checked=false;
	}

	this.get_value= function() {
		return this.input.checked?1:0;
	}

}
CheckField.prototype.set_disp = function(val) {
	if (val){ $ds(this.checkimg); } 
	else { $dh(this.checkimg); }
}

function ButtonField() { } ButtonField.prototype = new Field();
ButtonField.prototype.make_input = function() { var me = this;

	//this.input_area.className = 'buttons';
	$y(this.input_area,{height:'30px', marginTop:'4px', marginBottom: '4px'});

	this.input = $a(this.input_area, 'button');
	this.input.label = $a(this.input,'span');
	this.input.label.innerHTML = me.df.label;
	this.input.onclick = function() {
		this.disabled = true;
		if(me.df.trigger=='Client' && (!me.in_filter)) {
			cur_frm.runclientscript(me.df.label, me.doctype, me.docname);
			this.disabled = false;
		} else
			cur_frm.runscript(me.df.options, me);
	}
}
ButtonField.prototype.set = function(v) { }; // No Setter
ButtonField.prototype.set_disp = function(val) {  } // No Disp on readonly

var codeid=0; var code_editors={}; var tinymce_loaded;
function CodeField() { } CodeField.prototype = new Field();
CodeField.prototype.make_input = function() {
	var me = this; 
	$ds(this.label_area);
	this.label_area.innerHTML = this.df.label;
	this.input = $a(this.input_area, 'textarea','code_text');
	this.myid = 'code-'+codeid;
	this.input.setAttribute('id',this.myid);
	codeid++;

	this.input.setAttribute('wrap', 'off');
	this.input.set_input = function(v) {
		if(me.editor) {
			me.editor.setContent(v); // tinyMCE
		} else {
			me.input.value = v;
			me.input.innerHTML = v;
		}
	}
	this.input.onchange = function() {
		if(me.editor) {
			me.set(me.editor.getContent()); // tinyMCE
		} else {
			me.set(me.input.value);
		} 
		me.run_trigger();
	}
	this.get_value= function() {
		if(me.editor) {
			return me.editor.getContent(); // tinyMCE
		} else {
			return this.input.value;
		}
	}
	if(this.df.fieldtype=='Text Editor') {
		if(!tinymce_loaded) {
			tinymce_loaded = 1;
			tinyMCE_GZ.init({
				themes : "advanced",
				plugins : "style,table",
				languages : "en",
				disk_cache : true
			}, function() { me.setup_editor() });
		} else {
			this.setup_editor();
		}
	}
}
CodeField.prototype.set_disp = function(val) { 
	$y(this.disp_area, {width:'90%'})
	this.disp_area.innerHTML = '<textarea class="code_text" readonly=1>'+val+'</textarea>'; 
}
CodeField.prototype.setup_editor = function() { 
	var me = this;
	code_editors[me.df.fieldname] = me.input;
	// make the editor
	tinyMCE.init({
		theme : "advanced",
		mode : "exact",
		elements: this.myid,
		plugins:"table,style",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		theme_advanced_statusbar_location : "bottom",
		extended_valid_elements: "div[id|dir|class|align|style]",

		// w/h
		width: '100%',
		height: '360px',

		// buttons
		theme_advanced_buttons1 : "save,newdocument,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,styleselect,formatselect,fontselect,fontsizeselect",
		theme_advanced_buttons2 : "cut,copy,paste,pastetext,pasteword,|,search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,image,unlink,cleanup,help,code,|,forecolor,backcolor",
		theme_advanced_buttons3 : "tablecontrols,styleprops,|,hr,removeformat,visualaid,|,sub,sup,|,charmap,emotions,iespell,media,advhr,|,ltr,rtl",

		// framework integation
		init_instance_callback : "code_editors."+ this.df.fieldname+".editor_init_callback",
		onchange_callback : "code_editors."+ this.df.fieldname+".onchange"
	});
	this.input.editor_init_callback = function() {
		if(cur_frm)
			cur_frm.fields_dict[me.df.fieldname].editor = tinyMCE.get(me.myid);
	}
}

function TextField() { } TextField.prototype = new Field();
TextField.prototype.with_label = 1;
TextField.prototype.set_disp = function(val) { 
	this.disp_area.innerHTML = replace_newlines(val);
}
TextField.prototype.make_input = function() {
	var me = this; 
	
	if(this.in_grid)
		return; // do nothing, text dialog will take over
	
	this.input = $a(this.input_area, 'textarea');
	this.input.wrap = 'off';
	if(this.df.fieldtype=='Small Text')
		this.input.style.height = "80px";
	this.input.set_input = function(v) {
		me.input.value = v;
	}
	this.input.onchange = function() {
		me.set(me.input.value); 
		me.run_trigger();
	}
	this.get_value= function() {
		return this.input.value;
	}
}

// text dialog
function make_text_dialog() {
	var d = new Dialog(520,410);
	d.make_body([
		['Text', 'Enter Text'],
		['Button', 'Update']
	]);
	d.widgets['Update'].onclick = function() {
		var t = this.dialog;
		t.field.set(t.widgets['Enter Text'].value);
		t.hide();
	}
	d.onshow = function() {
		this.widgets['Enter Text'].style.height = '300px';
		var v = get_value(this.field.doctype,this.field.docname,this.field.df.fieldname);
		this.widgets['Enter Text'].value = v==null?'':v;
		this.widgets['Enter Text'].focus();
	}
	d.onhide = function() {
		if(grid_selected_cell)
			grid_selected_cell.grid.cell_deselect();
	}
	text_dialog = d;
}

TextField.prototype.table_refresh = function() {
	text_dialog.title_text.data = 'Enter text for "'+ this.df.label +'"';
	text_dialog.field = this;
	text_dialog.show();
}

// Table

function TableField() { } TableField.prototype = new Field();
TableField.prototype.make_body = function() {
	if(this.perm[this.df.permlevel] && this.perm[this.df.permlevel][READ]) {
		this.grid = new FormGrid(this);
		if(this.frm)this.frm.grids[this.frm.grids.length] = this;
		this.grid.make_buttons();
	}
}

TableField.prototype.refresh = function() {
	if(!this.grid)return;
	
	// hide / show grid
	var st = this.get_status();

	if(!this.df['default']) 
		this.df['default']='';

	this.grid.can_add_rows = false;
	this.grid.can_edit = false
	if(st=='Write') {
		if(cur_frm.editable && this.perm[this.df.permlevel] && this.perm[this.df.permlevel][WRITE]) {
			this.grid.can_edit = true;
			if(this.df['default'].toLowerCase()!='no toolbar')
				this.grid.can_add_rows = true;
		}
		if(cur_frm.editable 
			&& this.df.allow_on_submit 
				&& cur_frm.doc.docstatus == 1 
					&& this.df['default'].toLowerCase()!='no toolbar') {
				this.grid.can_add_rows = true;
				this.grid.can_edit = true;
		}
	}
	
	if(this.old_status!=st) {
		if(st=='Write') {
			// nothing
			this.grid.show();
		} else if(st=='Read') {
			this.grid.show();
		} else {
			this.grid.hide();
		}
		this.old_status = st; // save this if next time
	}

	this.grid.refresh();
}

TableField.prototype.set = function(v) { }; // nothing
TableField.prototype.set_input = function(v) { }; // nothing

// Select

function SelectField() { } SelectField.prototype = new Field();
SelectField.prototype.with_label = 1;
SelectField.prototype.make_input = function() { 
	var me = this;
	
	this.input = $a(this.input_area, 'select');
	if(isIE6 || isIE7) $y(this.input,{margin:'1px'}); //?? - wont show without this
	select_register[select_register.length] = this.input;
	var opt=[];
	
	if(this.in_filter && (!this.df.single_select)) {
		this.input.multiple = true;
		this.input.style.height = '4em';
		var lab = $a(this.input_area, 'div');
		lab.innerHTML = '(Use Ctrl+Click to select multiple or de-select)'
		lab.style.fontSize = '9px';
		lab.style.color = '#999';
	}

	this.input.onchange = function() {
		if(!me.in_filter) {
			if(me.validate)
				me.validate();
			me.set(me.input.options[me.input.selectedIndex].value); 
		}
		me.run_trigger();
	}
	
	this.refresh_options = function(options) {
		if(options)
			me.df.options = options;
		if(this.set_options == me.df.options) return; // no change	

		var opt = me.df.options?me.df.options.split('\n'):[];
		
		// add options
		var selectedflag = false;
		empty_select(this.input);

		for (var i=0; i<opt.length; i++) { 
			var cur_sel=false; 
			me.input.options[me.input.options.length] = new Option(opt[i], opt[i], false, cur_sel);
		}
		
		// set selected
		this.set_options = me.df.options;
	
	}
	
	this.onrefresh = function() {
		this.refresh_options();

		if(this.in_filter) {
			if(isIE) { // deselect all in IE
				this.input.selectedIndex = -1;
			}
			return;
		}
			
		var v = get_value(this.doctype,this.docname,this.df.fieldname);
		this.input.set_input(v);

	}
	this.in_options = function(v) {
		var opt = me.df.options?me.df.options.split('\n'):[];
		if(in_list(opt, v))
			return 1;
		else
			return 0;
	}
	
	this.input.set_input=function(v) {
		if(!v) {
			if(!me.in_filter) {
				if(me.docname) { // if called from onload without docname being set on fields
					me.input.selectedIndex = 0;
					me.set(sel_val(me.input));
				}
			}
		} else {
			if(me.in_options(v))
				me.input.value = v;
			else {
				if(!me.df.options) {
					me.df.options = '\n'+v;
					me.refresh_options();
				}
				me.input.value = v;
			}
		}
	}
	this.get_value= function() {
		if(me.in_filter) {	
			var l = [];
			for(var i=0;i<me.input.options.length; i++ ) {
				if(me.input.options[i].selected)l[l.length] = me.input.options[i].value;
			}
			return l;
		} else {
			return sel_val(me.input);
		}
	}
	this.refresh();
}

// Time

function TimeField() { } TimeField.prototype = new Field();
TimeField.prototype.with_label = 1;

TimeField.prototype.get_time = function() {
	return time_to_hhmm(sel_val(this.input_hr), sel_val(this.input_mn), sel_val(this.input_am));
}
TimeField.prototype.set_time = function(v) {	
	//show_alert(ret);
	ret = time_to_ampm(v);
	this.input_hr.value = ret[0];
	this.input_mn.value = ret[1];
	this.input_am.value = ret[2];
}
TimeField.prototype.make_input = function() { var me = this;
	this.input = $a(this.input_area, 'div', 'time_field');
	this.input_hr = $a(this.input, 'select');
	this.input_mn = $a(this.input, 'select');
	this.input_am = $a(this.input, 'select');

	this.input_hr.isactive = 1; this.input_mn.isactive = 1; this.input_am.isactive = 1;

	select_register[select_register.length] = this.input_hr;
	select_register[select_register.length] = this.input_mn;
	select_register[select_register.length] = this.input_am;


	var opt_hr = ['1','2','3','4','5','6','7','8','9','10','11','12'];
	var opt_mn = ['00','05','10','15','20','25','30','35','40','45','50','55'];
	var opt_am = ['AM','PM'];

	add_sel_options(this.input_hr, opt_hr);
	add_sel_options(this.input_mn, opt_mn);
	add_sel_options(this.input_am, opt_am);

	var onchange_fn = function() {
		me.set(me.get_time()); 
		me.run_trigger();
	}
	
	this.input_hr.onchange = onchange_fn;
	this.input_mn.onchange = onchange_fn;
	this.input_am.onchange = onchange_fn;
	
	this.onrefresh = function() {
		var v = get_value(me.doctype,me.docname,me.df.fieldname);
		me.set_time(v);
		if(!v)
			me.set(me.get_time());
	}
	
	this.input.set_input=function(v) {
		if(v==null)v='';
		me.set_time(v);
	}

	this.get_value = function() {
		return this.get_time();
	}
	this.refresh();
}

TimeField.prototype.set_disp=function(v) {
	var t = time_to_ampm(v);
	var t = t[0]+':'+t[1]+' '+t[2];
	this.set_disp_html(t);
}

function make_field(docfield, doctype, parent, frm, in_grid, hide_label) { // Factory

	switch(docfield.fieldtype.toLowerCase()) {
		case 'data':var f = new DataField(); break;
		case 'password':var f = new DataField(); break;
		case 'int':var f = new IntField(); break;
		case 'float':var f = new FloatField(); break;
		case 'currency':var f = new CurrencyField(); break;
		case 'read only':var f = new ReadOnlyField(); break;
		case 'link':var f = new LinkField(); break;
		case 'date':var f = new DateField(); break;
		case 'time':var f = new TimeField(); break;
		case 'html':var f = new HTMLField(); break;
		case 'check':var f = new CheckField(); break;
		case 'button':var f = new ButtonField(); break;
		case 'text':var f = new TextField(); break;
		case 'small text':var f = new TextField(); break;
		case 'code':var f = new CodeField(); break;
		case 'text editor':var f = new CodeField(); break;
		case 'select':var f = new SelectField(); break;
		case 'table':var f = new TableField(); break;
		case 'section break':var f= new SectionBreak(); break;
		case 'column break':var f= new ColumnBreak(); break;
		case 'image':var f= new ImageField(); break;
	}

	f.parent 	= parent;
	f.doctype 	= doctype;
	f.df = docfield;
	f.perm = frm.perm;
	f.col_break_width = cur_col_break_width;

	if(in_grid) {
		f.in_grid = true;
		f.with_label = 0;
	}
	if(hide_label) {
		f.with_label = 0;
	}
	if(frm)
		f.frm = frm;
	f.make_body();
	return f;
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
// Grid
//


function FormGrid(field) {
	this.field = field;
	this.doctype = field.df.options;
		
	if(!this.doctype) {
		show_alert('No Options for table ' + field.df.label); 
	}
	
	this.col_break_width = cint(this.field.col_break_width);
	if(!this.col_break_width) this.col_break_width = 100;
	
	this.is_scrolltype = true;
	if(field.df['default'] && field.df['default'].toLowerCase() =='simple') this.is_scrolltype=false;
	this.init(field.parent, field.df.width);
	this.setup();
}

FormGrid.prototype = new Grid();

FormGrid.prototype.setup = function() {
	this.make_columns();
}

FormGrid.prototype.make_buttons = function() {
	var me = this;
	if(this.is_scrolltype) {
		this.tbar_btns = {};
		this.tbar_btns['Del'] = make_tbar_link($td(this.tbar_tab,0,0),'Del', function() { me.delete_row(); }, 'table_row_delete.gif',1);
		this.tbar_btns['Ins'] = make_tbar_link($td(this.tbar_tab,0,1),'Ins', function() { me.insert_row(); }, 'table_row_insert.gif',1);
		this.tbar_btns['Up'] = make_tbar_link($td(this.tbar_tab,0,2),'Up', function() { me.move_row(true); }, 'arrow_up.gif',1);
		this.tbar_btns['Dn'] = make_tbar_link($td(this.tbar_tab,0,3),'Dn', function() { me.move_row(false); }, 'arrow_down.gif',1);
		
		for(var i in this.btns)
			this.btns[i].isactive = true;
	} else {
		// new button
		this.btn_area.onclick = function() {
			// activate row,
			me.make_newrow(1);
			var dn = me.add_newrow();
			// edit record
			cur_grid = me;
			cur_grid_ridx = me.tab.rows.length - 1; // the last row is the fresh one
			edit_record(me.doctype, dn);
		}
	}
}

FormGrid.prototype.make_columns = function() {
	var gl = fields_list[this.field.df.options];

	if(!gl) {
		alert('Table details not found "'+this.field.df.options+'"');
	}

	var p = this.field.perm;
	for(var i=0;i<gl.length;i++) {
		if(p[this.field.df.permlevel] && p[this.field.df.permlevel][READ] && (!gl[i].hidden)) { // if read
			this.insert_column(this.field.df.options, gl[i].fieldname, gl[i].fieldtype, gl[i].label, gl[i].width, gl[i].options, this.field.perm, gl[i].reqd);
		}
	}
	
	if(!this.is_scrolltype) {
		// set width as percent
		for(var i=0;i<this.head_row.cells.length; i++) {
			var c = this.head_row.cells[i];
			$w(c,cint(cint(c.style.width) / this.total_width * 100)+'%')
		}
	}
}

FormGrid.prototype.set_column_label = function(fieldname, label) {
	for(var i=0;i<this.head_row.cells.length;i++) {
		var c = this.head_row.cells[i];
		if(c.fieldname == fieldname) {
			c.innerHTML = '<div class="grid_head_div">'+label+'</div>';
			c.cur_label = label;
			break;
		}
	}
}

FormGrid.prototype.refresh = function() {
	var docset = getchildren(this.doctype, this.field.frm.docname, this.field.df.fieldname, this.field.frm.doctype);
	var data = [];
	
	//alert(docset.length);
	for(var i=0; i<docset.length; i++) {
		locals[this.doctype][docset[i].name].idx = i+1;
		data[data.length] = docset[i].name;
	}
	this.set_data(data);
}

FormGrid.prototype.set_unsaved = function() {
	// set unsaved
	locals[cur_frm.doctype][cur_frm.docname].__unsaved=1;
	cur_frm.set_heading();	
}

FormGrid.prototype.insert_row = function() {
	var d = this.new_row_doc();
	var ci = grid_selected_cell.cellIndex;
	var row_idx = grid_selected_cell.row.rowIndex;
	d.idx = row_idx+1;
	for(var ri = row_idx; ri<this.tab.rows.length; ri++) {
		var r = this.tab.rows[ri];
		if(r.docname)
			locals[this.doctype][r.docname].idx++;
	}
	// refresh
	this.refresh();
	this.cell_select('', row_idx, ci);
	this.set_unsaved();
}

FormGrid.prototype.new_row_doc = function() {
	// create row doc
	var n = LocalDB.create(this.doctype);
	var d = locals[this.doctype][n];
	d.parent = this.field.frm.docname; 
	d.parentfield = this.field.df.fieldname;
	d.parenttype = this.field.frm.doctype;
	return d;
}
FormGrid.prototype.add_newrow = function() {
	var r = this.tab.rows[this.tab.rows.length - 1];
	if(!r.is_newrow)
		show_alert('fn: add_newrow: Adding a row which is not flagged as new');

	var d = this.new_row_doc();
	d.idx = r.rowIndex + 1;

	// set row
	r.docname = d.name;
	//r.cells[0].div.innerHTML = r.rowIndex + 1;
	r.is_newrow = false;
	this.set_cell_value(r.cells[0]);
	
	// one more
	this.make_newrow();
	this.refresh_row(r.rowIndex, d.name); // added 26-Mar-09
	
	if(this.onrowadd) this.onrowadd(cur_frm.doc, d.doctype, d.name);
	
	return d.name;
}

FormGrid.prototype.make_newrow = function(from_add_btn) {
	if(!this.can_add_rows) // No Addition
		return;
		
	if((!from_add_btn) && (this.field.df['default'].toLowerCase()=='simple')) return; // no empty row if simple
		
	// check if exists
	if(this.tab.rows.length) {
		var r = this.tab.rows[this.tab.rows.length - 1];
		if(r.is_newrow)
			return;
	}
	
	// make new
	var r = this.append_row();
	r.cells[0].div.innerHTML = '<b style="font-size: 18px;">*</b>';	
	r.is_newrow = true;
}

FormGrid.prototype.check_selected = function() {
	if(!grid_selected_cell) {
		show_alert('Select a cell first');
		return false;
	}
	if(grid_selected_cell.grid != this) {
		show_alert('Select a cell first');
		return false;
	}
	return true;
}

function delete_local(dt, dn)  {
	var d = locals[dt][dn];
	if(!d.__islocal) // newly created (not required to tag)
		d.__oldparent = d.parent;
	d.parent = 'old_parent:' + d.parent; // should be ..
	d.docstatus = 2;
	d.__deleted = 1;
	
}

FormGrid.prototype.delete_row = function(dt, dn) {
	if(dt && dn) {
		delete_local(dt, dn);
		this.refresh();	
	} else {
		if(!this.check_selected()) return;
		var r = grid_selected_cell.row;
		if(r.is_newrow)return;

		var ci = grid_selected_cell.cellIndex;
		var ri = grid_selected_cell.row.rowIndex;
		
		delete_local(this.doctype, r.docname);	
		
		this.refresh();
		if(ri < (this.tab.rows.length-2))
			this.cell_select(null, ri, ci);
		else grid_selected_cell = null;	
	}
	this.set_unsaved();
}

FormGrid.prototype.move_row = function(up) {
	
	if(!this.check_selected()) return;
	var r = grid_selected_cell.row;	
	if(r.is_newrow)return;

	if(up && r.rowIndex > 0) {
		var swap_row = this.tab.rows[r.rowIndex - 1];
	} else if (!up) {
		var len = this.tab.rows.length;
		if(this.tab.rows[len-1].is_newrow)
			len = len - 1;
		if(r.rowIndex < (len-1))
			var swap_row = this.tab.rows[r.rowIndex + 1];	
	}
	
	if(swap_row) {
		var cidx = grid_selected_cell.cellIndex;
		this.cell_deselect();

		// swap index
		var aidx = locals[this.doctype][r.docname].idx;
		locals[this.doctype][r.docname].idx = locals[this.doctype][swap_row.docname].idx; 
		locals[this.doctype][swap_row.docname].idx = aidx;

		// swap rows
		var adocname = swap_row.docname;
		this.refresh_row(swap_row.rowIndex, r.docname);
		this.refresh_row(r.rowIndex, adocname);

		this.cell_select(this.tab.rows[swap_row.rowIndex].cells[cidx]);
		
		this.set_unsaved();
	}
}


//
// Print
//
function print_make_field_tab(layout_cell) {
	var t = $a(layout_cell, 'table');
	$w(t, '100%');
	var r = t.insertRow(0); this.r = r;
	r.insertCell(0); r.insertCell(1);
	r.cells[0].className='datalabelcell';
	r.cells[1].className='datainputcell';
	return r
}


// start a layout


function print_std() {
	var dn = cur_frm.docname;
	var dt = cur_frm.doctype;
	var pf_list = [];

	function add_layout() {
		var l = new Layout();
		if(locals['DocType'][dt].print_outline=='Yes') l.with_border = 1;
		pf_list[pf_list.length]=l;
		return l;
	}

	var layout = add_layout();

	// add letter head
	var cp = locals['Control Panel']['Control Panel'];
	pf_list[pf_list.length-1].addrow();
	if (cp.letter_head) {
		pf_list[pf_list.length-1].cur_row.header.innerHTML = cp.letter_head;
	}

	// heading
	layout.cur_row.header.innerHTML += '<div style="font-size: 18px; font-weight: bold; margin: 8px;">'+dt+' : '+dn+'</div>';

	var fl = getchildren('DocField', dt, 'fields', 'DocType'); 

	if(fl[0]&&fl[0].fieldtype!="Section Break") {
		layout.addrow(); // default section break
		if(fl[0].fieldtype!="Column Break") // without column too
			layout.addcell(); 
	}

	for(var i=0;i<fl.length;i++) {
		var fn = fl[i].fieldname?fl[i].fieldname:fl[i].label;
		if(fn)
			var f = get_field(dt, fn, dn);
		else
			var f = fl[i];
			
		if(!cint(f.print_hide)){
			switch(f.fieldtype){
			 case 'Section Break':
				layout.addrow();
				if(fl[i+1]&&(fl[i+1].fieldtype!='Column Break')) {
					layout.addcell(); }
				if(f.label)
					layout.cur_row.header.innerHTML = '<div class="sectionHeading">'+f.label+'</div>';
				break;
			 case 'Column Break': 
				layout.addcell(f.width, f.label); 
				if(f.label)
					layout.cur_cell.header.innerHTML = '<div class="columnHeading">'+f.label+'</div>';
				break;
			 case 'Table': 
				var t = print_table(dt, dn,f.fieldname,f.options,null,null,null,null);
				if(t.appendChild) { 
					// one table only
					layout.cur_cell.appendChild(t);
				} else { 
			 		// multiple tables
					for(var ti=0;ti<t.length-1;ti++) {	
						// add to current page
						layout.cur_cell.appendChild(t[ti]);
						layout.close_borders();
						pf_list[pf_list.length] = '<div style="page-break-after: always;"></div>';
						
						// new page
						layout = add_layout();
						layout.addrow(); layout.addcell();
	
						var div = $a(layout.cur_cell, 'div');
						div.innerHTML = 'Continued from previous page...';
						div.style.padding = '4px';
					}
				 	// last table
					layout.cur_cell.appendChild(t[t.length-1]);
				}
			 	break;
			 case 'HTML': 
			 	var tmp = $a(layout.cur_cell, 'div');
			 	tmp.innerHTML = f.options;
			 	if(datatables[f.label])
			 		tmp.innerHTML = datatables[f.label].get_html();
			 	break;
			 case 'Code': 
			 	var tmp = $a(layout.cur_cell, 'div');
			 	var v=get_value(dt,dn,f.fieldname);
			 	tmp.innerHTML = '<div>'+ f.label + ': </div>'
			 		+ '<pre style="font-family: Courier, Fixed;">'+(v?v:'')+'</pre>';
			 	break;
			 default:
			 	// add cell data
				if(f.fieldtype!="Button"){
					r = print_make_field_tab(layout.cur_cell)
					// label
					r.cells[0].innerHTML=f.label?f.label:f.fieldname;
					
					$s(r.cells[1], get_value(dt,dn,f.fieldname), f.fieldtype);
				}
			}
		}
	}

	layout.close_borders();
	var html = '';
	for(var i=0;i<pf_list.length;i++) {
		if(pf_list[i].wrapper) {
			html += pf_list[i].wrapper.innerHTML;
		} else if(pf_list[i].innerHTML) {
			html += pf_list[i].innerHTML;
		} else {
			html += pf_list[i];
		}
	}

	pf_list = []; // cleanup
	return html;
}

var print_style= ".datalabelcell {padding: 2px;width: 38%;vertical-align:top; }"
	+".datainputcell { padding: 2px; width: 62%; text-align:left; }"
	+".sectionHeading { font-size: 16px; font-weight: bold; margin: 8px; }"
	+".columnHeading { font-size: 14px; font-weight: bold; margin: 8px 0px; }"
	+".sectionCell {padding: 3px; vertical-align: top; }"
	+".pagehead { font-size: 16px; font-weight: bold; font-family: verdana; padding: 2px 10px 10px 0px; }"		
	+".pagesubhead { font-size: 12px; font-weight: bold; font-family: verdana; padding: 2px 10px 10px 0px; }";

var def_print_style = "html, body{ font-family: Arial, Helvetica; font-size: 12px; }"
	+"\nbody { margin: 12px; }"
	+"td {padding: 2px;}"
	+"\npre { margin:0; padding:0;}"	
	+"\n.simpletable, .noborder { border-collapse: collapse; margin-bottom: 10px;}"
	+"\n.simpletable td {border: 1pt solid #000; vertical-align: top; }"
	+"\n.noborder td { vertical-align: top; }"
	+"\n.layout_row_table { width: 100%; }"

var print_formats = {}

function print_format(fmtname, onload) {
	if(!cur_frm) { alert('No Document Selected'); return; }
	var doc = locals[cur_frm.doctype][cur_frm.docname];
	if(fmtname=='Standard') {
		onload(print_makepage(print_std(), print_style, doc, doc.name));
	} else {
		if(! print_formats[fmtname]) // not loaded, get data
			$c('get_print_format', {'name':fmtname }, 
				function(r,t) { 
					print_formats[fmtname] = r.message;
					onload(print_makepage(print_formats[fmtname], '', doc, doc.name)); 
				}
			);
		else // loaded
			onload(print_makepage(print_formats[fmtname], '', doc, doc.name));	
	}
}

function print_makepage(body, style, doc, title) {
	var block = document.createElement('div');
	var tmp_html = '';
	block.innerHTML = body;

	if(doc && cint(doc.docstatus)==0 && cur_frm.perm[0][SUBMIT])  {
		var tmp_html = '<div style="text-align: center; padding: 4px; border: 1px solid #000"><div style="font-size: 20px;">Temporary</div>This box will go away after the document is submitted.</div>';
	}

	style = def_print_style + style;

	// run embedded javascript
	var jslist = block.getElementsByTagName('script');
	while(jslist.length>0) {
		for(var i=0; i<jslist.length; i++) {
			var code = jslist[i].innerHTML;
			var p = jslist[i].parentNode;
			var sp = $a(p, 'span');
			p.replaceChild(sp, jslist[i]);
			var h = eval(code); if(!h)h='';
			sp.innerHTML = h;
		}
		jslist = block.getElementsByTagName('script');
	}
	return '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">\n'
		+ '<html><head>'
		+'<title>'+title+'</title>'
		+'<style>'+style+'</style>'
		+'</head><body>'
		+tmp_html
		+ block.innerHTML
		+'</body></html>';
}

function print_go(html) {
	var w = window.open('');
	w.document.write(html);
	w.document.close();
}

function print_table(dt, dn, fieldname, tabletype, cols, head_labels, widths, condition, cssClass) {
	var fl = fields_list[tabletype];
	var ds = getchildren(tabletype, dn, fieldname, dt);
	var tl = [];
	
	var make_table = function(fl) {
		var w = document.createElement('div');
		var t = $a(w, 'table', (cssClass ? cssClass : 'simpletable'));
		t.wrapper = w;
		$w(t, '100%');
		
		// head row
		t.insertRow(0);
		var c_start = 0;
	 	if(fl[0]=='SR') {
			t.rows[0].insertCell(0).innerHTML = head_labels?head_labels[0]:' ';
	 		$w(t.rows[0].cells[0], '30px');
			c_start = 1;
		}

		for(var c=c_start;c<fl.length;c++) {
			var cell = t.rows[0].insertCell(c);
			if(head_labels)
				cell.innerHTML = head_labels[c];
			else
				cell.innerHTML = fl[c].label;
			if(fl[c].width)
				$w(cell, fl[c].width);
			if(widths)
				$w(cell, widths[c]);
			cell.style.fontWeight = 'bold';
		}
		return t;
	}
	
	// no headings if not entries
	
	if(!ds.length) return document.createElement('div');
		
	// make column list
	var newfl = [];
	if(cols&&cols.length) { // custom
		if(cols[0]=='SR')newfl[0]='SR';
		for(var i=0;i<cols.length;i++) {
			for(var j=0;j<fl.length;j++) {
				if(fl[j].fieldname==cols[i]) {
					newfl[newfl.length] = fl[j];
					break;
				}
			}
		}
	} else { // remove hidden cols
		newfl = ['SR']
		for(var j=0;j<fl.length;j++) {
			if(!fl[j].print_hide) {
				newfl[newfl.length] = fl[j];
			}
		}
	}
	fl = newfl;
	
	var t = make_table(fl);
	tl.push(t.wrapper);

	// setup for auto "Sr No" -> SR
	var c_start = 0;
	if(fl[0]=='SR') { c_start = 1; }
		
	// data
	var sr = 0;
	for(var r=0;r<ds.length;r++) {
		if((!condition)||(condition(ds[r]))) {

			// check for page break
			if(ds[r].page_break) { var t = make_table(fl); tl.push(t.wrapper); }

			var rowidx = t.rows.length; 
			sr++
			var row = t.insertRow(rowidx);
			if(c_start) { row.insertCell(0).innerHTML = sr; }
			
			// add values
			for(var c=c_start;c<fl.length;c++) {
				var cell = row.insertCell(c);
				$s(cell, ds[r][fl[c].fieldname], fl[c].fieldtype);
				if(fl[c].fieldtype=='Currency')
					cell.style.textAlign = 'right';
			}
		}
	}	
	if(tl.length>1) return tl; // multiple tables with page breakes
	else return tl[0];
}

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

// Grid

function Grid(parent) { }

Grid.prototype.init = function(parent, row_height) {
	
	this.alt_row_bg = '#F2F2FF';
	this.row_height = row_height;
	if(this.is_scrolltype) {
		if(!row_height)this.row_height = '26px';
		this.make_ui(parent);
	} else {
		this.make_ui_simple(parent);
	}
	// Sr No
	this.insert_column('', '', 'Int', 'Sr', '50px', '', [1,0,0]);
	this.total_width = 50;
	
	if(this.oninit)this.oninit();
}

Grid.prototype.make_ui = function(parent) { 

	var ht = make_table($a(parent, 'div'), 1, 2, '100%', ['60%','40%']);
	this.main_title = $td(ht,0,0); this.main_title.className = 'columnHeading';
	$td(ht,0,1).style.textAlign = 'right';
	this.tbar_div = $a($td(ht,0,1), 'div', 'grid_tbarlinks');
	this.tbar_tab = make_table(this.tbar_div,1,4,'100%',['25%','25%','25%','25%']);	
	
	this.wrapper = $a(parent, 'div', 'grid_wrapper');
	$h(this.wrapper, cint(pagewidth * 0.5) + 'px');

	this.head_wrapper = $a(this.wrapper, 'div', 'grid_head_wrapper');

	this.head_tab = $a(this.head_wrapper, 'table', 'grid_head_table');
	this.head_row = this.head_tab.insertRow(0);

	this.tab_wrapper = $a(this.wrapper, 'div', 'grid_tab_wrapper');	
	this.tab = $a(this.tab_wrapper, 'table', 'grid_table');

	var me = this;
	
	this.wrapper.onscroll = function() { me.head_wrapper.style.top = me.wrapper.scrollTop+'px'; }
}

Grid.prototype.make_ui_simple = function(parent) { 

	var ht = make_table($a(parent, 'div'), 1, 2, '100px', ['60%','40%']);

	this.main_title = $td(ht,0,0); this.main_title.className = 'columnHeading';
	$td(ht,0,1).style.textAlign = 'right';

	this.btn_area = $a(parent,'button','',{marginBottom:'8px', fontWeight:'bold'});
	this.btn_area.innerHTML = '+ Add Row';
	
	this.wrapper = $a(parent, 'div', 'grid_wrapper_simple');
	this.head_wrapper = $a(this.wrapper, 'div','grid_head_wrapper_simple');

	this.head_tab = $a(this.head_wrapper, 'table', 'grid_head_table');
	this.head_row = this.head_tab.insertRow(0);

	this.tab_wrapper = $a(this.wrapper, 'div','grid_tab_wrapper_simple');	
	this.tab = $a(this.tab_wrapper, 'table', 'grid_table');

	var me = this;	
}

Grid.prototype.show = function() { 
	$ds(this.wrapper);
	if(this.can_add_rows) {
		if(this.is_scrolltype)$ds(this.tbar_div);
		else $ds(this.btn_area);
	} else {
		if(this.is_scrolltype)$dh(this.tbar_div);
		else $dh(this.btn_area);
	}
}
Grid.prototype.hide = function() { 
	$dh(this.wrapper); $dh(this.tbar_div); 
}

Grid.prototype.insert_column = function(doctype, fieldname, fieldtype, label, width, options, perm, reqd) {
	
	var idx = this.head_row.cells.length;
	if(!width)width = '100px';
	
	var col = this.head_row.insertCell(idx);
	
	if(!this.is_scrolltype){ 
		col.style.padding = '2px';
		col.style.borderRight = '1px solid #AA9';
	}
	col.doctype = doctype; // for report (fields may be from diff doctypes)
	col.fieldname = fieldname;
	col.fieldtype = fieldtype;
	col.innerHTML = '<div>'+label+'</div>';
	col.label = label;
	if(reqd)
		col.childNodes[0].style.color = "#D22";
	
	this.total_width += cint(width);
	$w(col, width);
	
	col.orig_width = col.style.width;
	col.options = options;
	col.perm = perm;

}

Grid.prototype.set_column_disp = function(label, show) { 
	//alert(label);
	for(var i=0; i<this.head_row.cells.length; i++) {
		var c = this.head_row.cells[i];
		if(label && (c.label == label || c.cur_label == label)) {
			//alert(c.orig_width);
			if(show) {
				var w = c.orig_width;
				this.head_tab.style.width = (this.total_width + cint(w)) + 'px';
				this.tab.style.width = (this.total_width + cint(w)) + 'px';
			} else {
				var w = '0px';
				this.head_tab.style.width = (this.total_width - cint(c.orig_width)) + 'px';
				this.tab.style.width = (this.total_width - cint(c.orig_width)) + 'px';
			}
			$w(c, w);
			// change width of table too
			if(this.tab) {
				for(var j=0; j<this.tab.rows.length; j++) {
					var cell = this.tab.rows[j].cells[i];
					$w(cell, w);
					if(show) { $ds(cell.div); cell.div.style.padding = '2px'; }
					else { $dh(cell.div); cell.div.style.padding = '0px'; }
				}
			}
			break;
		}
	}
}

Grid.prototype.append_row = function(idx, docname) { 
	if(!idx)idx = this.tab.rows.length;
	var row = this.tab.insertRow(idx);
	row.docname = docname;
	
	if(idx % 2)var odd=true; else var odd=false;

	var me = this;
	// make cells
	for(var i=0; i<this.head_row.cells.length; i++){
		var cell = row.insertCell(i);
		var hc = this.head_row.cells[i];
		$w(cell, hc.style.width);
		cell.row = row;
		cell.grid = this;
		if(this.is_scrolltype)	cell.className = 'grid_cell';
		else					cell.className = 'grid_cell_simple';

		cell.div = $a(cell, 'div', 'grid_cell_div');
		if(this.row_height) {
			cell.div.style.height = this.row_height; }
		cell.div.cell = cell;
		cell.div.onclick = function(e) { me.cell_click(this.cell, e); }

		if(odd) {
			$bg(cell, this.alt_row_bg); cell.is_odd = 1;
			cell.div.style.border = '2px solid ' + this.alt_row_bg;
		} else $bg(cell,'#FFF');

		if(!hc.fieldname) cell.div.style.cursor = 'default'; // Index
	}

	if(this.is_scrolltype)this.set_ht();

	return row;	
}

Grid.prototype.refresh_cell = function(docname, fieldname) {
	for(var r=0;r<this.tab.rows.length;r++) {
		if(this.tab.rows[r].docname==docname) {
			for(var c=0;c<this.head_row.cells.length;c++) {
				var hc = this.head_row.cells[c];
				if(hc.fieldname==fieldname) {
					this.set_cell_value(this.tab.rows[r].cells[c]);
				}
			}
		}
	}
}

var cur_grid; var cur_grid_ridx; // for form edit
Grid.prototype.set_cell_value = function(cell) {
	// if newrow
	if(cell.row.is_newrow)return;

	// show static
	var hc = this.head_row.cells[cell.cellIndex];
	
	if(hc.fieldname) {
		var v = locals[hc.doctype][cell.row.docname][hc.fieldname];
	} else {
		var v = (cell.row.rowIndex + 1); // Index
	}
	
	if(v==null){ v=''; }
	var me = this;
	
	// variations
	if(cell.cellIndex) {
		var ft = hc.fieldtype;
		if(ft=='Link' && cur_frm.doc.docstatus < 1) ft='Data';
		$s(cell.div, v, ft, hc.options);
	} else {
		// Index column
		cell.div.style.padding = '2px';
		cell.div.style.textAlign = 'left';
		cell.innerHTML = '';

		var t = make_table(cell,1,3,'60px',['20px','20px','20px'],{verticalAlign: 'middle', padding:'2px'});
		$y($td(t,0,0),{paddingLeft:'4px'});
		$td(t,0,0).innerHTML = cell.row.rowIndex + 1;

		if(cur_frm.editable && this.can_edit) {

			var ed = $a($td(t,0,1),'img','',{cursor:'pointer'}); ed.cell = cell; ed.title = 'Edit Row';
			ed.src = 'images/icons/page.gif'; ed.onclick = function() { 
				cur_grid = me;
				cur_grid_ridx = this.cell.row.rowIndex;
				edit_record(me.doctype, this.cell.row.docname);				
			}
			
			if(!me.is_scrolltype) {
				var ca = $a($td(t,0,2),'img','',{cursor:'pointer'});
				ca.cell = cell; ca.title = 'Delete Row';
				ca.src = 'images/icons/cancel.gif'; ca.onclick = function() {
					me.delete_row(me.doctype, this.cell.row.docname);
				}
			}
		} else {
			cell.div.innerHTML = (cell.row.rowIndex + 1);
			cell.div.style.cursor = 'default';
			cell.div.onclick = function() { }
		}
	}
}

Grid.prototype.cell_click = function(cell, e) {
	if(grid_selected_cell==cell)
		return; // on existing cell
		
	this.cell_select(cell);
	if(cur_frm.editable) {
		if(isIE) {
			window.event.cancelBubble = true;
			window.event.returnValue = false;
		} else {
			e.preventDefault();	
		}
	}
}

function grid_click_event(e, target) {
	if(grid_selected_cell && !target.isactive) {
		if(!text_dialog.display && !selector.display) {
			grid_selected_cell.grid.cell_deselect();
		}
	}
}

Grid.prototype.cell_deselect = function() {
	if(grid_selected_cell) {
		var c = grid_selected_cell;
		c.grid.remove_template(c);
		c.div.className = 'grid_cell_div';
		if(c.is_odd) c.div.style.border = '2px solid ' + c.grid.alt_row_bg;
		else c.div.style.border = '2px solid #FFF';
		grid_selected_cell = null;
		cur_grid = null;
		this.isactive = false;
	}
}

Grid.prototype.cell_select = function(cell, ri, ci) {
	if(ri!=null && ci!=null)
		cell = this.tab.rows[ri].cells[ci];
	
	var hc = this.head_row.cells[cell.cellIndex];

	if(!hc.template) {
		this.make_template(hc);
	}

	hc.template.perm = this.field ? this.field.perm : hc.perm; // get latest permissions

	if(hc.fieldname && hc.template.get_status()=='Write') {
		this.cell_deselect();
		cell.div.style.border = '2px solid #88F';
		grid_selected_cell = cell;
		this.add_template(cell);
		this.isactive = true;
	}
}

Grid.prototype.add_template = function(cell) {
	if(!cell.row.docname && this.add_newrow) { // activate new row here
		this.add_newrow();
		this.cell_select(cell);
	} else {
		var hc = this.head_row.cells[cell.cellIndex];
		cell.div.innerHTML = '';
		cell.div.appendChild(hc.template.wrapper);
		hc.template.activate(cell.row.docname);
		hc.template.activated=1;
	}
}

Grid.prototype.get_field = function(fieldname) { // get template
	for(var i=0;i<this.head_row.cells.length;i++) {
		var hc = this.head_row.cells[i];
		if(hc.fieldname == fieldname) {
			if(!hc.template) {
				this.make_template(hc);
			}
			return hc.template;
		}
	}
	return {} // did not find, return empty object not to throw error in get_query
}


grid_date_cell = '';
function grid_refresh_date() {
	grid_date_cell.grid.set_cell_value(grid_date_cell);
}
function grid_refresh_field(temp, input) {
	if(input.value!=get_value(temp.doctype, temp.docname, temp.df.fieldname))
		if(input.onchange)input.onchange();
}

Grid.prototype.remove_template = function(cell) {
	var hc = this.head_row.cells[cell.cellIndex];

	if(!hc.template)return;
	if(!hc.template.activated)return;

	if(hc.template.txt) {
		if(hc.template.df.fieldtype=='Date') {
			// for calendar popup. the value will come after this
			grid_date_cell = cell;
			setTimeout('grid_refresh_date()', 100);
		}
		if(hc.template.txt.value)
		grid_refresh_field(hc.template, hc.template.txt);
		
	} else if(hc.template.input) {
		grid_refresh_field(hc.template, hc.template.input);		
	}

	if(hc.template && hc.template.wrapper.parentNode)
		cell.div.removeChild(hc.template.wrapper);
	this.set_cell_value(cell);
	hc.template.activated=0;

}

Grid.prototype.cell_keypress = function(e, keycode) {
	if(keycode>=37 && keycode<=40 && e.shiftKey) {
		if(text_dialog && text_dialog.display) {
			return;
		}
	} else 
		return;

	if(!grid_selected_cell) return;
	var ri = grid_selected_cell.row.rowIndex;
	var ci = grid_selected_cell.cellIndex;
	switch(keycode) {
		case 38: // up
			if (ri > 0) {
				this.cell_select('', ri - 1, ci);
			} break;
		case 40: // down
			if (ri < (this.tab.rows.length - 1)) {
				this.cell_select('', ri + 1, ci);
			} break;
		case 39: // right
			if (ci < (this.head_row.cells.length - 1)) {
				this.cell_select('', ri, ci + 1);
			} break;
		case 37: // left
			if (ci > 1) {
				this.cell_select('', ri, ci - 1);
			} break;
	}
}

Grid.prototype.make_template = function(hc) {
	hc.template = make_field(get_field(hc.doctype, hc.fieldname), hc.doctype, '', '', true);
	hc.template.grid = this;
}

Grid.prototype.append_rows = function(n) { for(var i=0;i<n;i++) this.append_row(); }
Grid.prototype.truncate_rows = function(n) { for(var i=0;i<n;i++) this.tab.deleteRow(this.tab.rows.length-1); }

Grid.prototype.set_data = function(data) {
	// data is list of docnames

	// deselect if not done yet
	this.cell_deselect();

	// set table widths
	if(this.is_scrolltype) {
		this.tab.style.width = this.total_width + 'px';
		this.head_tab.style.width = this.total_width + 'px';
	} else {
		this.tab.style.width = '100%';
		this.head_tab.style.width = '100%';
	}
	// append if reqd
	if(data.length > this.tab.rows.length)
		this.append_rows(data.length - this.tab.rows.length);

	// truncate if reqd
	if(data.length < this.tab.rows.length)
		this.truncate_rows(this.tab.rows.length - data.length);

	// set data
	for(var ridx=0;ridx<data.length;ridx++) {
		this.refresh_row(ridx, data[ridx]);
	}
	
	if(this.can_add_rows && this.make_newrow) {
		this.make_newrow();
	}
	
	if(this.is_scrolltype)this.set_ht();
	
	if(this.wrapper.onscroll)this.wrapper.onscroll();
}

Grid.prototype.set_ht = function(ridx, docname) {
	var ht = ((cint(this.row_height) + 10) * (((this.tab && this.tab.rows) ? this.tab.rows.length : 0) + 1));
	if(ht < 100)ht=100; 
	if(ht > cint(0.3 * pagewidth))ht=cint(0.3 * pagewidth);
	ht += 4;
	$y(this.wrapper,{height:ht+'px'});
}

Grid.prototype.refresh_row = function(ridx, docname) {
	var row = this.tab.rows[ridx];
	row.docname = docname;
	row.is_newrow = false;
		
	for(var cidx=0; cidx<row.cells.length; cidx++) {
		this.set_cell_value(row.cells[cidx]);
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

//----------------------------------------------------------------------------
// Author: Matt Kruse <matt@mattkruse.com>
// WWW: http://www.mattkruse.com/

var popup_list = [];
var cal_displayed = 0;

var MONTH_NAMES=new Array('January','February','March','April','May','June','July','August','September','October','November','December','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec');
var DAY_NAMES=new Array('Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sun','Mon','Tue','Wed','Thu','Fri','Sat');
function LZ(x) {return(x<0||x>9?"":"0")+x}

function isDate(val,format) {
	var date=getDateFromFormat(val,format);
	if (date==0) { return false; }
	return true;
	}

// compareDates(date1,date1format,date2,date2format)
function compareDates(date1,dateformat1,date2,dateformat2) {
	var d1=getDateFromFormat(date1,dateformat1);
	var d2=getDateFromFormat(date2,dateformat2);
	if (d1==0 || d2==0) return -1;
	else if (d1 > d2) return 1;
	return 0;
	}

// formatDate (date_object, format)
// ------------------------------------------------------------------
function formatDate(date,format) {
	format=format+"";
	var result="";
	var i_format=0;
	var c="";
	var token="";
	var y=date.getYear()+"";
	var M=date.getMonth()+1;
	var d=date.getDate();
	var E=date.getDay();
	var H=date.getHours();
	var m=date.getMinutes();
	var s=date.getSeconds();
	var yyyy,yy,MMM,MM,dd,hh,h,mm,ss,ampm,HH,H,KK,K,kk,k;
	// Convert real date parts into formatted versions
	var value=new Object();
	if (y.length < 4) {y=""+(y-0+1900);}
	value["y"]=""+y;
	value["yyyy"]=y;
	value["yy"]=y.substring(2,4);
	value["M"]=M;
	value["MM"]=LZ(M);
	value["MMM"]=MONTH_NAMES[M-1];
	value["NNN"]=MONTH_NAMES[M+11];
	value["d"]=d;
	value["dd"]=LZ(d);
	while (i_format < format.length) {
		c=format.charAt(i_format);
		token="";
		while ((format.charAt(i_format)==c) && (i_format < format.length)) {
			token += format.charAt(i_format++);
			}
		if (value[token] != null) { result=result + value[token]; }
		else { result=result + token; }
		}
	return result;
	}
	
// Utility functions for parsing in getDateFromFormat()
// ------------------------------------------------------------------
function _isInteger(val) {
	var digits="1234567890";
	for (var i=0; i < val.length; i++) {
		if (digits.indexOf(val.charAt(i))==-1) { return false; }
		}
	return true;
	}
function _getInt(str,i,minlength,maxlength) {
	for (var x=maxlength; x>=minlength; x--) {
		var token=str.substring(i,i+x);
		if (token.length < minlength) { return null; }
		if (_isInteger(token)) { return token; }
		}
	return null;
	}

function getDateFromFormat(val,format) {
	val=val+"";
	format=format+"";
	var i_val=0;
	var i_format=0;
	var c="";
	var token="";
	var token2="";
	var x,y;
	var now=new Date();
	var year=now.getYear();
	var month=now.getMonth()+1;
	var date=1;
	var hh=now.getHours();
	var mm=now.getMinutes();
	var ss=now.getSeconds();
	var ampm="";
	
	while (i_format < format.length) {
		// Get next token from format string
		c=format.charAt(i_format);
		token="";
		while ((format.charAt(i_format)==c) && (i_format < format.length)) {
			token += format.charAt(i_format++);
			}
		// Extract contents of value based on format token
		if (token=="yyyy" || token=="yy" || token=="y") {
			if (token=="yyyy") { x=4;y=4; }
			if (token=="yy")   { x=2;y=2; }
			if (token=="y")    { x=2;y=4; }
			year=_getInt(val,i_val,x,y);
			if (year==null) { return 0; }
			i_val += year.length;
			if (year.length==2) {
				if (year > 70) { year=1900+(year-0); }
				else { year=2000+(year-0); }
				}
			}
		else if (token=="MM"||token=="M") {
			month=_getInt(val,i_val,token.length,2);
			if(month==null||(month<1)||(month>12)){return 0;}
			i_val+=month.length;}
		else if (token=="dd"||token=="d") {
			date=_getInt(val,i_val,token.length,2);
			if(date==null||(date<1)||(date>31)){return 0;}
			i_val+=date.length;}
		else if (token=="mm"||token=="m") {
			mm=_getInt(val,i_val,token.length,2);
			if(mm==null||(mm<0)||(mm>59)){return 0;}
			i_val+=mm.length;}
		else {
			if (val.substring(i_val,i_val+token.length)!=token) {return 0;}
			else {i_val+=token.length;}
			}
		}
	// If there are any trailing characters left in the value, it doesn't match
	if (i_val != val.length) { return 0; }
	// Is date valid for month?
	if (month==2) {
		// Check for leap year
		if ( ( (year%4==0)&&(year%100 != 0) ) || (year%400==0) ) { // leap year
			if (date > 29){ return 0; }
			}
		else { if (date > 28) { return 0; } }
		}
	if ((month==4)||(month==6)||(month==9)||(month==11)) {
		if (date > 30) { return 0; }
		}
	// Correct hours value
	if (hh<12 && ampm=="PM") { hh=hh-0+12; }
	else if (hh>11 && ampm=="AM") { hh-=12; }
	var newdate=new Date(year,month-1,date,hh,mm,ss);
	return newdate.getTime();
	}

function parseDate(val) {
	var preferEuro=(arguments.length==2)?arguments[1]:false;
	generalFormats=new Array('y-M-d','MMM d, y','MMM d,y','y-MMM-d','d-MMM-y','MMM d');
	monthFirst=new Array('M/d/y','M-d-y','M.d.y','MMM-d','M/d','M-d');
	dateFirst =new Array('d/M/y','d-M-y','d.M.y','d-MMM','d/M','d-M');
	var checkList=new Array('generalFormats',preferEuro?'dateFirst':'monthFirst',preferEuro?'monthFirst':'dateFirst');
	var d=null;
	for (var i=0; i<checkList.length; i++) {
		var l=window[checkList[i]];
		for (var j=0; j<l.length; j++) {
			d=getDateFromFormat(val,l[j]);
			if (d!=0) { return new Date(d); }
			}
		}
	return null;
	}

// Set the position of the popup window based on the anchor
function PopupWindow_getXYPosition(anchorname) {
	var coordinates = objpos(anchorname);
	this.x = coordinates.x;
	this.y = coordinates.y;
	}
// Set width/height of DIV/popup window
function PopupWindow_setSize(width,height) {
	this.width = width;
	this.height = height;
	}
// Fill the window with contents
function PopupWindow_populate(contents) {
	this.contents = contents;
	this.populated = false;
	}
// Set the URL to go to
function PopupWindow_setUrl(url) {
	this.url = url;
	}
// Refresh the displayed contents of the popup
function PopupWindow_refresh() {
	if(this.divName) 
		$i(this.divName).innerHTML = this.contents;
		$i(this.divName).style.visibility = "visible";
		cal_displayed = 1;
	}
// Position and show the popup, relative to an anchor object
function PopupWindow_showPopup(anchorname, inputobj) {
	this.getXYPosition(inputobj);
	this.x += this.offsetX;
	this.y += this.offsetY;
	if (!this.populated && (this.contents != "")) {
		this.populated = true;
		this.refresh();
		}
	if (this.divName != null) {
		// Show the DIV object
		$i(this.divName).style.left = this.x + "px";
		$i(this.divName).style.top = this.y + "px";
		$i(this.divName).style.visibility = "visible";
		cal_displayed = 1;
		}
	}
// Hide the popup
function PopupWindow_hidePopup() {
	if (this.divName&&$i(this.divName)) {
		$i(this.divName).style.visibility = "hidden";
		cal_displayed = 0;
	}
	else {
		if (this.popupWindow && !this.popupWindow.closed) {
			this.popupWindow.close();
			this.popupWindow = null;
			cal_displayed = 0;			
		}
	}
}

// Check an onMouseDown event to see if we should hide
function PopupWindow_hideIfNotClicked(e) { this.hidePopup(); }

// Run this immediately to attach the event listener
// CONSTRUCTOR for the PopupWindow object
// Pass it a DIV name to use a DHTML popup, otherwise will default to window popup
function PopupWindow() {
	//attachListener();
	this.index = popup_list.length;
	popup_list[popup_list.length] = this;
	this.divName = null;
	this.popupWindow = null;
	this.width=0;
	this.height=0;
	this.populated = false;
	this.visible = false;
	
	this.contents = "";
	this.url="";
	if (arguments.length>0) {
		this.type="DIV";
		this.divName = arguments[0];}
	else {
		this.type="WINDOW";
		}
	this.use_byId = true;
	this.use_css = false;
	this.use_layers = false;
	this.offsetX = 0;
	this.offsetY = 0;
	// Method mappings
	this.getXYPosition = PopupWindow_getXYPosition;
	this.populate = PopupWindow_populate;
	this.setUrl = PopupWindow_setUrl;
	this.refresh = PopupWindow_refresh;
	this.showPopup = PopupWindow_showPopup;
	this.hidePopup = PopupWindow_hidePopup;
	this.setSize = PopupWindow_setSize;
	this.hideIfNotClicked = PopupWindow_hideIfNotClicked;
	}

/* SOURCE FILE: CalendarPopup.js */

/* 
DESCRIPTION: This object implements a popup calendar to allow the user to
select a date, month, quarter, or year.
*/ 

// CONSTRUCTOR for the CalendarPopup Object
function CalendarPopup() {
	var c;
	if (arguments.length>0) {
		c = new PopupWindow(arguments[0]);}
	else {
		c = new PopupWindow();
		c.setSize(150,175);
		}
	c.offsetX = 0;
	c.offsetY = 25;
	// Calendar-specific properties
	c.monthNames = new Array("January","February","March","April","May","June","July","August","September","October","November","December");
	c.monthAbbreviations = new Array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");
	c.dayHeaders = new Array("S","M","T","W","T","F","S");
	c.returnFunction = "CP_tmpReturnFunction";
	c.returnMonthFunction = "CP_tmpReturnMonthFunction";
	c.returnQuarterFunction = "CP_tmpReturnQuarterFunction";
	c.returnYearFunction = "CP_tmpReturnYearFunction";
	c.weekStartDay = 0;
	c.isShowYearNavigation = false;
	c.displayType = "date";
	c.disabledDatesExpression = "";
	c.yearSelectStartOffset = 2;
	c.currentDate = null;
	c.todayText="Today";
	c.cssPrefix="";
	window.CP_calendarObject = null;
	window.CP_targetInput = null;
	window.CP_dateFormat = "MM/dd/yyyy";
	// Method mappings
	c.copyMonthNamesToWindow = CP_copyMonthNamesToWindow;
	c.setReturnFunction = CP_setReturnFunction;
	c.setReturnMonthFunction = CP_setReturnMonthFunction;
	c.setReturnQuarterFunction = CP_setReturnQuarterFunction;
	c.setReturnYearFunction = CP_setReturnYearFunction;
	c.setMonthNames = CP_setMonthNames;
	c.setMonthAbbreviations = CP_setMonthAbbreviations;
	c.setDayHeaders = CP_setDayHeaders;
	c.setWeekStartDay = CP_setWeekStartDay;
	c.setDisplayType = CP_setDisplayType;
	c.setYearSelectStartOffset = CP_setYearSelectStartOffset;
	c.setTodayText = CP_setTodayText;
	c.showYearNavigation = CP_showYearNavigation;
	c.showCalendar = CP_showCalendar;
	c.hideCalendar = CP_hideCalendar;
	c.refreshCalendar = CP_refreshCalendar;
	c.getCalendar = CP_getCalendar;
	c.select = CP_select;
	c.setCssPrefix = CP_setCssPrefix;
	c.copyMonthNamesToWindow();
	// Return the object
	return c;
	}
function CP_copyMonthNamesToWindow() {
	// Copy these values over to the date.js 
	if (typeof(window.MONTH_NAMES)!="undefined" && window.MONTH_NAMES!=null) {
		window.MONTH_NAMES = new Array();
		for (var i=0; i<this.monthNames.length; i++) {
			window.MONTH_NAMES[window.MONTH_NAMES.length] = this.monthNames[i];
		}
		for (var i=0; i<this.monthAbbreviations.length; i++) {
			window.MONTH_NAMES[window.MONTH_NAMES.length] = this.monthAbbreviations[i];
		}
	}
}
// Temporary default functions to be called when items clicked, so no error is thrown
var cal_clicked = 0;
function CP_tmpReturnFunction(y,m,d) { 
	cal_clicked = 1;
	if (window.CP_targetInput!=null) {
		var dt = new Date(y,m-1,d,0,0,0);
		if (window.CP_calendarObject!=null) { window.CP_calendarObject.copyMonthNamesToWindow(); }
		window.CP_targetInput.value = formatDate(dt,window.CP_dateFormat);
		window.CP_targetInput.onchange() // RM - call onchange function
		}
	}

// Set the name of the functions to call to get the clicked item
function CP_setReturnFunction(name) { this.returnFunction = name; }
function CP_setReturnMonthFunction(name) { this.returnMonthFunction = name; }
function CP_setReturnQuarterFunction(name) { this.returnQuarterFunction = name; }
function CP_setReturnYearFunction(name) { this.returnYearFunction = name; }

// Over-ride the built-in month names
function CP_setMonthNames() {
	for (var i=0; i<arguments.length; i++) { this.monthNames[i] = arguments[i]; }
	this.copyMonthNamesToWindow();}

// Over-ride the built-in month abbreviations
function CP_setMonthAbbreviations() {
	for (var i=0; i<arguments.length; i++) { this.monthAbbreviations[i] = arguments[i]; }
	this.copyMonthNamesToWindow();}

// Over-ride the built-in column headers for each day
function CP_setDayHeaders() {
	for (var i=0; i<arguments.length; i++) { this.dayHeaders[i] = arguments[i]; }
	}

// Set the day of the week (0-7) that the calendar display starts on
// This is for countries other than the US whose calendar displays start on Monday(1), for example
function CP_setWeekStartDay(day) { this.weekStartDay = day; }

// Show next/last year navigation links
function CP_showYearNavigation() { this.isShowYearNavigation = (arguments.length>0)?arguments[0]:true; }

// Which type of calendar to display
function CP_setDisplayType(type) {
	if (type!="date"&&type!="week-end"&&type!="month"&&type!="quarter"&&type!="year") { alert("Invalid display type! Must be one of: date,week-end,month,quarter,year"); return false; }
	this.displayType=type;
	}

// How many years back to start by default for year display
function CP_setYearSelectStartOffset(num) { this.yearSelectStartOffset=num; }
		
// Set the text to use for the "Today" link
function CP_setTodayText(text) {this.todayText = text;}

// Set the prefix to be added to all CSS classes when writing output
function CP_setCssPrefix(val) { this.cssPrefix = val; }

// Hide a calendar object
function CP_hideCalendar() {
	if (arguments.length > 0) { window.popup_list[arguments[0]].hidePopup(); }
	else { this.hidePopup(); }
	}

// Refresh the contents of the calendar display
function CP_refreshCalendar(index) {
	var calObject = window.popup_list[index];
	if (arguments.length>1) { 
		calObject.populate(calObject.getCalendar(arguments[1],arguments[2],arguments[3],arguments[4],arguments[5]));
		}
	else {calObject.populate(calObject.getCalendar());}
	calObject.refresh();
	}

// Populate the calendar and display it
function CP_showCalendar(anchorname, inputobj) {
	//if (arguments.length>1) {
	//	if (arguments[1]==null||arguments[1]=="") {this.currentDate=new Date();}
	//	else { this.currentDate=new Date(parseDate(arguments[1])); }
	//}
	this.populate(this.getCalendar());
	this.showPopup(anchorname, inputobj); }

// Simple method to interface popup calendar with a text-entry box
function CP_select(inputobj, linkname, format) {
	var selectedDate=(arguments.length>3)?arguments[3]:null;
	if (inputobj.disabled) { return; } // Can't use calendar input on disabled form input!
	window.CP_targetInput = inputobj;window.CP_calendarObject = this;
	this.currentDate=null; var time=0;
	if (selectedDate!=null) { time = getDateFromFormat(selectedDate,format) }
	else if (inputobj.value!="") { time = getDateFromFormat(inputobj.value,format); }
	if (selectedDate!=null || inputobj.value!="") {
		if (time==0) { this.currentDate=null; }
		else { this.currentDate=new Date(time); }
	}
	window.CP_dateFormat = format;
	
	this.showCalendar(linkname, inputobj); }

// Return a string containing all the calendar code to be displayed
function CP_getCalendar() {
	var now = new Date();
	// Reference to window
	var windowref = "";
	var result = "";
	// If POPUP, write entire HTML document
	
	result += '<TABLE CLASS="cpBorder" WIDTH=144 BORDER=1 BORDERWIDTH=1 CELLSPACING=0 CELLPADDING=1>\n';
	result += '<TR><TD ALIGN=CENTER><CENTER>\n';
	
	// Code for DATE display (default)
	// -------------------------------
	if (this.displayType=="date" || this.displayType=="week-end") {
		if (this.currentDate==null) { this.currentDate = now; }
		if (arguments.length > 0) { var month = arguments[0]; }
			else { var month = this.currentDate.getMonth()+1; }
		if (arguments.length > 1 && arguments[1]>0 && arguments[1]-0==arguments[1]) { var year = arguments[1]; }
			else { var year = this.currentDate.getFullYear(); }
		var daysinmonth= new Array(0,31,28,31,30,31,30,31,31,30,31,30,31);
		if ( ( (year%4 == 0)&&(year%100 != 0) ) || (year%400 == 0) ) {
			daysinmonth[2] = 29;
			}
		var current_month = new Date(year,month-1,1);
		var display_year = year;
		var display_month = month;
		var display_date = 1;
		var weekday= current_month.getDay();
		var offset = 0;
		
		offset = (weekday >= this.weekStartDay) ? weekday-this.weekStartDay : 7-this.weekStartDay+weekday ;
		if (offset > 0) {
			display_month--;
			if (display_month < 1) { display_month = 12; display_year--; }
			display_date = daysinmonth[display_month]-offset+1;
			}
		var next_month = month+1;
		var next_month_year = year;
		if (next_month > 12) { next_month=1; next_month_year++; }
		var last_month = month-1;
		var last_month_year = year;
		if (last_month < 1) { last_month=12; last_month_year--; }
		var date_class;
		result += "<TABLE WIDTH=144 BORDER=0 BORDERWIDTH=0 CELLSPACING=0 CELLPADDING=0>";
		result += '<TR>\n';
		var refresh = windowref+'CP_refreshCalendar';
		var refreshLink = 'javascript:' + refresh;
		result += '<TD CLASS="cpMonthNavigation" WIDTH="22"><A CLASS="cpMonthNavigation" HREF="'+refreshLink+'('+this.index+','+last_month+','+last_month_year+');">&lt;&lt;</A></TD>\n';
		result += '<TD CLASS="cpMonthNavigation" WIDTH="100"><SPAN CLASS="cpMonthNavigation">'+this.monthNames[month-1]+' '+year+'</SPAN></TD>\n';
		result += '<TD CLASS="cpMonthNavigation" WIDTH="22"><A CLASS="cpMonthNavigation" HREF="'+refreshLink+'('+this.index+','+next_month+','+next_month_year+');">&gt;&gt;</A></TD>\n';

		result += '</TR></TABLE>\n';
		result += '<TABLE style="width:120px" BORDER=0 CELLSPACING=0 CELLPADDING=1 ALIGN=CENTER>\n';
		result += '<TR>\n';
		for (var j=0; j<7; j++) {
			result += '<TD CLASS="cpDayColumnHeader" WIDTH="14%"><SPAN CLASS="cpDayColumnHeader">'+this.dayHeaders[(this.weekStartDay+j)%7]+'</TD>\n';
			}
		result += '</TR>\n';
		for (var row=1; row<=6; row++) {
			result += '<TR>\n';
			for (var col=1; col<=7; col++) {
				var disabled=false;
				var dateClass = "";
				if ((display_month == this.currentDate.getMonth()+1) && (display_date==this.currentDate.getDate()) && (display_year==this.currentDate.getFullYear())) {
					dateClass = "cpCurrentDate";
					}
				else if (display_month == month) {dateClass = "cpCurrentMonthDate";}
				else {dateClass = "cpOtherMonthDate";}
				var selected_date = display_date;
				var selected_month = display_month;
				var selected_year = display_year;
				result += '	<TD CLASS="'+this.cssPrefix+dateClass+'"><A HREF="javascript:'+windowref+this.returnFunction+'('+selected_year+','+selected_month+','+selected_date+');'+windowref+'CP_hideCalendar(\''+this.index+'\');" CLASS="'+this.cssPrefix+dateClass+'">'+display_date+'</A></TD>\n';
				display_date++;
				if (display_date > daysinmonth[display_month]) {display_date=1;display_month++;}
				if (display_month > 12) {display_month=1;display_year++;}
				}
			result += '</TR>';
			}
		var current_weekday = now.getDay() - this.weekStartDay;
		if (current_weekday < 0) {current_weekday += 7;}
		result += '<TR>\n<TD COLSPAN=7 ALIGN=CENTER CLASS="cpTodayText">\n<A CLASS="cpTodayText" HREF="javascript:'+windowref+this.returnFunction+'(\''+now.getFullYear()+'\',\''+(now.getMonth()+1)+'\',\''+now.getDate()+'\');'+windowref+'CP_hideCalendar(\''+this.index+'\');">'+this.todayText+'</A>\n';
		result += '<BR></TD></TR></TABLE></CENTER></TD></TR></TABLE>\n';
	}
	return result;
	}

