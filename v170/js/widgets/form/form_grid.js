_f.FormGrid = function(field) {
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

_f.FormGrid.prototype = new _f.Grid();

_f.FormGrid.prototype.setup = function() {
	this.make_columns();
}

_f.FormGrid.prototype.make_tbar_link = function(parent, label, fn, icon, isactive) {

	var div = $a(parent,'div','',{cursor:'pointer'});
	var t = make_table(div, 1, 2, '90%', ['20px',null]);
	var img = $a($td(t,0,0),'img');
	img.src = 'images/icons/'+icon;
	var l = $a($td(t,0,1),'span','link_type');
	l.style.fontSize = '11px';
	l.innerHTML = label;
	div.onclick = fn;
	div.show = function() { $ds(this); }
	div.hide = function() { $dh(this); }

	$td(t,0,0).isactive = isactive;
	$td(t,0,1).isactive = isactive;
	l.isactive = isactive;
	div.isactive = isactive;

	return div;
}

_f.FormGrid.prototype.make_buttons = function() {
	var me = this;
	if(this.is_scrolltype) {
		this.tbar_btns = {};
		this.tbar_btns['Del'] = this.make_tbar_link($td(this.tbar_tab,0,0),'Del', function() { me.delete_row(); }, 'table_row_delete.gif',1);
		this.tbar_btns['Ins'] = this.make_tbar_link($td(this.tbar_tab,0,1),'Ins', function() { me.insert_row(); }, 'table_row_insert.gif',1);
		this.tbar_btns['Up'] = this.make_tbar_link($td(this.tbar_tab,0,2),'Up', function() { me.move_row(true); }, 'arrow_up.gif',1);
		this.tbar_btns['Dn'] = this.make_tbar_link($td(this.tbar_tab,0,3),'Dn', function() { me.move_row(false); }, 'arrow_down.gif',1);
		
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
			_f.edit_record(me.doctype, dn, 1);
		}
	}
}

_f.FormGrid.prototype.make_columns = function() {
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

_f.FormGrid.prototype.set_column_label = function(fieldname, label) {
	for(var i=0;i<this.head_row.cells.length;i++) {
		var c = this.head_row.cells[i];
		if(c.fieldname == fieldname) {
			c.innerHTML = '<div class="grid_head_div">'+label+'</div>';
			c.cur_label = label;
			break;
		}
	}
}

_f.FormGrid.prototype.refresh = function() {
	var docset = getchildren(this.doctype, this.field.frm.docname, this.field.df.fieldname, this.field.frm.doctype);
	var data = [];
	
	//alert(docset.length);
	for(var i=0; i<docset.length; i++) {
		locals[this.doctype][docset[i].name].idx = i+1;
		data[data.length] = docset[i].name;
	}
	this.set_data(data);
}

_f.FormGrid.prototype.set_unsaved = function() {
	// set unsaved
	locals[cur_frm.doctype][cur_frm.docname].__unsaved=1;
	cur_frm.set_heading();	
}

_f.FormGrid.prototype.insert_row = function() {
	var d = this.new_row_doc();
	var ci = _f.cur_grid_cell.cellIndex;
	var row_idx = _f.cur_grid_cell.row.rowIndex;
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

_f.FormGrid.prototype.new_row_doc = function() {
	// create row doc
	var n = LocalDB.create(this.doctype);
	var d = locals[this.doctype][n];
	d.parent = this.field.frm.docname; 
	d.parentfield = this.field.df.fieldname;
	d.parenttype = this.field.frm.doctype;
	return d;
}
_f.FormGrid.prototype.add_newrow = function() {
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

_f.FormGrid.prototype.make_newrow = function(from_add_btn) {
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

_f.FormGrid.prototype.check_selected = function() {
	if(!_f.cur_grid_cell) {
		show_alert('Select a cell first');
		return false;
	}
	if(_f.cur_grid_cell.grid != this) {
		show_alert('Select a cell first');
		return false;
	}
	return true;
}

_f.FormGrid.prototype.delete_row = function(dt, dn) {
	if(dt && dn) {
		LocalDB.delete_record(dt, dn);
		this.refresh();	
	} else {
		if(!this.check_selected()) return;
		var r = _f.cur_grid_cell.row;
		if(r.is_newrow)return;

		var ci = _f.cur_grid_cell.cellIndex;
		var ri = _f.cur_grid_cell.row.rowIndex;
		
		LocalDB.delete_record(this.doctype, r.docname);	
		
		this.refresh();
		if(ri < (this.tab.rows.length-2))
			this.cell_select(null, ri, ci);
		else _f.cur_grid_cell = null;	
	}
	this.set_unsaved();
}

_f.FormGrid.prototype.move_row = function(up) {
	
	if(!this.check_selected()) return;
	var r = _f.cur_grid_cell.row;	
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
		var cidx = _f.cur_grid_cell.cellIndex;
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
