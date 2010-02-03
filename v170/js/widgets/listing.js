// Listing
// -----------------------

list_opts = {
	cell_style : {padding:'3px 2px'},
	alt_cell_style : {backgroundColor:'#F2F2FF'},
	head_style : {height:'20px',overflow:'hidden',verticalAlign:'middle',textAlign:'center',fontWeight:'bold',padding:'1px',fontSize:'13px'},
	head_main_style : {padding:'0px'},
	hide_export : 0,
	hide_print : 0,
	hide_refresh : 0,
	hide_rec_label: 0,
	show_calc: 1,
	show_empty_tab : 1,
	show_bottom_paging: 1,
	round_corners: 1,
	no_border: 0,
	append_records: 0
};
function Listing(head_text, no_index, no_loading) {
	this.start = 0; 
	this.page_len = 20;
	this.paging_len = 5;
	this.filters_per_line = 3;
	this.head_text = head_text ? head_text : 'Result';
	this.keyword = 'records';
	this.no_index = no_index;
	this.underline = 1;
	
	// interfaces
	// show_cell(cell, cell_id, data) - override cell display
	// show_result() 
	// server_call(srs, call_back) - override query function

	this.show_cell = null;
	this.show_result = null;
	this.colnames = null; // sr num is required
	this.colwidths = null;
	this.coltypes = null;
	this.coloptions = null;
	
	this.filters = {};
	this.sort_list = {};
	this.sort_order_dict = {};
	this.sort_heads = {};
	
	this.is_std_query = false;
	this.server_call = null;
	this.no_loading = no_loading;
	
	this.opts = copy_dict(list_opts);
}

Listing.prototype.make = function(parent) {
	var me = this;
	
	this.wrapper = parent;
	
	// filter
	this.filter_wrapper = $a(parent, 'div', 'srs_filter_wrapper');
	this.filter_area = $a(this.filter_wrapper, 'div', 'srs_filter_area');
	$dh(this.filter_wrapper);

	this.btn_area = $a(parent, 'div', '', {margin:'8px 0px'});
	this.body_area = $a(parent,'div','srs_body_area');

	// paging area
	var div = $a(this.body_area,'div','srs_paging_area');
	this.body_head = make_table(div, 1, 2, '100%', ['50%','50%'], {verticalAlign:'middle'});
	$y(this.body_head,{borderCollapse:'collapse'});
	this.rec_label = $td(this.body_head,0,0);

	if(this.opts.hide_rec_label) {
		$y($td(this.body_head,0,0),{width:'0%'}); 
		$y($td(this.body_head,0,1),{width:'100%'});
	}

	// results
	this.results = $a($a(this.body_area, 'div','srs_results_area'),'div');
	this.fetching_area = $a(this.body_area, 'div','',{height:'120px', background:'url("images/ui/square_loading.gif") center no-repeat', display:'none'});

	if(this.opts.show_empty_tab)
		this.make_result_tab();
	
	this.bottom_div = $a(this.body_area,'div','',{paddingTop:'8px',height:'22px'});
	
	// buttons
	var t = make_table(me.btn_area, 1,12, '',['20px','','20px','','20px','','20px','','20px','','20px',''],{height: '36px', verticalAlign:'middle'});
	var cnt = 0;
	this.btns = {};
	var make_btn = function(label,src,onclick,bold) {
		$w($td(t,0,cnt+1), (20 + 6*label.length) + 'px');
		var img = $a($td(t,0,cnt+0), 'img', ''); img.src = "images/icons/"+src+".gif";
		var span = $a($td(t,0,cnt+1),'span','link_type',{margin:'0px 8px 0px 4px'});
		if(bold)$y(span,{fontSize: '14px', fontWeight: 'bold'});
		span.innerHTML = label;
		span.onclick = onclick;
		me.btns[label] = [img,span]; // link
	}
	
	
	// refresh btn
	var tmp = 0;
	if(!this.opts.hide_refresh) {
		make_btn('Refresh','page_refresh',function() {me.run();},1); cnt+=2;
	}

	// new
	if(this.opts.show_new) {
		make_btn('New ','page_add',function() { new_doc(me.dt); },1); cnt+=2;
	}

	// report
	if(this.opts.show_report) {
		make_btn('Report Builder','table',function() { loadreport(me.dt); },0); cnt+=2;
	}
	
	// export
	if(!this.opts.hide_export) {
		make_btn('Export','page_excel',function() {me.do_export();}); cnt +=2;
	}

	// print
	if(!this.opts.hide_print) {
		make_btn('Print','printer',function() {me.do_print();}); cnt+=2;
	}
	
	// calc
	if(this.opts.show_calc) {
		make_btn('Calc','calculator',function() {me.do_calc();}); cnt+=2;
		$dh(this.btns['Calc'][0]); $dh(this.btns['Calc'][1]);
	}
	
	if(!cnt)$dh(this.btn_area);
	
	this.paging_nav = {};
	this.make_paging_area('top',$td(this.body_head,0,1));
	if(this.opts.show_bottom_paging) 
		this.make_paging_area('bottom',this.bottom_div);
	
}

Listing.prototype.do_print = function() {
	this.build_query();
	if(!this.query) { alert('No Query!'); return; }
	
	args = {
		query:this.query,
		title:this.head_text,
		colnames:this.colnames,
		colwidths:this.colwidths,
		coltypes:this.coltypes,
		has_index:(this.no_index ? 0 : 1),
		has_headings: 1,
		check_limit:1,
		is_simple:1
	}
	
	new_widget('_p.PrintQuery', function(w) {
		// global
		if(!_p.print_query) 
			_p.print_query = w;
		
		_p.print_query.show_dialog(args);	
	}, 1);
}

Listing.prototype.do_calc = function() {
	show_calc(this.result_tab, this.colnames, this.coltypes, 0)
}

ListPaging = function(id, list, p) {
	var mo_bg = '#FFF';
	this.list = list;
	this.wrapper = $a(p,'div','paging_area');
	$dh(this.wrapper);
	var cw = ['15px','50px'];
	for(var i=0;i<list.paging_len;i++) cw[cw.length]='20px';
	cw[cw.length]='35px'; cw[cw.length]='15px'
	var pt = make_table(this.wrapper,1,cw.length,null,cw)

	var me = this;
	var make_link = function(p,label,onclick,rtborder) {
		p.innerHTML = label; 
		p.style.cursor='pointer';
		p.onmouseover = function() { if(!this.disabled) { this.className = 'srs_paging_item srs_paging_item_mo'} }
		p.onmouseout = function() { this.className = 'srs_paging_item'; }
		p.user_onclick = onclick;
		p.onclick = function() { this.user_onclick(); }
		p.disable = function(b) { if(!b)$op(this,30); p.style.cursor='default'; this.disabled=1; }
		p.enable = function() { $op(this,100); p.style.cursor='pointer'; this.disabled=0; }
		p.rtborder = rtborder;
		if(rtborder)p.style.borderRight = '1px solid #CCC';
		return p;
	}

	var goto_rec = function(t,st) { if(!t.disabled) {list.start=st;list.run(1);} }

	this.prev1 = make_link($td(pt,0,0),'<img src="images/ui/prev_pointer.gif">',function() { goto_rec(this,me.list.start - me.list.page_len); });
	this.prev2 = make_link($td(pt,0,1),'Previous',function() { goto_rec(this,me.list.start - me.list.page_len); });

	for(var i=0;i<list.paging_len;i++) {
		this['p_'+i] = make_link($td(pt,0,i+2),'',function() { goto_rec(this,this.st); },((i==list.paging_len-1)?0:1));
	}
	this.next1 = make_link($td(pt,0,cw.length-2),'Next',function() { goto_rec(this,me.list.start + me.list.page_len); });
	this.next2 = make_link($td(pt,0,cw.length-1),'<img src="images/ui/next_pointer.gif">',function() { goto_rec(this,me.list.start + me.list.page_len); });

	list.paging_nav[id] = this;
}

ListPaging.prototype.refresh = function(nr) {
	var lst = this.list;
	if(cint(lst.max_len) <= cint(lst.page_len)) {
		$dh(this.wrapper); return;
	}
	$ds(this.wrapper);
	var last = 0; var cpage = 1; var page_from = 1;
	if((lst.start + nr) == lst.max_len) last = 1;
	
	if(lst.start>0) {
		this.prev1.enable(); this.prev2.enable(); 
		cpage = cint(lst.start / lst.page_len)+1;
		if(cpage > 3) page_from = cpage - 2;
	} else { 
		this.prev1.disable(); this.prev2.disable(); 
	}
	
	// set pages
	for(var i=0;i<lst.paging_len;i++) {
		var st = ((page_from-1)+i)* lst.page_len;
		var p = this['p_'+i];
		if((page_from+i)==cpage) {
			p.innerHTML = ((page_from+i)+'').bold();
			p.disable(1);
		} else if (st> lst.max_len) {
			p.innerHTML = (page_from+i)+'';	
			p.disable();
		} else {
			p.innerHTML = (page_from+i)+'';	
			p.enable();	
			p.st = st;
		}
	}
	if(!last) { this.next1.enable();this.next2.enable(); } else { this.next1.disable();this.next2.disable(); }
}


Listing.prototype.make_paging_area = function(id, p) { new ListPaging(id,this,p); }
Listing.prototype.refresh_paging = function(nr) { for(var i in this.paging_nav) this.paging_nav[i].refresh(nr);}
Listing.prototype.hide_paging = function() { for(var i in this.paging_nav) $dh(this.paging_nav[i].wrapper); }

Listing.prototype.add_filter = function(label, ftype, options, tname, fname, cond) {
	if(!this.filter_area){alert('[Listing] make() must be called before add_filter');}
	var me = this;

	// create filter area
	if(!this.filter_set) {
		// actual area
		var h = $a(this.filter_area, 'div', '', {fontSize:'14px', fontWeight:'bold', marginBottom:'4px'}); 
		h.innerHTML = 'Apply Filters';
		this.filter_area.div = $a(this.filter_area, 'div'); 
				
		this.perm = [[1,1],]
		this.filters = {};
	}
	
	$ds(this.filter_wrapper);
	$(this.filter_wrapper).corners();

	// create new table (or new line)
	if((!this.inp_tab) || (this.inp_tab.rows[0].cells.length==this.filters_per_line)) {
		this.inp_tab = $a(this.filter_area.div, 'table','',{width:'100%'});
		this.inp_tab.insertRow(0);	
	}

	
	var c= this.inp_tab.rows[0].insertCell(this.inp_tab.rows[0].cells.length);
	$y(c,{width:cint(100/this.filters_per_line) + '%',textAlign:'left',verticalAlign:'top'});
	
	var d1= $a(c,'div'); d1.innerHTML = label; $y(d1,{marginBottom:'2px'});
	var d2= $a(c,'div');
	
	// create the filter
	if(in_list(['Text', 'Small Text', 'Code', 'Text Editor'],ftype)) 
		ftype='Data';
	var inp = make_field({fieldtype:ftype, 'label':label, 'options':options}, '', d2, this, 0, 1);
	inp.not_in_form = 1;
	inp.report = this;

	// filter style
	inp.df.single_select = 1;
	inp.parent_cell = c;
	inp.parent_tab = this.input_tab;
	$y(inp.wrapper,{width:'140px'});
	inp.refresh();
	if(!inp.input.custom_select)
		$y(inp.input,{width:'100%'});
	inp.tn = tname; inp.fn = fname; inp.condition = cond;
	
	var me = this;
	inp.onchange = function() { me.start = 0; }
	this.filters[label] = inp;
	this.filter_set = 1;
}

Listing.prototype.remove_filter = function(label) {
	var inp = this.filters[label];
	inp.parent_tab.rows[0].deleteCell(inp.parent_cell.cellIndex);
	delete this.filters[label];
}

Listing.prototype.remove_all_filters = function() {
	for(var k in this.filters) this.remove_filter(k);
	$dh(this.filter_wrapper);
}

Listing.prototype.add_sort = function(ci, fname) { this.sort_list[ci]=fname;	}
Listing.prototype.has_data = function() { return this.n_records; }

Listing.prototype.set_default_sort = function(fname, sort_order) {
	this.sort_order = sort_order;
	this.sort_order_dict[fname] = sort_order;
	this.sort_by = fname;
	if(this.sort_heads[fname])
		this.sort_heads[fname].set_sorting_as(sort_order);
}
Listing.prototype.set_sort = function(cell, ci, fname) {
	var me = this;
	$y(cell.sort_cell,{width:'18px'});

	cell.sort_img = $a(cell.sort_cell, 'img');
	cell.fname = fname;
	$dh(cell.sort_img);

	cell.set_sort_img = function(order) {
		var t = 'images/icons/sort_desc.gif';
		if(order=='ASC') {
			t = 'images/icons/sort_asc.gif';
		}
		this.sort_img.src = t;		
	}

	cell.set_sorting_as = function(order) {
		// set values for query building
		me.sort_order = order;
		me.sort_by = this.fname
		me.sort_order_dict[this.fname] = order;

		// set the image
		this.set_sort_img(order)
		
		// deselect active
		if(me.cur_sort) {
			$y(me.cur_sort, {backgroundColor:"#FFF"});
			$dh(me.cur_sort.sort_img);
		}
		
		// set at active
		me.cur_sort = this;
		$y(this, {backgroundColor:"#DDF"});
		$di(this.sort_img);
	}

	$y(cell.label_cell,{color:'#44A',cursor:'pointer'});

	// set default image
	cell.set_sort_img(me.sort_order_dict[fname] ? me.sort_order_dict[fname] : 'ASC');
		
		
	cell.onmouseover = function() { 
		$di(this.sort_img); 
	}
	
	cell.onmouseout = function() { 
		if(this != me.cur_sort) 
			$dh(this.sort_img); 
	}
	
	cell.onclick = function() {
		// switch
		this.set_sorting_as((me.sort_order_dict[fname]=='ASC') ? 'DESC' : 'ASC');
		
		// run
		me.run();
	}
	
	this.sort_heads[fname] = cell;
}
Listing.prototype.do_export = function() {
	this.build_query();
	var cn = [];
	if(this.no_index)
		cn = this.colnames; // No index
	else {
		for(var i=1;i<this.colnames.length;i++) cn.push(this.colnames[i]); // Ignore the SR label
	}
	var q = export_query(this.query, function(query) { export_csv(query, this.head_text, null, 1, null, cn); });
}

Listing.prototype.build_query = function() {
	if(this.get_query)this.get_query(this);
	if(!this.query) { alert('No Query!'); return; }

	// add filters
	var cond = [];
	for(var i in this.filters) {
		var f = this.filters[i];
		var val = f.get_value();
		var c = f.condition;
		if(!c)c='=';
		if(val && c.toLowerCase()=='like')val += '%';
		if(f.tn && val && !in_list(['All','Select...',''],val)) 
			cond.push(repl(' AND `tab%(dt)s`.%(fn)s %(condition)s "%(val)s"', {dt:f.tn, fn:f.fn, condition:c, val:val}));
	}

	if(cond) {
		this.query += NEWLINE + cond.join(NEWLINE)
		this.query_max += NEWLINE + cond.join(NEWLINE)
	}

    // add grouping
	if(this.group_by)
		this.query += ' ' + this.group_by + ' ';	

	// add sorting
	if(this.sort_by && this.sort_order) {
		this.query += NEWLINE + ' ORDER BY `' + this.sort_by + '` ' + this.sort_order;
	}
	if(this.show_query) msgprint(this.query);
}
Listing.prototype.set_rec_label = function(total, cur_page_len) {
	if(this.opts.hide_rec_label) 
		return;
	else if(total==-1)
		this.rec_label.innerHTML = 'Fetching...'
	else if(total > 0)
		this.rec_label.innerHTML = repl('Total %(total)s %(keyword)s. Showing %(start)s to %(end)s', {total:total,start:cint(this.start)+1,end:cint(this.start)+cint(cur_page_len), keyword:this.keyword});
	else if(total==null)
		this.rec_label.innerHTML = ''
	else if(total==0)
		this.rec_label.innerHTML = 'No Result'
}

Listing.prototype.run = function(from_page) {
	this.build_query();
	
	var q = this.query;
	var me = this;

	// add limits
	if(this.max_len && this.start>=this.max_len) this.start-= this.page_len;
	if(this.start<0 || (!from_page)) this.start = 0;
	
	q += ' LIMIT ' + this.start + ',' + this.page_len;
	
	// callback
	var call_back = function(r,rt) {
		// show results
		me.clear_tab();
		me.max_len = r.n_values;
		if(r.values && r.values.length) {
			me.n_records = r.values.length;
			var nc = r.values[0].length;
			if(me.colwidths) nc = me.colwidths.length-(me.no_index?0:1); // -1 for sr no

			// redraw table
			if(!me.opts.append_records && !me.show_empty_tab) {
				me.remove_result_tab();
				me.make_result_tab(r.values.length);
			}
			me.refresh(r.values.length, nc, r.values);
			me.total_records = r.n_values;
			me.set_rec_label(r.n_values, r.values.length);
		} else { // no result
			if(!me.opts.append_records) {
				me.n_records = 0;
				me.set_rec_label(0);
				if(!me.show_empty_tab) {
					me.remove_result_tab();
					me.make_result_tab(0);
				} else {
					me.clear_tab();
				}
			}
		}
		$ds(me.results);
		if(me.onrun) me.onrun();
	}
	
	// run
	this.set_rec_label(-1);
	if(this.server_call) 
		{ this.server_call(this, call_back); }
	else {
		args={ query_max: this.query_max }
		if(this.is_std_query) args.query = q;
		else args.simple_query = q;
		$c('webnotes.widgets.query_builder.runquery', args, call_back, null, this.no_loading);
	}
}

Listing.prototype.remove_result_tab = function() {
	if(!this.result_tab) return;
	this.result_tab.parentNode.removeChild(this.result_tab);
	delete this.result_tab;
}

Listing.prototype.reset_tab = function() {
	this.remove_result_tab();
	this.make_result_tab();
}

Listing.prototype.make_result_tab = function(nr) {
	if(this.result_tab)return;
	if(!this.colwidths) alert("Listing: Must specify column widths");
	var has_headrow = this.colnames ? 1 : 0;
	if(nr==null)nr = this.page_len;
	nr += has_headrow;
	var nc = this.colwidths.length;
		
	var t=make_table(this.results, nr, nc, '100%', this.colwidths,{padding:'0px'});
	t.className = 'srs_result_tab'; this.result_tab = t;
	$y(t,{borderCollapse:'collapse'});
	
	// display headings
	if(has_headrow) {
		this.make_headings(t,nr,nc);
		
		// hilight sorted cell
		if(this.sort_by && this.sort_heads[this.sort_by]) {
			this.sort_heads[this.sort_by].set_sorting_as(this.sort_order);
		}
	}
	
	for(var ri=(has_headrow?1:0); ri<t.rows.length; ri++) {
		for(var ci=0; ci<t.rows[ri].cells.length; ci++) {
			if(this.opts.cell_style)$y($td(t,ri,ci), this.opts.cell_style);
			if(this.opts.alt_cell_style && (ri % 2))$y($td(t,ri,ci), this.opts.alt_cell_style);	
			if(this.opts.show_empty_tab)$td(t, ri, ci).innerHTML = '&nbsp;';
		}
	}

	if(this.opts.no_border == 1) {
		$y(t,{border:'0px'});
	}	

	this.result_tab = t;
}
Listing.prototype.clear_tab = function() {
	$dh(this.results);
	if(this.result_tab) {
		var nr = this.result_tab.rows.length;
		for(var ri=(this.colnames?1:0); ri<nr; ri++)
			for(var ci=0; ci< this.result_tab.rows[ri].cells.length; ci++)
				$td(this.result_tab, ri, ci).innerHTML = (this.opts.show_empty_tab ? '&nbsp;' : '');
	}
}
Listing.prototype.clear = function() {
	this.rec_label.innerHTML = '';
	this.clear_tab();
}

Listing.prototype.refresh_calc = function() {
	if(!this.opts.show_calc) return;
	if(has_common(this.coltypes, ['Currency','Int','Float'])) {
		$di(this.btns['Calc'][0]); $di(this.btns['Calc'][1]);
	}
}

Listing.prototype.refresh = function(nr, nc, d) {

	this.refresh_paging(nr);
	this.refresh_calc();
	
	if(this.show_result) 
		this.show_result();
	
	else { 
		if(nr) {
			// Standard Result Display
			var has_headrow = this.colnames ? 1 : 0;	
	
			// display results
			for(var ri=0 ; ri<nr ; ri++) {
				var c0 = $td(this.result_tab,ri+has_headrow,0);
				if(!this.no_index) { // show index
					c0.innerHTML = cint(this.start) + cint(ri) + 1;
				}
				for(var ci=0 ; ci<nc ; ci++) {
					var c = $td(this.result_tab,ri+has_headrow,ci+(this.no_index?0:1));
					if(c) {
						c.innerHTML = ''; // clear
						if(this.show_cell) this.show_cell(c, ri, ci, d);
						else this.std_cell(d, ri, ci);
					}
				}
			}

		}
	}
}

Listing.prototype.make_headings = function(t,nr,nc) {
	for(var ci=0 ; ci<nc ; ci++) { 
	
		var tmp = make_table($td(t,0,ci),1,2,'100%',['','0px'],this.opts.head_style);
		$y(tmp,{tableLayout:'fixed',borderCollapse:'collapse'});
		$y($td(t,0,ci),this.opts.head_main_style); // right border on main table
		$td(t,0,ci).sort_cell = $td(tmp,0,1);
		$td(t,0,ci).label_cell = $td(tmp,0,0);
		$td(tmp,0,1).style.padding = '0px';
		
		$td(tmp,0,0).innerHTML = this.colnames[ci]?this.colnames[ci]:'&nbsp;'; 
	
		if(this.sort_list[ci])this.set_sort($td(t,0,ci), ci, this.sort_list[ci]);
					
		var div = $a($td(t,0,ci), 'div');
		$td(t,0,ci).style.borderBottom ='1px solid #CCC';
		
		if(this.coltypes && this.coltypes[ci] && in_list(['Currency','Float','Int'], this.coltypes[ci])) $y($td(t,0,ci).label_cell,{textAlign:'right'})
	}
}

Listing.prototype.std_cell = function(d, ri, ci) {
	var has_headrow = this.colnames ? 1 : 0;
	var c = $td(this.result_tab,ri+has_headrow,ci+(this.no_index?0:1));
	c.div = $a(c, 'div');
	$s(
		c.div, 
		d[ri][ci], 
		this.coltypes ? this.coltypes[ci+(this.no_index?0:1)] : null, 
		this.coloptions ? this.coloptions[ci+(this.no_index?0:1)] : null
	);
}
