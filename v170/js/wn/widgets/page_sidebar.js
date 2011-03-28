// opts = { 'title': 'My Sidebar',
//  'sections': [
//     {'title': 'Actions', 
//		'items': [{type: , label:, onclick function / string to eval], ]
//		'render': function (optional) 
//		}
//
// item types = link, button, html, inpu


//
// Page Sidebar
//
wn.widgets.PageSidebar = function(parent, opts) {
	this.opts = opts
	this.sections = {}
	this.wrapper = $a(parent, 'div', 'psidebar-wrapper')

	// refresh sidebar - make head and sections
	this.refresh = function() {
		this.wrapper.innerHTML = ''
		if(this.opts.title)
			this.make_head();
		for(var i=0; i<this.opts.sections.length; i++) {
			this.sections[this.opts.sections[i].title] 
				= new wn.widgets.PageSidebarSection(this, this.opts.sections[i]);
		}
		if(this.opts.onrefresh) { this.opts.onrefresh(this) }
	}

	this.make_head = function() {
		this.head = $a(this.wrapper, 'div', 'psidebar-head', '', this.opts.title);
	}
}

//
// Sidebar Section
//
wn.widgets.PageSidebarSection = function(sidebar, opts) {
	this.items = [];
	this.sidebar = sidebar;
	this.wrapper = $a(sidebar.wrapper, 'div', 'psidebar-section');
	$br(this.wrapper, '3px');
	this.opts = opts;

	// head
	this.make_head = function() {
		this.head = $a(this.wrapper, 'div', 'psidebar-section-head', '', this.opts.title);
	}

	// make items
	this.make_items = function() {
		for(var i=0; i<this.opts.items.length; i++) {
			
			var item = this.opts.items[i];
			if((item.display && item.display()) || !item.display) {
				
				var div = $a(this.wrapper, 'div', 'psidebar-section-item');
				this.make_one_item(item, div);
			}
				
		}
	}

	this.make_one_item = function(item, div) {
		if (item.type.toLowerCase()=='link')
			this.items[item.label] = new wn.widgets.PageSidebarLink(this, item, div);

		else if (item.type.toLowerCase()=='button')
			this.items[item.label] = new wn.widgets.PageSidebarButton(this, this.opts.items[i], div);

		//else if (item.type=='Input')
		//	new wn.widgets.PageSidebarInput(this, this.opts.items[i], div);

		else if (item.type.toLowerCase()=='html')
			this.items[item.label] = new wn.widgets.PageSidebarHTML(this, this.opts.items[i], div);
	}
	
	// image
	this.add_icon = function(parent, icon) {
		if(icon.substr(0,3)=='ic-') {
			var img = $a(parent, 'div', 'wn-icon ' + icon, 
				{cssFloat:'left', marginRight: '7px', marginBottom:'-3px'}
			);
		} else {
			var img = $a(parent, 'img', '', {marginRight: '7px', marginBottom:'-3px'});
			img.src = 'images/icons/' + icon;
		}
	}
	
	this.refresh = function() {
		this.make_head();
		if(this.opts.render) { 
			this.opts.render(this.wrapper); }
		else 
			this.make_items();
	}
	this.refresh();
}
//
// Elements
//

// link
wn.widgets.PageSidebarLink = function(section, opts, wrapper) {
	this.wrapper = wrapper;
	this.section = section;
	this.opts = opts;
	
	var me = this;
	if(opts.icon) {
		section.add_icon(this.wrapper, opts.icon);
	}
	this.ln = $a(this.wrapper, 'span', 'link_type psidebar-section-link', opts.style, opts.label);
	this.ln.onclick = function() { me.opts.onclick(me) };
}

// button
wn.widgets.PageSidebarButton = function(section, opts, wrapper) {
	this.wrapper = wrapper;
	this.section = section;
	this.opts = opts;
	
	var me = this;
	this.btn = $btn(this.wrapper, opts.label, opts.onclick, opts.style, opts.color);
}

// html
wn.widgets.PageSidebarHTML = function(section, opts, wrapper) {
	wrapper.innerHTML = opts.content
}