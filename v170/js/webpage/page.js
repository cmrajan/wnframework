// PAGE

var pages=[];
function Page(page_name, content) {	
	var me = this;
	this.name = page_name;

	this.onshow = function() {
		// default set_title
		set_title(me.doc.page_title ? me.doc.page_title : me.name);
		
		// onshow
		try {
			if(pscript['onshow_'+me.name]) pscript['onshow_'+me.name](); // onload
		} catch(e) { submit_error(e); }
	}

	this.wrapper = page_body.add_page(page_name, this.onshow);
	this.cont = this.wrapper // bc
	if(content)
		this.wrapper.innerHTML = content;

	if(page_name == home_page)
		pages['_home'] = this;
	
	return this;
}

function render_page(page_name, menuitem) {
	if(!page_name)return;
	if((!locals['Page']) || (!locals['Page'][page_name])) {
		// no page, go home
		loadpage('_home');
		return;
	}
	var pdoc = locals['Page'][page_name];

	// style
	if(pdoc.style) set_style(pdoc.style)

	// create page
	var p = new Page(page_name, pdoc._Page__content?pdoc._Page__content:pdoc.content);
	// script
	var script = pdoc.__script ? pdoc.__script : pdoc.script;
	p.doc = pdoc;

	if(script)
		try { eval(script); } catch(e) { submit_error(e); }		

	// change
	page_body.change_to(page_name);	
	
	// run onload
	try {
		if(pscript['onload_'+page_name]) pscript['onload_'+page_name](); // onload
	} catch(e) { submit_error(e); }
		
	return p;
}

function refresh_page(page_name) {
	var fn = function(r, rt) {
		render_page(page_name)	
	}
	$c('webnotes.widgets.page.getpage', {'name':page_name}, fn);
}
