search_fields = {};

// Search Selector 2.0
// -------------------

function makeselector2() {
	var d = new Dialog(640,440, 'Search');

	d.make_body([
		['HTML', 'List']
	]);

	d.loading_div = $a(d.widgets.List,'div','comment',{margin:'8px 0px', display:'none'}); d.loading_div.innerHTML = 'Setting up...';
	d.ls = new Listing("Search", 1);
	d.ls.opts = {
		cell_style : {padding:'3px 2px',border:'0px'},
		alt_cell_style : {backgroundColor:'#FFFFFF'},
		hide_export : 1,
		hide_print : 1,
		hide_refresh : 0,
		hide_rec_label: 0,
		show_calc: 0,
		show_empty_tab : 0,
		show_bottom_paging: 0,
		round_corners: 0,
		no_border: 1
	}
	d.ls.is_std_query = 1;

	// make
	d.ls.colwidths=[''];
	d.ls.make(d.widgets.List);
	$y(d.ls.results, {height:'200px',overflowY:'auto'});
	
	d.ls.get_query = function() {

					
		if(d.input && d.input.get_query) {
			var doc = {};
			if(cur_frm) doc = locals[cur_frm.doctype][cur_frm.docname];
			this.query = d.input.get_query(doc);
			this.query_max = 'SELECT COUNT(*) FROM ' + this.query.split(' FROM ')[1]; // custom query -- NO QUERY MAX

		} else {

			var q = {};
			var fl = []
			q.table = repl('`tab%(dt)s`', {dt:d.sel_type});
			for(var i in d.fields) 
				fl.push(q.table+'.`'+d.fields[i][0]+'`')
	
			q.fields = fl.join(', ');
			q.conds = q.table + '.docstatus < 2 ';
			this.query = repl("SELECT %(fields)s FROM %(table)s WHERE %(conds)s", q);
			this.query_max = repl("SELECT COUNT(*) FROM %(table)s WHERE %(conds)s", q);
		}

	}

	d.ls.show_cell = function(cell,ri,ci,dat) {
		var l = $a($a(cell,'div','',{borderBottom:'1px dashed #CCC',paddingBottom:'4px'}), 'span','link_type'); l.innerHTML = dat[ri][0];
		l.d = d;
		l.onclick = function() {
			if(this.d.style=='Search')
				loaddoc(this.d.sel_type, this.innerHTML);
			else
				setlinkvalue(this.innerHTML);
		}
		var l = $a(cell, 'div','comment'); var tmp = [];
		for(var i=1;i<dat[ri].length;i++) tmp.push(dat[ri][i]);
		l.innerHTML = tmp.join(', ');
	}

	// called from search
	d.set_search = function(dt) {
		if(d.style!='Search') {
			d.ls.clear();
		}
		d.style = 'Search';
		if(d.input) { d.input = null; sel_type = null; } // clear out the linkfield refrences
		d.sel_type = dt;
		d.title_text.innerHTML = 'Search for ' + dt;
	}
	
	// called from link
	d.set = function(input, type, label) {
		d.sel_type = type; d.input = input;
		if(d.style!='Link') {
			d.ls.clear();
		}
		d.style = 'Link';
		if(!d.sel_type)d.sel_type = 'Value';
		d.title_text.innerHTML = 'Select a "'+ d.sel_type +'" for field "'+label+'"';
	}
	
	// on show
	d.onshow = function() {
		if(d.sel_type!='Value' && !search_fields[d.sel_type]) {
			$dh(d.ls.wrapper);
			$ds(d.loading_div);
			 // de focus selector
			// get search fields
			$c('getsearchfields', {doctype:d.sel_type}, function(r,rt) { search_fields[d.sel_type] = r.searchfields; d.show_lst(); })
		} else {
			d.show_lst();
		}
	}
	d.onhide = function() {
		if(page_body.wntoolbar)
			page_body.wntoolbar.search_sel.disabled = 0;
	}
	d.show_lst = function() {
		$ds(d.ls.wrapper);
		$dh(d.loading_div);
		d.fields = search_fields[d.sel_type];
		if(d.sel_type=='Value') {
			d.fields = []; // for customized query with no table - NO FILTERS
		}

		if(d.sel_type!=d.set_doctype) {
			// clear filters
			d.ls.clear();
			d.ls.remove_all_filters();
			for(var i=0;i< (d.fields.length>4 ? 4 : d.fields.length);i++) {
				if(d.fields[i][2]=='Link')d.fields[i][2]='Data';  // no link-in-link
				d.ls.add_filter(d.fields[i][1], d.fields[i][2], d.fields[i][3], d.sel_type, d.fields[i][0], (in_list(['Data','Text','Link'], d.fields[i][2]) ? 'LIKE' : ''));
			}
		}
		d.set_doctype = d.sel_type;
		if(d.ls.filters['ID'].input)d.ls.filters['ID'].input.focus();
		
		//d.ls.show_query = 1;
	}	
	selector = d;
}

// Link Selector
// -------------

function makeselector() {
	var d = new Dialog(540,440, 'Search');

	d.make_body([
		['Data', 'Beginning With', 'Tip: You can use wildcard "%"'],
		['Select', 'Search By'],
		['Button', 'Search'],
		['HTML', 'Result']
	]);	
	d.wrapper.style.zIndex = 93;
	
	// search with
	var inp = d.widgets['Beginning With'];
	var field_sel = d.widgets['Search By'];
	var btn = d.widgets['Search'];

	// result
	d.sel_type = '';
	d.values_len = 0;
	d.set = function(input, type, label) {
		d.sel_type = type; d.input = input;
		if(d.style!='Link') {
			d.rows['Result'].innerHTML ='';
			d.values_len = 0;
		}
		d.style = 'Link';
		if(!d.sel_type)d.sel_type = 'Value';
		d.title_text.innerHTML = 'Select a "'+ d.sel_type +'" for field "'+label+'"';
	}
	d.set_search = function(dt) {
		if(d.style!='Search') {
			d.rows['Result'].innerHTML ='';
			d.values_len = 0;
		}		
		d.style = 'Search';
		if(d.input) { d.input = null; sel_type = null; }
		d.sel_type = dt;
		d.title_text.innerHTML = 'Quick Search for ' + dt;
	}
	
	inp.onkeydown = function(e) { 
		if(isIE)var kc = window.event.keyCode;
		else var kc = e.keyCode;

		if(kc==13) if(!btn.disabled)btn.onclick(); 
	}

	d.onshow = function() { 
		if(d.set_doctype!=d.sel_type) {
			d.rows['Result'].innerHTML ='';
			d.values_len = 0;
		}
	
		inp.value = '';		
		if(d.input && d.input.txt.value) {
			inp.value = d.input.txt.value;
		}
		try{inp.focus();} catch(e){}
		
		if(d.input) d.input.set_get_query();

		// temp function to strip labels from search fields
		var get_sf_list = function(dt) {
			var l = []; var lf = search_fields[dt];
			for(var i=0; i<lf.length; i++) l.push(lf[i][1]);
			return l;
		}
	
		// set fields
		$ds(d.rows['Search By']);
		
		if(search_fields[d.sel_type]) {
			empty_select(field_sel);
			add_sel_options(field_sel, get_sf_list(d.sel_type), 'ID');
		} else {
			// set default select by
			empty_select(field_sel);
			add_sel_options(field_sel, ['ID'], 'ID');

			$c('webnotes.widgets.search.getsearchfields', {'doctype':d.sel_type}, function(r,rt) {
				search_fields[d.sel_type] = r.searchfields;
				empty_select(field_sel);
				add_sel_options(field_sel, get_sf_list(d.sel_type));
				field_sel.selectedIndex = 0;
			} );
		}
	}
	d.onhide = function() {
		if(page_body.wntoolbar)
			page_body.wntoolbar.search_sel.disabled = 0;
	}

	btn.onclick = function() {
		btn.disabled = true;
		d.set_doctype = d.sel_type;
		var q = '';
		if(d.input && d.input.get_query) {
			var doc = {};
			if(cur_frm) doc = locals[cur_frm.doctype][cur_frm.docname];
			var q = d.input.get_query(doc);
			if(!q) { return ''; }
		}

		// for field type, return field name
		var get_sf_fieldname = function(v) {
			var lf = search_fields[d.sel_type];
			for(var i=0; i<lf.length; i++) if(lf[i][1]==v) return lf[i][0];
		}		

		$c('webnotes.widgets.search.search_widget', 
			args = {
				'txt':strip(inp.value)
				,'doctype':d.sel_type
				,'query':q
				,'searchfield':get_sf_fieldname(sel_val(field_sel))
			},
			function(r, rtxt) {
				btn.disabled = false;
				if(r.coltypes)r.coltypes[0]='Link'; // first column must always be selectable even if it is not a link
				d.values_len = r.values.length;
				d.set_result(r);
			}, function() { btn.disabled= false; });
	}
	
	d.set_result = function(r) {
		d.rows['Result'].innerHTML = '';
		var c = $a(d.rows['Result'],'div','comment',{paddingBottom:'4px',marginBottom:'4px',borderBottom:'1px solid #CCC', marginLeft:'4px'});
		if(r.values.length==50)
			c.innerHTML = 'Showing max 50 results. Use filters to narrow down your search';
		else
			c.innerHTML = 'Showing '+r.values.length+' resuts.';

		var w = $a(d.rows['Result'],'div','',{height:'240px',overflow:'auto',margin:'4px'});
		for(var i=0; i<r.values.length; i++) {
			var div = $a(w,'div','',{marginBottom:'4px',paddingBottom:'4px',borderBottom:'1px dashed #CCC'});

			// link
			var l = $a(div,'div','link_type'); l.innerHTML = r.values[i][0]; l.link_name = r.values[i][0]; l.dt = r.coloptions[0];
			if(d.input)
				l.onclick = function() { setlinkvalue(this.link_name); }
			else
				l.onclick = function() { loaddoc(this.dt, this.link_name); }

			// support
			var cl = []
			for(var j=1; j<r.values[i].length; j++) cl.push(r.values[i][j]);
			var c = $a(div,'div','comment',{marginTop:'2px'}); c.innerHTML = cl.join(', ');
		}
		
	}
	
	d.wrapper.style.zIndex = '95';
	
	selector = d;	
}
