var print_dialog;
function show_print_dialog(args) {
	if(!print_dialog) {
		var d = new Dialog(400, 300, "Print");
		d.make_body([
			['Data', 'Max rows', 'Blank to print all rows'],
			['Data', 'Rows per page'],
			['Button', 'Go'],
		]);	
		d.widgets['Go'].onclick = function() {
			print_dialog.hide();
			go_print_query(print_dialog.args, cint(print_dialog.widgets['Max rows'].value), cint(print_dialog.widgets['Rows per page'].value))
		}
		d.onshow = function() {
			this.widgets['Rows per page'].value = '35';
			this.widgets['Max rows'].value = '500';
		}
		print_dialog = d;
	}
	print_dialog.args = args;
	print_dialog.show();
}

function print_query(args) { show_print_dialog(args); }

function go_print_query(args, max_rows, page_len) {
 //q, title, colnames, colwidths, coltypes, has_index, check_limit, is_simple
 
	// limit for max rows
    if(cint(max_rows)!=0) args.query += ' LIMIT 0,' + cint(max_rows);

	if(!args.query) return;

	var callback = function(r,rt) {

		if(!r.values) { return; }
		if(!page_len) page_len = r.values.length;

		// add serial num column
				
		if(r.colnames && r.colnames.length) 
			args.colnames = args.has_index ? add_lists(['Sr'],r.colnames) : r.colnames;
		if(r.colwidths && r.colwidths.length) 
			args.colwidths = args.has_index ? add_lists(['25px'],r.colwidths) : r.colwidths;
		if(r.coltypes) 
			args.coltypes = args.has_index ? add_lists(['Data'],r.coltypes) : r.coltypes;

		if(args.coltypes) {
			for(var i in args.coltypes) 
				if(args.coltypes[i]=='Link') args.coltypes[i]='Data';
		}

		// fix widths to %
		if(args.colwidths) {
			var tw = 0;
			for(var i=0; i<args.colwidths.length; i++) tw+=cint(args.colwidths[i] ? args.colwidths[i]: 100);
			for(var i=0; i<args.colwidths.length; i++) args.colwidths[i]= cint(cint(args.colwidths[i] ? args.colwidths[i] : 100) / tw * 100) + '%';
		}
		

		var has_heading = args.colnames ? 1 : 0;
		if(!args.has_headings) has_heading = 0;
		
		var tl = []
		for(var st=0; st< r.values.length; st = st + page_len) {
			tl.push(print_query_table(r, st, page_len, has_heading, args.finder))
		}
		
		var html = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">'
			+ '<html><head>'
			+'<title>'+args.title+'</title>'
			+'<style>'+def_print_style+'</style>'
			+'</head><body>'
			+ (r.header_html ? r.header_html : '')
			+ tl.join('\n<div style="page-break-after: always;"></div>\n')
			+ (r.footer_html ? r.footer_html : '')
			+'</body></html>';
		print_go(html)    
	}
	var out_args = copy_dict(args);
	if(args.is_simple) {
		out_args.simple_query = args.query;
		delete out_args.query;
	} else {
		out_args.defaults = pack_defaults();
		out_args.roles = '["'+user_roles.join('","')+'"]';
	}
	// add filter values
	if(args.filter_values) 
		out_args.filter_values = args.filter_values;
	$c('runquery', out_args, callback);
}

function print_query_table(r, start, page_len, has_heading, finder) {
	// print a table
	var div = document.createElement('div');
	
	if(!r.page_template) {
		var head = $a(div,'div',null,{fontSize:'20px', fontWeight:'bold', margin:'16px 0px', borderBottom: '1px solid #CCC', paddingBottom:'8px'});
		head.innerHTML = args.title;
	}

	var m = start + page_len;
	if(m>r.values.length) m = r.values.length
		
	var t = make_table(div, m + has_heading - start, r.values[0].length + args.has_index, '100%', null);
	t.className = 'simpletable';
	if(args.colwidths)
		$y(t,{tableLayout:'fixed'});

	if(has_heading) {
		for(var i=0; i < args.colnames.length; i++) {
			$td(t,0,i).innerHTML = args.colnames[i].bold();
			if(args.colwidths && args.colwidths[i]) {
				$w($td(t,0,i),args.colwidths[i]);
			}
		}
	}

	for(var ri=start; ri<m; ri++) {
		// Sr No
		if(args.has_index)
			$td(t,ri+has_heading-start,0).innerHTML=ri+1;
		for(var ci=0; ci<r.values[0].length; ci++) {
			if(ri-start==0 && args.colwidths && args.colwidths[i]){
				$w($td(t,0,i), args.colwidths[i]); // colwidths for all
			}
			var c = $td(t,ri+has_heading-start,ci + args.has_index)
			c.div = $a(c, 'div');
			$s(
				c.div, 
				r.values[ri][ci],
				args.coltypes ? args.coltypes[ci + args.has_index] : null
			);
		}
	}

	// user style
	if(r.style) {
		for(var i=0;i<r.style.length;i++) {
			$yt(t,r.style[i][0],r.style[i][1],r.style[i][2]);
		}
	}

	if(finder && finder.aftertableprint) {
		finder.aftertableprint(t);
	}
		
	if(r.page_template) return repl(r.page_template, {table:div.innerHTML});
	else return div.innerHTML;

}

