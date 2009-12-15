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
		me.set(me.txt.value); 
		me.run_trigger();
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
	var as = new bsn.AutoSuggest(me.txt.id, opts);
	
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
