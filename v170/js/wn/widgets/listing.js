// new re-factored Listing object
// uses FieldGroup for rendering filters
// removed rarely used functionality
//

wn.widgets.Listing = function(opts) {
	this.opts = opts;
	this.btns = {};
	this.start = 0;

	// create place holders for all the elements
	this.make = function(opts) {
		this.wrapper = $a(this.opts.parent, 'div');
		this.filters_area = $a(this.wrapper, 'div', 'listing-filters');
		this.toolbar_area = $a(this.wrapper, 'div', 'listing-toolbar');
		this.results_area = $a(this.wrapper, 'div', 'listing-results');
		this.loading_area = $a(this.wrapper, 'div', 'listing-loading');
		this.more_button = $a(this.wrapper, 'div', 'listing-more');
		this.no_results_area = $a(this.wrapper, 'div', 'help_box', {display: 'none'});

		if(opts) this.opts = opts;
		this.make_toolbar();
		this.make_filters();
	}
	
	// make filters using FieldGroup
	this.make_filters = function() {
		if(this.opts.filters) {
			$ds(this.filters_area);
			
			// expand / collapse filters
			
			this.filters = new wn.widgets.FieldGroup(this.filters_area, this.opts.fields);
		}
	}
	
	// make the toolbar
	this.make_toolbar = function() {
		if(this.opts.filters.hide_refresh)
			this.btns.refresh = $btn(this.toolbar_area, 'Refresh', this.run);

		if(this.opts.filters.show_report)
			this.btns.report = $btn(this.toolbar_area, 'Report', this.show_report);

		if(this.opts.filters.show_export)
			this.btns.export = $btn(this.toolbar_area, 'Export', this.do_export);

		if(this.opts.filters.show_print)
			this.btns.print = $btn(this.toolbar_area, 'Print', this.do_print);
	}

	// clear the results and re-run the query
	this.clear = function() {
		this.results_area.innerHTML = '';
		this.table = null;
		$dh(this.no_result_area);
	}
	
	// callback on the query
	// build the table
	// returns r.values as a table of results
	this.make_results = function(r, rt) {
		if(this.start==0) this.clear();
		
		if(r.values) {
			if(this.opts.headers && !this.table) {
				this.build_table()
			}
			
			// render the rows
			for(var i=0; i<r.values.length; i++) {
				var row = this.add_row();
				if(this.opts.render_row) {
					// call the show_cell with row, ri, ci, d
					this.opts.render_row(row, i, 0, r.values);
				} else {
					// render the cells
					this.render_row(r.values, i)
				}
			}
			
			// extend start
			this.start += r.values.length;
			
		} else {
			if(this.start==0) {
				$dh(this.results_area);
				$ds(this.no_results_area);
			}
		}
	}
	
	// build a table of headers
	// add serial number column if
	// required
	this.build_table = function() {
		var widths = [];
		for(var i=0; i<this.opts.headers.length; i++) {
			widths.push(this.opts.headers[i].width);
		}
		var cell_style = opts.cell_style ? opts.cell_style : {padding: '3px'};
		
		// table
		this.results_table = make_table(this.results_area, 1, this.opts.headers.length, '100%', widths, cell_style)
		
		// headings
		for(var i=0; i<this.opts.headers.length; i++) {
			var cell = $td(this.results_table, 0, i);
			cell.innerHTML = this.opts.headers[i].label;
			$y(cell, {fontWeight:'bold'});
		}
	}
	
	// add a results row
	this.add_row = function() {
		if(this.results_table) {
			this.results_table.append_row();
		} else {
			return $a(this.results_area, 'div', '', (opts.cell_style ? opts.cell_style : {padding: '3px'}));
		}
	}
	
	// render a simple row based on the
	// values and style given
	this.render_row = function(data, ridx) {
		for(var i=0; i<data[ridx].length; i++) {
			if(i==0) {
				// serial number
				$td(this.results_table, ridx+1, i) = i+1;
			}

			// render the cell value
			this.render_cell($td(this.results_table, ridx+1, i+1), data[ridx][i], this.opts.headers[i].fieldtype, this.opts.headers[i].options)
		}
	}
	
	// render a cell based on the datatype
	this.render_cell = function(cell, data, type, options) {
		cell.div = $a(cell, 'div');
		$s(cell.div, data, type, options);		
	}
	
	// run the query, get the query from 
	// the get_query method of opts
	this.run = function() {
		// load query
		this.opts.get_query();
		this.add_limits();
		
		args={ query_max: this.query_max }
		
		if(this.is_std_query) 
			args.query = q;
		else 
			args.simple_query = q;
		$c('webnotes.widgets.query_builder.runquery', args, this.make_results, null, this.opts.no_loading);
	}
	
	this.add_limits = function() {
		var page_len = this.opts.page_length ? this.opts.page_length ? 20
		this.query += ' LIMIT ' + this.start + ',' + page_len;
		
	}
	this.show_report = function() {
		
	}
	this.do_export = function() {
		
	}
	this.do_print = function() {
		
	}
}