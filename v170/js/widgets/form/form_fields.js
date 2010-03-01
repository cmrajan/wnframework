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

	var t = make_table($a(head,'div'), 1,2, '100%', ['20px',null], {verticalAlign:'middle'});
	$y(t,{borderCollapse:'collapse'});
		
	this.label = $a($td(t,0,1), 'div', 'sectionHeading');
	this.label.innerHTML = this.df.label?this.df.label:'';
		
	// exp / collapse
	this.exp_icon = $a($td(t,0,0),'img','',{cursor:'pointer'}); this.exp_icon.src = min_icon;
	this.exp_icon.onclick = function() { if(me.row.body.style.display.toLowerCase()=='none') me.exp_icon.expand(); else me.exp_icon.collapse(); }
	this.exp_icon.expand = function() { 
		if(ui_effects) $ds(me.row.body) 
		else $(me.row.body).slideDown(); 
		me.exp_icon.src = min_icon; 
	}
	this.exp_icon.collapse = function() { 
		if(ui_effects) $dh(me.row.body) 
		else $(me.row.body).slideUp(); 
		me.exp_icon.src = exp_icon; 
	}
	$y(head,{padding:'2px', borderBottom:'1px solid #ccc', margin:'8px'});
		
	// callable functions
	this.collapse = this.exp_icon.collapse;
	this.expand = this.exp_icon.expand;

}


_f.SectionBreak.prototype.make_simple_section = function(static) {
	var head = $a(this.row.header, 'div', '', {margin:'4px 8px 0px 8px'});
	var me = this;

	// colour
	var has_col = false;
	if(this.df.colour) {
		has_col = true;
		var col = this.df.colour.split(':')[1];
		if(col!='FFF') {
			
			$y(this.row.sub_wrapper, { margin:'8px', padding: '0px' ,backgroundColor: ('#' + col)} );
			$(this.row.sub_wrapper).corners();
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
			
			this.onshow = function() { 
				if(me.df.label && me.df.trigger=='Client' && (!me.in_filter))
					cur_frm.runclientscript(me.df.label, me.doctype, me.docname);
			}
			this.show = function() { me.frm.tabs.tabs[me.df.label].show(); }
			this.hide = function() {  }

			this.mytab = this.frm.tabs.add_tab(me.df.label, this.onshow, this.row.wrapper);			
			
			this.make_simple_section(1);
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

			$(this.header).hover(function() {
					if(_f.cur_sec_header != this) { $y(this, {backgroundColor:'#DDD'}); }
				}, function() {
					if(_f.cur_sec_header != this) { $y(this, {backgroundColor:'#FFF'}); }
				}
			);
			if(ui_effects)$(this.header).corners('top-left bottom-left');
			
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
	$(this.input).button({icons:{ primary: 'ui-icon-play' }});
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
