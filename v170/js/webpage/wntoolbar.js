// requires
// menu.js
// search.js
// datatype.js
// dom.js

function WNToolbar(parent) {
	var me = this;
	
	this.setup = function() {
		this.wrapper = $a(parent, 'div', '', {borderBottom: '1px solid #CCC'});
		this.body_tab = make_table(this.wrapper, 1, 4, '100%', ['5%','45%','25%','25%'],{padding:'2px'});
		
		// webnotes logo
		this.webnotes = $a($td(this.body_tab,0,0), 'img', '', {marginTop:'0px', cursor:'pointer'})
		this.webnotes.src = 'images/ui/webnotes20x80-1.gif';
		this.webnotes.onclick = function() { show_about(); }
		
		this.menu = new MenuToolbar($td(this.body_tab,0,1));
		this.setup_start();
		this.setup_home();
		this.setup_new();
		this.setup_recent();
		this.setup_report_builder();

		this.setup_logout();
		this.setup_search();
	}
	
	// Toolbar
	// ======================
	
	// Start
	// ----------------------------------------------------------------------------------------
	this.setup_start = function() {
		var tm = this.menu.add_top_menu('Start', function() { });
		
		var fn = function() {
			if(this.dt=='Page')
				loadpage(this.dn);
			else
				loaddoc(this.dt, this.dn);
			mclose();
		}
	
		// add start items
		profile.start_items.sort(function(a,b){return (a[4]-b[4])});
		for(var i=0;i< profile.start_items.length;i++) {
			var d = profile.start_items[i];
			var mi = this.menu.add_item('Start',d[1], fn);
			mi.dt = d[0]; mi.dn = d[5]?d[5]:d[1];
		}
	}
	
	// Home
	// ----------------------------------------------------------------------------------------

	this.setup_home = function() {
		this.menu.add_top_menu('Home', function() { loadpage(home_page); } );
	}
	
	// New
	// ----------------------------------------------------------------------------------------

	this.setup_new = function() {
		this.menu.add_top_menu('New', function() {  } );
	
		var fn = function() {
			new_doc(this.dt);
			mclose();
		}
		
		// add menu items
		for (var i=0;i<profile.can_create.length;i++) {
			var mi = this.menu.add_item('New',profile.can_create[i], fn);
			mi.dt = profile.can_create[i];
		}
	}

	// Recent
	// ----------------------------------------------------------------------------------------
	this.setup_recent = function() {
	
		this.rdocs = me.menu.add_top_menu('Recent', function() {  } );
		this.rdocs.items = {};
	
		var fn = function() { // recent is only for forms
			loaddoc(this.dt, this.dn);
			mclose();
		}
		
		// add to recent
		this.rdocs.add = function(dt, dn, on_top) {
			if(!in_list(['Start Page','ToDo Item','Event','Search Criteria'], dt)) {
	
				// if there in list, only bring it to top
				if(this.items[dt+'-'+dn]) {
					var mi = this.items[dt+'-'+dn];
					mi.bring_to_top();
					return;
				}
	
				var tdn = dn;
				var rec_label = '<table style="width: 100%" cellspacing=0><tr>'
					+'<td style="width: 10%; vertical-align: middle;"><div class="status_flag" id="rec_'+dt+'-'+dn+'"></div></td>'
					+'<td style="width: 50%; text-decoration: underline; color: #22B; padding: 2px;">'+tdn+'</td>'
					+'<td style="font-size: 11px;">'+dt+'</td></tr></table>';
			
				var mi = me.menu.add_item('Recent',rec_label,fn, on_top);
				mi.dt = dt; mi.dn = dn;	
				this.items[dt+'-'+dn] = mi;
				if(pscript.on_recent_update)pscript.on_recent_update();
			}
		}
		
		// remove from recent
		this.rdocs.remove = function(dt, dn) {
			var it = this.rdocs.items[dt+'-'+dn];
			if(it)$dh(it);
			if(pscript.on_recent_update)pscript.on_recent_update();
		}
		// add menu items
		var rlist = profile.recent.split('\n');
		var m = rlist.length;
		if(m>15)m=15;
		for (var i=0;i<m;i++) {
			var t = rlist[i].split('~~~');
			if(t[1]) {
				var dn = t[0]; var dt = t[1];
				this.rdocs.add(dt, dn, 0);
			}
		}

		this.rename_notify = function(dt, old, name) {
			rdocs.remove(dt, old);
			rdocs.add(dt, name, 1);
		}
		rename_observers.push(this);
	}

	// Report Builder
	// ----------------------------------------------------------------------------------------
	this.setup_report_builder = function() {
		me.menu.add_top_menu('Report Builder', function() {  } );
	
		var fn = function() {
			loadreport(this.dt);
			mclose();
		}
		
		// add menu items
		for (var i=0;i<profile.can_get_report.length;i++) {
			var mi = me.menu.add_item('Report Builder',profile.can_get_report[i], fn);
			mi.dt = profile.can_get_report[i];
		}
	}
	
	// Setup User / Logout area
	// ----------------------------------------------------------------------------------------

	this.setup_logout = function() {
		var w = $a($td(this.body_tab, 0, 2),'div','',{paddingTop:'2px'});
		var t = make_table(w, 1, 3, null, [null, null, null], {padding: '2px 6px', borderLeft:'1px solid #CCC', fontSize: '13px'});
		$y($td(t,0,0),{border:'0px'});
		$td(t,0,0).innerHTML = user_fullname;
		$td(t,0,1).innerHTML = '<span class="link_type" onclick="loaddoc(\'Profile\', user);">Profile</span>';
		$td(t,0,2).innerHTML = '<span class="link_type" onclick="logout()">Logout</span>';
	}

	// Setup Search
	// ----------------------------------------------------------------------------------------

	this.setup_search = function() {
		var w = $a($td(this.body_tab, 0, 3),'div');

		this.search_sel = $a(w,'select','',{width:'100px', margin:'0px', marginRight:'8px'});
		this.search_btn = $a(w,'button'); this.search_btn.innerHTML = 'Search';
		
		function open_quick_search() {
			selector.set_search(sel_val(me.search_sel));
			me.search_sel.disabled = 1;
			selector.show();
		}

		add_sel_options(me.search_sel, profile.can_read);
		me.search_sel.selectedIndex = 0;
		me.search_sel.onchange = function() { open_quick_search(); }
		select_register.push(me.search_sel);
		
		this.search_btn.onclick = function() { open_quick_search(); }	
		makeselector();
	}

	this.setup();
}