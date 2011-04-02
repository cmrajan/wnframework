wn.widgets.form.sidebar = { Sidebar: function(form) {
	var me = this;
	this.form = form;
	this.opts = {
		sections: [
			{
				title: 'Actions',
				items: [
					{
						type: 'link',
						label: 'New',
						icon: 'ic-doc_new',
						display: function() { 
							return in_list(profile.can_create, form.doctype) 
						},
						onclick: function() { new_doc(me.form.doctype) }
					},

					{
						type: 'link',
						label: 'Refresh',
						icon: 'ic-playback_reload',
						onclick: function() { me.form.reload_doc() }
					},

					{
						type: 'link',
						label: 'Print',
						display: function() { return !me.form.doc.__islocal },
						icon: 'ic-print',
						onclick: function() { me.form.print_doc() }
					},

					{
						type: 'link',
						label: 'Email',
						display: function() { return !me.form.doc.__islocal },
						icon: 'ic-mail',
						onclick: function() { me.form.email_doc() }
					},

					{
						type: 'link',
						label: 'Copy',
						display: function() { 
							return in_list(profile.can_create, me.form.doctype) && !me.form.meta.allow_copy 
						},
						icon: 'ic-clipboard_copy',
						onclick: function() { me.form.copy_doc() }
					},
					
					{
						type: 'link',
						label: 'Trash',
						display: function() { 
							return me.form.meta.allow_trash && cint(me.form.doc.docstatus) != 2 
							&& (!me.form.doc.__islocal) && me.form.perm[0][CANCEL] 
						},
						icon: 'ic-trash',
						onclick: function() { me.form.savetrash() }
					}
				]
			},

			{
				title: 'Follow this ' + get_doctype_label(me.form.doctype),
				render: function(wrapper) {
					new wn.widgets.follow.Follow(wrapper, me.form.doctype, me.form.docname);
				},
				display: function() { return !me.form.doc.__islocal }
			},
						
			{
				title: 'Tags',
				render: function(wrapper) {
					me.form.taglist = new TagList(wrapper, 
						me.form.doc._user_tags ? me.form.doc._user_tags.split(',') : [], 
						me.form.doctype, me.form.docname, 0, 
						function() {	});
				},
				display: function() { return !me.form.doc.__islocal }
			},

			{
				title: 'Comments',
				render: function(wrapper) {
					new wn.widgets.form.sidebar.SidebarComment(wrapper, me, me.form.doctype, me.form.docname);
				},
				display: function() { return !me.form.doc.__islocal }
			}
		]
	}
	
	this.refresh = function() {
		if(!this.sidebar) {
			$y($td(this.form.wtab, 0, 1), {paddingTop:'8px'})
			this.sidebar = new wn.widgets.PageSidebar($td(this.form.wtab, 0, 1), this.opts);
		}
		this.sidebar.refresh();
	}
	

}, 

SidebarComment: function(parent, sidebar, doctype, docname) {
	var me = this;
	this.sidebar = sidebar;
	this.doctype = doctype; this.docname = docname;
	
	this.refresh = function() {
		$c('webnotes.widgets.form.get_comments', {dt: me.doctype, dn: me.docname, limit: 5}, function(r, rt) {
			wn.widgets.form.comments.sync(me.doctype, me.docname, r);
			me.make_body();
		});
	}
	
	this.make_body = function() {
		if(this.wrapper) this.wrapper.innerHTML = '';
		else this.wrapper = $a(parent, 'div', 'sidebar-comment-wrapper');

		this.input = $a_input(this.wrapper, 'text');
		this.btn = $btn(this.wrapper, 'Post', function() { me.add_comment() }, {marginLeft:'8px'});

		this.render_comments()

	}
	this.render_comments = function() {
		var f = wn.widgets.form.comments;
		var cl = f.comment_list[me.docname]
		this.msg = $a(this.wrapper, 'div', 'sidebar-comment-message');

		if(cl) {
			this.msg.innerHTML = cl.length + ' out of ' + f.n_comments[me.docname] + ' comments';
			if(f.n_comments[me.docname] > cl.length) {
				this.msg.innerHTML += ' <span class="link_type" onclick="cur_frm.show_comments()">Show all</span>'
			}
			for(var i=0; i< cl.length; i++) {
				this.render_one_comment(cl[i]);
			}
		} else {
			this.msg.innerHTML = 'Be the first one to comment.'
		}
	}

	//
	this.render_one_comment = function(det) {
		// comment
		$a(this.wrapper, 'div', 'sidebar-comment-text', '', det.comment);
		// by etc
		$a(this.wrapper, 'div', 'sidebar-comment-info', '', comment_when(det.creation) + ' by ' + det.comment_by_fullname);
	}
	
	this.add_comment = function() {
		if(!this.input.value) return;
		this.btn.set_working();
		wn.widgets.form.comments.add(this.input, me.doctype, me.docname, function() {
			me.btn.done_working();
			me.make_body();
		});
	}
	
	this.refresh();
}}
