// PAGE

var pages=[];
function Page(page_name, content) {	
	var me = this;
	this.name = page_name;

	this.onshow = function() {
		// default set_title
		set_title(me.name);
		
		// onshow
		try {
			if(pscript['onshow_'+me.name]) pscript['onshow_'+me.name](); // onload
		} catch(e) { submit_error(e); }
	}

	this.cont = page_body.add_page(page_name, this.onshow);
	if(content)
		this.cont.innerHTML = content;

	if(page_name == home_page)
		pages['_home'] = this;
	
	return this;
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
	
	// create page
	var p = new Page(page_name, pdoc.__content?pdoc.__content:pdoc.content);

	// run onload
	try {
		if(pscript['onload_'+page_name]) pscript['onload_'+page_name](menuitem); // onload
	} catch(e) { submit_error(e); }
		
	return p;
}

function refresh_page(page_name) {
	var fn = function(r, rt) {
		render_page(page_name)	
	}
	$c('webnotes.widgets.page.getpage', {'name':page_name}, fn);
}
