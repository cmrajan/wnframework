wn.widgets.form.sidebar = { Sidebar: function(form) {
	var me = this;
	this.form = form;
	this.opts = {
		sections: [
			{
				'title': 'Actions',
				'items': [
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
						icon: 'ic-print',
						onclick: function() { me.form.print_doc() }
					},

					{
						type: 'link',
						label: 'Email',
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
				title: 'Tags',
				render: function(wrapper) {
					me.form.taglist = new TagList(wrapper, 
						me.form.doc._user_tags ? me.form.doc._user_tags.split(',') : [], 
						me.form.doctype, me.form.docname, 0, 
						function() {  });
				}
			}
		]
	}
	
	this.refresh = function() {
		if(!this.sidebar) {
			this.sidebar = new wn.widgets.PageSidebar($td(this.form.wtab, 0, 1), this.opts);
		}
		this.sidebar.refresh();
	}
}}
