_f.FrmContainer = function() {  
	this.wrapper = page_body.add_page("Forms", function() {});
	
	// create hidden
	$dh(this.wrapper);
	$y(this.wrapper,{margin:'4px'});
	
	this.make_head();
	this.make_toolbar();
}

_f.FrmContainer.prototype.make_head = function() {
	var me = this;
	this.bg_color = '#DDF';
	this.head = $a(this.wrapper, 'div', '', {borderBottom:'1px solid #AAA', margin:'0px'});
	this.body = $a(this.wrapper,'div');

	// add corner
	if(!$.browser.msie)$(div).corner('5px');
	
	// Row 1
	// ------------------

	var div = $a(this.head, 'div', '', {backgroundColor: this.bg_color});
	this.tbartab = make_table(div, 1, 2, '100%', ['50%','50%'],{ paddingTop:'2px'});

	// left side - headers
	// -------------------
	$y($td(this.tbartab,0,0),{padding:'6px 4px 2px 8px'});
	this.main_title = $a($td(this.tbartab,0,0), 'div', '',{fontFamily:'Helvetica', margin: '0px 8px 0px 0px', display:'inline', fontSize:'24px'});
	this.sub_title = $a($td(this.tbartab,0,0), 'div','',{display:'inline'});
	this.sub_title.is_inline = 1;
	this.status_title = $a($td(this.tbartab,0,0), 'span','',{marginLeft:'8px'});
	this.status_title.is_inline = 1;
	
	// right side - actions, comments & close btn
	// ------------------------------------------
	this.tbar_div = $a($td(this.tbartab,0,1),'div','',{marginRight:'8px', textAlign:'right'})
	var tab2 = make_table(this.tbar_div, 1, 4, '220px', ['160px','60px'], {textAlign: 'center', padding:'3px', verticalAlign:'middle'}); 
	$y(tab2,{cssFloat:'right'});


	// (Tweets) Comments
	// -----------------
	/*$y($td(tab2,0,0),{textAlign:'right'});
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
		$y(c,{backgroundColor:'#F8F8FF'});
		if(me.doc.__islocal) {
			return;
		}
		this.dropdown.body.appendChild(tweet_dialog);
		this.dropdown.show();
		tweet_dialog.show(); 
	}
	this.comments_btn.onmouseout = function() {
		$y(c,{backgroundColor:me.bg_color});
		this.dropdown.clear();
	}
		
	this.comments_btn.innerHTML = 'Comments';*/

	// Actions...
	// -------------
	this.tbarlinks = new SelectWidget($td(tab2,0,0),[]);

	// close button
	// ---------------
	$y($td(tab2,0,1),{padding:'6px 0px 2px 0px', textAlign:'right'});
	this.close_btn = $a($td(tab2,0,1), 'img','',{cursor:'pointer'}); this.close_btn.src="images/icons/close.gif";
	this.close_btn.onclick = function() { nav_obj.show_last_open(); }

	// Row 2
	// ------------------

	this.tbartab2 = make_table($a(this.head, 'div'), 1, 2, '100%', ['50%','50%']);
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

_f.FrmContainer.prototype.show_head = function() { 
	$ds(this.head); 
}

_f.FrmContainer.prototype.hide_head = function() { 
	$dh(this.head); 
}

_f.FrmContainer.prototype.make_toolbar = function() {
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

	makebtn('Edit', function() { cur_frm.edit_doc() });
	makebtn('Save', function() { cur_frm.save('Save');}, 1);
	makebtn('Submit', function() { cur_frm.savesubmit(); });
	makebtn('Cancel', function() { cur_frm.savecancel() });
	makebtn('Amend', function() { cur_frm.amend_doc() });
	
	me.tbarlinks.inp.onchange= function() {
		var v = this.value;
		if(v=='New') new_doc();
		else if(v=='Refresh') cur_frm.reload_doc();
		else if(v=='Print') cur_frm.print_doc();
		else if(v=='Email') cur_frm.email_doc();
		else if(v=='Copy') cur_frm.copy_doc();
		this.value = 'Actions...';
	}
}

_f.FrmContainer.prototype.refresh_save_btns= function() {
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

_f.FrmContainer.prototype.refresh_opt_btns = function() {
	var frm = cur_frm;

	var ol = ['Actions...','New','Refresh'];

	if(!frm.meta.allow_print) ol.push('Print');
	if(!frm.meta.allow_email) ol.push('Email');
	if(!frm.meta.allow_copy) ol.push('Copy');

	empty_select(this.tbarlinks);
	add_sel_options(this.tbarlinks, ol, 'Actions...');
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

_f.FrmContainer.prototype.add_frm = function(doctype, onload, opt_name) {
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
		new _f.Frm(doctype, me.body);

		if(onload)onload(r,rt);
	}
	if(opt_name && (!LocalDB.is_doc_loaded(doctype, opt_name))) {
		// get both
		$c('webnotes.widgets.form.getdoc', {'name':opt_name, 'doctype':doctype, 'getdoctype':1, 'user':user}, fn);
	} else {
		// get doctype only
		$c('webnotes.widgets.form.getdoctype', args={'doctype':doctype}, fn);
	}
}