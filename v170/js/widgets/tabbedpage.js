// Tabbed Page

function TabbedPage(parent, only_labels) { 
	this.tabs = {};
	this.cur_tab = null;

	this.label_wrapper = $a(parent, 'div','box_label_wrapper'); // for border
	this.label_body = $a(this.label_wrapper, 'div', 'box_label_body'); // for height
	this.label_area = $a(this.label_body, 'ul', 'box_tabs');
	if(!only_labels)this.body_area = $a(parent, 'div', '', {backgroundColor:'#FFF'});
	else this.body_area = null;
}

TabbedPage.prototype.add_tab = function(n, onshow) { 

	var tab = $a(this.label_area, 'li');
	tab.label = $a(tab,'a');
	tab.label.innerHTML = n;
	
	if(this.body_area){
		tab.tab_body = $a(this.body_area, 'div');
		$dh(tab.tab_body);
	} else { tab.tab_body = null; }
	tab.onshow = onshow;
	var me = this;

	tab.hide = function() { 
		if(this.tab_body)$dh(this.tab_body); this.className = '';
		hide_autosuggest();
	}
	tab.set_selected = function() { 
		if(me.cur_tab) me.cur_tab.hide();
		this.className = 'box_tab_selected';
		$op(this, 100); 
		me.cur_tab = this;
	}
	tab.show = function(arg) { 
		this.set_selected(); 
		if(this.tab_body) $ds(this.tab_body);
		if(this.onshow)this.onshow(arg); 
	}
	tab.onmouseover = function() { 
		if(me.cur_tab!=this) this.className = 'box_tab_mouseover';
	}
	tab.onmouseout = function() {
		if(me.cur_tab!=this) this.className = ''
	}
	tab.onclick = function() { this.show(); }
	this.tabs[n] = tab;
	return tab;
}

TabbedPage.prototype.disable_tab = function(n) {
	if(this.cur_tab==this.tabs[n]) this.tabs[n].hide();
	$dh(this.tabs[n]) // hide label
}
TabbedPage.prototype.enable_tab = function(n) {
	$di(this.tabs[n]) // show label
}

// =================================================================================

function TrayPage(parent, height, width) {
	var me = this;
	if(!width) width='122px';
	
	this.tray_bg = '#DDE3EA';
	this.tray_mo = '#B5C3D6';
	this.tray_fg = '#8392AC';
	this.body_style = {margin: '16px'}
	
	this.cur_item = null;
	
	this.items = {};
	this.tab = make_table($a(parent, 'div'), 1, 2, '100%', [width, null]);
	
	// tray style
	$y($td(this.tab, 0, 0),{
		backgroundColor: this.tray_bg
		,borderRight:'1px solid ' + this.tray_fg
		,width: '122px'
	});

	// body style
	this.body = $a($td(this.tab, 0, 1), 'div');
	if(height) {
		$y(this.body, {height: height, overflow: 'auto'});
	}
	
	this.add_item = function(label, onclick, no_body, with_heading) {
		this.items[label] = new TrayItem(me, label, onclick, no_body, with_heading);
		return this.items[label];
	}
}

function TrayItem(tray, label, onclick, no_body, with_heading) {
	this.label = label;
	this.onclick = onclick;
	var me = this;
	
	this.ldiv = $a($td(tray.tab, 0, 0), 'div', '', {padding: '6px 8px', cursor:'pointer'});
	if(!no_body) {
		this.wrapper = $a(tray.body, 'div', '', tray.body_style);
		if(with_heading) {
			this.header = $a(this.wrapper, 'div', 'sectionHeading', {marginBottom:'16px', paddingBottom:'0px'});
			this.header.innerHTML = label;
		}
		this.body = $a(this.wrapper, 'div');
		
		$dh(this.wrapper);
	}

	$(this.ldiv).html(label)
		.hover(
			function() { if(tray.cur_item.label != this.innerHTML) $y(this,{backgroundColor:tray.tray_mo}) },
			function() { if(tray.cur_item.label != this.innerHTML) $y(this,{backgroundColor:tray.tray_bg}) }
		)
		.click(
			function() { me.expand(); }
		)

	this.expand = function() {
		if(tray.cur_item) tray.cur_item.collapse();
		if(me.wrapper) $ds(me.wrapper);
		if(me.onclick) me.onclick(me.label);
		me.show_as_expanded();
	}
	
	this.show_as_expanded = function() {
		$y(me.ldiv, {backgroundColor: tray.tray_fg, color:'#FFF', fontWeight: 'bold'})
		tray.cur_item = me;
	}
	
	this.collapse = function() {
		if(me.wrapper)$dh(me.wrapper);		
		$y(me.ldiv, {backgroundColor: tray.tray_bg, color:'#000', fontWeight: 'normal'})
	}
	this.hide = function() {
		me.collapse();
		$dh(me.ldiv);
	}
	this.show = function() {
		$ds(me.ldiv);
	}	
}