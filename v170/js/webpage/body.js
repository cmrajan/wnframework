/** Page Body

	+ body
		+ wntoolbar
		+ header
		+ body
			+ left_sidebar
			+ center
			+ right_sidebar
		+ footer


**/
function Body() { 
	var me = this;
	this.wrapper = $i('body_div');

	this.no_of_columns = function() {
		var n = 1;
		if(cint(this.cp.left_sidebar_width)) n++;
		if(cint(this.cp.right_sidebar_width)) n++;
		return n;
	}
	
	this.setup_sidebars = function() {
		var n = this.no_of_columns();
		if(n==1) 
			// no sidebar
			this.center = this.body;
		else {
			// has sidebars, make a table
			this.body_table = make_table(this.body, 1, n, '100%');
			var c = 0;
			if(cint(this.cp.left_sidebar_width)) {
				this.left_sidebar = $td(this.body_table, 0, c);
				c++;
			}
			this.center = $td(this.body_table, 0, c);
			c++;
			if(cint(this.cp.right_sidebar_width)) {
				this.right_sidebar = $td(this.body_table, 0, c);
				c++;
			}			
		}
	}
	
	this.setup = function() {
		this.cp = locals['Control Panel']['Control Panel'];

		// core areas;
		this.wntoolbar = new WNToolbar(this.wrapper);
		this.header = $a(this.wrapper, 'div');
		this.body = $a(this.wrapper, 'div');
		this.footer = $a(this.wrapper, 'div');
		
		// sidebars
		this.setup_sidebars();
		
		// page width
		if(this.cp.page_width) $y(this.wrapper,{width:cint(this.cp.page_width) + 'px'});
	}
	
	// Standard containers
	// - Forms
	// - Report Builder
	// - Item List
	// - [Pages by their names]

	this.containers = {};
	this.cur_cont = null;
	this.add_container = function(label, onshow) {
		var c = $a(this.center, 'div');
		if(onshow) c.onshow = onshow;
		this.containers[label] = c;
	}
	
	this.change_to = function(label) {
		// hide existing
		if(me.cur_cont) 
			$dh(me.cur_cont);
			
		// show
		me.cur_cont = me.containers[label];
		$ds(me.cur_cont);
	
		// on show
		if(me.cur_cont.onshow)
			me.cur_cont.onshow(me.cur_cont);
	}
	
	this.resize = function() {
		
	}
	
	this.set_width = function() {
		
	}
	this.setup();
}