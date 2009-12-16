
/// Report Page
var ReportBuilder;

function ReportPage(parent) {
	var me = this;
	this.finders = {};

	// tool bar

	var div = $a(parent, 'div','',{margin:'0px 8px'});
	var htab = make_table($a(div,'div','',{padding:'4px', backgroundColor:'#DDD'}), 1,2, '100%', ['80%','20%']);
	
	this.main_title = $a($td(htab,0,0),'h2','',{margin: '0px 4px', display:'inline'});
		
	// close button
	$y($td(htab,0,1),{textAlign:'right'});
	this.close_btn = $a($a($td(htab,0,1),'div','',{padding: '2px', margin:'0px'}), 'img', '', {cursor:'pointer'});
	this.close_btn.src="images/icons/close.gif";
	this.close_btn.onclick = function() { nav_obj.show_last_open(); }

	this.button_area2 = $a($td(htab,0,1),'div',{marginTop:'8px'});

	// row 2
	var htab = make_table($a(div,'div','',{padding:'4px'}), 1,2, '100%', ['80%','20%']);

	this.button_area = $a($td(htab,0,0),'div');
	this.button_area2 = $a($td(htab,0,1),'div',{marginTop:'8px'});
	$y($td(htab,0,1),{textAlign:'right'});

	// new
	if(has_common(['Administrator', 'System Manager'], user_roles)) {
		// save
		var savebtn = $a(this.button_area2,'span','link_type',{marginRight:'8px'});
		savebtn.innerHTML = 'Save';
		savebtn.onclick = function() {if(me.cur_finder) me.cur_finder.save_criteria(); };
		
		// advanced
		var advancedbtn = $a(this.button_area2,'span','link_type');
		advancedbtn.innerHTML = 'Advanced';
		advancedbtn.onclick = function() { 
			if(me.cur_finder) {
				if(!me.cur_finder.current_loaded) {
					msgprint("error:You must save the report before you can set Advanced features");
					return;
				}
				loaddoc('Search Criteria', me.cur_finder.sc_dict[me.cur_finder.current_loaded]);
			}
		};
	}
	
	// buttons
	var runbtn = $a(this.button_area, 'button');
	runbtn.innerHTML = 'Run'.bold();
	runbtn.onclick = function() { if(me.cur_finder){
		me.cur_finder.dt.start_rec = 1;
		me.cur_finder.dt.run();} 
	}
	$dh(this.button_area);
	
	this.finder_area = $a(parent, 'div');

	// set a type
	this.set_dt = function(dt, onload) {
		// show finder
		$dh(me.home_area);
		$ds(me.finder_area);
		$ds(me.button_area);
		my_onload = function(f) {
			me.cur_finder = f;
			me.cur_finder.mytabs.tabs['Result'].show();
			if(onload)onload(f);
		}
	
		if(me.cur_finder)
			me.cur_finder.hide();
		if(me.finders[dt]){
			me.finders[dt].show(my_onload);
		} else {
			me.finders[dt] = new ReportBuilder(me.finder_area, dt, my_onload);
		}

	}
}

var FILTER_SEP = '\1';

function ReportBuilder(parent, doctype, onload) {
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

ReportBuilder.prototype.make_tabs = function() {
	this.tab_wrapper = $a(this.wrapper, 'div', 'finder_tab_area');
	this.mytabs = new TabbedPage(this.tab_wrapper);
	this.mytabs.body_area.className = 'finder_body_area';
	
	this.mytabs.add_tab('Result');
	this.mytabs.add_tab('More Filters');
	this.mytabs.add_tab('Select Columns');
	this.mytabs.add_tab('Graph');
	
	$dh(this.mytabs.tabs['Graph']);
}

ReportBuilder.prototype.make_body = function() {

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

ReportBuilder.prototype.make_graph = function() {
	var me = this;
	this.graph_area = $a(this.mytabs.tabs['Graph'].tab_body, 'div', '');
	this.mytabs.tabs['Graph'].onshow = function() {
		me.show_graph();
	}
}

ReportBuilder.prototype.clear_graph = function() { 
	if(this.graph_div)$dh(this.graph_div);
	this.graph_clear = 1; 
}

ReportBuilder.prototype.show_graph = function() {
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

ReportBuilder.prototype.make_save_criteria = function() {
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

ReportBuilder.prototype.save_criteria = function(save_as) {
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

ReportBuilder.prototype.hide_all_filters = function() {
	for(var i=0; i<this.filter_fields.length; i++) {
		this.filter_fields[i].df.filter_hide = 1;
	}
}

// Load Criteria
// -------------
ReportBuilder.prototype.clear_criteria = function() {
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

ReportBuilder.prototype.select_column = function(dt, label, value) {
	if(value==null)value = 1;
	if(this.report_fields_dict[dt+'\1'+ label])
		this.report_fields_dict[dt+'\1'+ label].checked = value;
}

ReportBuilder.prototype.set_filter = function(dt, label, value) {
	if(this.filter_fields_dict[dt+'\1'+ label])
		this.filter_fields_dict[dt+'\1'+ label].set_input(value);
}

ReportBuilder.prototype.load_criteria = function(criteria_name) {
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

ReportBuilder.prototype.set_criteria_sel = function(criteria_name) {
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

ReportBuilder.prototype.setup_filters = function() {

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

ReportBuilder.prototype.refresh_filters = function() {
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

ReportBuilder.prototype.add_filter = function(f) {
	if(this.filter_fields_dict[f.parent + '\1' + f.label]) {
		// exists
		this.filter_fields_dict[f.parent + '\1' + f.label].df = f; // reset properties
	} else {
		f.custom = 1;
		this.add_field(f, f.parent);
	}
}

ReportBuilder.prototype.add_field = function(f, dt, in_primary) {
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

ReportBuilder.prototype.make_filter_fields = function(fl, dt) {
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

ReportBuilder.prototype.set_sort_options = function(l) {
	var sl = this.orig_sort_list;
	
	empty_select(this.dt.sort_sel);
	
	if(l) sl = add_lists(l, this.orig_sort_list)
	for(var i=0; i<sl.length; i++) {
		this.dt.add_sort_option(sl[i][0], sl[i][1]);
	}
}


ReportBuilder.prototype.make_filters = function(onload) {
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

ReportBuilder.prototype.make_datatable = function() {
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