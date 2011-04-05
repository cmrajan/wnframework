// =================================================
//
// Tag Globals
//
_tags = {
	dialog: null,
	color_map: {},
	all_tags: [],
	colors: {'Default':'#489', 'Red':'#FF0000', 'Blue':'#000088', 'Green':'#008800', 'Orange':'#FF8800'},
	color_list: ['Default', 'Red', 'Blue', 'Green', 'Orange'] // for sequence
}

//
// Tag List
//
TagList = function(parent, start_list, dt, dn, static, onclick) {
	this.start_list = start_list ? start_list : [];
	this.tag_list = [];
	this.dt = dt;
	this.onclick = onclick;
	this.dn = dn;
	this.static;
	this.parent = parent;
	this.make_body();
}

TagList.prototype.make = function(parent) {
	for(var i=0; i<this.start_list.length; i++) {
		if(this.start_list[i])
			new SingleTag(this.body, this.start_list[i], this.dt, this.dn, '_user_tags', this.static, this);
	}
}

TagList.prototype.make_body = function() {
	var div = $a(this.parent, 'div', '', {margin:'3px 0px', padding:'3px 0px'});
	this.body = $a(div, 'span', '', {marginRight:'4px'});
	this.add_tag_area = $a(div, 'span');
	this.make_add_tag();
	this.make();
}

// render a new tag
TagList.prototype.add_tag = function(label, static, fieldname) {
	if(!label) return;
	if(in_list(this.tag_list, label)) return; // no double tags
	var tag = new SingleTag(this.body, label, this.dt, this.dn, fieldname, static, this);	
}

// add -tag area
TagList.prototype.make_add_tag = function() {
	var me = this;
	this.add_tag_span = $a(this.add_tag_area, 'span', '', {color:'#888', textDecoration:'underline', cursor:'pointer',marginLeft:'4px',fontSize:'11px'});
	this.add_tag_span.innerHTML = 'Add tag';
	this.add_tag_span.onclick = function() { me.new_tag(); }
}

// new tag dialog
TagList.prototype.make_tag_dialog = function() {
	var me = this;
	var d = new Dialog(400,200,'New Tag');
	d.make_body([['HTML','Tag'],['Button','Save']])
	
	// tag input
	this.make_tag_input(d);
	
	// make a color picker
	d.color_picker = this.make_color_picker(d.widgets['Tag']);

	// save
	d.widgets['Save'].onclick = function() { me.save_tag(d) };
	return d;
}

// input with autosuggest
TagList.prototype.make_tag_input = function(d) {
	d.tag_input = make_field({fieldtype:'Link', label:'New Tag', options:'Tag', no_buttons:1}, '', 
		d.widgets['Tag'], this, 0, 1);		
	d.tag_input.not_in_form = 1;
	d.tag_input.refresh();
	$y(d.tag_input.txt, {width:'80%'});
}

// check if tag text is okay
TagList.prototype.is_text_okay = function(val) {
	if(!val) {
		msgprint("Please type something");
		return;
	}
	if(validate_spl_chars(val)) {
		msgprint("Special charaters, commas etc not allowed in tags");
		return;
	}
	return 1
}

// add to local
TagList.prototype.add_to_locals = function(tag) {
	if(locals[this.dt] && locals[this.dt][this.dn]) {
		var doc = locals[this.dt][this.dn];
	
		if(!doc._user_tags) {
			doc._user_tags = ''
		}
		var tl = doc._user_tags.split(',')
		tl.push(tag)
		doc._user_tags = tl.join(',');
	}
}

// remove from local
TagList.prototype.remove_from_locals = function(tag) {
	if(locals[this.dt] && locals[this.dt][this.dn]) {
		var doc = locals[this.dt][this.dn];
	
		var tl = doc._user_tags.split(',');
		var new_tl = [];
		for(var i=0; i<tl.length; i++) {
			if(tl[i]!=tag) new_tl.push(tl[i]);
		}
		doc._user_tags = new_tl.join(',');
	}
}

// save the tag
TagList.prototype.save_tag = function(d) {
	var val = strip(d.tag_input.txt.value);
	var me = this;

	if(!this.is_text_okay(val)) return;
	
	var callback = function(r,rt) {
		var d = _tags.dialog;
		// update tag color
		if(d.color_picker.picked) {
			_tags.color_map[r.message] = d.color_picker.picked.color_name;
			me.refresh_tags();
			d.color_picker.picked.unpick()
		}
		
		// hide the dialog
		d.tag_input.txt.value= '';
		d.hide();
		
		// add in locals
		me.add_to_locals(val)

		if(!r.message) return;
		me.add_tag(r.message, 0, '_user_tags');
		
	}
	var t = d.color_picker.picked ? d.color_picker.picked.color_name : '';
	$c('webnotes.widgets.menus.add_tag',{'dt': me.dt, 'dn': me.dn, 'tag':val, 'color':t}, callback);
}

// create a new tag
TagList.prototype.new_tag = function() {
	var me = this;
	
	if(!_tags.dialog) {
		_tags.dialog = this.make_tag_dialog();
	}
	_tags.dialog.show();
}

// refresh tags
TagList.prototype.refresh_tags = function() {
	for(var i=0; i<_tags.all_tags.length; i++) {
		_tags.all_tags[i].refresh_color();
	}
}




//
// Color Picker
//
TagList.prototype.make_color_picker = function(parent) {
	var n_cols = _tags.color_list.length;
	var div = $a(parent, 'div', '', {margin:'8px 0px'});

	div.tab = make_table(div, 2, n_cols, (26*n_cols) + 'px', [], {textAlign:'center'});
	div.pickers = [];
	for(var i=0; i<n_cols; i++) {
		var wrapper = $a($td(div.tab, 0, i), 'div', '', {margin:'5px', border:'3px solid #FFF'})
		var p = $a(wrapper, 'div', '', {backgroundColor: _tags.colors[_tags.color_list[i]],height:'16px', width:'16px', border:'1px solid #000', cursor:'pointer'});
		p.wrapper = wrapper;
		p.pick = function() {
			$y(this.wrapper, {border:'3px solid #000'});
			if(this.picker.picked) this.picker.picked.unpick();
			this.picker.picked = this;
		}
		p.unpick = function() {
			$y(this.wrapper, {border:'3px solid #FFF'});
		}
		p.onclick = function() {
			this.pick();
		}
		p.picker = div;
		div.pickers.push(p);
		p.color_name = _tags.color_list[i];
	}
	
	return div;
}






//
// SingleTag
//
function SingleTag(parent, label, dt, dn, fieldname, static, taglist) {
	this.dt = dt; 
	this.dn = dn; 
	this.label = label;
	this.taglist = taglist;
	this.fieldname = fieldname;	
	this.static = static;
	
	if(this.taglist && !in_list(this.taglist.tag_list, label))
		this.taglist.tag_list.push(label);
	
	this.make_body(parent);
}

// make body
SingleTag.prototype.make_body = function(parent) {
	var me = this;
	// tag area
	this.body = $a(parent,'span','',{padding:'2px 4px', backgroundColor: this.get_color(), 
		color:'#FFF', marginRight:'4px', fontSize:'11px', cursor:'pointer'});
	$br(this.body,'3px');
	
	// hover
	$(this.body).hover(function() { $op(this,60); } ,function() { $op(this,100); });

	// label
	this.make_label();
	
	// remove btn
	if(!this.static) this.make_remove_btn();
	
	// add to all tags
	_tags.all_tags.push(this);
}

// color
SingleTag.prototype.get_color = function() {
	if(this.label=='Submitted') return '#459';
	else if(this.label=='Draft') return '#4A5';
	else return (_tags.color_map[this.label] ? _tags.color_map[this.label] : _tags.colors['Default'])
}

// refresh color from _tags.color_map
SingleTag.prototype.refresh_color = function() {
	$y(this.body, {backgroundColor: this.get_color()});
}

// remove btn
SingleTag.prototype.make_remove_btn = function() {
	var me = this;
	var span = $a(this.body,'span');
	span.innerHTML += ' |';
	
	var span = $a(this.body,'span');
	span.innerHTML = ' x'
	span.onclick = function() { me.remove(me); }
}

// label
SingleTag.prototype.make_label = function() {
	var me = this;
	this.label_span = $a(this.body,'span', '', null, this.label);
	this.label_span.onclick = function() { if(me.taglist && me.taglist.onclick) me.taglist.onclick(me); }
}

// remove
SingleTag.prototype.remove_tag_body = function() {
	// clear tag
	$dh(this.body);

	// remove from tag_list
	var nl=[]; 
	for(var i in this.tag_list) 
		if(this.tag_list[i]!=this.label) 
			nl.push(this.tag_list[i]);
	if(this.taglist)
		this.taglist.tag_list = nl;
}

// remove
SingleTag.prototype.remove = function() {
	var me = this;
	var callback = function(r,rt) {
		me.remove_tag_body()
		me.taglist.remove_from_locals(me.label);
	}
	$c('webnotes.widgets.menus.remove_tag', {'dt':me.dt, 'dn':me.dn, 'tag':me.label}, callback)
	$bg(me.body,'#DDD');
}
