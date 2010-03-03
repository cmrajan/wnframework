// _f.Grid

_f.cur_grid_cell = null;
_f.Grid = function(parent) { }

_f.Grid.prototype.init = function(parent, row_height) {
	
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
	
	keypress_observers.push(this)
}

_f.Grid.prototype.make_ui = function(parent) { 

	var ht = make_table($a(parent, 'div'), 1, 2, '100%', ['60%','40%']);
	this.main_title = $td(ht,0,0); this.main_title.className = 'columnHeading';
	$td(ht,0,1).style.textAlign = 'right';
	this.tbar_div = $a($td(ht,0,1), 'div', 'grid_tbarlinks');
	if(isIE) $y(this.tbar_div, {width:'200px'});
	if(!isIE) $(this.tbar_div).corners('top-right top-left');
	this.tbar_tab = make_table(this.tbar_div,1,4,'100%',['25%','25%','25%','25%']);	
			
	this.wrapper = $a(parent, 'div', 'grid_wrapper');

	$h(this.wrapper, cint(screen.width * 0.5) + 'px');

	this.head_wrapper = $a(this.wrapper, 'div', 'grid_head_wrapper');

	this.head_tab = $a(this.head_wrapper, 'table', 'grid_head_table');
	this.head_row = this.head_tab.insertRow(0);

	this.tab_wrapper = $a(this.wrapper, 'div', 'grid_tab_wrapper');	
	this.tab = $a(this.tab_wrapper, 'table', 'grid_table');

	var me = this;
	
	this.wrapper.onscroll = function() { me.head_wrapper.style.top = me.wrapper.scrollTop+'px'; }
}

_f.Grid.prototype.make_ui_simple = function(parent) { 

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

_f.Grid.prototype.show = function() { 
	if(this.can_add_rows) {
		if(this.is_scrolltype)$ds(this.tbar_div);
		else $ds(this.btn_area);
	} else {
		if(this.is_scrolltype)$dh(this.tbar_div);
		else $dh(this.btn_area);
	}
	$ds(this.wrapper);
}
_f.Grid.prototype.hide = function() { 
	$dh(this.wrapper); $dh(this.tbar_div); 
}

_f.Grid.prototype.insert_column = function(doctype, fieldname, fieldtype, label, width, options, perm, reqd) {
	
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

_f.Grid.prototype.set_column_disp = function(label, show) { 
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

_f.Grid.prototype.append_row = function(idx, docname) { 
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

_f.Grid.prototype.refresh_cell = function(docname, fieldname) {
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

// for form edit
_f.cur_grid; 
_f.cur_grid_ridx; 

_f.Grid.prototype.set_cell_value = function(cell) {
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
				_f.cur_grid = me;
				_f.cur_grid_ridx = this.cell.row.rowIndex;
				_f.edit_record(me.doctype, this.cell.row.docname, 1);				
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

_f.Grid.prototype.cell_click = function(cell, e) {
	if(_f.cur_grid_cell==cell)
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

_f.Grid.prototype.notify_click = function(e, target) {
	if(_f.cur_grid_cell && !target.isactive) {
		if(!(text_dialog && text_dialog.display) && !selector.display) {
			_f.cur_grid_cell.grid.cell_deselect();
		}
	}
}

_f.Grid.prototype.cell_deselect = function() {
	if(_f.cur_grid_cell) {
		var c = _f.cur_grid_cell;
		c.grid.remove_template(c);
		c.div.className = 'grid_cell_div';
		if(c.is_odd) c.div.style.border = '2px solid ' + c.grid.alt_row_bg;
		else c.div.style.border = '2px solid #FFF';
		_f.cur_grid_cell = null;
		_f.cur_grid = null;
		this.isactive = false;
		
		// remove from observer
		delete click_observers[this.observer_id];
	}
}

_f.Grid.prototype.cell_select = function(cell, ri, ci) {
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
		_f.cur_grid_cell = cell;
		this.add_template(cell);
		this.isactive = true;
		
		// start observing clicks
		click_observers.push(this);
		this.observer_id = click_observers.length - 1;
	}
}

_f.Grid.prototype.add_template = function(cell) {
	if(!cell.row.docname && this.add_newrow) { // activate new row here
		this.add_newrow();
		this.cell_select(cell);
	} else {
		var hc = this.head_row.cells[cell.cellIndex];
		cell.div.innerHTML = '';
		cell.div.appendChild(hc.template.wrapper);
		hc.template.activate(cell.row.docname);
		hc.template.activated=1;
		
		if(hc.template.input && hc.template.input.set_width) {
			hc.template.input.set_width(isIE ? cell.offsetWidth : cell.clientWidth);
		}
	}
}

_f.Grid.prototype.get_field = function(fieldname) { // get template
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


_f.grid_date_cell = '';
_f.grid_refresh_date = function() {
	_f.grid_date_cell.grid.set_cell_value(_f.grid_date_cell);
}
_f.grid_refresh_field = function(temp, input) {
	if(input.value != _f.get_value(temp.doctype, temp.docname, temp.df.fieldname))
		if(input.onchange)input.onchange();
}

_f.Grid.prototype.remove_template = function(cell) {
	var hc = this.head_row.cells[cell.cellIndex];

	if(!hc.template)return;
	if(!hc.template.activated)return;

	if(hc.template.txt) {
		if(hc.template.df.fieldtype=='Date') {
			// for calendar popup. the value will come after this
			_f.grid_date_cell = cell;
			setTimeout('_f.grid_refresh_date()', 100);
		}
		if(hc.template.txt.value)
		_f.grid_refresh_field(hc.template, hc.template.txt);
		
	} else if(hc.template.input) {
		_f.grid_refresh_field(hc.template, hc.template.input);		
	}

	if(hc.template && hc.template.wrapper.parentNode)
		cell.div.removeChild(hc.template.wrapper);
	this.set_cell_value(cell);
	hc.template.activated=0;
	
	if(isIE6) {
		$dh(this.wrapper); $ds(this.wrapper);	
	}

}

_f.Grid.prototype.notify_keypress = function(e, keycode) {
	if(keycode>=37 && keycode<=40 && e.shiftKey) {
		if(text_dialog && text_dialog.display) {
			return;
		}
	} else 
		return;

	if(!_f.cur_grid_cell) return;
	if(_f.cur_grid_cell.grid != this) return;
	var ri = _f.cur_grid_cell.row.rowIndex;
	var ci = _f.cur_grid_cell.cellIndex;
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

_f.Grid.prototype.make_template = function(hc) {
	hc.template = make_field(get_field(hc.doctype, hc.fieldname), hc.doctype, '', '', true);
	hc.template.grid = this;
}

_f.Grid.prototype.append_rows = function(n) { for(var i=0;i<n;i++) this.append_row(); }
_f.Grid.prototype.truncate_rows = function(n) { for(var i=0;i<n;i++) this.tab.deleteRow(this.tab.rows.length-1); }

_f.Grid.prototype.set_data = function(data) {
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

_f.Grid.prototype.set_ht = function(ridx, docname) {
	var ht = ((cint(this.row_height) + 10) * (((this.tab && this.tab.rows) ? this.tab.rows.length : 0) + 1));
	if(ht < 100)ht=100; 
	if(ht > cint(0.3 * screen.width))ht=cint(0.3 * screen.width);
	ht += 4;
	$y(this.wrapper,{height:ht+'px'});
}

_f.Grid.prototype.refresh_row = function(ridx, docname) {
	var row = this.tab.rows[ridx];
	row.docname = docname;
	row.is_newrow = false;
		
	for(var cidx=0; cidx<row.cells.length; cidx++) {
		this.set_cell_value(row.cells[cidx]);
	}

}
