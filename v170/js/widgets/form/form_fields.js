//
// Form Input
// ======================================================================================

_f.ColumnBreak = function() {
	this.set_input = function() { };
}

_f.ColumnBreak.prototype.make_body = function() {
	if((!this.perm[this.df.permlevel]) || (!this.perm[this.df.permlevel][READ]) || this.df.hidden) {
		// no display
		return;
	}

	this.cell = this.frm.layout.addcell(this.df.width);
	$y(this.cell.wrapper, {padding: '8px'});
	_f.cur_col_break_width = this.df.width;

	var fn = this.df.fieldname?this.df.fieldname:this.df.label;
	// header
	if(this.df&&this.df.label){
		this.label = $a(this.cell.wrapper, 'div', 'columnHeading');
		this.label.innerHTML = this.df.label;
	}

}

_f.ColumnBreak.prototype.refresh = function(layout) {
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

// ======================================================================================

_f.SectionBreak = function() {
	this.set_input = function() { };
}

_f.SectionBreak.prototype.make_row = function() {
	this.row = this.frm.layout.addrow();
}

_f.SectionBreak.prototype.make_collapsible = function(head) {
	var me = this;

	var t = make_table($a(head,'div'), 1,2, '100%', [null, '60px'], {verticalAlign:'middle'});
	$y(t,{borderCollapse:'collapse'});
		
	this.label = $a($td(t,0,0), 'div', 'sectionHeading');
	this.label.innerHTML = this.df.label?this.df.label:'';
	
	// indent
	$y(this.row.body, { margin:'32px' });

	// exp / collapse
	$y($td(t,0,1),{textAlign:'right'});
	this.exp_icon = $a($td(t,0,1),'span','link_type',{fontSize:'11px'});
	this.exp_icon.innerHTML = 'hide';
	this.exp_icon.onclick = function() { 
		if(me.row.body.style.display.toLowerCase()=='none') me.exp_icon.expand(); 
		else me.exp_icon.collapse(); 
	}
	this.exp_icon.expand = function() { 
		$ds(me.row.body) 
		//me.exp_icon.src = min_icon; 
		me.exp_icon.innerHTML = 'hide';
	}
	this.exp_icon.collapse = function() { 
		$dh(me.row.body) 
		//me.exp_icon.src = exp_icon; 
		me.exp_icon.innerHTML = 'show';
	}
	$y(head,{padding:'2px', borderBottom:'1px solid #ccc', margin:'8px'});
		
	// callable functions
	this.collapse = this.exp_icon.collapse;
	this.expand = this.exp_icon.expand;

}


_f.SectionBreak.prototype.make_simple_section = function(static) {
	var head = $a(this.row.header, 'div', '', {margin:'4px 8px 0px 8px'});
	var me = this;

	// description
	if(this.df.description) {
		var d = $a(this.row.header, 'div', '', {margin:'0px 8px', padding:'8px 8px', backgroundColor:'#EEE'});
		if(this.df.description.length > 240) {
			$($a(d, 'div', 'comment')).html(replace_newlines(this.df.description.substr(0,240)) + '...');
			$($a(d, 'div', 'link_type', {fontSize:'11px'})).html('more').click(function() { msgprint(me.df.description) });
		} else {
			$($a(d, 'div')).html(replace_newlines(this.df.description));
		}
	}

	// colour
	var has_col = false;
	if(this.df.colour) {
		has_col = true;
		var col = this.df.colour.split(':')[1];
		if(col!='FFF') {			
			$y(this.row.sub_wrapper, { margin:'8px', padding: '0px' ,backgroundColor: ('#' + col)} );
		}
	}
	
	if(static) {
		this.label = $a(head, 'div', 'sectionHeading', {margin:'12px 0px 8px 0px'});
		this.label.innerHTML = this.df.label?this.df.label:'';
		return;
	}
	
	if(this.df.label) {
		this.make_collapsible(head);
		
	} else if(!has_col) {
		// divider
		$y(head,{margin:'8px', borderBottom:'2px solid #445'});
	}

}

_f.cur_sec_header = null;
_f.SectionBreak.prototype.make_body = function() {
	if((!this.perm[this.df.permlevel]) || (!this.perm[this.df.permlevel][READ]) || this.df.hidden) {
		// no display
		return;
	}
	var me = this;

	// header
	if(this.frm.meta.section_style=='Tabbed') {
		if(this.df.options!='Simple') {
			// IE full page ??
			
			this.make_row();
			
			this.sec_id = this.frm.sections.length;
			this.frm.sections[this.sec_id] = this;
			this.frm.sections_by_label[me.df.label] = this;
			
			this.mytab = this.frm.tabs.add_tab(me.df.label, function() { me.frm.set_section(me.sec_id);});
			
			this.show = function() { 
				this.row.show(); me.mytab.set_selected();
				
				if(me.df.label && me.df.trigger=='Client' && (!me.in_filter))
					cur_frm.runclientscript(me.df.label, me.doctype, me.docname);
			}
			this.hide = function() { this.row.hide(); me.mytab.hide(); }

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
			this.frm.sections_by_label[me.df.label] = this;
			
			var w=$a(this.frm.tray_area, 'div');
			this.header = $a(w, 'div', '', {padding: '4px 8px', cursor:'pointer'});
			this.header.innerHTML = me.df.label;
			this.header.onclick = function() { me.frm.set_section(me.sec_id); }

			this.header.onmouseover = function() {
				if(_f.cur_sec_header != this) { $y(this, {backgroundColor:'#DDD'}); }
			}
			this.header.onmouseout = function() {
				if(_f.cur_sec_header != this) { $y(this, {backgroundColor:'#FFF'}); }
			}
			
			this.hide = function() { 
				this.row.hide();
				$y(this.header, { backgroundColor:'#FFF', fontWeight:'normal', color:'#000'} );
			}
			this.show = function() { 
				this.row.show(); 
				$y(this.header, { backgroundColor:'#AAA', fontWeight:'bold', color:'#FFF'} );
				
				_f.cur_sec_header = this.header;
				if(me.df.label && me.df.trigger=='Client' && (!me.in_filter))
					cur_frm.runclientscript(me.df.label, me.doctype, me.docname);
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

// ======================================================================================

_f.SectionBreak.prototype.refresh = function(layout) {
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

// Image field definition
// ======================================================================================



_f.ImageField = function() { this.images = {}; }
_f.ImageField.prototype = new Field();
_f.ImageField.prototype.onmake = function() {
	this.no_img = $a(this.wrapper, 'div','no_img');
	this.no_img.innerHTML = "No Image";
	$dh(this.no_img);
}

_f.ImageField.prototype.get_image_src = function(doc) {
	if(doc.file_list) {
		file = doc.file_list.split(',');
		// if image
		extn = file[0].split('.');
		extn = extn[extn.length - 1].toLowerCase();
		var img_extn_list = ['gif', 'jpg', 'bmp', 'jpeg', 'jp2', 'cgm',  'ief', 'jpm', 'jpx', 'png', 'tiff', 'jpe', 'tif'];

		if(in_list(img_extn_list, extn)) {
			var src = outUrl + "?cmd=downloadfile&file_id="+file[1];
		}
	} else {
		var src = "";
	}
	return src;
}
_f.ImageField.prototype.onrefresh = function() { 
	var me = this;
	if(!this.images[this.docname]) this.images[this.docname] = $a(this.wrapper, 'img');
	else $di(this.images[this.docname]);
	
	var img = this.images[this.docname]
	
	// hide all other
	for(var dn in this.images) if(dn!=this.docname)$dh(this.images[dn]);

	var doc = locals[this.frm.doctype][this.frm.docname];
	
	if(!this.df.options) var src = this.get_image_src(doc);
	else var src = outUrl + '?cmd=get_file&fname='+this.df.options+"&__account="+account_id + (__sid150 ? ("&sid150="+__sid150) : '');

	
	if(src) {
		$dh(this.no_img);
		if(img.getAttribute('src')!=src) img.setAttribute('src',src);
		canvas = this.wrapper;
		canvas.img = this.images[this.docname];
		canvas.style.overflow = "auto";
		$w(canvas, "100%");
	
		if(!this.col_break_width)this.col_break_width = '100%';
		var allow_width = cint(1000 * (cint(this.col_break_width)-10) / 100);

		if((!img.naturalWidth) || cint(img.naturalWidth)>allow_width)
			$w(img, allow_width + 'px');

	} else {
		$ds(this.no_img);
	}
}
_f.ImageField.prototype.set_disp = function (val) { }
_f.ImageField.prototype.set = function (val) { }

// ======================================================================================

_f.ButtonField = function() { };
_f.ButtonField.prototype = new Field();
_f.ButtonField.prototype.make_input = function() { var me = this;

	//this.input_area.className = 'buttons';
	$y(this.input_area,{height:'30px', marginTop:'4px', marginBottom: '4px'});

	this.input = $a(this.input_area, 'button');
	this.input.innerHTML = me.df.label;
	this.input.onclick = function() {
		this.disabled = true;
		if(me.df.trigger=='Client' && (!me.in_filter)) {
			cur_frm.runclientscript(me.df.label, me.doctype, me.docname);
			this.disabled = false;
		} else
			cur_frm.runscript(me.df.options, me);
	}
	
	$(this.input).button({icons:{ primary: 'ui-icon-circle-triangle-e' }});
}
_f.ButtonField.prototype.set = function(v) { }; // No Setter
_f.ButtonField.prototype.set_disp = function(val) {  } // No Disp on readonly

// Table
// ======================================================================================

_f.TableField = function() { };
_f.TableField.prototype = new Field();
_f.TableField.prototype.make_body = function() {
	if(this.perm[this.df.permlevel] && this.perm[this.df.permlevel][READ]) {
		this.grid = new _f.FormGrid(this);
		if(this.frm)this.frm.grids[this.frm.grids.length] = this;
		this.grid.make_buttons();
	}
}

_f.TableField.prototype.refresh = function() {
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

_f.TableField.prototype.set = function(v) { }; // nothing
_f.TableField.prototype.set_input = function(v) { }; // nothing

// ==============================================================

_f.CodeField = function() { };
_f.CodeField.prototype = new Field();
_f.CodeField.prototype.make_input = function() {
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
		code_editors[me.df.fieldname] = me;
		if(!tinymce_loaded) {
			tinymce_loaded = 1;
			tinyMCE_GZ.init({
				strict_loading_mode: true,
				themes : "advanced",
				plugins : "style,table,indicime",
				languages : "en",
				disk_cache : true
			}, function() { me.setup_editor() });
		} else {
			this.setup_editor();
		}
	} else {
		$y(me.input, {fontFamily:'Courier, Fixed'});
	}
}
_f.CodeField.prototype.set_disp = function(val) {
	$y(this.disp_area, {width:'90%'})
	this.disp_area.innerHTML = '<textarea class="code_text" readonly=1>'+val+'</textarea>';
}
_f.CodeField.prototype.setup_editor = function() {
	var me = this;
	// make the editor
	tinyMCE.init({
		theme : "advanced",
		mode : "none",
		//elements: me.myid,
		strict_loading_mode: true,
		plugins:"table,style,indicime",
		theme_advanced_toolbar_location : "top",
		theme_advanced_toolbar_align : "left",
		theme_advanced_statusbar_location : "bottom",
		extended_valid_elements: "div[id|dir|class|align|style]",

		// w/h
		width: '100%',
		height: '360px',

		// buttons
		theme_advanced_buttons1 : "save,newdocument,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,styleselect,formatselect,fontselect,fontsizeselect",
		theme_advanced_buttons2 : "cut,copy,paste,pastetext,pasteword,|,search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,unlink,cleanup,help,code,|,forecolor,backcolor,|,indicime,indicimehelp",
		theme_advanced_buttons3 : "tablecontrols,styleprops,|,hr,removeformat,visualaid,|,sub,sup",

		// framework integation
		init_instance_callback : "code_editors."+ this.df.fieldname+".editor_init_callback",
		onchange_callback : "code_editors."+ this.df.fieldname+".input.onchange"
	});

	this.editor_init_callback = function() {
		if(cur_frm)
			cur_frm.fields_dict[me.df.fieldname].editor = tinyMCE.get(me.myid);
	}
	tinyMCE.execCommand("mceAddControl",false,me.myid);
}

// ======================================================================================

