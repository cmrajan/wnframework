// Menu Bar

function MenuToolbar(parent) {
	this.ul = $a(parent, 'ul', 'menu_toolbar');
	this.cur_top_menu = null;
	this.max_rows = 10;
	this.dropdown_width = '280px';
	this.top_menus = {};

	this.top_menu_style = 'top_menu';
	this.top_menu_mo_style = 'top_menu_mo';
	
}
MenuToolbar.prototype.add_top_menu = function(label, onclick) {
	var li = $a(this.ul, 'li');
	var a = $a(li, 'a', this.top_menu_style);
	var me = this;
	a.onclick = function() { /*this.set_selected();*/ onclick(); } ;
	a.innerHTML = label;
	a.onmouseover = function() { 
		if(this!=me.cur_top_menu) this.className = me.top_menu_style+' '+me.top_menu_mo_style;
		if(a.my_mouseover)a.my_mouseover(this);
	}
	a.onmouseout = function() { 
		if(a.my_mouseout)a.my_mouseout(this);
		if(this!=me.cur_top_menu)
			this.className = me.top_menu_style;
	}
	a.set_unselected = function() {
		this.className = me.top_menu_style;
		me.is_active = 0;
	}
	a.set_selected = function() { 
		if(me.cur_top_menu)me.cur_top_menu.set_unselected();
		this.className = me.top_menu_style+' '+me.top_menu_mo_style;
		me.cur_top_menu = this;
		me.is_active = 1;
	}
	this.top_menus[label] = a;
	return a;
}

var closetimer;
function mclose() { // close all active
	for(var i=0;i<all_dropdowns.length;i++) {
		if(all_dropdowns[i].is_active)
			all_dropdowns[i].hide();
	}
}
function mclosetime() { closetimer = window.setTimeout(mclose, 500); }
function mcancelclosetime() { if(closetimer) { window.clearTimeout(closetimer); closetimer = null; } }

MenuToolbar.prototype.make_dropdown = function(tm) {
	var me = this;
	var dropdown = new DropdownMenu(tm.parentNode, this.dropdown_width);

	tm.dropdown = dropdown;
	
	// triggers on top menu
	tm.my_mouseover = function() {
		this.dropdown.show();
	}
	tm.my_mouseout = function() {
		this.dropdown.clear();
	}
}

MenuToolbar.prototype.add_item = function(top_menu_label, label, onclick, on_top) {
	var me = this;
	var tm = this.top_menus[top_menu_label];
	if(!tm.dropdown) 
		this.make_dropdown(tm, this.dropdown_width);
	
	return tm.dropdown.add_item(label, onclick, on_top);
}

var all_dropdowns = [];
function DropdownMenu(label_ele, width) {
	this.body = $a(label_ele, 'div', 'menu_toolbar_dropdown', {width:(width ? width : '140px')});
	this.label = label_ele;
	this.items = {};
	this.item_style = 'dd_item';
	this.item_mo_style = 'dd_item_mo';
		
	var me = this;
	
	this.body.onmouseout = function() { me.clear(); }
	this.body.onmouseover = function() { mcancelclosetime(); } // re-entered

	this.show = function() {
		// close others
		mclose();
		
		// clear menu timeout
		mcancelclosetime();
		
		hide_selects(); 
		$ds(me.body); // show
		
		// events on label
		if(me.label.set_selected)
			me.label.set_selected();
		
		me.is_active = 1;
	}

	this.hide = function() {
		$dh(me.body); // hide
		if(!frozen)show_selects();
		
		// clear from active list
		me.is_active = 0;
		
		// events on label
		if(me.label.set_unselected)
			me.label.set_unselected();		
	}

	this.clear = function() {
		mcancelclosetime();
		mclosetime();
	}
	all_dropdowns.push(me);
}

DropdownMenu.prototype.add_item = function(label, onclick, on_top) {
	var me = this;
	
	if(on_top) {
		var mi = document.createElement('div');
		me.body.insertBefore(mi, me.body.firstChild);
		mi.className = this.item_style;
	} else {
		var mi = $a(this.body, 'div', this.item_style);
	}
	
	mi.innerHTML = label;
	mi.onclick = onclick;
	mi.onmouseover = function() {
		this.className = me.item_style + ' ' + me.item_mo_style;
		me.cur_mi=this;
	}
	mi.onmouseout = function() { this.className = me.item_style; }
	mi.bring_to_top = function() { me.body.insertBefore(this, me.body.firstChild); }

	var nitems = this.body.childNodes.length;
	if(nitems>max_dd_rows)nitems = max_dd_rows;
	$h(this.body, (nitems * 23) + 'px');
	
	this.items[label] = mi;

	return mi;
}
