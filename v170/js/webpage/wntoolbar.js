// requires
// menu.js
// search.js
// datatype.js
// dom.js

function WNToolbar(parent) {
	var me = this;
	
	this.setup = function() {
		this.wrapper = $a(parent, 'div', '', {borderBottom: '1px solid #CCC', paddingLeft: '32px', background:'url("images/logos/wnf24.gif") center left no-repeat', backgroundColor:'#EEE'});
		this.body_tab = make_table(this.wrapper, 1, 3, '100%', ['30%','45%','25%'],{padding:'2px'});
		
		// model tab
		$y($td(this.body_tab, 0, 1),{paddingTop:'3px', paddingBottom:'0px'});
		this.model_tab = make_table($td(this.body_tab,0,1), 1, 4, null, ['140px','140px','140px','80px'], {padding:'2px'});
		
		this.menu = new MenuToolbar($td(this.body_tab,0,0));
		this.setup_home();
		this.setup_recent();
		this.setup_options();
		this.setup_help();

		this.setup_new();
		this.setup_report_builder();

		this.setup_logout();
		this.setup_search();
	}
	
	// Options
	// ----------------------------------------------------------------------------------------
	this.setup_options = function() {
		var tm = this.menu.add_top_menu('Options', function() { });
		
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
			var mi = this.menu.add_item('Options',d[1], fn);
			mi.dt = d[0]; mi.dn = d[5]?d[5]:d[1];
		}
	}
	
	// Home
	// ----------------------------------------------------------------------------------------

	this.setup_home = function() {
		this.menu.add_top_menu('Home', function() { loadpage(home_page); } );
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
			var it = me.rdocs.items[dt+'-'+dn];
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
				var dt = t[0]; var dn = t[1];
				this.rdocs.add(dt, dn, 0);
			}
		}

		this.rename_notify = function(dt, old, name) {
			me.rdocs.remove(dt, old);
			me.rdocs.add(dt, name, 1);
		}
		rename_observers.push(this);
	}
	
	// Tools
	// ----------------------------------------------------------------------------------------
	this.setup_help = function() {
		me.menu.add_top_menu('Tools', function() {  } );
		this.menu.add_item('Tools','Error Console', function() { err_console.show(); });
		this.menu.add_item('Tools','Start / Finish Testing Mode', function() { enter_testing(); });
		if(has_common(user_roles,['Administrator','System Manager'])) {
			this.menu.add_item('Tools','Download Backup', function() { start_testing(); });
			this.menu.add_item('Tools','Reset Testing', function() { download_backup(); });			
		}
		this.menu.add_item('Tools','About <b>Web Notes</b>', function() { show_about(); });
	}	

	// New
	// ----------------------------------------------------------------------------------------
	this.setup_new = function() {	
		this.new_sel = new SelectWidget($td(this.model_tab, 0, 0), profile.can_create);
		this.new_sel.inp.value='Create New...';
		this.new_sel.inp.onchange = function() { new_doc(me.new_sel.inp.value); this.value = 'Create New...'; }
	}
	
	// Report Builder
	// ----------------------------------------------------------------------------------------
	this.setup_report_builder = function() {
		this.rb_sel = new SelectWidget($td(this.model_tab, 0, 1), profile.can_get_report);
		this.rb_sel.inp.value = 'Report Builder...';
		this.rb_sel.inp.onchange = function() { loadreport(me.rb_sel.inp.value); this.value = 'Report Builder...'; }
	}

	// Setup Search
	// ----------------------------------------------------------------------------------------

	this.setup_search = function() {

		this.search_sel = new SelectWidget($td(this.model_tab, 0, 2), []);
		this.search_sel.inp.value = 'Search...';
		$y($td(this.model_tab, 0, 3),{paddingTop:'0px'});
		this.search_btn = $a($td(this.model_tab, 0, 3), 'button'); this.search_btn.innerHTML = 'Search';
		
		function open_quick_search() {
			if(me.search_sel.inp.value)
				selector.set_search(me.search_sel.inp.value);
			me.search_sel.disabled = 1;
			selector.show();
		}

		me.search_sel.set_options(profile.can_read);
		me.search_sel.inp.onchange = function() { open_quick_search(); this.value = 'Search...'; }
		
		this.search_btn.onclick = function() { open_quick_search(); }	
		makeselector();
	}
	
	// Setup User / Logout area
	// ----------------------------------------------------------------------------------------

	this.setup_logout = function() {
		var w = $a($td(this.body_tab, 0, 2),'div','',{paddingTop:'2px', paddingLeft:'16px', textAlign:'right'});
		var t = make_table(w, 1, 3, null, [null, null, null], {padding: '2px 6px', borderLeft:'1px solid #CCC', fontSize: '13px'});
		$y($td(t,0,0),{border:'0px'});
		$td(t,0,0).innerHTML = user_fullname;
		$td(t,0,1).innerHTML = '<span class="link_type" onclick="loaddoc(\'Profile\', user);">Profile</span>';
		$td(t,0,2).innerHTML = '<span class="link_type" onclick="logout()">Logout</span>';
	}


	this.setup();
}