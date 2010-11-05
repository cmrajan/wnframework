DocBrowser = function() {
	this.lists = {};
	this.dt_details = {};
	this.cur_list = null;

	this.my_page = page_body.add_page('DocBrowser');
	this.wrapper = $a(this.my_page,'div');

	this.body = $a(this.wrapper, 'div');

	var h = $a(this.body, 'div');
	this.page_head = new PageHeader(h, 'List');

	this.list_wrapper = $a(this.body, 'div', '', {margin:'16px'});
	
	this.loading_div = $a(this.wrapper,'div','',{margin:'200px 0px', textAlign:'center', fontSize:'14px', color:'#888', display:'none'});
	this.loading_div.innerHTML = 'Loading...';
}

DocBrowser.prototype.show = function(dt, label, field_list) {
	var me = this;

	if(this.cur_list) $dh(this.cur_list);
		
	$ds(this.loading_div);
	$dh(this.body);

	var l = get_doctype_label(dt).toLowerCase()
	this.page_head.main_head.innerHTML = (l.substr(-4) == 'list') ? get_doctype_label(dt) : (get_doctype_label(dt) + ' List')

	var callback = function(r, rt) {
		if(r.message == 'Yes') {
			// has something
			var l = me.lists[dt];

			if(l) {
				$ds(l);
				me.cur_list = l;
				set_title(l._label);
				$dh(me.loading_div);
				$ds(me.body);

				$dh(me.no_result_area);
				$ds(me.list_wrapper);
			} else {
				me.make(dt, label, field_list);
			}
		} else {
			me.show_no_result(dt);
		}
	}

	$c_obj('Menu Control', 'has_result', dt, callback);

	
	page_body.change_to('DocBrowser');
}

DocBrowser.prototype.make = function(dt, label, field_list) {
	var me = this;
	label = label ? label : dt;

	var callback = function(r,rt) { 
		me.dt_details[dt] = r.message; 
		
		// call make_new
		if(r.message) {
			me.make_new(dt, label, r.message.field_list);
			$dh(me.loading_div);
			$ds(me.body);
			$dh(me.no_result_area);
			$ds(me.list_wrapper);
		}
	}

	$c_obj('Menu Control', 'get_dt_details', dt + '~~~' + cstr(field_list), callback);
	
}

DocBrowser.prototype.show_no_result = function(dt) {
	if(!this.no_result_area) {
		this.no_result_area = $a(this.body, 'div', '', {margin: '160px auto', width: '480px', padding:'16px', backgroundColor:'#DDF', fontSize:'14px', border:'1px solid #AAF', textAlign: 'center'})
	}
	$dh(this.loading_div);
	$ds(this.body);
	
	$dh(this.list_wrapper);
	$ds(this.no_result_area);
	this.no_result_area.innerHTML = repl('No %(dt)s records found. <span class="link_type" onclick="newdoc(\'%(dt)s\')">Click here</span> to create your first %(dt)s', {dt:get_doctype_label(dt)});
}

DocBrowser.prototype.make_new = function(dt, label, field_list) {
	var me = this;
	var label = get_doctype_label(label);
				
	// make a new wrapper
	var w = $a(this.wrapper, 'div');
		
	// new button
	if(in_list(profile.can_create,dt)) {
		var d = $a($a(w,'div','green_buttons',{marginBottom:'16px'}),'button');
		d.dt = dt;
		$(d).html('+ New ' + label).css('font-size','13px').css('font-weight','bold').button().click( function() { newdoc(this.dt); } );
	}


	// make the list
	me.make_the_list(dt, w);
	me.lists[dt] = w;

	me.cur_list = w;
	me.cur_list._label = label;		
}
	
DocBrowser.prototype.make_the_list  = function(dt, wrapper) {
	var me = this;
	var lst = new Listing(dt);
	lst.cl = me.dt_details[dt].columns;
	lst.dt = dt;

	lst.opts = {
		cell_style : {padding:'3px 2px',borderBottom:'1px dashed #CCC'},
		alt_cell_style : {backgroundColor:'#FFFFFF'},
		head_style : {overflow:'hidden',verticalAlign:'middle',fontWeight:'bold',padding:'2px'},
		head_main_style : {padding:'0px'},
		hide_export : 1,
		hide_print : 1,
		hide_refresh : 0,
		hide_rec_label: 0,
		show_calc: 0,
		show_empty_tab : 0,
		show_no_records_label: 1,
		show_bottom_paging: 0,
		round_corners: 0,
		no_border: 1,
		show_new: 0,
		show_report: 1
	}
		
	if(user_defaults.hide_report_builder) lst.opts.show_report = 0;
	
	// build th query
	lst.is_std_query = 1;
	lst.get_query = function() {
		q = {};
		var fl = [];
		q.table = repl('`tab%(dt)s`', {dt:this.dt});
	
		for(var i=0;i<this.cl.length;i++) fl.push(q.table+'.`'+this.cl[i][0]+'`')
		if(me.dt_details[dt].submittable)
			fl.push(q.table + '.docstatus');			
		q.fields = fl.join(', ');
		q.conds = q.table + '.docstatus < 2 ';
		
		this.query = repl("SELECT %(fields)s FROM %(table)s WHERE %(conds)s", q);
		this.query_max = repl("SELECT COUNT(*) FROM %(table)s WHERE %(conds)s", q);
	}
	
	// make the columns
	lst.colwidths=['5%']; lst.colnames=['Sr']; lst.coltypes=['Data']; lst.coloptions = [''];

	for(var i=0;i < lst.cl.length;i++) {
		lst.colwidths[i+1] = cint(100/lst.cl.length) + '%';
		lst.colnames[i+1] = lst.cl[i][1];
		lst.coltypes[i+1] = lst.cl[i][2];
		lst.coloptions[i+1] = lst.cl[i][3];
			
		lst.add_sort(i+1, lst.cl[i][0]);
	}
	lst.make(wrapper);

	// add the filters
	var sf = me.dt_details[dt].filters;
	for(var i=0;i< sf.length;i++) {
		var fname = sf[i][0]; var label = sf[i][1]; var ftype = sf[i][2]; var fopts = sf[i][3];

		if(in_list(['Int','Currency','Float','Date'], ftype)) {
			lst.add_filter('From '+label, ftype, fopts, dt, fname, '>=');
			lst.add_filter('To '+label, ftype, fopts, dt, fname, '<=');
		} else {
			lst.add_filter(label, ftype, fopts, dt, fname, (in_list(['Data','Text','Link'], ftype) ? 'LIKE' : ''));
		}
	}
	
	// customize ID field - for submittable doctypes
	if(me.dt_details[dt].submittable) {
		lst.show_cell = function(cell,ri,ci,d) {
			if (ci==0){
				// link
				var s1 = $a(cell, 'span', 'link_type', {marginRight:'8px'});
				s1.innerHTML = d[ri][0];
				s1.dt = dt; s1.dn = d[ri][0];
				s1.onclick = function() { loaddoc(this.dt, this.dn); };

				// tag
				var docstatus = cint(d[ri][d[ri].length - 1]);
				var hl=$a(cell,'span','',{padding: '1px', color:'#FFF', backgroundColor:(docstatus ? '#44F' : '#999'), fontSize:'10px'});
				hl.innerHTML = (docstatus ? 'Submitted' : 'Draft');
			} else{
				// show standard output
				lst.std_cell(d,ri,ci);
			}
		}
	}
	
	// default sort
	lst.set_default_sort('name', in_list(lst.coltypes, 'Date') ? 'DESC' : 'ASC');
	lst.run();
}
