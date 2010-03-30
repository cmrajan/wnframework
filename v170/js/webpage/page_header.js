// Header.js
// standard page header
// -----------------------------

var def_ph_style = {
	wrapper: {marginBottom:'32px'}
	,main_heading: { fontSize:'22px', fontWeight:'bold', marginBottom:'8px' }
	,sub_heading: { fontSize:'14px', marginBottom:'8px', color:'#777' }
	,toolbar_area: { margin:'0px', marginBottom:'4px', padding: '2px 4px', backgroundColor:'#DDD', display:'none'}
	,separator: { border:'1px solid #000' } // show this when there is no toolbar
	,tag_area: { color:'#888', marginBottom:'4px', textAlign:'right', fontSize:'10px' }
	,close_btn: { cursor:'pointer', width:'60px', cssFloat:'right', padding:'1px', paddingRight: '20px', background:"url('images/icons/close.gif') right top no-repeat" }
}

function PageHeader(parent, main_text, sub_text) {

	this.wrapper = $a(parent,'div','',def_ph_style.wrapper);
	this.t1 = make_table(this.wrapper, 1, 2, '100%', [null, '100px']);
	this.main_head = $a($td(this.t1, 0, 0), 'div', '', def_ph_style.main_heading);
	this.sub_head = $a($td(this.t1, 0, 0), 'div', '', def_ph_style.sub_heading);
	this.separator = $a(this.wrapper, 'div', '', def_ph_style.separator);
	this.toolbar_area = $a(this.wrapper, 'div', '', def_ph_style.toolbar_area);
	this.tag_area = $a(this.wrapper, 'div', '', def_ph_style.tag_area);

	// close btn
	$y($td(this.t1, 0, 1),{textAlign:'right'});
	this.close_btn = $a($td(this.t1, 0, 1), 'div', '', def_ph_style.close_btn);
	this.close_btn.innerHTML = 'Close';
	this.close_btn.onclick = function() { nav_obj.show_last_open(); }

	if(main_text) this.main_head.innerHTML = main_text;
	if(sub_text) this.sub_head.innerHTML = sub_text;
}

PageHeader.prototype.add_button = function(label, fn, bold, icon) {
	var btn = $a(this.toolbar_area,'button');
	btn.innerHTML = label; 
	btn.onclick = fn;
	if(bold)$y(btn, {fontWeight: 'bold'});
	$(btn).button({icons:{ primary: icon }});
	$dh(this.separator);
	$ds(this.toolbar_area);
}

PageHeader.prototype.clear_toolbar = function() {
	this.toolbar_area.innerHTML = '';
}

PageHeader.prototype.make_buttonset = function() {
	$(this.toolbar_area).buttonset();
}