DocBrowser = function() {
	this.lists = {};
	this.dt_details = {};
	this.cur_list = null;

	this.my_page = page_body.add_page('DocBrowser');
	this.wrapper = $a(this.my_page,'div','',{margin:'8px'});
	this.loading_div = $a(this.wrapper,'div','',{margin:'200px 0px', textAlign:'center', fontSize:'14px', color:'#888', display:'none'});
	this.loading_div.innerHTML = 'Loading...';
}

DocBrowser.prototype.show = function(dt, label, field_list) {
	if(this.cur_list) 
		$dh(this.cur_list);

	var l = this.lists[dt];
	if(l) {
		$ds(l);
		this.cur_list = l;
		set_title(l._label);
	} else {
		this.make(dt, label, field_list);
	}
	
	page_body.change_to('DocBrowser');
}

DocBrowser.prototype.make = function(dt, label, field_list) {
	var me = this;
	label = label ? label : dt;
	if(me.dt_details[dt]) {
		// make a new wrapper
		var w = $a(this.wrapper, 'div');
		w.head = $a(w,'div','',{marginBottom:'8px'});

		me.page_head = new PageHeader(w.head, label);
		// new button
		if(in_list(profile.can_create,dt)) {
			var d = $a($a(w,'div','',{marginBottom:'16px'}),'span');
			d.dt = dt;
			$(d).html('+ New ' + dt).css('background-color','#039').css('padding','4px 8px').css('cursor','pointer').css('color','#FFF').css('font-weight','bold').corners().click( function() { newdoc(this.dt); } );
		}


		// make the list
		me.make_the_list(dt, w);
		me.cur_list = w;
		me.cur_list._label = label;

	} else {
		$ds(this.loading_div);
		$c_obj('Menu Control', 'get_dt_details', dt + '~~~' + field_list, 
		function(r,rt) { 
			me.dt_details[dt] = r.message; 
			$dh(me.loading_div);
			if(r.message) me.make(dt, label, field_list); });
	}
	
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
		
	lst.is_std_query = 1;
	lst.get_query = function() {
		q = {};
		var fl = [];
		q.table = repl('`tab%(dt)s`', {dt:this.dt});
	
		for(var i=0;i<this.cl.length;i++) fl.push(q.table+'.`'+this.cl[i][0]+'`')
		q.fields = fl.join(', ');
		q.conds = q.table + '.docstatus < 2 ';
		
		this.query = repl("SELECT %(fields)s FROM %(table)s WHERE %(conds)s", q);
		this.query_max = repl("SELECT COUNT(*) FROM %(table)s WHERE %(conds)s", q);
	}
	
	lst.colwidths=['5%']; lst.colnames=['Sr']; lst.coltypes=['Data']; lst.coloptions = [''];

	for(var i=0;i < lst.cl.length;i++) {
		lst.colwidths[i+1] = cint(100/lst.cl.length) + '%';
		lst.colnames[i+1] = lst.cl[i][1];
		lst.coltypes[i+1] = lst.cl[i][2];
		lst.coloptions[i+1] = lst.cl[i][3];
			
		lst.add_sort(i+1, lst.cl[i][0]);
	}
	lst.make(wrapper);

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
	me.lists[dt] = wrapper;
		
	// default sort
	lst.set_default_sort('name', in_list(lst.coltypes, 'Date') ? 'DESC' : 'ASC');
	lst.run();
}