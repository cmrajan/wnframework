// requires
// menu.js
// search.js
// datatype.js
// dom.js

var about_dialog;

function WNToolbar(parent) {
	var me = this;
	
	this.setup = function() {
		this.wrapper = $a(parent, 'div', '', {borderBottom: '1px solid #CDF' /*, paddingLeft: '24px', background:'url("images/logos/wnf24.gif") left no-repeat', backgroundPosition: '4px 2px'*/});
		this.body_tab = make_table(this.wrapper, 1, 3, '100%', ['65%','10%','25%'],{padding:'2px'});
		
		// model tab
		$y($td(this.body_tab, 0, 1),{paddingTop:'3px', paddingBottom:'0px'});
		this.model_tab = make_table($td(this.body_tab,0,1), 1, 4, null, ['140px','140px','140px'], {padding:'2px'});
		
		this.menu = new MenuToolbar($td(this.body_tab,0,0));
		this.setup_home();
		this.setup_new();
		this.setup_recent();
		this.setup_options();
		this.setup_help();

		this.setup_report_builder();

		this.setup_logout();
		this.setup_search();
	}
	
	// Options
	// ----------------------------------------------------------------------------------------
	this.setup_options = function() {
		var tm = this.menu.add_top_menu('Options', function() { }, "images/ui/down-arrow1.gif");
		
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
		this.menu.add_top_menu('<b>Home</b>', function() { loadpage(home_page); });
	}

	// Recent
	// ----------------------------------------------------------------------------------------
	this.setup_recent = function() {
	
		this.rdocs = me.menu.add_top_menu('Recent', function() {  }, "images/ui/down-arrow1.gif");
		this.rdocs.items = {};
	
		var fn = function() { // recent is only for forms
			loaddoc(this.dt, this.dn);
			mclose();
		}
		
		// add to recent
		this.rdocs.add = function(dt, dn, on_top) {
			var has_parent = false;
			if(locals[dt] && locals[dt][dn] && locals[dt][dn].parent) has_parent = true;
			
			if(!in_list(['Start Page','ToDo Item','Event','Search Criteria'], dt) && !has_parent) {
	
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
		me.menu.add_top_menu('Tools', function() {  }, "images/ui/down-arrow1.gif");
		this.menu.add_item('Tools','Error Console', function() { err_console.show(); });
		this.menu.add_item('Tools','Start / Finish Testing Mode', function() { me.enter_testing(); });
		if(has_common(user_roles,['Administrator','System Manager'])) {
			this.menu.add_item('Tools','Download Backup', function() { me.start_testing(); });
			this.menu.add_item('Tools','Reset Testing', function() { me.download_backup(); });			
		}
		this.menu.add_item('Tools','About <b>Web Notes</b>', function() { show_about(); });
	}	

	// New
	// ----------------------------------------------------------------------------------------
	this.setup_new = function() {	
		me.menu.add_top_menu('Create New...', function() { me.show_new(); } );
		me.show_new = function() {
			if(!me.new_dialog) {
				var d = new Dialog(240, 140, "Create a new record");
				d.make_body(
					[['HTML','Select']
					,['Button','Go', function() { me.new_dialog.hide(); new_doc(me.new_sel.inp.value); }]]);
				me.new_dialog = d;			
				me.new_sel = new SelectWidget(d.widgets['Select'], profile.can_create.sort(), '200px');
			}
			me.new_dialog.show();
		}

		//this.new_sel.inp.onchange = function() { new_doc(me.new_sel.inp.value); this.value = 'Create New...'; }
	}
	
	// Report Builder
	// ----------------------------------------------------------------------------------------
	this.setup_report_builder = function() {
		me.menu.add_top_menu('Report Builder...', function() { me.show_rb(); } );
		me.show_rb = function() {
			if(!me.rb_dialog) {
				var d = new Dialog(240, 140, "Build a report for");
				d.make_body(
					[['HTML','Select']
					,['Button','Go', function() { me.rb_dialog.hide(); loadreport(me.rb_sel.inp.value, null, null, 1); }]]);
				me.rb_dialog = d;			
				me.rb_sel = new SelectWidget(d.widgets['Select'], profile.can_get_report.sort(), '200px');
			}
			me.rb_dialog.show();
		}		
	}

	// Setup Search
	// ----------------------------------------------------------------------------------------

	this.setup_search = function() {

		$y(page_body.search_area, {padding: '8px 0px'});
		
		// table
		var d = $a(page_body.search_area, 'div', '', {cssFloat:'right'});
		var t = make_table(d, 1, 3, null,['18px', '130px', '60px'], {padding: '2px', verticalAlign:'middle', textAlign:'right'});
		
		// icon
		var img = $a($td(t, 0, 0), 'img'); img.src='images/icons/magnifier.gif';

		// select
		this.search_sel = new SelectWidget($td(t, 0, 1), [], '120px');
		this.search_sel.inp.value = 'Select...';
		$y($td(this.model_tab, 0, 3),{paddingTop:'0px'});
		
		function open_quick_search() {
			if(me.search_sel.inp.value)
				selector.set_search(me.search_sel.inp.value);
			me.search_sel.disabled = 1;
			selector.show();
		}

		me.search_sel.set_options(profile.can_read.sort());
		me.search_sel.onchange = function() { open_quick_search(); }

		// button
		me.search_btn = $a($td(t, 0, 2), 'button')
		$(me.search_btn).html('Search');
		me.search_btn.onclick = function() { open_quick_search(); }
		
		startup_list.push(makeselector);
	}
	
	// Setup User / Logout area
	// ----------------------------------------------------------------------------------------

	this.setup_logout = function() {
		var w = $a($td(this.body_tab, 0, 2),'div','',{paddingTop:'2px'});
		var t = make_table(w, 1, 5, null, [], {padding: '2px 4px', borderLeft:'1px solid #CCC', fontSize:'13px'});
		$y(t,{cssFloat:'right'});
		$y($td(t,0,0),{border:'0px'});
		$td(t,0,0).innerHTML = user_fullname;
		$td(t,0,1).innerHTML = '<span class="link_type" style="font-weight: bold" onclick="get_help()">Help</span>';
		$td(t,0,2).innerHTML = '<span class="link_type" style="font-weight: bold" onclick="get_feedback()">Feedback</span>';
		$td(t,0,3).innerHTML = '<span class="link_type" onclick="loaddoc(\'Profile\', user);">Profile</span>';
		$td(t,0,4).innerHTML = '<span class="link_type" onclick="logout()">Logout</span>';
	}

	this.download_backup = function() {
	  window.location = outUrl + "?cmd=backupdb&read_only=1&__account="+account_id
	    + (__sid150 ? ("&sid150="+__sid150) : '')
		+ "&db_name="+account_id;
	}
	
	this.enter_testing = function() {
		about_dialog.hide();
		if(is_testing) {
			end_testing();
			return;
		}
		var a  = prompt('Type in the password', '');
		if(a=='start testing') {
			$c('start_test',args={}, function() {
					$ds('testing_div'); 
					is_testing = true;
					$i('testing_mode_link').innerHTML = 'End Testing';
				}
			);
		} else {
			msgprint('Sorry, only administrators are allowed use the testing mode.');	
		}
	}
	
	this.setup_testing = function() {
		about_dialog.hide();
		$c('setup_test',args={}, function() { } );
	}
	
	this.end_testing = function() {
		$c('end_test',args={}, function() {
				$dh('testing_div'); 
				is_testing = false;
				$i('testing_mode_link').innerHTML = 'Enter Testing Mode'; 
			} 
		);
	}
	this.setup();
}

var get_help = function() {
	msgprint('Help not implemented');
}

var get_feedback = function() {
	// dialog
	var d = new Dialog(640, 320, "Please give your feedback");
	d.make_body(
		[['Text','Feedback']
		,['Button','Send', function() { 
			$c_obj('Feedback Control', 'get_feedback', d.widgets['Feedback'].value, function(r,rt) { 
				d.hide(); if(r.message) msgprint(r.message); 
			})
		} ]]
	);
	d.show();
	
	// send to Feedback Control
}
