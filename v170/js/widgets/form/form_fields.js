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
		this.label = $a(this.cell.wrapper, 'h3');
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
	this.row = this.df.label ? this.frm.layout.addrow() : this.frm.layout.addsubrow();
}

_f.SectionBreak.prototype.make_collapsible = function(head) {
	var me = this;

	var div = $a(head,'div','',{padding:'4px 4px', backgroundColor:'#EEE'});
	$gr(div, '#DDD', '#CCC'); $br(div, '3px');  
	if(cur_frm.meta.in_dialog) $y(div, {marginLeft:'8px'});
	
	// checkbox
	this.chk = $a_input(div, 'checkbox',null,{marginRight:'8px'})
	
	// label
	this.label = $a(div, 'span', '', {fontSize:'16px', fontFamily:'Georgia'});
	this.label.innerHTML = this.df.label?this.df.label:'';
	
	// description
	var d = this.df.description;
	if(d) {
		this.desc_area = $a(div, 'span', '', {color:'#888', marginLeft:'8px'});
		this.desc_area.innerHTML = d.substr(0,80) + (d.length > 80 ? '...' : '');
	}

	// back to top
	var span = $a(div, 'span', 'link_type', {cssFloat:'right', marginRight:'8px'});
	span.innerHTML = 'Go To Top';
	span.onclick = function() { scroll(0, 0); }

	// exp / collapse

	this.chk.onclick = function() { 
		if(this.checked) me.expand(); 
		else me.collapse(); 
	}
	
	this.expand = function() { 
		$(me.row.main_body).slideDown();
	}
	
	this.collapse = function() { 
		$(me.row.main_body).slideUp();
	}
	
	// hide by default
	if(me.frm.section_count) {
		$dh(this.row.main_body);
	} else {
		this.chk.checked = true;
	}
}

// ======================================================================================

_f.SectionBreak.prototype.make_simple_section = function(with_header) {
	var head = $a(this.row.main_head, 'div', '', {margin:'8px 8px 0px 0px'});
	this.row.header.head = head;
	var me = this;

	// colour
	if(this.df.colour) {
		var col = this.df.colour.split(':')[1];
		if(col!='FFF') {			
			$y(this.row.sub_wrapper, { margin:'8px', padding: '0px' ,backgroundColor: ('#' + col)} );
		}
	}
	
	if(with_header) {
		if(this.df.label && this.df.options!='Simple') {
			this.make_collapsible(head);
		} else {
			// divider
			$y(head,{borderBottom:'1px solid #AAA', fontWeight:'bold', paddingBottom:'4px'});
			if(this.df.label) {
				head.innerHTML = this.df.label
			}
		}
	}

	// indent
	$y(this.row.body, { marginLeft:'17px' });

}

// ======================================================================================

_f.SectionBreak.prototype.add_to_sections = function() {
	this.sec_id = this.frm.sections.length;
	this.frm.sections[this.sec_id] = this;
	this.frm.sections_by_label[this.df.label] = this;
}

_f.cur_sec_header = null;
_f.SectionBreak.prototype.make_body = function() {
	if((!this.perm[this.df.permlevel]) || (!this.perm[this.df.permlevel][READ]) || this.df.hidden) {
		// no display
		return;
	}
	var me = this;

	if(this.df){
		this.make_row();
		this.make_simple_section(1, 1);
	}	
}


// ======================================================================================

_f.SectionBreak.prototype.refresh = function(layout) {
	var fn = this.df.fieldname?this.df.fieldname:this.df.label;

	if(fn)
		this.df = get_field(this.doctype, fn, this.docname);

	// hidden
	if(this.set_hidden!=this.df.hidden) {
		if(this.df.hidden) {
			if(this.frm.meta.section_style=='Tabbed') {
				$dh(this.mytab);
			} else if(this.tray_item)
				this.tray_item.hide();
			
			if(this.row)this.row.hide();
		} else {
			if(this.frm.meta.section_style=='Tabbed') {
				$di(this.mytab);
			} else if(this.tray_item)
				this.tray_item.show();

			if(this.expanded)this.row.show();
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
_f.ButtonField.prototype.init = function() {
	this.prev_button = null;
	// if previous field is a button, add it to the same div!
	
	// button-set structure
	// + wrapper (1st button)
	// 		+ input_area
	//			+ button_area
	//			+ button_area
	//			+ button_area
	
	if(cur_frm && 
		cur_frm.fields[cur_frm.fields.length-1] &&
			cur_frm.fields[cur_frm.fields.length-1].df.fieldtype=='Button') {
				
		this.make_body = function() {
			this.prev_button = cur_frm.fields[cur_frm.fields.length-1];
			if(!this.prev_button.prev_button) {
				// first button, make the button area
				this.prev_button.button_area = $a(this.prev_button.input_area, 'span');
			}
			this.wrapper = this.prev_button.wrapper;
			this.input_area = this.prev_button.input_area;
			this.disp_area = this.prev_button.disp_area;
			
			// all buttons in the same input_area
			this.button_area = $a(this.prev_button.input_area, 'span');
		}
	}
}
_f.ButtonField.prototype.make_input = function() { var me = this;
	if(!this.prev_button) {
		$y(this.input_area,{marginTop:'4px', marginBottom: '4px'});
	}

	// make a button area for one button
	if(!this.button_area) this.button_area = $a(this.input_area, 'span','',{marginRight:'4px'});
	
	// make the input
	this.input = $btn(this.button_area, 
		me.df.label.substr(0,20) + ((me.df.label.length>20) ? '..' : ''), {width:'170px', fontWeight:'bold'}, null, 1)
	this.input.onclick = function() {
		this.set_disabled();
		if(cur_frm.cscript[me.df.label] && (!me.in_filter)) {			
			cur_frm.runclientscript(me.df.label, me.doctype, me.docname);
			this.set_enabled();
		} else {
			this.set_working();
			cur_frm.runscript(me.df.options, me);
		}
	}
}

_f.ButtonField.prototype.hide = function() { 
	$dh(this.button_area);
};

_f.ButtonField.prototype.show = function() { 
	$ds(this.button_area);
};


_f.ButtonField.prototype.set = function(v) { }; // No Setter
_f.ButtonField.prototype.set_disp = function(val) {  } // No Disp on readonly

// Table
// ======================================================================================

_f.TableField = function() { };
_f.TableField.prototype = new Field();
_f.TableField.prototype.make_body = function() {
	if(this.perm[this.df.permlevel] && this.perm[this.df.permlevel][READ]) {
		// add comment area
		if(this.df.description) {
			this.comment_area = $a(this.parent, 'div', 'comment', {padding:'0px 8px 8px 8px'});
			this.comment_area.innerHTML = this.df.description;
		}
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
	this.input = $a(this.input_area, 'textarea','code_text',{fontSize:'12px'});
	this.myid = 'code-'+codeid;
	this.input.setAttribute('id',this.myid);
	codeid++;


	this.input.setAttribute('wrap', 'off');
	this.input.set_input = function(v) {
		if(me.editor) {
			me.editor.setContent(v);
		} else {
			me.input.value = v;
			me.input.innerHTML = v;
		}
	}
	this.input.onchange = function() {
		if(me.editor) {
			//me.set(tinymce.get(me.myid).getContent());
		} else {
			me.set(me.input.value);
		}
		me.run_trigger();
	}
	this.get_value = function() {
		if(me.editor) {
			return me.editor.getContent(); // tinyMCE
		} else {
			return this.input.value;
		}
	}
	if(this.df.fieldtype=='Text Editor') {
		// setup tiny mce
		$(me.input).tinymce({
			// Location of TinyMCE script
			script_url : 'js/tiny_mce_33/tiny_mce.js',

			// General options
			theme : "advanced",
			plugins : "style,inlinepopups,table",
			extended_valid_elements: "div[id|dir|class|align|style]",
			
			// w/h
			width: '100%',
			height: '360px',
	
			// buttons
			theme_advanced_buttons1 : "save,newdocument,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,styleselect,formatselect,fontselect,fontsizeselect",
			theme_advanced_buttons2 : "cut,copy,paste,pastetext,pasteword,|,search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,unlink,cleanup,help,code,|,forecolor,backcolor,|,indicime,indicimehelp",
			theme_advanced_buttons3 : "tablecontrols,styleprops,|,hr,removeformat,visualaid,|,sub,sup",

			theme_advanced_toolbar_location : "top",
			theme_advanced_toolbar_align : "left",

			content_css: "js/tiny_mce_33/custom_content.css",

			oninit: function() { me.init_editor(); }
		});
	} else {
		$y(me.input, {fontFamily:'Courier, Fixed'});
	}
}

_f.CodeField.prototype.init_editor = function() {
	// attach onchange methods
	var me = this;
	this.editor = tinymce.get(this.myid);
	this.editor.onKeyUp.add(function(ed, e) { 
		me.set(ed.getContent()); 
	});
	this.editor.onPaste.add(function(ed, e) { 
		me.set(ed.getContent());
	});
	this.editor.onSetContent.add(function(ed, e) { 
		me.set(ed.getContent()); 
	});
	
	// reset content
	if(cur_frm) this.editor.setContent(locals[cur_frm.doctype][cur_frm.docname][this.df.fieldname]);
}

_f.CodeField.prototype.set_disp = function(val) {
	$y(this.disp_area, {width:'90%'})
	if(this.df.fieldtype=='Text Editor') {
		this.disp_area.innerHTML = val;
	} else {
		this.disp_area.innerHTML = '<textarea class="code_text" readonly=1>'+val+'</textarea>';
	}
}

// ======================================================================================

