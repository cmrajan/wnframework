DocBrowserPage = function() {
	this.lists = {};
	this.dt_details = {};
	this.cur_list = null;

	this.my_page = page_body.add_page('DocBrowser');
	this.wrapper = $a(this.my_page,'div');

	var h = $a(this.wrapper, 'div');

	this.body = $a(this.wrapper, 'div', '', {margin:'16px'});

	this.page_head = new PageHeader(h, 'List');
	this.new_button = this.page_head.add_button('New', function() { newdoc(me.cur_dt) }, 1, 'ui-icon-plus', 1)
	
}

// -------------------------------------------------

DocBrowserPage.prototype.show = function(dt, label, field_list) {
	var me = this;

	if(this.cur_list) $dh(this.cur_list.wrapper);
	
	// page heading
	var l = get_doctype_label(dt)
	this.page_head.main_head.innerHTML = (l.toLowerCase().substr(-4) == 'list') ? l : (l + ' List')

	// button label
	this.page_head.clear_toolbar();
	if(in_list(profile.can_create,dt)) {
		var new_button = this.page_head.add_button('New ' + l, function() { newdoc(this.dt) }, 1, 'ui-icon-plus', 1)
		new_button.dt = dt
	}
	
	if(!me.lists[dt]) {
		me.lists[dt] = new DocBrowser(me.body, dt, label, field_list);
	}

	me.cur_list = me.lists[dt];
	me.cur_list.show();
	
	page_body.change_to('DocBrowser');
}

// -------------------------------------------------

DocBrowser = function(parent, dt, label, field_list) {	
	var me = this;
	this.label = label ? label : dt;
	this.dt = dt;
	this.field_list = field_list;

	this.wrapper = $a(parent, 'div', '', {display:'none'});

	// areas
	this.no_result_area = $a(this.wrapper, 'div', '', {margin: '16px 0px', 
		padding:'4px', backgroundColor:'#FFC'
	});
	
	this.loading_div = $a(this.wrapper,'div','',{margin:'200px 0px', textAlign:'center', fontSize:'14px', color:'#888', display:'none'});
	this.loading_div.innerHTML = 'Loading...';
	this.body = $a(this.wrapper, 'div');
}

// -------------------------------------------------

DocBrowser.prototype.show = function() {
	var me = this;
	var callback = function(r, rt) {
		if(r.message == 'Yes') {
			if(!me.loaded)
				me.load_details();
			else
				me.show_results();
		} else {
			me.show_no_result();	
		}
	}
	$c_obj('Menu Control', 'has_result', this.dt, callback);	
}

// -------------------------------------------------

DocBrowser.prototype.load_details = function() {
	var me = this;
	var callback = function(r,rt) { 
		me.dt_details = r.message;
		if(r.message) {
			me.show_trend(r.message.trend);
			me.make_the_list(me.dt, me.body);
			me.show_results();
		}
	}
	$c_obj('Menu Control', 'get_dt_details', this.dt + '~~~' + cstr(this.field_list), callback);
	this.loaded = 1;
}

// -------------------------------------------------

DocBrowser.prototype.show_results = function() {
	$ds(this.wrapper);
	$dh(this.loading_div);
	$ds(this.body);
	$dh(this.no_result_area);
	set_title(get_doctype_label(this.label));
}

// -------------------------------------------------

DocBrowser.prototype.show_trend = function(trend) {
	this.trend_area = $a(this.body, 'div', '', {margin:'8px 16px'});
	var maxval = 0;
	for(var key in trend) { if(trend[key]>maxval) maxval = trend[key] };

	// head
	var div = $a(this.trend_area, 'div','',{marginLeft:'32px', color:'#888'}); div.innerHTML = 'Activity in last 30 days';
	var wrapper_tab = make_table(this.trend_area, 1, 2, '100%', ['20px',null], {padding:'2px 4px',fontSize:'10px',color:'#888'});

	// y-label
	var ylab_tab = make_table($td(wrapper_tab,0,0),2,1,'100%',['100%'],{verticalAlign:'top', textAlign:'right',height:'24px'});
	$td(ylab_tab,0,0).innerHTML = maxval;

	$y($td(ylab_tab,1,0),{verticalAlign:'bottom'});
	$td(ylab_tab,1,0).innerHTML = '0';

	// infogrid
	var tab = make_table($td(wrapper_tab,0,1), 1, 30, '100%', [], 
		{width:10/3 + '%', border:'1px solid #DDD', height:'40px', verticalAlign:'bottom', textAlign:'center', padding:'2px'});
		
	// labels
	var labtab = make_table($td(wrapper_tab,0,1), 1, 6, '100%', [], 
		{width:100/6 + '%', border:'1px solid #FFF', height:'16px',color:'#888',textAlign:'right',fontSize:'10px'});
	
	for(var i=0; i<30; i++) {
		var div = $a($td(tab,0,30-i),'div','',{backgroundColor:'#4AC', width:'50%', margin:'auto', height:(trend[i] ? (trend[i]*100/maxval) : 0) + '%'});		
		
		// date string
		if(i % 5 == 0) {
			$td(labtab,0,5-(i/5)).innerHTML = dateutil.obj_to_user(dateutil.add_days(new Date(), -i));
			$y($td(tab,0,i-1),{'backgroundColor':'#EEE'});
		}
	}
	$td(labtab,0,5).innerHTML = 'Today';
}

// -------------------------------------------------

DocBrowser.prototype.show_no_result = function() {
	$ds(this.wrapper);
	$dh(this.loading_div);
	$dh(this.body);	
	$ds(this.no_result_area);
	this.no_result_area.innerHTML = repl('No %(dt)s records found. <span class="link_type" onclick="newdoc(\'%(dt)s\')">Click here</span> to create your first %(dt)s', {dt:get_doctype_label(this.dt)});
	set_title(get_doctype_label(this.label));
}

// -------------------------------------------------

DocBrowser.prototype.make_new = function(dt, label, field_list) {
	// make the list
	this.make_the_list(dt, this.body);
}

// -------------------------------------------------
	
DocBrowser.prototype.make_the_list  = function(dt, wrapper) {
	var me = this;
	var lst = new Listing(dt, 1);
	lst.cl = me.dt_details.columns;
	lst.dt = dt;

	lst.opts = {
		cell_style : {padding:'6px 2px'},
		alt_cell_style : {backgroundColor:'#FFFFFF'},
		//head_style : {overflow:'hidden',verticalAlign:'middle',fontWeight:'bold',padding:'2px'},
		//head_main_style : {padding:'0px'},
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
		if(me.dt_details.submittable)
			fl.push(q.table + '.docstatus');			
		q.fields = fl.join(', ');
		q.conds = q.table + '.docstatus < 2 ';
		
		this.query = repl("SELECT %(fields)s FROM %(table)s WHERE %(conds)s", q);
		this.query_max = repl("SELECT COUNT(*) FROM %(table)s WHERE %(conds)s", q);
	}
	
	// make the columns
	lst.colwidths=['100%']; lst.coltypes=['Data']; lst.coloptions = [''];

	/*for(var i=0;i < lst.cl.length;i++) {
		lst.colwidths[i+1] = cint(100/lst.cl.length) + '%';
		lst.colnames[i+1] = lst.cl[i][1];
		lst.coltypes[i+1] = lst.cl[i][2];
		lst.coloptions[i+1] = lst.cl[i][3];
			
		lst.add_sort(i+1, lst.cl[i][0]);
	}*/
	
	lst.show_cell = function(cell, ri, ci, d) {
		var div = $a(cell, 'div');
		
		var span = $a(div, 'span', 'link_type', {fontWeight:'bold'});
		span.innerHTML = d[ri][0];
		span.onclick = function() { loaddoc(me.dt, this.innerHTML); }
		
		var span = $a(div, 'span', '', {paddingLeft:'8px'});
		var tmp = []
		for(var i=2; i<d[ri].length; i++) {
			if(lst.cl[i] && lst.cl[i][1] && d[ri][i])
				tmp.push(lst.cl[i][1] + ': ' + d[ri][i]);
		}
		span.innerHTML = tmp.join(' | ');
			
		var div = $a(cell, 'div', '', {color:'#888', fontSize:'11px'});
		div.innerHTML = comment_when(d[ri][1]);
	}
	
	lst.make(wrapper);

	// add the filters
	var sf = me.dt_details.filters;
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
	/*if(me.dt_details.submittable) {
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
	}*/
	
	// default sort
	lst.set_default_sort('modified', 'DESC');
	lst.run();
}
