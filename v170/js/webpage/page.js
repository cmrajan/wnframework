// PAGE

var pages=[];
function Page(page_name, content) {	
	this.name = page_name;
	this.cont = new Container(page_name);
	this.cont.init();
	if(content)this.cont.body.innerHTML = content;
	pages[page_name] = this;
	if(page_name == home_page)pages['_home'] = this;
	this.cont.page = this;
	this.cont.onshow = function() {
		try {
			if(pscript['onshow_'+this.page.name]) pscript['onshow_'+this.page.name](); // onload
		} catch(e) { submit_error(e); }
		set_title(this.page.name);
	}
	return this;
}

var pscript={};
var cur_page;
function loadpage(page_name, call_back, menuitem) {
	//if(cur_page==page_name) return;
	if(page_name=='_home')page_name = home_page;
	var fn = function(r,rt) {
		if(pages[page_name]) {
			// loaded
			var p = pages[page_name]
			
			// call refresh
			try {
				if(pscript['refresh_'+page_name]) pscript['refresh_'+page_name](menuitem); // onload
			} catch(e) { 
				submit_error(e); 
			}
		} else {
			// new page
			var p = render_page(page_name, menuitem);
			if(menuitem) p.menuitem = menuitem;
			if(!p)return;
		}

		// show
		p.cont.show();
		
		// select menu
		if(p.menuitem) p.menuitem.show_selected();

		// execute callback
		cur_page=page_name;
		if(call_back)call_back();

		// update "back"		
		if(page_name!='_search')
			nav_obj.open_notify('Page',page_name,'');
	}
	
	if(get_local('Page', page_name) || pages[page_name]) fn();
	else $c('getdoc', {'name':page_name, 'doctype':"Page", 'user':user, 'is_page':1}, fn);
}

function render_page(page_name, menuitem) {
	if(!page_name)return;
	if((!locals['Page']) || (!locals['Page'][page_name])) {
		alert(page_name + ' not found'); return;
	}
	var pdoc = locals['Page'][page_name];

	// style
	if(pdoc.style) set_style(pdoc.style)

	// script
	var script = pdoc.__script ? pdoc.__script : pdoc.script;
	if(script)
		try { eval(script); } catch(e) { submit_error(e); }		
		
	var p = new Page(page_name, pdoc.__content?pdoc.__content:pdoc.content);

	try {
		if(pscript['onload_'+page_name]) pscript['onload_'+page_name](menuitem); // onload
	} catch(e) { submit_error(e); }
		
	return p;
}

function refresh_page(page_name) {
	var fn = function(r, rt) {
		render_page(page_name)	
	}
	$c('getdoc', {'name':page_name, 'doctype':"Page", 'user':user, 'is_page':1}, fn)
}
