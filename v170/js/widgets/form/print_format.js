_p.build_dialog = function() {
	if(!_p.dialog) {
		_p.make_dialog();
	}
	_p.dialog.show();
}

_p.make_dialog = function() {
	var d = new Dialog(360, 140, "Print Formats");
	$dh(d.wrapper);
	d.make_body(
		[['HTML','Select']
		,['Button','Go', function() { _p.build(sel_val(cur_frm.print_sel), go); }]]);
	
	_p.print_doc_dialog = d;
	d.onshow = function() {
		var c = d.widgets['Select'];
		if(c.cur_sel)c.removeChild(c.cur_sel);
		c.appendChild(cur_frm.print_sel.wrapper);
		c.cur_sel = cur_frm.print_sel.wrapper;
	}
}

_p.field_tab = function(layout_cell) {
	var t = $a(layout_cell, 'table');
	$w(t, '100%');
	var r = t.insertRow(0); this.r = r;
	r.insertCell(0); r.insertCell(1);
	r.cells[0].className='datalabelcell';
	r.cells[1].className='datainputcell';
	return r
}


// start a layout


_p.print_std = function() {
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
	if(cp.letter_head) {
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
			
		if(!f.print_hide){
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
					r = _p.field_tab(layout.cur_cell)
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

_p.print_style = ".datalabelcell {padding: 2px;width: 38%;vertical-align:top; }"
	+".datainputcell { padding: 2px; width: 62%; text-align:left; }"
	+".sectionHeading { font-size: 16px; font-weight: bold; margin: 8px; }"
	+".columnHeading { font-size: 14px; font-weight: bold; margin: 8px 0px; }"
	+".sectionCell {padding: 3px; vertical-align: top; }"
	+".pagehead { font-size: 16px; font-weight: bold; font-family: verdana; padding: 2px 10px 10px 0px; }"		
	+".pagesubhead { font-size: 12px; font-weight: bold; font-family: verdana; padding: 2px 10px 10px 0px; }";

_p.def_print_style = "html, body{ font-family: Arial, Helvetica; font-size: 12px; }"
	+"\nbody { margin: 12px; }"
	+"td {padding: 2px;}"
	+"\npre { margin:0; padding:0;}"	
	+"\n.simpletable, .noborder { border-collapse: collapse; margin-bottom: 10px;}"
	+"\n.simpletable td {border: 1pt solid #000; vertical-align: top; }"
	+"\n.noborder td { vertical-align: top; }"

_p.formats = {}

_p.build = function(fmtname, onload) {
	if(!cur_frm) { alert('No Document Selected'); return; }
	var doc = locals[cur_frm.doctype][cur_frm.docname];
	if(fmtname=='Standard') {
		onload(_p.render(print_std(), _p.print_style, doc, doc.name));
	} else {
		if(!_p.formats[fmtname]) // not loaded, get data
			$c('get_print_format', {'name':fmtname }, 
				function(r,t) { 
					_p.formats[fmtname] = r.message;
					onload(_p.render(_p.formats[fmtname], '', doc, doc.name)); 
				}
			);
		else // loaded
			onload(_p.render(_p.formats[fmtname], '', doc, doc.name));	
	}
}

_p.render = function(body, style, doc, title) {
	var block = document.createElement('div');
	var tmp_html = '';
	block.innerHTML = body;

	if(doc && cint(doc.docstatus)==0 && cur_frm.perm[0][SUBMIT])  {
		var tmp_html = '<div style="text-align: center; padding: 4px; border: 1px solid #000"><div style="font-size: 20px;">Temporary</div>This box will go away after the document is submitted.</div>';
	}

	style = _p.def_print_style + style;

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

_p.go = function(html) {
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
