_r.ReportContainer = function() {
	this.wrapper = page_body.add_page("Report Builder", function() { });
	
	$dh(this.wrapper);
	$y(this.wrapper, {margin:'4px'});
	
	var me = this;
	this.rb_dict = {};

	// tool bar

	var div = $a(this.wrapper, 'div');
	var inner = $a(div, 'div', '', {padding:'6px 8px 4px 8px'});
		
	var htab = make_table(inner, 1,2, '100%', ['80%','20%']);
	
	this.main_title = $a($td(htab,0,0),'h1');
		
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
		savebtn.onclick = function() {if(me.cur_rb) me.cur_rb.save_criteria(); };
		
		// advanced
		var advancedbtn = $a(this.button_area2,'span','link_type');
		advancedbtn.innerHTML = 'Advanced';
		advancedbtn.onclick = function() { 
			if(me.cur_rb) {
				if(!me.cur_rb.current_loaded) {
					msgprint("error:You must save the report before you can set Advanced features");
					return;
				}
				loaddoc('Search Criteria', me.cur_rb.sc_dict[me.cur_rb.current_loaded]);
			}
		};
	}
	
	// buttons
	var runbtn = $a(this.button_area, 'button', '', {fontSize:'14px'});
	runbtn.innerHTML = 'Run'.bold();
	runbtn.onclick = function() { if(me.cur_rb){
		me.cur_rb.dt.start_rec = 1;
		me.cur_rb.dt.run();} 
	}
	$dh(this.button_area);
	
	this.rb_area = $a(this.wrapper, 'div');

	// set a type
	this.set_dt = function(dt, onload) {
		$dh(me.home_area);
		$ds(me.rb_area);
		$ds(me.button_area);

		my_onload = function(f) {
			if(!f.forbidden) {
				me.cur_rb = f;
				me.cur_rb.mytabs.tabs['Result'].show();
	
				if(onload)onload(f);	
			}
		}
	
		if(me.cur_rb)
			me.cur_rb.hide();
		if(me.rb_dict[dt]){
			me.rb_dict[dt].show(my_onload);
		} else {
			me.rb_dict[dt] = new _r.ReportBuilder(me.rb_area, dt, my_onload);
		}

	}
}

// ===================================================================================

_r.ReportBuilder = function(parent, doctype, onload) {
	this.menuitems = {};
	this.has_primary_filters = false;
	this.doctype = doctype;
	this.forbidden = 0;

	this.filter_fields = [];
	this.filter_fields_dict = {};
	
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
		
		// reset main title
		_r.rb_con.main_title.innerHTML = me.doctype;
		
		if(my_onload)my_onload(me);
	}
	
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.make_tabs = function() {
	this.tab_wrapper = $a(this.wrapper, 'div', 'finder_tab_area');
	this.mytabs = new TabbedPage(this.tab_wrapper);
	
	this.mytabs.add_tab('Result');
	this.mytabs.add_tab('More Filters');
	this.mytabs.add_tab('Select Columns');
	
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.make_body = function() {

	_r.rb_con.main_title.innerHTML = this.doctype;
	var me = this;

	this.make_save_criteria();	
	this.column_picker = new _r.ReportColumnPicker(this);
	this.report_filters = new _r.ReportFilters(this);
}

//
// Saving of criteria
// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.make_save_criteria = function() {
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
// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.save_criteria = function(save_as) {
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
	
	// save columns
	var t = this.column_picker.get_selected();
	for(var i=0;i<t.length;i++)
		cl.push(t[i].parent + '\1' + t[i].label);
		
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
		save_doclist(doc.doctype, doc.name, 'Save', fn);
	}
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.hide_all_filters = function() {
	for(var i=0; i<this.filter_fields.length; i++) {
		this.filter_fields[i].df.filter_hide = 1;
	}
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.run = function() {
	this.dt.run();
}

// Load Criteria
// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.clear_criteria = function() {

	this.column_picker.clear();	
	this.column_picker.set_defaults();

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
	
	_r.rb_con.main_title.innerHTML = this.doctype;

	this.current_loaded = null;
	this.customized_filters = null;
	this.sc = null;
	this.has_index = 1; this.has_headings = 1;

	for(var i in this.fn_list) this[this.fn_list[i]] = null; // clear custom functions
			
	this.report_filters.refresh();	
	this.column_picker.refresh();
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.select_column = function(dt, label, value) {
	if(value==null)value = 1;
	this.column_picker.set(dt, label, value);
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.set_filter = function(dt, label, value) {
	if(this.filter_fields_dict[dt+'\1'+ label])
		this.filter_fields_dict[dt+'\1'+ label].set_input(value);
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.load_criteria = function(criteria_name) {
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
	this.report_filters.refresh();
	
	// set fields
	// ----------
	this.column_picker.clear();
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

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.set_criteria_sel = function(criteria_name) {

	
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
		this.dt.sort_sel.inp.value = sc.sort_by;
	}
	if(sc && sc.sort_order) {
		sc.sort_order=='ASC' ? this.dt.set_asc() : this.dt.set_desc();
	}
	if(sc && sc.page_len) {
		this.dt.page_len_sel.inp.value = sc.page_len;
	}
	this.current_loaded = criteria_name;
	// load additional fields sort option
	_r.rb_con.main_title.innerHTML = criteria_name;	
}

//
// Create the filter UI and column selection UI
// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.setup_filters = function() {

	function can_dt_be_submitted(dt) {
		var plist = getchildren('DocPerm', dt, 'permissions', 'DocType');
		for(var pidx in plist) {
			if(plist[pidx].submit) return 1;
		}
		return 0;
	}

	var me = this;

	var dt = me.parent_dt?me.parent_dt:me.doctype;

	// default filters
	var fl = [
		{'fieldtype':'Data', 'label':'ID', 'fieldname':'name', 'search_index':1, 'parent':dt},
		{'fieldtype':'Data', 'label':'Owner', 'fieldname':'owner', 'search_index':1, 'parent':dt},
		{'fieldtype':'Date', 'label':'Created on', 'fieldname':'creation', 'search_index':0, 'parent':dt},
		{'fieldtype':'Date', 'label':'Last modified on', 'fieldname':'modified', 'search_index':0, 'parent':dt},
	];

	// can this be submitted?
	if(can_dt_be_submitted(dt)) {
		fl[fl.length] = {'fieldtype':'Check', 'label':'Saved', 'fieldname':'docstatus', 'search_index':1, 'def_filter':1, 'parent':dt};
		fl[fl.length] = {'fieldtype':'Check', 'label':'Submitted', 'fieldname':'docstatus', 'search_index':1, 'def_filter':1, 'parent':dt};
		fl[fl.length] = {'fieldtype':'Check', 'label':'Cancelled', 'fieldname':'docstatus', 'search_index':1, 'parent':dt};
	}
	
	me.make_datatable();

	// Add columns of parent doctype
	me.orig_sort_list = [];
	if(me.parent_dt) {
		me.setup_doctype(fl, me.parent_dt); 
		var fl = [];
	}

	// Add columns of selected doctype
	me.setup_doctype(fl, me.doctype); 

	// hide primary filters if not fields
	if(!this.has_primary_filters) 
		$dh(this.report_filters.first_page_filter);

	this.column_picker.refresh();

	// show body
	$ds(me.body);
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.add_filter = function(f) {
	if(this.filter_fields_dict[f.parent + '\1' + f.label]) {
		// exists
		this.filter_fields_dict[f.parent + '\1' + f.label].df = f; // reset properties
	} else {
		f.custom = 1;
		this.report_filters.add_field(f, f.parent);
	}
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.setup_doctype = function(fl, dt) {
	var me = this; 
	
	// set value in Toolbar
	if(page_body.wntoolbar && page_body.wntoolbar.rb_sel)
		page_body.wntoolbar.rb_sel.value = dt;

	// set labels
	var lab = $a(me.filter_area,'div','filter_dt_head');
	lab.innerHTML = 'Filters for ' + dt;

	var lab = $a(me.picker_area,'div','builder_dt_head');
	lab.innerHTML = 'Select columns for ' + dt;
		
	// get fields
	var dt_fields = fields_list[dt];
	for(var i=0;i<dt_fields.length;i++) {
		fl[fl.length] = dt_fields[i];
	}
	
	// get "high priority" search fields
	var sf_list = locals.DocType[dt].search_fields ? locals.DocType[dt].search_fields.split(',') : [];
	for(var i in sf_list) sf_list[i] = strip(sf_list[i]);
	
	// make fields
	for(var i=0;i<fl.length;i++) {
	
		var f=fl[i];
		
		// add to filter
		if(f && (cint(f.search_index) || cint(f.in_filter))) {
			me.report_filters.add_field(f, dt, in_list(sf_list, f.fieldname));
		}
		
		// add to column selector (builder) 
		if(f && !in_list(no_value_fields, f.fieldtype) && f.fieldname != 'docstatus' && (!f.report_hide)) {
			me.column_picker.add_field(f);
		}
	}
	me.set_sort_options();
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.set_sort_options = function(l) {
	var sl = this.orig_sort_list;
	
	empty_select(this.dt.sort_sel);
	
	if(l) sl = add_lists(l, this.orig_sort_list)
	for(var i=0; i<sl.length; i++) {
		this.dt.add_sort_option(sl[i][0], sl[i][1]);
	}
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.validate_permissions = function(onload) {
	this.perm = get_perm(this.parent_dt ? this.parent_dt : this.doctype);
	if(!this.perm[0][READ]) {
		this.forbidden = 1;
		if(user=='Guest') {
			msgprint('You must log in to view this page');
		} else {
			msgprint('No Read Permission');
		}
		nav_obj.show_last_open();
		return 0;
	}
	return 1;
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.make_filters = function(onload) {
	// load doctype
	var me = this;
	
	if(!locals['DocType'][this.doctype]) {
		$c('webnotes.widgets.form.getdoctype', args = {'doctype': this.doctype, 'with_parent':1 }, 
			function(r,rt) { 
				if(r.parent_dt)me.parent_dt = r.parent_dt;
				if(!me.validate_permissions()) 
					return;
				me.make_body();
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
		if(!me.validate_permissions()) 
			return;
		me.validate_permissions();
		me.make_body();
		me.setup_filters();
		if(onload)onload(me);
	}
}

// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.reset_report = function() {
	this.clear_criteria();
	this.set_filter(this.doctype, 'Saved', 1);
	this.set_filter(this.doctype, 'Submitted', 1);
	this.set_filter(this.doctype, 'Cancelled', 0);
	
	this.column_picker.set_defaults();
	this.dt.clear_all();
	
	this.dt.sort_sel.inp.value = 'ID';
	this.dt.page_len_sel.inp.value = '50';
	this.dt.set_no_limit(0);
	this.dt.set_desc();
}

//
// Make the SQL query
// -------------------------------------------------------------------------------------

_r.ReportBuilder.prototype.make_datatable = function() {
	var me = this;
	
	this.dt_area = $a(this.mytabs.tabs['Result'].tab_body, 'div', 'finder_dt_area');

	var clear_area = $a(this.mytabs.tabs['Result'].tab_body, 'div');
	clear_area.style.marginTop = '8px';
	clear_area.style.textAlign = 'right';
	
	this.clear_btn = $a(clear_area, 'button');
	this.clear_btn.innerHTML = 'Clear Settings';
	this.clear_btn.onclick = function() {
		me.reset_report();
	}

	var div = $a(this.mytabs.tabs['Result'].tab_body, 'div');
	div.style.marginTop = '8px';

	var d = $a(div, 'div');
	this.show_query = $a_input(d, 'checkbox');
	this.show_query.checked = false;

	
	this.dt = new _r.DataTable(this.dt_area, '');
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
		
		// select columns
		var t = me.column_picker.get_selected();
		for(var i=0;i<t.length;i++) {
			fl.push(table_name(t[i].parent) + '.`'+t[i].fieldname+'`');
		}
		me.selected_fields = fl;
				
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
		me.filter_vals = me.dt.filter_vals; // in both dt and report
		
		// overloaded query - finish it here
		this.is_simple = 0;
		if(sc && sc.custom_query) {
			this.query = repl(sc.custom_query, me.dt.filter_vals);
			this.is_simple = 1;
			return
		}
		
		if(me.get_query) {
			// custom query method
			this.query = me.get_query();

		} else {
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
	
			// atleast one field
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
		}
		
		if(me.show_query.checked) {
			this.show_query = 1;
		}
		
		// report name
		if(me.current_loaded) this.rep_name = me.current_loaded;
		else this.rep_name = me.doctype;
	}
}

// Report Filter
// ===================================================================================

_r.ReportFilters = function(rb) {
	this.rb = rb;

	// filters broken into - primary - in searchfields and others
	this.first_page_filter = $a(rb.mytabs.tabs['Result'].tab_body, 'div', 'finder_filter_area');
	this.filter_area = $a(rb.mytabs.tabs['More Filters'].tab_body, 'div', 'finder_filter_area');
	
	// filter fields area
	this.filter_fields_area = $a(this.filter_area,'div');

}

// -------------------------------------------------------------------------------------

_r.ReportFilters.prototype.refresh = function() {
	// called after customization
	var fl = this.rb.filter_fields
	
	for(var i=0; i<fl.length; i++) {
		var f = fl[i];
		
		// is hidden ?
		if(f.df.filter_hide) { 
			$dh(f.wrapper); 
		} else {
			$ds(f.wrapper);
		}
		
		// is bold?
		if(f.df.bold) { 
			if(f.label_cell) 
				$y(f.label_cell, {fontWeight:'bold'}) 
		} else { 
			if(f.label_cell) $y(f.label_cell, {fontWeight:'normal'}) 
		}
		
		// set default value
		if(f.df['report_default']) 
			f.set_input(f.df['report_default']);
			
		// show in first page?
		if(f.df.in_first_page) {
			f.df.filter_cell.parentNode.removeChild(f.df.filter_cell);
			this.first_page_filter.appendChild(f.df.filter_cell);
			this.rb.has_primary_filters = 1;
			$ds(this.first_page_filter);
		}
	}
}

// -------------------------------------------------------------------------------------

_r.ReportFilters.prototype.add_date_field = function(cell, f, dt) {
	var my_div = $a(cell,'div','',{});
	
	// from date
	var f1 = copy_dict(f);
	f1.label = 'From ' + f1.label;
	var tmp1 = this.make_field_obj(f1, dt, my_div);
	tmp1.sql_condition = '>=';
	tmp1.bound = 'lower';

	// to date
	var f2 = copy_dict(f);
	f2.label = 'To ' + f2.label;
	var tmp2 = this.make_field_obj(f2, dt, my_div);
	tmp2.sql_condition = '<=';
	tmp2.bound = 'upper';
}

// -------------------------------------------------------------------------------------

_r.ReportFilters.prototype.add_numeric_field = function(cell, f, dt) {
	var my_div = $a(cell,'div','',{});
	
	// from value
	var f1 = copy_dict(f);
	f1.label = f1.label + ' >=';
	var tmp1 = this.make_field_obj(f1, dt, my_div);
	tmp1.sql_condition = '>=';
	tmp1.bound = 'lower';

	// to value
	var f2 = copy_dict(f);
	f2.label = f2.label + ' <=';
	var tmp2 = this.make_field_obj(f2, dt, my_div);
	tmp2.sql_condition = '<=';
	tmp2.bound = 'upper';		
}

// make a field object
_r.ReportFilters.prototype.make_field_obj = function(f, dt, parent) {
	var tmp = make_field(f, dt, parent, this.rb, false);
	tmp.not_in_form = true;
	tmp.refresh();
	this.rb.filter_fields[this.rb.filter_fields.length] = tmp;
	this.rb.filter_fields_dict[f.parent + '\1' + f.label] = tmp;
	return tmp;	
}

// -------------------------------------------------------------------------------------

_r.ReportFilters.prototype.add_field = function(f, dt, in_primary) {
	var me = this;
		
	// insert in (parent element)
	if(f.in_first_page) in_primary = true;
	
	var fparent = this.filter_fields_area;
	if(in_primary) { 
		fparent = this.first_page_filter; 
		this.rb.has_primary_filters = 1; 
	}
	
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
		// date field
		this.add_date_field(cell, f, dt);
	} else if(in_list(['Currency', 'Int', 'Float'], f.fieldtype)) {
		// numeric
		this.add_numeric_field(cell, f, dt);
	} else {
		var tmp = this.make_field_obj(f, dt, cell);
	}
	
	// add to datatable sort
	if(f.fieldname != 'docstatus')
		me.rb.orig_sort_list.push([f.label, '`tab' + f.parent + '`.`' + f.fieldname + '`']);
			
	// check saved
	if(f.def_filter)
		tmp.input.checked = true;
}

// Column Picker
// ===================================================================================

_r.ReportColumnPicker = function(rb) {
	this.rb = rb;
	this.picker_area = $a(this.rb.mytabs.tabs['Select Columns'].tab_body, 'div', 'finder_picker_area');
	
	this.all_fields = [];
	this.sel_idx = 0;
	
	this.make_body();
}

// -------------------------------------------------------------------------------------

_r.ReportColumnPicker.prototype.make_body = function() {

	var t = make_table(this.picker_area, 1, 3, '100%', ['35%','30%','35%'], {verticalAlign:'middle', textAlign:'center'});

	// all fields
	$a($td(t,0,0), 'h3', '', {marginBottom:'8px'}).innerHTML = 'Columns';
	this.unsel_fields = $a($td(t,0,0), 'select', '', {height:'200px', width:'100%', border:'1px solid #AAA'});
	this.unsel_fields.multiple = true;
	this.unsel_fields.onchange = function() { for(var i=0; i<this.options.length; i++) this.options[i].field.is_selected = this.options[i].selected; }

	// buttons
	var me = this;
	this.up_btn = $a($a($td(t,0,1), 'div'), 'button', '', {width:'70px'});
	this.up_btn.innerHTML = 'Up &uarr;';
	this.up_btn.onclick = function() { me.move_up(); }

	this.add_all = $a($a($td(t,0,1), 'div'), 'button', '', {width:'40px'});
	this.add_all.innerHTML = '&gt;&gt;';
	this.add_all.onclick = function() { me.move(me.unsel_fields, 'add', 1); }

	this.add_btn = $a($a($td(t,0,1), 'div'), 'button', '', {width:'110px'});
	this.add_btn.innerHTML = '<b>Add &gt;</b>';
	this.add_btn.onclick = function() { me.move(me.unsel_fields, 'add'); }
		
	this.remove_btn = $a($a($td(t,0,1), 'div'), 'button', '', {width:'110px'});
	this.remove_btn.innerHTML = '<b>&lt; Remove</b>';
	this.remove_btn.onclick = function() { me.move(me.sel_fields, 'remove'); }

	this.remove_all = $a($a($td(t,0,1), 'div'), 'button', '', {width:'40px'});
	this.remove_all.innerHTML = '&lt;&lt;';
	this.remove_all.onclick = function() { me.move(me.sel_fields, 'remove', 1); }

	this.dn_btn = $a($a($td(t,0,1), 'div'), 'button', '', {width:'70px'});
	this.dn_btn.innerHTML = 'Down &darr;';
	this.dn_btn.onclick = function() { me.move_down(); }

	// multiple fields
	$a($td(t,0,2), 'h3', '', {marginBottom:'8px'}).innerHTML = 'Seleted Columns';
	this.sel_fields = $a($td(t,0,2), 'select', '', {height:'200px', width:'100%', border:'1px solid #AAA'});
	this.sel_fields.multiple = true;
	this.sel_fields.onchange = function() { for(var i=0; i<this.options.length; i++) this.options[i].field.is_selected = this.options[i].selected; }

}



// -------------------------------------------------------------------------------------

_r.ReportColumnPicker.prototype.get_by_sel_idx = function(s, idx) {
	for(var j=0;j<s.options.length; j++) {
		if(s.options[j].field.sel_idx == idx)
			return s.options[j].field;
	}
	return {} // nothing
}

_r.ReportColumnPicker.prototype.move_up = function() {
	var s = this.sel_fields;
	for(var i=1;i<s.options.length; i++ ) {
		if(s.options[i].selected) {
			s.options[i].field.sel_idx--;
			this.get_by_sel_idx(s, i-1).sel_idx++;
		}
	}
	this.refresh();
}

_r.ReportColumnPicker.prototype.move_down = function() {
	var s = this.sel_fields;
	
	if(s.options.length<=1) return;
	
	for(var i=s.options.length-2;i>=0; i-- ) {
		if(s.options[i].selected) {
			this.get_by_sel_idx(s, i+1).sel_idx--;
			s.options[i].field.sel_idx++;
		}
	}
	this.refresh();
}



// -------------------------------------------------------------------------------------

_r.ReportColumnPicker.prototype.move = function(s, type, all) {
	for(var i=0;i<s.options.length; i++ ) {
		if(s.options[i].selected || all) {
			if(type=='add') {
				s.options[i].field.selected = 1;
				s.options[i].field.sel_idx = this.sel_idx;
				this.sel_idx++;
			} else {
				s.options[i].field.selected = 0;
				s.options[i].field.sel_idx = 0;
				this.sel_idx--;
			}
		}
	}
	this.refresh();
}

// -------------------------------------------------------------------------------------

_r.ReportColumnPicker.prototype.refresh = function() {
	
	// separate
	var ul = []; var sl=[];
	for(var i=0; i<this.all_fields.length; i++) {
		if(this.all_fields[i].selected) {
			sl.push(this.all_fields[i]);
		} else {
			ul.push(this.all_fields[i]);
		}
	}
	
	// sort by field idx
	ul.sort(function(a,b){return (cint(a.df.idx)-cint(b.df.idx))});
	
	// sort by order in which they were selected
	sl.sort(function(a,b){return (cint(a.sel_idx)-cint(b.sel_idx))})

	// re-number selected
	for(var i=0; i<sl.length; i++) { sl[i].sel_idx = i; }
	
	// add options
	this.set_options(this.unsel_fields, ul);
	this.set_options(this.sel_fields, sl);

}

// -------------------------------------------------------------------------------------

_r.ReportColumnPicker.prototype.set_options = function(s, l) {
	empty_select(s);

	for(var i=0; i<l.length; i++) {
		var v = l[i].df.parent + '.' + l[i].df.label;
		var o = new Option (v, v, false, false);
		o.field = l[i];
		if(o.field.is_selected) o.selected = 1;
		s.options[s.options.length] = o;
	}
}

// -------------------------------------------------------------------------------------

_r.ReportColumnPicker.prototype.clear = function() {
	this.sel_idx = 0;
	for(var i=0; i<this.all_fields.length; i++) {
		this.all_fields[i].selected = 0;	
	}
	this.refresh();
}

// -------------------------------------------------------------------------------------

_r.ReportColumnPicker.prototype.get_selected = function() {
	var sl = [];
	for(var i=0; i<this.all_fields.length; i++) {
		var o = this.all_fields[i];
		if(o.selected) {
			sl[sl.length] = o.df;
			o.df.sel_idx = o.sel_idx;
		}
	}
	return sl.sort(function(a,b){return (cint(a.sel_idx)-cint(b.sel_idx))});
}

// -------------------------------------------------------------------------------------

_r.ReportColumnPicker.prototype.set_defaults = function() {
	for(var i=0; i<this.all_fields.length; i++) {
		if(this.all_fields[i].selected_by_default)
			this.all_fields[i].selected = 1;
	}
}

// -------------------------------------------------------------------------------------

_r.ReportColumnPicker.prototype.add_field = function(f) {
	// column picker
	if(!f.label) return;
	
	var by_default = (f.search_index || f.in_filter) ? 1 : 0;
	
	this.all_fields.push({
		selected:by_default
		,df:f
		,sel_idx: (by_default ? this.sel_idx : 0)
		,selected_by_default : by_default
	});

	this.sel_idx += by_default;

}

// -------------------------------------------------------------------------------------

_r.ReportColumnPicker.prototype.set = function(dt, label, selected) {
	for(var i=0; i<this.all_fields.length; i++) {
		if(this.all_fields[i].df.parent == dt && this.all_fields[i].df.label==label) {
			this.all_fields[i].selected = selected;
			this.all_fields[i].sel_idx = this.sel_idx;
			this.sel_idx += cint(selected);
			this.refresh();
			return;
		}
	}
}