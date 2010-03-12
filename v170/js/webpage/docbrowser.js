DocBrowser = function() {
	this.lists = {};
	this.dt_details = {};
	this.cur_list = null;

	this.my_page = page_body.add_page('DocBrowser');
	this.wrapper = $a(this.my_page,'div','',{margin:'8px'});
	var head = $a(this.wrapper,'div','',{marginBottom:'8px'});
	this.head_tab = make_table(head, 1, 3, '100%', ['80px', null, '30%'], {verticalAlign:'middle'});
}

DocBrowser.prototype.show = function(dt, img, label, field_list) {
	if(this.cur_list) 
		$dh(this.cur_list.wrapper);

	if(!this.lists[dt]) {
		this.make(dt, img, label, field_list);	
	} else {
		$ds(this.lists[dt].wrapper);
	}
	page_body.change_to('DocBrowser');
}

DocBrowser.prototype.make = function(dt, img, label, field_list) {
	var me = this;
	if(me.dt_details[dt]) {
		// header
		$td(me.head_tab,0,1).innerHTML = '<h1>' + label + '</h1>';
		if(img) 
			$td(me.head_tab,0,0).appendChild(img);
		$y($td(me.head_tab,0,0), {'textAlign':'right'});
	
		// make the list
		me.make_the_list(dt);
		me.cur_list = me.lists[dt];

	} else {
		$c_obj('Menu Control', 'get_dt_details', dt + '~~~' + field_list, 
		function(r,rt) { 
			me.dt_details[dt] = r.message; 
			if(r.message) me.make(dt, img, label, field_list); });
	}
	
}

DocBrowser.prototype.make_the_list  = function(dt) {
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
		show_bottom_paging: 0,
		round_corners: 0,
		no_border: 1,
		show_new: 1,
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
	lst.make(me.wrapper);

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
	me.lists[dt] = lst;
		
	// default sort
	lst.set_default_sort('name', in_list(lst.coltypes, 'Date') ? 'DESC' : 'ASC');
	lst.run();
}