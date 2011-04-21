
ItemBrowserPage = function() {
	this.lists = {};
	this.dt_details = {};
	this.cur_list = null;

	this.my_page = page_body.add_page('ItemBrowser');
	this.wrapper = $a(this.my_page,'div','',{marginRight:'8px'});
	this.body = $a(this.wrapper, 'div');

	
}

// -------------------------------------------------

ItemBrowserPage.prototype.show = function(dt, label, field_list) {
	var me = this;

	if(this.cur_list && this.cur_list.dt != dt) $dh(this.cur_list.wrapper);
		
	if(!me.lists[dt]) {
		me.lists[dt] = new ItemBrowser(me.body, dt, label, field_list);
	}

	me.cur_list = me.lists[dt];
	me.cur_list.show();
	
	page_body.change_to('ItemBrowser');
}

// -------------------------------------------------

ItemBrowser = function(parent, dt, label, field_list) {	
	var me = this;
	this.label = label ? label : dt;
	this.dt = dt;
	this.field_list = field_list;
	this.tag_filter_dict = {};
	this.items = [];

	this.wrapper = $a(parent, 'div');
	this.head = $a(this.wrapper, 'div');

	// header (?)
	var l = get_doctype_label(dt);
	l = (l.toLowerCase().substr(-4) == 'list') ? l : (l + ' List')
	this.page_head = new PageHeader(this.head, l); $y(this.page_head.wrapper, {marginBottom:'0px'});
	$dh(this.page_head.separator);

	// areas
	this.no_result_area = $a(this.wrapper, 'div','help_box',{fontSize:'14px', textAlign:'center'});
	
	// loading...
	this.loading_div = $a(this.wrapper,'div','',{margin:'200px 0px', textAlign:'center', fontSize:'14px', color:'#444', display:'none'});
	this.loading_div.innerHTML = 'Loading<img src="images/ui/button-load.gif" style="margin-bottom: -2px; margin-left: 8px">';
	
	// body
	this.body = $a(this.wrapper, 'div');
	
	// toolbar
	this.toolbar_area = $a(this.body, 'div', '', {padding: '4px', backgroundColor:'#EEE'});
	$br(this.toolbar_area, '4px'); $gr(this.toolbar_area, '#DDD', '#CCC');
	
	this.sub_toolbar = $a(this.body, 'div', '', {marginBottom:'8px', padding: '4px', textAlign:'right', fontSize:'11px', color:'#444'});
	
	// archives label
	this.archives_label = $a(this.body, 'div', 'help_box_big',{display:'none'});
	this.archives_label.innerHTML = 'Showing from Archives'
	var span = $a(this.archives_label, 'span', 'link_type', {marginLeft:'8px'});
	span.innerHTML = 'Show Active';
	span.onclick = function() { me.show_archives.checked = 0; me.show_archives.onclick(); }
	
	this.trend_area = $a(this.body, 'div', '', {marginBottom:'16px', padding: '4px', backgroundColor:'#EEF', border: '1px solid #CCF', display:'none'});
	$br(this.trend_area, '5px');
	
	// tag filters
	this.tag_filters = $a(this.body, 'div', '', {marginBottom:'8px', display:'none', padding:'6px 8px 8px 8px', backgroundColor:'#FFD'});
	var span = $a(this.tag_filters,'span','',{marginRight:'4px',color:'#444'}); span.innerHTML = '<i>Showing for:</i>';
	this.tag_area = $a(this.tag_filters, 'span');
	
}

// -------------------------------------------------

ItemBrowser.prototype.make_toolbar = function(show_callback) {
	var me = this;

	// new button
	if(inList(profile.can_create, this.dt)) {
		this.new_button = $btn(this.toolbar_area, '+ New ' + get_doctype_label(this.dt), function() { newdoc(me.dt) }, {fontWeight:'bold',marginRight:'0px'}, 'green');
	}
	
	// archive, delete
	if(in_list(profile.can_write, this.dt)) {
		this.archive_btn = $btn(this.toolbar_area, 'Archive', function() { me.archive_items(); }, {marginLeft:'24px'});
	} 
	if(this.dt_details.can_cancel) {
		this.delete_btn = $btn(this.toolbar_area, 'Delete', function() { me.delete_items(); });
	}
	
	if(this.archive_btn && this.delete_btn)
		$btn_join(this.archive_btn, this.delete_btn)
	
	// search box
	this.search_input = $a(this.toolbar_area, 'input', '', {width:'120px', marginLeft:'24px', border:'1px solid #AAA'});
	this.search_btn = $btn(this.toolbar_area, 'Search', function() { me.run(); }, {marginLeft:'4px'});	

	// show hide filters
	this.filters_on = 0;
	this.filter_btn = $ln(this.toolbar_area, 'Advanced Search', function() { me.show_filters(); }, {marginLeft:'24px'});

	// show hide trend
	this.trend_on = 0; this.trend_loaded = 0;
	this.trend_btn = $ln(this.toolbar_area, 'Show Activity', function() { me.show_activity(); }, {marginLeft:'24px'});

	// checks for show cancelled and show archived
	if(this.dt_details.submittable) {
		this.show_cancelled = $a_input(this.sub_toolbar, 'checkbox');
		var lab = $a(this.sub_toolbar, 'span', '', {marginRight:'8px'}); lab.innerHTML = 'Show Cancelled';
		this.show_cancelled.onclick = function() { me.run(); }
	}
	
	this.set_archiving();

}

// -------------------------------------------------

ItemBrowser.prototype.set_archiving = function() {
	var me = this;
	
	this.show_archives = $a_input(this.sub_toolbar, 'checkbox');
	var lab = $a(this.sub_toolbar, 'span'); lab.innerHTML = 'Show Archives';
	
	this.show_archives.onclick = function() {
		if(this.checked) {
			if(me.archive_btn) me.archive_btn.innerHTML = 'Restore';
			$(me.archives_label).slideDown();
		} else {
			if(me.archive_btn) me.archive_btn.innerHTML = 'Archive';
			$(me.archives_label).slideUp();
		}
		me.run();
	}
	
}

// -------------------------------------------------

ItemBrowser.prototype.show_filters = function() {
	if(this.filters_on) {
		$(this.lst.filter_wrapper).slideUp();
		this.filters_on = 0;
		this.filter_btn.innerHTML = 'Advanced Search';
	} else {
		$(this.lst.filter_wrapper).slideDown();
		this.filters_on = 1;
		this.filter_btn.innerHTML = 'Hide Search';
	}
}

// -------------------------------------------------

ItemBrowser.prototype.show_activity = function() {
	var me = this;
	if(this.trend_on) {
		$(this.trend_area).slideUp();
		me.trend_btn.innerHTML = 'Show Activity';
		me.trend_on = 0;
		
	} else {
		
		// show
		if(!this.trend_loaded) {
			// load the trend
			var callback = function(r,rt) {
				me.show_trend(r.message.trend);
				$(me.trend_area).slideDown();
				me.trend_btn.done_working();
				me.trend_btn.innerHTML = 'Hide Activity';
				me.trend_loaded = 1;
				me.trend_on = 1;
			}
			$c('webnotes.widgets.menus.get_trend', {'dt':this.dt}, callback);
			me.trend_btn.set_working();

		} else {
			// slide up and dwon
			$(this.trend_area).slideDown();
			me.trend_btn.innerHTML = 'Hide Activity';
			me.trend_on = 1;
		}
	}
}

// -------------------------------------------------

ItemBrowser.prototype.show = function(show_callback) {
	$ds(this.wrapper);
	
	if(this.loaded && this.lst.n_records) return;
	
	$ds(this.loading_div);
	$dh(this.body);
	$dh(this.head);
	$dh(this.no_result_area);
	
	var me = this;
	var callback = function(r, rt) {
		if(r.message == 'Yes') {
			if(!me.loaded) {
				me.load_details(show_callback);
			} else {
				me.show_results();
				if(show_callback)show_callback();
			}
		} else {
			me.show_no_result();
			if(show_callback)show_callback();
		}
	}
	$c('webnotes.widgets.menus.has_result', {'dt': this.dt}, callback);	
}

// -------------------------------------------------

ItemBrowser.prototype.load_details = function(load_callback) {
	var me = this;
	var callback = function(r,rt) { 
		me.dt_details = r.message;
		if(r.message) {
			me.make_toolbar();
			me.make_the_list(me.dt, me.body);
			me.show_results();
			if(load_callback) load_callback();
		}
	}

	var fl = this.field_list ? this.field_list.split('\n') : [];
	$c('webnotes.widgets.menus.get_dt_details', {'dt': this.dt, 'fl': JSON.stringify(fl)}, callback);
	this.loaded = 1;
}

// -------------------------------------------------

ItemBrowser.prototype.show_results = function() {
	$dh(this.loading_div);
	$ds(this.head);
	$ds(this.body);
	$dh(this.no_result_area);
	set_title(get_doctype_label(this.label));
}

// -------------------------------------------------

ItemBrowser.prototype.show_trend = function(trend) {
	var maxval = 0;
	for(var key in trend) { if(trend[key]>maxval) maxval = trend[key] };

	// head
	var div = $a(this.trend_area, 'div','',{marginLeft:'32px'}); div.innerHTML = 'Activity in last 30 days';
	var wrapper_tab = make_table(this.trend_area, 1, 2, '100%', ['20px',null], {padding:'2px 4px',fontSize:'10px',color:'#888'});

	// y-label
	var ylab_tab = make_table($td(wrapper_tab,0,0),2,1,'100%',['100%'],{verticalAlign:'top', textAlign:'right',height:'24px'});
	$td(ylab_tab,0,0).innerHTML = maxval;

	$y($td(ylab_tab,1,0),{verticalAlign:'bottom'});
	$td(ylab_tab,1,0).innerHTML = '0';

	// infogrid
	var tab = make_table($td(wrapper_tab,0,1), 1, 30, '100%', [], 
		{width:10/3 + '%', border:'1px solid #DDD', height:'40px', verticalAlign:'bottom', textAlign:'center', padding:'2px', backgroundColor:'#FFF'});
		
	// labels
	var labtab = make_table($td(wrapper_tab,0,1), 1, 6, '100%', [], 
		{width:100/6 + '%', border:'1px solid #EEF', height:'16px',color:'#888',textAlign:'right',fontSize:'10px'});
	
	for(var i=0; i<30; i++) {
		var div = $a($td(tab,0,29-i),'div','',{backgroundColor:'#4AC', width:'50%', margin:'auto', height:(trend[i+''] ? (trend[i+'']*100/maxval) : 0) + '%'});
		div.setAttribute('title', trend[i] + ' records');
		
		// date string
		if(i % 5 == 0) {
			$td(labtab,0,5-(i/5)).innerHTML = dateutil.obj_to_user(dateutil.add_days(new Date(), -i));
			$y($td(tab,0,i-1),{'backgroundColor':'#EEE'});
		}
	}
	$td(labtab,0,5).innerHTML = 'Today';
}

// -------------------------------------------------

ItemBrowser.prototype.show_no_result = function() {
	$dh(this.loading_div);
	$ds(this.no_result_area);
	$ds(this.head);
	$dh(this.body);
	this.no_result_area.innerHTML = repl('No %(dt)s found. <span class="link_type" onclick="newdoc(\'%(dt)s\')">Click here</span> to create your first %(dt)s!', {dt:get_doctype_label(this.dt)});
	set_title(get_doctype_label(this.label));
}

// -------------------------------------------------

ItemBrowser.prototype.make_new = function(dt, label, field_list) {
	// make the list
	this.make_the_list(dt, this.body);
}

// -------------------------------------------------

ItemBrowser.prototype.add_search_conditions = function(q) {
	if(this.search_input.value) {
		q.conds += ' AND ' + q.table + '.name LIKE "%'+ this.search_input.value +'%"';
	}
}	
	
// -------------------------------------------------

ItemBrowser.prototype.add_tag_conditions = function(q) {
	var me = this;
	
	if(keys(me.tag_filter_dict).length) {
		var cl = [];
		for(var key in me.tag_filter_dict) {
			var val = key;
			var op = '=';
				
			var fn = me.tag_filter_dict[key].fieldname;
				
			// conditions based on user tags
			if(fn=='docstatus')val=(key=='Draft'?'0':'1');
			if(fn=='_user_tags'){ val='%,'+key + '%'; op=' LIKE '; }
				
			cl.push(q.table + '.`' + fn + '`'+op+'"' + val + '"');
		}
		if(cl)
			q.conds += ' AND ' + cl.join(' AND ') + ' ';
	}
}
	
// -------------------------------------------------
	
ItemBrowser.prototype.make_the_list  = function(dt, wrapper) {
	var me = this;
	var lst = new Listing(dt, 1);
	lst.dt = dt;
	lst.cl = this.dt_details.columns;

	lst.opts = {
		cell_style : {padding:'0px 2px'},
		alt_cell_style : {backgroundColor:'#FFFFFF'},
		hide_export : 1,
		hide_print : 1,
		hide_rec_label: 0,
		show_calc: 0,
		show_empty_tab : 0,
		show_no_records_label: 1,
		show_new: 0,
		show_report: 1,
		no_border: 1,
		append_records: 1
	}
		
	if(user_defaults.hide_report_builder) lst.opts.show_report = 0;
	
	// build th query
	lst.is_std_query = 1;
	lst.get_query = function() {
		q = {};
		var fl = [];
		q.table = repl('`%(prefix)s%(dt)s`', {prefix:(me.show_archives.checked ? 'arc' : 'tab'), dt:this.dt});
	
		// columns
		for(var i=0;i<this.cl.length;i++) {
			if(!(me.show_archives && me.show_archives.checked && this.cl[i][0]=='_user_tags'))
				fl.push(q.table+'.`'+this.cl[i][0]+'`')
		}

		if(me.dt_details.submittable)
			fl.push(q.table + '.docstatus');

		// columns
		q.fields = fl.join(', ');

		// conitions
		q.conds = q.table + '.docstatus < '+ ((me.show_cancelled && me.show_cancelled.checked) ? 3 : 2) +' ';
		
		// filter conditions
		me.add_tag_conditions(q);

		// filter conditions
		me.add_search_conditions(q);
		
		this.query = repl("SELECT %(fields)s FROM %(table)s WHERE %(conds)s", q);
		this.query_max = repl("SELECT COUNT(*) FROM %(table)s WHERE %(conds)s", q);
		if(me.show_archives.checked)
			this.prefix = 'arc';
		else
			this.prefix = 'tab'
		
	}
	
	// make the columns
	lst.colwidths=['100%']; lst.coltypes=['Data']; lst.coloptions = [''];
	
	// show cell
	lst.show_cell = function(cell, ri, ci, d) {
		me.items.push(new ItemBrowserItem(cell, d[ri], me));
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

	$dh(lst.filter_wrapper);
			
	// default sort
	lst.set_default_sort('modified', 'DESC');
	this.lst = lst;
	lst.run();
}

// -------------------------------------------------

ItemBrowser.prototype.run = function() {
	this.items = [];
	this.lst.run();
}

// -------------------------------------------------

ItemBrowser.prototype.get_checked = function() {
	var il = [];
	for(var i=0; i<this.items.length; i++) {
		if(this.items[i].check.checked) il.push([this.dt, this.items[i].dn]);
	}
	return il;
}

// -------------------------------------------------

ItemBrowser.prototype.delete_items = function() {
	var me = this;
	if(confirm('This is PERMANENT action and you cannot undo. Continue?'))
		$c('webnotes.widgets.menus.delete_items', {'items': JSON.stringify(this.get_checked()) }, function(r, rt) { if(!r.exc) me.run(); })
}

// -------------------------------------------------

ItemBrowser.prototype.archive_items = function() {
	var me = this;
	var arg = {
		'action': this.show_archives.checked ? 'Restore' : 'Archive'
		,'items': JSON.stringify(this.get_checked())
	}
	$c('webnotes.widgets.menus.archive_items', arg, function(r, rt) { if(!r.exc) me.run(); })
}

// ========================== ITEM ==================================

function ItemBrowserItem(parent, det, ib) {
	this.wrapper = $a(parent, 'div');
	$y(this.wrapper, {borderTop:'1px solid #DDD'});
	
	this.tab = make_table(this.wrapper, 1, 2, '100%', [(200/7)+'%', null]);
	this.body = $a($td(this.tab, 0, 1), 'div');
	this.details_area = $a(this.body, 'div');
	
	this.det = det;
	this.ib = ib;
	this.dn = det[0];
	
	this.make_check();
	this.make_tags();
	this.make_details();
	this.add_timestamp();
}

// -------------------------------------------------

ItemBrowserItem.prototype.make_check = function() {
	if(this.ib.archive_btn || this.ib.delete_btn) {
		var me = this;
		this.check = $a_input($td(this.tab, 0, 0), 'checkbox');
		this.check.onclick = function() {
			if(this.checked) {
				$y(me.wrapper, {backgroundColor:'#FFC'});
			} else {
				$y(me.wrapper, {backgroundColor:'#FFF'});
			}
		}
	}
}

// -------------------------------------------------

ItemBrowserItem.prototype.make_details = function() {

	// link
	var me = this;
	var div = this.details_area;
	
	var span = $a($td(this.tab, 0, 0), 'span', 'link_type', {fontWeight:'bold'});
	span.innerHTML = me.dn;
	span.onclick = function() { loaddoc(me.ib.dt, me.dn, null, null, (me.ib.show_archives ? me.ib.show_archives.checked : null)); }
	
	// properties
	var tmp = [];
	var cl = me.ib.dt_details.columns;
	var first_property = 1;
	for(var i=3; i<me.det.length; i++) {
		if(cl[i] && cl[i][1] && me.det[i]) {
			// has status, group or type in the label
			if(cl[i][1].indexOf('Status') != -1 || 
				cl[i][1].indexOf('Group') != -1 || 
				cl[i][1].indexOf('Priority') != -1 || 
				cl[i][1].indexOf('Type') != -1) {
					me.taglist.add_tag(me.det[i], 1, cl[i][0]);	
			} else {

				// separator
				if(!first_property) {
					var span = $a(div,'span'); span.innerHTML = ',';
				} else first_property = 0;
				
				// label
				var span = $a(div,'span','',{color:'#888'});
				span.innerHTML = ' ' + cl[i][1] + ': ';
				
				// value
				var span = $a(div,'span');
				$s(span,me.det[i],(cl[i][2]=='Link'?'Data':cl[i][2]), cl[i][3]);
			}
		}
	}

}

// -------------------------------------------------

ItemBrowserItem.prototype.make_tags = function() {
	// docstatus tag
	var docstatus = cint(this.det[this.det.length - 1]);

	// make custom tags
	var me = this;
	var tl = this.det[2] ? this.det[2].split(',') : [];
	var div = $a(this.body, 'div', '', {margin: '7px 0px'})
	this.taglist = new TagList(div, tl, this.ib.dt, this.dn, 0, function(tag) { me.set_tag_filter(tag); });

	// std tags
	if(this.ib.dt_details.submittable) { 
		this.taglist.add_tag((docstatus ? 'Submitted' : 'Draft'), 1, 'docstatus'); }

}

// -------------------------------------------------

ItemBrowserItem.prototype.add_timestamp = function() {
	// time
	var div = $a($td(this.tab, 0, 0), 'div', '', {color:'#888', fontSize:'11px'});
	div.innerHTML = comment_when(this.det[1]);
}

// -------------------------------------------------

ItemBrowserItem.prototype.set_tag_filter = function(tag) {
	var me = this;
		
	// check if exists
	if(in_list(keys(me.ib.tag_filter_dict), tag.label)) return;
	
	// create a tag in filters
	var filter_tag = new SingleTag(me.ib.tag_area, tag.label, me.ib.dt, null, 0, null);
	filter_tag.ib = me.ib;
	filter_tag.fieldname = tag.fieldname;

	// remove tag from filters
	filter_tag.remove = function(tag_remove) {
		var ib = tag_remove.ib;
		$(tag_remove.body).fadeOut();
		delete ib.tag_filter_dict[tag_remove.label];
		
		// hide everything?
		if(!keys(ib.tag_filter_dict).length) {
			$(ib.tag_filters).slideUp(); // hide
		}
		
		// run
		ib.run();
	}

	// add to dict
	me.ib.tag_filter_dict[tag.label] = filter_tag;
	$ds(me.ib.tag_filters);
	
	// run
	me.ib.run();
}