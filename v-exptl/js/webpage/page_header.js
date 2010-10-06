/* standard page header

	+ wrapper
		+ [table]
			+ [r1c1] 
				+ main_head
				+ sub_head
			+ [r1c2] 
				+ close_btn
		+ seperator
		+ toolbar_area
		+ tag_area
*/

var def_ph_style = {
	wrapper: {marginBottom:'16px'}
	,main_heading: { fontSize:'22px', fontWeight:'bold', marginBottom:'8px'}
	,sub_heading: { fontSize:'14px', marginBottom:'8px', color:'#555' }
	,toolbar_area: { margin:'0px', padding: '2px 4px', backgroundColor:'#DDF', display:'none'}
	,separator: { borderBottom:'2px solid #AAA' } // show this when there is no toolbar
	,tag_area: { color:'#888', margin:'4px 0px', fontSize:'10px', textAlign:'right' }
	,close_btn: { cursor:'pointer', width:'64px', cssFloat:'right', height: '24px', 
		background:"url('images/ui/close_btn.gif') center no-repeat"
	}
}

function PageHeader(parent, main_text, sub_text) {

	this.wrapper = $a(parent,'div','',def_ph_style.wrapper);
	this.t1 = make_table(this.wrapper, 1, 2, '100%', [null, '100px']);
	this.main_head = $a($td(this.t1, 0, 0), 'div', '', def_ph_style.main_heading);
	this.sub_head = $a($td(this.t1, 0, 0), 'div', '', def_ph_style.sub_heading);
	this.toolbar_area = $a(this.wrapper, 'div', '', def_ph_style.toolbar_area);
	this.separator = $a(this.wrapper, 'div', '', def_ph_style.separator);
	this.tag_area = $a(this.wrapper, 'div', '', def_ph_style.tag_area);

	// close btn
	$y($td(this.t1, 0, 1),{textAlign:'right'});
	this.close_btn = $a($td(this.t1, 0, 1), 'button','',{fontSize:'11px'});
	this.close_btn.innerHTML = 'Close';
	$(this.close_btn).button({icons:{ primary: 'ui-icon-closethick' }});

	this.close_btn.onclick = function() { nav_obj.show_last_open(); }

	if(main_text) this.main_head.innerHTML = main_text;
	if(sub_text) this.sub_head.innerHTML = sub_text;
}

PageHeader.prototype.add_button = function(label, fn, bold, icon, green) {
	if(green)
		var btn = $a($a(this.toolbar_area, 'span', 'green_buttons'),'button','',{fontSize:'11px'});
	else
		var btn = $a(this.toolbar_area,'button','',{fontSize:'11px'});
	btn.innerHTML = label; 
	btn.onclick = fn;
	if(bold)$y(btn, {fontWeight: 'bold'});
	$(btn).button({icons:{ primary: icon }});
	this.show_toolbar();
	return btn;
}

PageHeader.prototype.show_toolbar = function() {
	$ds(this.toolbar_area);
	$dh(this.separator);
	/*if(!isIE) {
		$(this.toolbar_area)
			.css('-moz-border-radius','5px')
			.css('-webkit-border-radius','5px');
	}*/
}
PageHeader.prototype.clear_toolbar = function() {
	this.toolbar_area.innerHTML = '';
}

PageHeader.prototype.make_buttonset = function() {
	$(this.toolbar_area).buttonset();
}