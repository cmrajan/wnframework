/* standard page header

	+ wrapper
		+ [table]
			+ [r1c1] 
				+ main_head
				+ sub_head
			+ [r1c2] 
				+ close_btn
		+ toolbar_area
		+ tag_area
		+ seperator
*/

var def_ph_style = {
	wrapper: {marginBottom:'16px', backgroundColor:'#EEE'}
	,main_heading: { fontSize:'18px', padding: '4px 0px', fontWeight:'bold'}
	,sub_heading: { fontSize:'14px', marginBottom:'8px', color:'#555', display:'none' }
	,separator: { borderTop:'3px solid #444' } // show this when there is no toolbar
	,toolbar_area: { padding:'6px 0px', display:'none',borderBottom:'1px solid #AAA'}
}

function PageHeader(parent, main_text, sub_text) {

	this.wrapper = $a(parent,'div','page_header');
	this.t1 = make_table($a(this.wrapper,'div','',def_ph_style.wrapper.backgroundColor), 1, 2, '100%', [null, '100px'], {padding: '2px'});
	$y(this.t1, {borderCollapse:'collapse'})
	this.lhs = $td(this.t1, 0, 0);
	
	this.main_head = $a(this.lhs, 'div', '', def_ph_style.main_heading);
	this.sub_head = $a(this.lhs, 'div', '', def_ph_style.sub_heading);

	this.separator = $a(this.wrapper, 'div', '', def_ph_style.separator);
	this.toolbar_area = $a(this.wrapper, 'div', '', def_ph_style.toolbar_area);
	this.padding_area = $a(this.wrapper, 'div', '', {padding:'3px'});

	// close btn
	$y($td(this.t1, 0, 1),{textAlign:'right', padding:'3px'});
	this.close_btn = $btn($td(this.t1, 0, 1), 'Close',function() { nav_obj.show_last_open(); },0);

	if(main_text) this.main_head.innerHTML = main_text;
	if(sub_text) this.sub_head.innerHTML = sub_text;
	
	this.buttons = {};
	this.buttons2 = {};
}

PageHeader.prototype.add_button = function(label, fn, bold, icon, green) {

	var tb = this.toolbar_area;
	if(this.buttons[label]) return;
		
	var btn = $btn(tb,label,fn,{marginRight:'4px'},(green ? 'green' : ''));
	if(bold) $y(btn,{fontWeight:'bold'});

	this.buttons[label]=btn;
	$ds(this.toolbar_area);
	
	return btn;
}

PageHeader.prototype.clear_toolbar = function() {
	this.toolbar_area.innerHTML = '';
	this.buttons = {};
}

PageHeader.prototype.make_buttonset = function() {
	$(this.toolbar_area).buttonset();
}