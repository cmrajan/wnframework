//------------------
// FINDER 2.0
//------------------

var FILTER_SEP = '\1';

function Finder(parent, doctype, onload) {
	this.menuitems = {};
	this.has_primary_filters = false;
	this.doctype = doctype;
	var me = this;

	this.fn_list = ['beforetableprint','beforerowprint','afterrowprint','aftertableprint','customize_filters'];

	this.wrapper = $a(parent, 'div', 'finder_wrapper');

	this.make_tabs();
	this.current_loaded = null;
	this.make_filters(onload);
	
	this.hide = function() {
		$dh(me.wrapper);
	}
	this.show = function(my_onload) {
		$ds(me.wrapper);
		if(my_onload)my_onload(me);
	}
	this.make_save_criteria();
}

Finder.prototype.make_tabs = function() {
	this.tab_wrapper = $a(this.wrapper, 'div', 'finder_tab_area');
	this.mytabs = new TabbedPage(this.tab_wrapper);
	this.mytabs.body_area.className = 'finder_body_area';
	
	this.mytabs.add_tab('Result');
	this.mytabs.add_tab('More Filters');
	this.mytabs.add_tab('Select Columns');
	this.mytabs.add_tab('Graph');
	
	$dh(this.mytabs.tabs['Graph']);
}

Finder.prototype.make_body = function() {

	search_page.main_title.innerHTML = this.doctype;
	this.mytabs.tabs['Result'].show();

	var me = this;
	
	// filters broken into - primary - in searchfields and others
	this.pri_filter_fields_area = $a(this.mytabs.tabs['Result'].tab_body, 'div', 'finder_filter_area');

	this.filter_area = $a(this.mytabs.tabs['More Filters'].tab_body, 'div', 'finder_filter_area');
	this.builder_area = $a(this.mytabs.tabs['Select Columns'].tab_body, 'div', 'finder_builder_area');

	this.make_graph();
	this.make_save_criteria();
}

// Graph
// -----

Finder.prototype.make_graph = function() {
	var me = this;
	this.graph_area = $a(this.mytabs.tabs['Graph'].tab_body, 'div', '');
	this.mytabs.tabs['Graph'].onshow = function() {
		me.show_graph();
	}
}

Finder.prototype.clear_graph = function() { 
	if(this.graph_div)$dh(this.graph_div);
	this.graph_clear = 1; 
}

Finder.prototype.show_graph = function() {
	var me = this;
	
	if(isIE) {
		$dh(me.mytabs.tabs['Graph'].tab_body);
		$ds(me.mytabs.tabs['Graph'].tab_body);
	}
	
	var show_no_graph = function() {
		if(!me.no_graph) {
			me.no_graph = $a(me.mytabs.tabs['Graph'].tab_body, 'div');
			me.no_graph.style.margin = '16px';
			me.no_graph.innerHTML = 'No Graph Defined';
		}
		$ds(me.no_graph);
		return;
	}
	
	if(!me.current_loaded) {
		show_no_graph();
		return;
	}
	var sc = get_local('Search Criteria', me.sc_dict[me.current_loaded]);
	if(!sc || !sc.graph_series) {
		show_no_graph();
		return;
	}

	// get series lables
	var series = me.dt.get_col_data(sc.graph_series);
	if(series.length>100) return; //No graph more than 100 cols

	for(var i=0;i<series.length;i++) {
		if(series[i].length > 14)series[i] = series[i].substr(0,14)+'...';
	}

	var ht = (series.length * 20);

	// if exsts then, dont redraw
	if(!this.graph_clear) return;

	if(ht<400)ht=400;

	if(!me.graph_div) {
		me.graph_div = $a(me.graph_area, 'div');
		me.graph_div.style.position = 'relative';
		me.graph_div.style.border = '2px solid #AAA';
		me.graph_div.style.marginTop = '16px';
	}
	$ds(me.graph_div);
	$dh(me.no_graph);

	// get values
	var values = me.dt.get_col_data(sc.graph_values);
	for(var i=0;i<values.length;i++) {
		values[i] = flt(values[i]);	
	}

	$h(me.graph_div, ht + 'px');
	if(!me.graphobj) {
		me.graphobj = new GraphViewer(me.graph_div);
	}
	var g = me.graphobj;
	g.clear();
	g.set_title('');
	if(series.length<16) g.set_vertical();
	else g.set_horizontal();
	
	// graph settings
	g.series1_color = '#AAF';
	g.series1_border_color = '#88A';

	g.series2_color = '#AFA';
	g.series2_border_color = '#8A8';

	g.series3_color = '#FAA';
	g.series3_border_color = '#88A';

	if(me.graph_settings)me.graph_settings(g);
	
	// heights		
	$h(g.main_area, (ht - 160) + 'px');
	$h(g._y_labels, (ht - 160) + 'px');

	g._x_name.style.top = (ht - 40) + 'px';
	g._x_labels.style.top = (ht - 80) + 'px';

	g.xtitle = sc.graph_series;
	g.ytitle = sc.graph_values;
	
	g.xlabels = series;
	g.add_series(sc.graph_values, g.series1_color, values, g.series1_border_color);
	g.refresh();
	this.graph_clear = 0;
	
}

//
// Saving of criteria
// ------------------

Finder.prototype.make_save_criteria = function() {
	var me = this;
	
	// make_list
	// ---------
	
	this.sc_list = []; this.sc_dict = {};
	for(var n in locals['Search Criteria']) {
		var d = locals['Search Criteria'][n];
		if(d.doc_type==this.doctype) {
			this.sc_list[this.sc_list.length] = d.criteria_name;
			this.sc_dict[d.criteria_name] = n;
		}
	}
}

// Save Criteria
// -------------

Finder.prototype.save_criteria = function(save_as) {
	var overwrite = 0;
	// is loaded?
	if(this.current_loaded && (!save_as)) {
		var overwrite = confirm('Do you want to overwrite the saved criteria "'+this.current_loaded+'"');
		if(overwrite) {
			var doc = locals['Search Criteria'][this.sc_dict[this.current_loaded]];
			var criteria_name = this.current_loaded;
		}
	}

	// new criteria
	if(!overwrite) {
		var criteria_name = prompt('Select a name for the criteria:', '');
		if(!criteria_name)
			return;
	
		var dn = createLocal('Search Criteria');
		var doc = locals['Search Criteria'][dn];

		doc.criteria_name = criteria_name;
		doc.doc_type = this.doctype;
	}

	var cl = []; var fl = {};
	
	// save fields
	for(var i=0;i<this.report_fields.length;i++) {
		var chk = this.report_fields[i];
		if(chk.checked) {
			cl[cl.length] = chk.df.parent + '\1' + chk.df.label;
		}
	}
	
	// save filters
	for(var i=0;i<this.filter_fields.length;i++) {
		var t = this.filter_fields[i];
		var v = t.get_value?t.get_value():'';
		if(v)fl[t.df.parent + '\1' + t.df.label + (t.bound?('\1'+t.bound):'')] = v;
	}
	
	doc.columns = cl.join(',');
	doc.filters = docstring(fl);
	
	// sort by and sort order
	doc.sort_by = sel_val(this.dt.sort_sel);
	doc.sort_order = this.dt.sort_order;
	doc.page_len = this.dt.page_len;
	
	// save advanced
	if(this.parent_dt)
		doc.parent_doc_type = this.parent_dt
	
	// rename
	var me = this;
	var fn = function(r) {
		me.sc_dict[criteria_name] = r.main_doc_name;
		me.set_criteria_sel(criteria_name);
	}
	if(this.current_loaded && overwrite) {
		msgprint('Filters and Columns Synchronized. You must also "Save" the Search Criteria to update');
		loaddoc('Search Criteria', this.sc_dict[this.current_loaded]);
	} else {
		savedoc(doc.doctype, doc.name, 'Save',fn);
	}
}

Finder.prototype.hide_all_filters = function() {
	for(var i=0; i<this.filter_fields.length; i++) {
		this.filter_fields[i].df.filter_hide = 1;
	}
}

// Load Criteria
// -------------
Finder.prototype.clear_criteria = function() {
	// clear all fields
	// ----------------
		
	for(var i=0; i<this.report_fields.length; i++) {
		this.report_fields[i].checked = false;
	}

	// clear filters
	// -------------
	for(var i=0; i<this.filter_fields.length; i++) {
		// reset filters
		this.filter_fields[i].df.filter_hide = 0;
		this.filter_fields[i].df.ignore = 0;
		if(this.filter_fields[i].df.custom) // hide customized filters
			this.filter_fields[i].df.filter_hide = 1;
		
		this.filter_fields[i].set_input(null);
	}
	
	this.set_sort_options();
	
	search_page.main_title.innerHTML = this.doctype;

	// clear graph
	// -----------
	this.clear_graph();
	
	this.current_loaded = null;
	this.customized_filters = null;
	this.sc = null;
	this.has_index = 1; this.has_headings = 1;

	for(var i in this.fn_list) this[this.fn_list[i]] = null; // clear custom functions
	
	this.refresh_filters();	
}

Finder.prototype.select_column = function(dt, label, value) {
	if(value==null)value = 1;
	if(this.report_fields_dict[dt+'\1'+ label])
		this.report_fields_dict[dt+'\1'+ label].checked = value;
}

Finder.prototype.set_filter = function(dt, label, value) {
	if(this.filter_fields_dict[dt+'\1'+ label])
		this.filter_fields_dict[dt+'\1'+ label].set_input(value);
}

Finder.prototype.load_criteria = function(criteria_name) {
	this.clear_criteria();	
	
	if(!this.sc_dict[criteria_name]) {
		alert(criteria_name + ' could not be loaded. Please Refresh and try again');
	}
	this.sc = locals['Search Criteria'][this.sc_dict[criteria_name]];

	var report = this;
	if(this.sc && this.sc.report_script) eval(this.sc.report_script);
	
	this.large_report = 0;

	if(report.customize_filters) {
		report.customize_filters(this);
	}

	// refresh fiters
	this.refresh_filters();
	
	// set fields
	// ----------
	var cl = this.sc.columns.split(',');
	for(var c=0;c<cl.length;c++) {
		var key = cl[c].split('\1');
		this.select_column(key[0], key[1], 1);
	}

	// set filters
	// -----------

	var fl = eval('var a='+this.sc.filters+';a');
	for(var n in fl) {
		if(fl[n]) {
			var key = n.split('\1');
			if(key[1]=='docstatus') { /* ? */ }
			this.set_filter(key[0], key[1], fl[n]);
		}
	}
	this.set_criteria_sel(criteria_name);
}

Finder.prototype.set_criteria_sel = function(criteria_name) {
	// load additional fields sort option
	search_page.main_title.innerHTML = criteria_name;
	
	var sc = locals['Search Criteria'][this.sc_dict[criteria_name]];
	if(sc && sc.add_col)
		var acl = sc.add_col.split('\n');
	else
		var acl = [];
	var new_sl = [];
	for(var i=0; i<acl.length; i++) {
		var tmp = acl[i].split(' AS ');
		if(tmp[1]) {
			var t = eval(tmp[1]);
			new_sl[new_sl.length] = [t, "`"+t+"`"];
		}
	}
	this.set_sort_options(new_sl);
	if(sc && sc.sort_by) {
		this.dt.sort_sel.value = sc.sort_by;
	}
	if(sc && sc.sort_order) {
		sc.sort_order=='ASC' ? this.dt.set_asc() : this.dt.set_desc();
	}
	if(sc && sc.page_len) {
		this.dt.page_len_sel.value = sc.page_len;
	}
	this.current_loaded = criteria_name;
}

//
// Create the filter UI and column selection UI
// --------------------------------------------

Finder.prototype.setup_filters = function() {

	function can_dt_be_submitted(dt) {
		var plist = getchildren('DocPerm', dt, 'permissions', 'DocType');
		for(var pidx in plist) {
			if(plist[pidx].submit) return 1;
		}
		return 0;
	}

	var me = this;
	me.make_body();

	var dt = me.parent_dt?me.parent_dt:me.doctype;
	me.report_fields = [];
	me.filter_fields = [];
	me.report_fields_dict = {};
	me.filter_fields_dict = {};
	
	// default filters
	var fl = [
		{'fieldtype':'Data', 'label':'ID', 'fieldname':'name', 'search_index':1, 'parent':dt},
		{'fieldtype':'Data', 'label':'Created By', 'fieldname':'owner', 'search_index':1, 'parent':dt},
	];

	// can this be submitted?
	if(can_dt_be_submitted(dt)) {
		fl[fl.length] = {'fieldtype':'Check', 'label':'Saved', 'fieldname':'docstatus', 'search_index':1, 'def_filter':1, 'parent':dt};
		fl[fl.length] = {'fieldtype':'Check', 'label':'Submitted', 'fieldname':'docstatus', 'search_index':1, 'def_filter':1, 'parent':dt};
		fl[fl.length] = {'fieldtype':'Check', 'label':'Cancelled', 'fieldname':'docstatus', 'search_index':1, 'parent':dt};
	}
	
	// Add columns of parent doctype
	// -----------------------------
	me.make_datatable();

	// select all button
	// -----------------
	me.select_all = $a($a(me.builder_area,'div','',{padding:'8px 0px'}),'button');
	me.select_all.innerHTML = 'Select / Unselect All';
	me.select_all.onclick = function() {
		var do_select = 1;
		if(me.report_fields[0].checked) do_select = 0;
		for(var i in me.report_fields) { me.report_fields[i].checked = do_select };
	}

	// Make fields and selectors

	me.orig_sort_list = [];

	if(me.parent_dt) {
		var lab = $a(me.filter_area,'div','filter_dt_head');
		lab.innerHTML = 'Filters for ' + me.parent_dt;

		var lab = $a(me.builder_area,'div','builder_dt_head');
		lab.innerHTML = 'Select columns for ' + me.parent_dt;
				
		me.make_filter_fields(fl, me.parent_dt); // make for parent
		var fl = [];
	}

	// Add columns of selected doctype
	// -------------------------------

	var lab = $a(me.filter_area,'div','filter_dt_head');
	lab.innerHTML = 'Filters for ' + me.doctype;
	
	var lab = $a(me.builder_area,'div','builder_dt_head');
	lab.innerHTML = 'Select columns for ' + me.doctype;

	me.make_filter_fields(fl, me.doctype); // make for the table

	// hide primary filters if not fields
	if(!this.has_primary_filters) $dh(this.pri_filter_fields_area);

	// show body
	$ds(me.body);
}

Finder.prototype.refresh_filters = function() {
	// called after customization
	for(var i=0; i<this.filter_fields.length; i++) {
		var f = this.filter_fields[i];
		
		// is hidden ?
		if(f.df.filter_hide) { $dh(f.wrapper); }
		else $ds(f.wrapper);
		
		// is bold?
		if(f.df.bold) { if(f.label_cell) $y(f.label_cell, {fontWeight:'bold'}) }
		else { if(f.label_cell) $y(f.label_cell, {fontWeight:'normal'}) }
		
		// set default value
		if(f.df['report_default']) 
			f.set_input(f.df['report_default']);
			//f.set_input(LocalDB.get_default_value(f.df.fieldname, f.df.fieldtype, f.df['default']));
			
		// show in first page?
		if(f.df.in_first_page) {
			f.df.filter_cell.parentNode.removeChild(f.df.filter_cell);
			this.pri_filter_fields_area.appendChild(f.df.filter_cell);
			this.has_primary_filters = 1;
			$ds(this.pri_filter_fields_area);
		}
	}
}

Finder.prototype.add_filter = function(f) {
	if(this.filter_fields_dict[f.parent + '\1' + f.label]) {
		// exists
		this.filter_fields_dict[f.parent + '\1' + f.label].df = f; // reset properties
	} else {
		f.custom = 1;
		this.add_field(f, f.parent);
	}
}

Finder.prototype.add_field = function(f, dt, in_primary) {
	var me = this;
	
	// make a field object
	var add_field = function(f, dt, parent) {
		var tmp = make_field(f, dt, parent, me, false);
		tmp.in_filter = true;
		tmp.refresh();
		me.filter_fields[me.filter_fields.length] = tmp;
		me.filter_fields_dict[f.parent + '\1' + f.label] = tmp;
		return tmp;	
	}
	
	// insert in (parent element)
	if(f.in_first_page) in_primary = true;
	
	var fparent = this.filter_fields_area;
	if(in_primary) { fparent = this.pri_filter_fields_area; this.has_primary_filters = 1; }
	
	// label
	// --- ability to insert
	if(f.on_top) {
		var cell = document.createElement('div');
		fparent.insertBefore(cell, fparent.firstChild);
		$y(cell,{width:'70%'});
	} else if(f.insert_before) {
		var cell = document.createElement('div');
		fparent.insertBefore(cell, fparent[f.df.insert_before].filter_cell);
		$y(cell,{width:'70%'});		
	}
	else
		var cell = $a(fparent, 'div', '', {width:'70%'});

	f.filter_cell = cell;
		
	// make field
	if(f.fieldtype=='Date') {
		
		var my_div = $a(cell,'div','',{});
		
		// from date
		var f1 = copy_dict(f);
		f1.label = 'From ' + f1.label;
		var tmp1 = add_field(f1, dt, my_div);
		tmp1.sql_condition = '>=';
		tmp1.bound = 'lower';

		// to date
		var f2 = copy_dict(f);
		f2.label = 'To ' + f2.label;
		var tmp2 = add_field(f2, dt, my_div);
		tmp2.sql_condition = '<=';
		tmp2.bound = 'upper';
						
	} else if(in_list(['Currency', 'Int', 'Float'], f.fieldtype)) {

		var my_div = $a(cell,'div','',{});
	
		// from date
		var f1 = copy_dict(f);
		f1.label = f1.label + ' >=';
		var tmp1 = add_field(f1, dt, my_div);
		tmp1.sql_condition = '>=';
		tmp1.bound = 'lower';

		// to date
		var f2 = copy_dict(f);
		f2.label = f2.label + ' <=';
		var tmp2 = add_field(f2, dt, my_div);
		tmp2.sql_condition = '<=';
		tmp2.bound = 'upper';		
	} else {
		var tmp = add_field(f, dt, cell);
	}
	
	// add to datatable sort
	if(f.fieldname != 'docstatus')
		me.orig_sort_list[me.orig_sort_list.length] = [f.label, '`tab' + f.parent + '`.`' + f.fieldname + '`'];
			
	// check saved
	if(f.def_filter)
		tmp.input.checked = true;
	
}

Finder.prototype.make_filter_fields = function(fl, dt) {
	var me = this; 
	
	if(search_page.sel)search_page.sel.value = dt;

	var t1 = $a($a(me.builder_area,'div'), 'table', 'builder_tab');

	// filter fields area
	this.filter_fields_area = $a(me.filter_area,'div');

	// get fields
	var dt_fields = fields_list[dt];
	for(var i=0;i<dt_fields.length;i++) {
		fl[fl.length] = dt_fields[i];
	}
	
	// get "high priority" search fields
	var sf_list = locals.DocType[dt].search_fields ? locals.DocType[dt].search_fields.split(',') : [];
	for(var i in sf_list) sf_list[i] = strip(sf_list[i]);
	
	this.ftab_cidx = 1; var bidx = 2;

	// make fields
	for(var i=0;i<fl.length;i++) {
	
		var f=fl[i];
		
		// add to filter
		if(f && cint(f.search_index)) {
			me.add_field(f, dt, in_list(sf_list, f.fieldname));
		}
		
		// add to column selector (builder) 
		if(f && !in_list(no_value_fields, f.fieldtype) && f.fieldname != 'docstatus' && (!f.report_hide)) {

			// add filter table cell ** for 3-col layout
			if(bidx==2) {
				var br = t1.insertRow(t1.rows.length);br.insertCell(0);br.insertCell(1);br.insertCell(2);
				bidx = 0;
			} else { bidx++; }

			var div = $a(br.cells[bidx], 'div', 'builder_field');
			var t2 = $a(div, 'table');
			var row = t2.insertRow(0);
			row.insertCell(0); row.insertCell(1);
			$w(row, '10%');

			if(isIE) {
				row.cells[0].innerHTML = '<input type="checkbox" style="border: 0px;">'; // IE fix
				var chk = row.cells[0].childNodes[0];
			} else {
				var chk = $a(row.cells[0], 'input'); 
				chk.setAttribute('type', 'checkbox');
			}

			chk.style.marginRight = '2px';
			chk.df = f;
			if(f.search_index || f.in_search) {
				chk.checked = true;
			}
			me.report_fields.push(chk);
			me.report_fields_dict[f.parent + '\1' + f.label] = chk;
			
			row.cells[1].innerHTML = f.label;
			row.cells[1].style.fontSize = '11px';
			
			// if in searchfield check
		}
	}
	me.set_sort_options();
}

Finder.prototype.set_sort_options = function(l) {
	var sl = this.orig_sort_list;
	
	empty_select(this.dt.sort_sel);
	
	if(l) sl = add_lists(l, this.orig_sort_list)
	for(var i=0; i<sl.length; i++) {
		this.dt.add_sort_option(sl[i][0], sl[i][1]);
	}
}


Finder.prototype.make_filters = function(onload) {
	// load doctype
	var me = this;
	
	if(!locals['DocType'][this.doctype]) {
		freeze('Loading Report...');
		$c('getdoctype', args = {'doctype': this.doctype, 'with_parent':1 }, 
			function(r,rt) { 
				unfreeze();
				if(r.parent_dt)me.parent_dt = r.parent_dt;
				me.setup_filters();
				if(onload)onload(me);
			} );
	} else {
		// find parent dt if required
		for(var key in locals.DocField) {
			var f = locals.DocField[key];
			if(f.fieldtype=='Table' && f.options==this.doctype)
				this.parent_dt = f.parent;
		}
		me.setup_filters();
		if(onload)onload(me);
	}
}

//
// Make the SQL query
// ------------------

Finder.prototype.make_datatable = function() {
	var me = this;
	
	this.dt_area = $a(this.mytabs.tabs['Result'].tab_body, 'div', 'finder_dt_area');

	var clear_area = $a(this.mytabs.tabs['Result'].tab_body, 'div');
	clear_area.style.marginTop = '8px';
	clear_area.style.textAlign = 'right';
	
	this.clear_btn = $a(clear_area, 'button');
	this.clear_btn.innerHTML = 'Clear Settings';
	this.clear_btn.onclick = function() {
		me.clear_criteria();
		me.set_filter(me.doctype, 'Saved', 1);
		me.set_filter(me.doctype, 'Submitted', 1);
		me.set_filter(me.doctype, 'Cancelled', 0);
		me.select_column(me.doctype, 'ID');
		me.select_column(me.doctype, 'Owner');
		me.dt.clear_all();
	}

	var div = $a(this.mytabs.tabs['Result'].tab_body, 'div');
	div.style.marginTop = '8px';

	var d = $a(div, 'div');
	d.innerHTML = '<input type="checkbox" style="border: 0px;"> Show Query'; // IE fix
	this.show_query = d.childNodes[0];
	this.show_query.checked = false;

	
	this.dt = new DataTable(this.dt_area, '');
	this.dt.finder = this;
	this.dt.make_query = function() {
		// attach report script functions
		var report = me;
		
		// get search criteria
		if(me.current_loaded && me.sc_dict[me.current_loaded])
			var sc = get_local('Search Criteria', me.sc_dict[me.current_loaded]);
		
		if(sc) me.dt.search_criteria = sc;
		else me.dt.search_criteria = null;
		
		//load server script
		if(sc && sc.server_script) me.dt.server_script = sc.server_script;
		else me.dt.server_script = null;
	
		//load client scripts
		for(var i=0;i<me.fn_list.length;i++) {
			if(me[me.fn_list[i]]) me.dt[me.fn_list[i]] = me[me.fn_list[i]];
			else me.dt[me.fn_list[i]] = null;
		}
		
		var fl = []; // field list
		var docstatus_cl = [];
		var cl = []; // cond list
		var table_name = function(t) { return '`tab' + t + '`'; }

		// advanced - diabled filters
		var dis_filters_list = [];
		if(sc && sc.dis_filters)
			var dis_filters_list = sc.dis_filters.split('\n');
		
		
		for(var i=0;i<me.report_fields.length;i++) {
			var chk = me.report_fields[i];
			if(chk.checked) {
				fl[fl.length] = table_name(chk.df.parent)+'.`'+chk.df.fieldname+'`';
			}
		}
		
		// advanced - additional fields
		if(sc && sc.add_col) {
			var adv_fl = sc.add_col.split('\n');
			for(var i=0;i<adv_fl.length;i++) {
				fl[fl.length] = adv_fl[i];
			}
		}

		// filter values for server side
		me.dt.filter_vals = {} 
		add_to_filter = function(k,v,is_select) {
			if(v==null)v='';
			if(!in_list(keys(me.dt.filter_vals), k)) {
				me.dt.filter_vals[k] = v;
				return
			} else {
				if(is_select)
					me.dt.filter_vals[k] += '\n' + v;
				else
					me.dt.filter_vals[k+'1'] = v; // for date, numeric (from-to)
			}
		}

		for(var i=0;i<me.filter_fields.length;i++) {
			var t = me.filter_fields[i];
			
			// add to "filter_values"
			var v = t.get_value?t.get_value():'';
			if(t.df.fieldtype=='Select') {
				for(var sel_i=0;sel_i < v.length; sel_i++) { 
					if(v[sel_i]) { add_to_filter(t.df.fieldname, v[sel_i], 1); }
				}

				// no values? atleast add key
				if(!v.length) add_to_filter(t.df.fieldname, "", 1); 
			} else add_to_filter(t.df.fieldname, v);
			
			// if filter is not disabled
			if(!in_list(dis_filters_list, t.df.fieldname) && !t.df.ignore) {
				if(t.df.fieldname=='docstatus') {
	
					// work around for docstatus
					// -------------------------
					
					if(t.df.label=='Saved'){
						if(t.get_value()) docstatus_cl[docstatus_cl.length] = table_name(t.df.parent)+'.docstatus=0';
						else cl[cl.length] = table_name(t.df.parent)+'.docstatus!=0';
					}
					else if(t.df.label=='Submitted'){
						if(t.get_value()) docstatus_cl[docstatus_cl.length] = table_name(t.df.parent)+'.docstatus=1';
						else cl[cl.length] = table_name(t.df.parent)+'.docstatus!=1';
					}
					else if(t.df.label=='Cancelled'){
						if(t.get_value()) docstatus_cl[docstatus_cl.length] = table_name(t.df.parent)+'.docstatus=2';
						else cl[cl.length] = table_name(t.df.parent)+'.docstatus!=2';
					}
				} else { // normal
					var fn = '`' + t.df.fieldname + '`';
					var v = t.get_value?t.get_value():'';
					if(v) {
						if(in_list(['Data','Link','Small Text','Text'],t.df.fieldtype)) {
							cl[cl.length] = table_name(t.df.parent) + '.' + fn + ' LIKE "' + v + '%"';
						} else if(t.df.fieldtype=='Select') {
							var tmp_cl = [];
							for(var sel_i=0;sel_i < v.length; sel_i++) {
								if(v[sel_i]) {
									tmp_cl[tmp_cl.length] = table_name(t.df.parent) + '.' + fn + ' = "' + v[sel_i] + '"';
								}
							}
							if(tmp_cl.length)cl[cl.length] = '(' + tmp_cl.join(' OR ') + ')';
						} else {
							var condition = '=';
							if(t.sql_condition) condition = t.sql_condition;
							cl[cl.length] = table_name(t.df.parent) + '.' + fn + condition + '"' + v + '"';
						}
					}
				}
			}
		}
		
		// standard filters
		me.dt.filter_vals.user = user;
		me.dt.filter_vals.user_email = user_email;
		
		// overloaded query - finish it here
		this.is_simple = 0;
		if(sc && sc.custom_query) {
			this.query = repl(sc.custom_query, me.dt.filter_vals);
			this.is_simple = 1;
			return
		}

		// add docstatus conditions
		if(docstatus_cl.length)
			cl[cl.length] = '('+docstatus_cl.join(' OR ')+')';

		// advanced - additional conditions
		if(sc && sc.add_cond) {
			var adv_cl = sc.add_cond.split('\n');
			for(var i=0;i< adv_cl.length;i++) {
				cl[cl.length] = adv_cl[i];
			}
		}

		if(!fl.length) {
			alert('You must select atleast one column to view');
			this.query = '';
			return;
		}

		// join with parent in case of child
		var tn = table_name(me.doctype);
		if(me.parent_dt) {
			tn = tn + ',' + table_name(me.parent_dt);
			cl[cl.length] = table_name(me.doctype) + '.`parent` = ' + table_name(me.parent_dt) + '.`name`';
		}
		
		// advanced - additional tables
		if(sc && sc.add_tab) {
			var adv_tl = sc.add_tab.split('\n');
			tn = tn + ',' + adv_tl.join(',');
		}
		
		// make the query
		if(!cl.length)
			this.query = 'SELECT ' + fl.join(',\n') + ' FROM ' + tn
		else
			this.query = 'SELECT ' + fl.join(',') + ' FROM ' + tn + ' WHERE ' + cl.join('\n AND ');

		// advanced - group by
		if(sc && sc.group_by) {
			this.query += ' GROUP BY ' + sc.group_by;
		}

		// replace
		this.query = repl(this.query, me.dt.filter_vals)

		if(me.show_query.checked) {
			this.show_query = 1;
		}
		
		// report name
		if(me.current_loaded) this.rep_name = me.current_loaded;
		else this.rep_name = me.doctype;
	}
}

/// Data Table

function DataTable(html_fieldname, dt, repname, hide_toolbar) {
  var me = this;
  if(html_fieldname.substr) {
	  var html_field = cur_frm.fields_dict[html_fieldname];
  
	  // override onrefresh
	  html_field.onrefresh = function() {
	  	if(me.docname != cur_frm.docname) {
	  	  me.clear_all();
	  	  me.docname = cur_frm.docname;
	  	}
	  }
  
	  var parent = html_field.wrapper;
	  datatables[html_fieldname] = this;
  } else {
  	var parent = html_fieldname;
  }

  this.start_rec = 1;
  this.page_len = 50;
  this.repname = repname;
  this.dt = dt;
  this.query = '';
  this.history = [];
  this.has_index = 1;
  this.has_headings = 1;  //this.sort_options = {};
  
  this.levels = [];
  
  // make ui

  // new link
  if(this.dt) {
    var tw = $a(parent, 'div');
  	var t = $a(tw, 'div', 'link_type');
  	t.style.cssFloat = 'right';
  	$h(tw, '14px');
  	t.style.margin = '2px 0px';
  	t.style.fontSize = '11px';
  	t.onclick = function() { new_doc(me.dt); }
  	t.innerHTML = 'New '+ this.dt;
  }

  // toolbar
  if(!hide_toolbar) this.make_toolbar(parent);

  this.wrapper = $a(parent, 'div', 'report_tab');
  $h(this.wrapper, cint(pagewidth * 0.5) + 'px');

  this.wrapper.onscroll = function() {scroll_head(this); }
  
  this.hwrapper = $a(this.wrapper, 'div', 'report_head_wrapper');
  this.twrapper = $a(this.wrapper, 'div', 'report_tab_wrapper');
  
  this.no_data_tag = $a(this.wrapper, 'div', 'report_no_data');
  this.no_data_tag.innerHTML = 'No Records Found';

  this.fetching_tag = $a(this.wrapper, 'div', '', {height:'120px', background:'url("images/ui/square_loading.gif") center no-repeat', display:'none'});  
}

DataTable.prototype.add_icon = function(parent, imgsrc) {
  var i = $a(parent, 'img');
  i.style.padding = '2px';
  i.style.cursor = 'pointer';
  i.setAttribute('src', 'images/icons/'+imgsrc+'.gif');
  return i;
}

DataTable.prototype.make_toolbar = function(parent) {
  var me = this;
  
  // headbar
  this.hbar = $a(parent, 'div', 'report_hbar');

  var ht = make_table(this.hbar,1,2,'100%',['80%','20%'],{verticalAlign:'middle'});
  
	var t = make_table($td(ht,0,0), 1,13, '',['20px','','20px','','20px','','20px','','80px','100px','20px','80px','50px'],{height: '54px', verticalAlign:'middle'});
	var cnt = 0;
	var make_btn = function(label,src,onclick,bold) {
		$w($td(t,0,cnt+1), (20 + ((bold?7:6)*label.length)) + 'px');
		var img = $a($td(t,0,cnt+0), 'img', ''); img.src = "images/icons/"+src+".gif";
		var span = $a($td(t,0,cnt+1),'span','link_type',{margin:'0px 8px 0px 4px'});
		if(bold)$y(span,{fontSize: '14px', fontWeight: 'bold'});
		span.innerHTML = label;
		span.onclick = onclick;
	}
	
	
	// refresh btn
	make_btn('Refresh','page_refresh',function() { me.start_rec = 1; me.run();},1); cnt+=2;
	
	// export
	make_btn('Export','page_excel',function() {me.do_export();}); cnt +=2;

	// print
	make_btn('Print','printer',function() {me.do_print();}); cnt+=2;

	// print
	make_btn('Calc','calculator',function() {me.do_calc();}); cnt+=2;

  // sort select
  $td(t,0,cnt).innerHTML = 'Sort By:'; $y($td(t,0,cnt),{textAlign:'right',paddingRight:'4px'});
  this.sort_sel = $a($td(t,0,cnt+1), 'select');
  $w(this.sort_sel, '100px');
  //$p(this.sort_sel,2,210);
  this.sort_sel.onchange = function() {
    me.start_rec = 1;
    me.run();
  }
  select_register[select_register.length] = this.sort_sel;
  // sort order
  this.sort_icon = this.add_icon($td(t,0,cnt+2), 'arrow_down');
  this.sort_order = 'DESC';
  
  this.sort_icon.onclick = function() {
  	if(me.sort_order=='ASC') me.set_desc();
    else me.set_asc();

    me.start_rec = 1;
    me.run();
  }

  // page len

  $td(t,0,cnt+3).innerHTML = 'Per Page:'; $y($td(t,0,cnt+3),{textAlign:'right',paddingRight:'4px'});  
  var s = $a($td(t,0,cnt+4), 'select');
  $w(s, '50px');
  
  s.options[s.options.length] = new Option('50', '50', false, true);
  s.options[s.options.length] = new Option('100', '100', false, false);
  s.options[s.options.length] = new Option('500', '500', false, false);
  s.options[s.options.length] = new Option('1000', '1000', false, false);

  s.onchange = function() { 
  	me.page_len = flt(sel_val(this));
  }
  select_register[select_register.length] = s;
  this.page_len_sel = s;

  var c1 = $td(ht,0,1);
  c1.style.textAlign = 'right';

  // first page
  var ic = this.add_icon(c1, 'resultset_first');
  ic.onclick = function() {
  	me.start_rec = 1;
  	me.run();
  }
  
  // prev page
  var ic = this.add_icon(c1, 'resultset_previous');
  ic.onclick = function() {
    if(me.start_rec - me.page_len <= 0)return;
  	me.start_rec = me.start_rec - me.page_len;
  	me.run();
  }
  
  // next page
  this.has_next = false;
  var ic = this.add_icon(c1, 'resultset_next');
  ic.onclick = function() {
    if(!me.has_next)return;
  	me.start_rec = me.start_rec + me.page_len;
  	me.run();
  }

}


DataTable.prototype.set_desc = function() {
	this.sort_icon.src = 'images/icons/arrow_down.png'; this.sort_order='DESC';
}
DataTable.prototype.set_asc = function(icon) {
	this.sort_icon.src = 'images/icons/arrow_up.png'; this.sort_order='ASC'; 
}

////

DataTable.prototype.add_sort_option = function(label, val) {
  var s = this.sort_sel;
  s.options[s.options.length] = 
	 new Option(label, val, false, s.options.length==0?true:false);
}

DataTable.prototype.update_query = function(no_limit) { 

  // add sorting
  if(this.search_criteria && this.search_criteria.custom_query) {
  	
  	// no sorting
  } else {
	  this.query += NEWLINE 
             + ' ORDER BY ' + sel_val(this.sort_sel)
             + ' ' + this.sort_order;
  }
  
  if(no_limit) return;
  
  // add paging  
  this.query += ' LIMIT ' + (this.start_rec-1) + ',' + this.page_len;
  if(this.show_query)
	alert(this.query);

}

DataTable.prototype._get_query = function(no_limit) {
	$dh(this.no_data_tag);
	this.show_query = 0;
  	if(this.make_query)this.make_query();
	this.update_query(no_limit);
}

DataTable.prototype.run = function() {
  if(this.validate && !this.validate())
    return;

  if(search_page.cur_finder) {
  	if(search_page.cur_finder.large_report == 1) {
  	  msgprint("This is a very large report and cannot be shown in the browser as it is likely to make your browser very slow.<br><br>Please click on 'Export' to open in a spreadsheet");
  	  return;
  	}
  	search_page.cur_finder.mytabs.tabs['Result'].show();
  }
  
  var me = this;
  this._get_query();
  
  // preset data
  if(this.set_data) {
  	this.show_result(this.set_data);
  	this.set_data = null;
  	return;
  }
    
  $ds(this.fetching_tag);
  if(isFF)this.clear_all();
  
  var args = { 
			'query':me.query,
			'report_name': 'DataTable', 
			'show_deleted':1,
			'sc_id':me.search_criteria ? me.search_criteria.name : '',
			'filter_values':me.filter_vals ? docstring(me.filter_vals) : '',
			'defaults':pack_defaults(),
			'roles':'["'+user_roles.join('","')+'"]'
		}

  if(this.is_simple) args.is_simple = 1;

  $c('runquery', args, function(r,rt) {  $dh(me.fetching_tag); me.show_result(r,rt); });
  
}

DataTable.prototype.clear_all = function() {
	// clear old
	if(this.htab && this.htab.parentNode) {
		this.htab.parentNode.removeChild(this.htab); delete this.htab; }
	if(this.tab && this.tab.parentNode) {
		this.tab.parentNode.removeChild(this.tab); delete this.tab; }
	$dh(this.no_data_tag);
	// clear graph in finder
	if(this.finder)this.finder.clear_graph();
}

DataTable.prototype.has_data = function() {
	if(this.htab && this.htab.rows.length)return 1;
	else return 0;
}

DataTable.prototype.show_result = function(r, rt) {
	// clear old
	var me = this;
	this.clear_all();

	// add 
	if(this.has_headings) {
		this.htab = $a(this.hwrapper, 'table');
		$y(this.twrapper,{top:'25px',borderTop:'0px'});
	}
	this.tab = $a(this.twrapper, 'table');

	this.colwidths  = eval(r.colwidths);
	this.coltypes   = eval(r.coltypes);
	this.coloptions = eval(r.coloptions);
	this.colnames = eval(r.colnames);
	this.rset = eval(r.values);

	$y(this.tab,{tableLayout:'fixed'});

	if(this.beforetableprint)this.beforetableprint(this);

	if(this.rset && this.rset.length) {

		// heading
		if(this.has_headings) this.make_head_tab(this.colnames);
	
		// data
	 	var start = this.start_rec;
	  
		for(var vi=0;vi<this.rset.length;vi++) {
			var row = this.tab.insertRow(vi);
			// for script

			if(this.has_index) {
				var c0 = row.insertCell(0);
				$w(c0, '30px');
				$a(c0, 'div', '', {width:'23px'}).innerHTML = start;
			}
	      
			// cells
			start++;      
			for(var ci=0;ci < this.rset[vi].length;ci++) {
				this.make_data_cell(vi, ci, this.rset[vi][ci]);
			}
		  
			if(this.afterrowprint) {
				row.data_cells = {}; row.data = {};
				for(var ci=0;ci< this.colnames.length;ci++) {
					row.data[this.colnames[ci]] = this.rset[vi][ci];
					row.data_cells[this.colnames[ci]] = row.cells[ci+1];
				}
				this.afterrowprint(row);
			}
		}
	} else {
		$ds(this.no_data_tag);
	}
  
	// has next page?
	if(this.rset.length && this.rset.length==this.page_len)this.has_next = true;

	// style
	if(r.style) {
		for(var i=0;i<r.style.length;i++) {
			$yt(this.tab,r.style[i][0],r.style[i][1],r.style[i][2]);
		}
	}	

	// after table print
	if(this.aftertableprint) this.aftertableprint(this.tab);
}

DataTable.prototype.get_col_width = function(i) {
	if(this.colwidths 
		&& this.colwidths.length 
			&& this.colwidths[i])
				return cint(this.colwidths[i]) +'px';
	else return '100px';
}

DataTable.prototype.make_head_tab = function(colnames) {
	var r0 = this.htab.insertRow(0);
	if(this.has_index) {
		var c0 = r0.insertCell(0);
		c0.className = 'report_head_cell';
		$w(c0, '30px');
		$a(c0, 'div').innerHTML = 'Sr';
		this.total_width = 30;  
	}
	
	for(var i=0;i<colnames.length;i++) {
		var w = this.get_col_width(i);
		this.total_width+=cint(w);  
	
		var c = r0.insertCell(r0.cells.length);
		c.className = 'report_head_cell';
		if(w)$w(c, w);
		$a(c,'div').innerHTML = colnames[i];
		c.val = colnames[i];
	}
	$w(this.htab, this.total_width + 'px');
	$w(this.tab, this.total_width + 'px');
}

DataTable.prototype.make_data_cell = function(ri, ci, val) {
  var row = this.tab.rows[ri];
  var c = row.insertCell(row.cells.length);
  
  // row style:
  if(row.style.color) 
  	c.style.color = row.style.color;
  if(row.style.backgroundColor) 
  	c.style.backgroundColor = row.style.backgroundColor;
  if(row.style.fontWeight) 
  	c.style.fontWeight = row.style.fontWeight;
  if(row.style.fontSize) 
  	c.style.fontSize = row.style.fontSize;
  
  var w = this.get_col_width(ci);
  if(w)$w(c, w);
  c.val = val;
  
  var me = this;

  c.div = $a(c, 'div', '', {width:(cint(w)-7)+'px'});
  $s(c.div, val, this.coltypes[ci], this.coloptions[ci])
}

DataTable.prototype.do_print = function() {
	this._get_query(true);  
	
	args = {
		query : this.query,
		title : this.rep_name?this.rep_name:this.dt,
		colnames : null,
		colwidhts : null,
		coltypes : null, 
		has_index : this.has_index, 
		has_headings: this.has_headings,
		check_limit : 1,
		is_simple : (this.is_simple ? 'Yes' : ''),
		sc_id : (this.search_criteria ? this.search_criteria.name : ''),
		filter_values : docstring(this.filter_vals),
		finder: this.finder ? this.finder : null
	};
	print_query(args);

}

DataTable.prototype.do_export = function() {
	this._get_query(true);

	var me = this;
	export_ask_for_max_rows(this.query, function(q) {
		export_csv(q, (me.rep_name?me.rep_name:me.dt), (me.search_criteria?me.search_criteria.name:''), me.is_simple, docstring(me.filter_vals));	
	});
}


// Calculator 
// ----------
DataTable.prototype.do_calc = function() {
	show_calc(this.tab, this.colnames, this.coltypes, 1);
}

DataTable.prototype.get_col_data = function(colname) {
	var ci = 0;
	if(!this.htab) return [];
    for(var i=1;i<this.htab.rows[0].cells.length;i++) {
		var hc = this.htab.rows[0].cells[i];
    	if(hc.val == colname) {
    		ci = i;
    		break;
    	}
    }
	
	var ret = [];
	for(var ri=0;ri<this.tab.rows.length;ri++) {
		ret[ret.length] = this.tab.rows[ri].cells[ci].val;
	}
	return ret;
}

DataTable.prototype.get_html = function() {
	var w = document.createElement('div');
	w = $a(w, 'div');
	w.style.marginTop = '16px';
	var tab = $a(w, 'table');

	var add_head_style = function(c, w) {
		c.style.fontWeight = 'bold';
		c.style.border = '1px solid #000';
		c.style.padding = '2px';
		if(w)$w(c, w);
		return c;
	}

	var add_cell_style = function(c) {
		c.style.padding = '2px';
		c.style.border = '1px solid #000';
		return c;
	}

	tab.style.borderCollapse = 'collapse';  
	var hr = tab.insertRow(0);
	var c0 = add_head_style(hr.insertCell(0), '30px');
	c0.innerHTML = 'Sr';
  
	// heading
	for(var i=1;i<this.htab.rows[0].cells.length;i++) {
		var hc = this.htab.rows[0].cells[i];
		var c = add_head_style(hr.insertCell(i), hc.style.width);
		c.innerHTML = hc.innerHTML;
	}
  
	// data
	for(var ri=0;ri<this.tab.rows.length;ri++) {
		var row = this.tab.rows[ri];
		var dt_row = tab.insertRow(tab.rows.length);
		for(var ci=0;ci<row.cells.length;ci++) {
			var c = add_cell_style(dt_row.insertCell(ci));
			c.innerHTML = row.cells[ci].innerHTML;
		}
	}
	return w.innerHTML;
}

GraphViewer= function(parent, w, h) {

	this.show_labels = true;
	this.font_size = 10;
	
	if(!parent) {
		this.wrapper = document.createElement('div')
		parent = this.wrapper
	}
	
	this.body = $a(parent, 'div', 'gr_body');
	
	if(w&&h) {
		$w(this.body, w + 'px');
		$w(this.body, h + 'px');
	}
	
	this._y_name = $a(parent, 'div', 'gr_y_name');
	this._x_name = $a(parent, 'div', 'gr_x_name');

	this._y_labels = $a(parent, 'div', 'gr_y_labels');
	this._x_labels = $a(parent, 'div', 'gr_x_labels');
	
	this.legend_area = $a(parent, 'div', 'gr_legend_area');
	this.title_area = $a(parent, 'div', 'gr_title_area');
	
	this.main_area = $a(parent, 'div', 'gr_main_area');
	this.set_horizontal();
	//this.set_vertical();
}
GraphViewer.prototype.clear = function() {
	this.series = [];
	this.xlabels = [];
	this.xtitle = null;
	this.ytitle = null;
}
GraphViewer.prototype.set_vertical = function() {
	this.k_barwidth = 'width';
	this.k_barstart = 'left';
	this.k_barlength = 'height';
	this.k_barbase = 'bottom';
	this.k_bartop = 'top';
	this.k_gridborder = 'borderTop';
	
	this.y_name = this._y_name;
	this.x_name = this._x_name;
	
	this.y_labels = this._y_labels;
	this.x_labels = this._x_labels;
	
	this.vertical = true;
}

GraphViewer.prototype.set_horizontal = function() {
	this.k_barwidth = 'height';
	this.k_barstart = 'top';
	this.k_barlength = 'width';
	this.k_barbase = 'left';
	this.k_bartop = 'right';
	this.k_gridborder = 'borderRight';

	this.y_name = this._x_name;
	this.x_name = this._y_name;
	
	this.y_labels = this._x_labels;
	this.x_labels = this._y_labels;

	this.vertical = false;
}

GraphViewer.prototype.set_title = function(t) {
	this.title_area.innerHTML = t;
}

GraphViewer.prototype.add_series = function(label, color, values, borderColor) {
	var s = new GraphViewer.GraphSeries(this, label);
	s.color = color;
	s.borderColor = borderColor;
	s.data = values;
	this.series[this.series.length] = s;
	//this.xlabels[this.xlabels.length] = label;
}

GraphViewer.prototype.refresh = function() {
	
	//
	this.legend_area.innerHTML = '';
	this.main_area.innerHTML = '';
	this.x_labels.innerHTML = '';
	this.y_labels.innerHTML = '';
	this.x_name.innerHTML = '';
	this.y_name.innerHTML = '';
		
	// get max
	var maxx=null;
	var legendheight = 12;

	for(i=0;i<this.series.length;i++) {
		var series_max = this.series[i].get_max();
		if(!maxx)maxx = series_max;
		if(series_max > maxx)maxx = series_max;
		
		// show series names
		var tmp = $a(this.legend_area, 'div', 'gr_legend');
		tmp.style.backgroundColor = this.series[i].color;
		if(this.series[i].borderColor)
			tmp.style.border = '1px solid ' + this.series[i].borderColor;
		tmp.style.top = (i*(legendheight + 2)) + 'px';
		tmp.style.height= legendheight + 'px';

		var tmp1 = $a(this.legend_area, 'div', 'gr_legend');
		tmp1.style.top = (i*(legendheight + 2)) + 'px';
		tmp1.style.left = '30px';
		$w(tmp1, '80px');
		tmp1.innerHTML = this.series[i].name;
	}
	if(maxx==0)maxx = 1;
	this.maxx = 1.1 * maxx;

	// y - axis grid
	var xfn = fmt_money;
	
	// smart grid
	if(maxx>1) {
		var nchars = (cint(maxx)+'').length;
		var gstep = Math.pow(10, (nchars-1));
		while(flt(maxx / gstep) < 4) {
			gstep = gstep / 2;
		}
	} else {
		var gstep = maxx / 6;
	}
		
	var curstep = gstep;
	
	while(curstep < this.maxx) {
		var gr = $a(this.main_area, 'div', 'gr_grid');
		gr.style[this.k_bartop] = (100-((flt(curstep)/this.maxx) * 100)) + '%';
		gr.style[this.k_barwidth] = '100%';
		gr.style[this.k_gridborder] = '1px dashed #888';
		var ylab = $a(this.y_labels, 'div', 'gr_label');
		ylab.style[this.k_bartop] = (99-((flt(curstep)/this.maxx)*100)) + '%';
		ylab.style[this.k_barstart] = '10%';
		ylab.innerHTML = xfn(curstep);
		curstep += gstep;
	}
	
	if(this.vertical) {	
		this.x_name.innerHTML = this.xtitle;
		middletext(this.y_name, this.ytitle);
	} else {
		middletext(this.x_name, this.xtitle);
		this.y_name.innerHTML = this.ytitle;
	}
	
	// make X units
	this.xunits = [];
	this.xunit_width = (100 / this.xlabels.length);
	if(this.series[0]){
		for(i=0;i<this.xlabels.length;i++) {
			this.xunits[this.xunits.length] = new GraphViewer.GraphXUnit(this, i, this.xlabels[i]);
		}
	}	
}

GraphViewer.GraphSeries= function(graph, name) {
	this.graph = graph;
	this.name = name;
}
GraphViewer.GraphSeries.prototype.get_max = function() {
	var m;
	for(t=0;t<this.data.length;t++) {
		if(!m)m = this.data[t];
		if(this.data[t]>m)m=this.data[t]
	}
	return m;
}

GraphViewer.GraphXUnit= function(graph, idx, label) {
	this.body = $a(graph.main_area, 'div', 'gr_xunit');
	this.body.style[graph.k_barstart] = (idx * graph.xunit_width) + '%';	
	this.body.style[graph.k_barwidth] = graph.xunit_width + '%';
	this.body.style[graph.k_barlength] = '100%';
	this.show(graph, label, idx);
	
	//
	if(graph.show_labels) {
		this.label = $a(graph.x_labels, 'div', 'gr_label');
		this.label.style[graph.k_barstart] = (idx * graph.xunit_width) + '%';
		this.label.style[graph.k_barwidth] = graph.xunit_width + '%';	
		if(graph.vertical) {
			$y(this.label,{height:'100%',top:'10%'});
			this.label.innerHTML = label;
		} else {
			middletext(this.label, label);
		}
	}
}

GraphViewer.GraphXUnit.prototype.show = function(graph, l, idx) {
	var bar_width = (100 / (graph.series.length + 1));
	//if(bar_width>15) bar_width = 15;
	//if(bar_width<20) bar_width = 20;
	start = (100 - (graph.series.length*bar_width)) / 2
	
	for(var i=0;i<graph.series.length; i++) {
		var v = graph.series[i].data[idx];
		var b = $a(this.body, 'div', 'gr_bar');
		b.style[graph.k_barbase] = '0%';
		b.style[graph.k_barstart] = start + '%';
		b.style[graph.k_barwidth] = bar_width + '%';
		b.style[graph.k_barlength] = (v / graph.maxx * 100) + '%';
		if(graph.series[i].color)b.style.backgroundColor = graph.series[i].color;
		if(graph.series[i].borderColor)
			b.style.border = '1px solid ' + graph.series[i].borderColor;
		
		start += bar_width;
	}
}

function middletext(par, t, size) {
	if(!size)size = 10;
	var tb = $a(par, 'div', 'absdiv');
	tb.style.top = ((par.clientHeight - size) / 2) + 'px';
	tb.innerHTML = t;
}