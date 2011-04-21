// new re-factored Listing object
// uses FieldGroup for rendering filters
// removed rarely used functionality
//

wn.widgets.Listing = function(opts) {
	this.opts = opts;
	this.page_length = 20;
	this.btns = {};
	this.start = 0;
	var me = this;

	// create place holders for all the elements
	this.make = function(opts) {
		this.wrapper = $a(this.opts.parent, 'div');
		this.filters_area = $a(this.wrapper, 'div', 'listing-filters');
		this.toolbar_area = $a(this.wrapper, 'div', 'listing-toolbar');
		this.results_area = $a(this.wrapper, 'div', 'listing-results');

		this.more_button_area = $a(this.wrapper, 'div', 'listing-more');

		this.no_results_area = $a(this.wrapper, 'div', 'help_box', {display: 'none'}, 
			(this.opts.no_results_message ? this.opts.no_results_message : 'No results'));

		if(opts) this.opts = opts;
		this.page_length = this.opts.page_length ? this.opts.page_length : this.page_length;
		
		this.make_toolbar();
		this.make_filters();
		this.make_more_button();
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
		if(!this.opts.hide_refresh) {
			this.ref_img = $a(this.toolbar_area, 'span', 'link_type', {color:'#888'}, '[refresh]');
			this.ref_img.onclick = function() { me.run(); }
			
			this.loading_img = $a(this.toolbar_area, 'img', 'images/ui/button-load.gif', {display:'none', marginLeft:'3px', marginBottom:'-2px'});
			
		}
	}

	// make more button
	// that shows more results when they are displayed
	this.make_more_button = function() {
		this.more_btn = $btn(this.more_button_area, 'Show more results...', 
			function() {
				me.more_btn.set_working();
				me.run(function() { 
					me.more_btn.done_working(); 
				}, 1);
			}, {fontSize:'14px'}, 0, 1
		);
		
		$y(this.more_btn.loading_img, {marginBottom:'0px'});
	}

	// clear the results and re-run the query
	this.clear = function() {
		this.results_area.innerHTML = '';
		this.table = null;
		$ds(this.results_area);
		$dh(this.no_results_area);
	}
	
	// callback on the query
	// build the table
	// returns r.values as a table of results
	this.make_results = function(r, rt) {
		if(this.start==0) this.clear();
		
		$dh(this.more_button_area);
		if(this.loading_img) $dh(this.loading_img)

		if(r.values && r.values.length) {
			// render the rows
			for(var i=0; i<r.values.length; i++) {
				var row = this.add_row();
				
				// call the show_cell with row, ri, ci, d
				this.opts.render_row(row, r.values[i], this);
			}
			// extend start
			this.start += r.values.length;
			
			// refreh more button
			if(r.values.length==this.page_length) $ds(this.more_button_area);
			
		} else {
			if(this.start==0) {
				$dh(this.results_area);
				$ds(this.no_results_area);
			}
		}
		
		// callbacks
		if(this.onrun) this.onrun();
		if(this.opts.onrun) this.opts.onrun();
	}
	
	
	// add a results row
	this.add_row = function() {
		return $a(this.results_area, 'div', '', (opts.cell_style ? opts.cell_style : {padding: '3px'}));
	}
	

	// run the query, get the query from 
	// the get_query method of opts
	this.run = function(callback, append) {
		if(callback) 
			this.onrun = callback;

		if(!append)
			this.start = 0;

		// load query
		this.query = this.opts.get_query();
		this.add_limits();

		args={ query_max: this.query_max ? this.query_max : '' }
		args.simple_query = this.query;
		
		// show loading
		if(this.loading_img) $di(this.loading_img);
		$c('webnotes.widgets.query_builder.runquery', args, 
			function(r, rt) { me.make_results(r, rt) }, null, this.opts.no_loading);
	}
	
	this.add_limits = function() {
		this.query += ' LIMIT ' + this.start + ',' + this.page_length;
	}
	
	if(opts) this.make();
}