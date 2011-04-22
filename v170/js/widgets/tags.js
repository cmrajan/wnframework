// =================================================
//
// Tag Globals
//
_tags = {
	dialog: null,
	color_map: {},
	all_tags: [],
	colors: {'Default':'#add8e6'}
	//color_list: ['Default'] // for sequence
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
			new SingleTag({
				parent: this.body,
				label: this.start_list[i],
				dt: this.dt,
				dn: this.dn,
				fieldname: '_user_tags',
				static: this.static,
				taglist: this,
				onclick: this.onclick
			});
	}
}

TagList.prototype.make_body = function() {
	var div = $a(this.parent, 'span', '', {margin:'3px 0px', padding:'3px 0px'});
	this.body = $a(div, 'span', '', {marginRight:'4px'});
	this.add_tag_area = $a(div, 'span');
	this.make_add_tag();
	this.make();
}

// render a new tag
TagList.prototype.add_tag = function(label, static, fieldname, color) {
	if(!label) return;
	if(in_list(this.tag_list, label)) return; // no double tags
	var tag = new SingleTag({
		parent: this.body,
		label: label,
		dt: this.dt,
		dn: this.dn,
		fieldname: fieldname,
		static: static,
		taglist: this,
		color: color,
		onclick: this.onclick
	});
}

// add -tag area
TagList.prototype.make_add_tag = function() {
	var me = this;
	this.add_tag_span = $a(this.add_tag_area, 'span', '', 
		{color:'#888', textDecoration:'underline', cursor:'pointer',marginLeft:'4px',fontSize:'11px'});
	this.add_tag_span.innerHTML = 'Add tag';
	this.add_tag_span.onclick = function() { me.new_tag(); }
}

// new tag dialog
TagList.prototype.make_tag_dialog = function() {
	var me = this;
	
	var d = new wn.widgets.Dialog({
		title: 'Add a tag',
		width: 400,
		fields: [
			{fieldtype:'Link', fieldname:'tag', label:'Tag', options:'Tag', 
				reqd:1, description:'Max chars (20)', no_buttons:1},
			{fieldtype:'Button', fieldname: 'add', label:'Add'}
		]
	})
	
	$(d.fields_dict.tag.input).attr('maxlength', 20);
	d.fields_dict.add.input.onclick = function() { me.save_tag(d); }

	return d;
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
	var val = d.get_values();
	if(val) val = val.tag;

	var me = this;

	if(!this.is_text_okay(val)) return;
	
	var callback = function(r,rt) {
		var d = me.dialog;
		// hide the dialog
		d.fields_dict.add.input.done_working();
		d.fields_dict.tag.input.set_input('');
		d.hide();
		
		// add in locals
		me.add_to_locals(val)

		if(!r.message) return;
		me.add_tag(r.message, 0, '_user_tags');
		
	}
	me.dialog.fields_dict.add.input.set_working();
	$c('webnotes.widgets.tags.add_tag',{'dt': me.dt, 'dn': me.dn, 'tag':val, 'color':'na'}, callback);
}

// create a new tag
TagList.prototype.new_tag = function() {
	var me = this;
	
	if(!this.dialog) {
		this.dialog = this.make_tag_dialog();
	}
	this.dialog.show();
}

// refresh tags
TagList.prototype.refresh_tags = function() {
}

//
// SingleTag
// parameters {parent, label, dt, dn, fieldname, static, taglist, color}
//
function SingleTag(opts) {
	$.extend(this, opts);

	if(!this.color) this.color = '#add8e6';
	
	if(this.taglist && !in_list(this.taglist.tag_list, this.label))
		this.taglist.tag_list.push(this.label);
	
	this.make_body(this.parent);
}

// make body
SingleTag.prototype.make_body = function(parent) {
	var me = this;
	// tag area
	this.body = $a(parent,'span','',{padding:'2px 4px', backgroundColor: this.color, 
		color:'#226', marginRight:'4px'});
	$br(this.body,'3px');
	
	if(this.onclick) $y(this.body, {cursor:'pointer'});
	
	// hover
	$(this.body).hover(function() { $op(this,60); } ,function() { $op(this,100); });

	// label
	this.make_label();
	
	// remove btn
	if(!this.static) this.make_remove_btn();
	
	// add to all tags
	_tags.all_tags.push(this);
}

// remove btn
SingleTag.prototype.make_remove_btn = function() {
	var me = this;
	var span = $a(this.body,'span');
	span.innerHTML += ' |';
	
	var span = $a(this.body,'span','',{cursor:'pointer'});
	span.innerHTML = ' x'
	span.onclick = function() { me.remove(me); }
}

// label
SingleTag.prototype.make_label = function() {
	var me = this;
	this.label_span = $a(this.body,'span', '', null, this.label);
	this.label_span.onclick = function() { if(me.onclick) me.onclick(me); }
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
	$c('webnotes.widgets.tags.remove_tag', {'dt':me.dt, 'dn':me.dn, 'tag':me.label}, callback)
	$bg(me.body,'#DDD');
}

// tag cloud
// render the tag cloud
// n1 x [tag1]
// n2 x [tag2]

wn.widgets.TagCloud = function(parent, doctype, onclick) {
	var me = this;
		
	this.make = function(r, rt) {
		if(r.message && r.message.length) {
			this.tab = make_table(parent, r.message.length, 2, '100%', ['30px', null], {padding:'5px 3px 5px 0px'})
			$y($td(this.tab, 0, 0), {textAlign:'right'});
			
			for(var i=0; i<r.message.length; i++) {
				new wn.widgets.TagCloud.Tag($td(this.tab, i, 0), $td(this.tab, i, 1), r.message[i], onclick) 
			}
		} else {
			me.set_no_tags();
		}
	}
	
	this.set_no_tags = function() {
		$a(parent, 'div', 'comment', '', 'No tags yet!, please start tagging')
	}
	$c('webnotes.widgets.tags.get_top_tags', {dt:doctype}, this.make);
}

// make a single row of a tag
wn.widgets.TagCloud.Tag = function(lh, rh, det, onclick) {
	// counter
	$(lh).css('text-align', 'right').html(det[1] + ' x');
	
	// tag
	this.tag = new SingleTag({
		parent: rh,
		label: det[0],
		static: 1,
		onclick: onclick
	})
}




