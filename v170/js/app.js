// App.js

var profile;
var page_body;
var session = {};
var account_name;
var is_testing = false;
var user;
var user_defaults;
var user_roles;
var user_fullname;
var user_email;
var user_img = {};
var pscript = {};
var selector; 
var keypress_observers = [];
var click_observers = [];

// ***** TEMP ********
var user_fmt = 'dd-MM-yyyy';

// ui
var top_index=91;

// Name Spaces
// ============

// form
var _f = {};

// print
var _p = {};

// email
var _e = {};

// report buidler
var _r = {};

// calendar 
var _c = {};

var widget_files = {
	'ReportBuilder':'report_builder/report_builder.js'
	,'_f.FrmContainer':'form.compressed.js'
	,'_c.CalendarPopup':'widgets/form/date_picker.js'
}

// API globals
var frms={};
var cur_frm;
var pscript = {};
var validated = true;
var validation_message = '';

// Global methods for API
var getchildren = LocalDB.getchildren;
var get_field = Meta.get_field;
var createLocal = LocalDB.create;

var $c_get_values;
var get_server_fields;
var set_multiple;
var set_field_tip;
var refresh_field;
var refresh_many;
var set_field_options;
var set_field_permlevel;
var hide_field;
var unhide_field;
var print_table;
var sendmail;

// icons
var exp_icon = "images/ui/right-arrow.gif"; 
var min_icon = "images/ui/down-arrow.gif";

function startup() {

	//initialize our DHTML history
	dhtmlHistory.initialize();

	//subscribe to DHTML history change events
	dhtmlHistory.addListener(historyChange);
			
	// Globals
	// ---------------------------------
	var setup_globals = function(r) {
		profile = r.profile;
		user = r.profile.name;		
		user_fullname = profile.first_name + (r.profile.last_name ? (' ' + r.profile.last_name) : '');
		user_defaults = profile.defaults;
		user_roles = profile.roles;
		user_email = profile.email;
		profile.start_items = r.start_items;
		account_name = r.account_name;

		sys_defaults = r.sysdefaults;		
	}
	
	var setup_history = function(r) {
		rename_observers.push(nav_obj);
	}
	
	var setup_events = function() {
		addEvent('keypress', function(ev, target) {
			for(var i in keypress_observers) {
				if(keypress_observers[i])
					keypress_observers[i].notify_keypress((ev.keyCode ? ev.keyCode : ev.charCode));
			} 
		});
		addEvent('click', function(ev, target) {
			for(var i=0; i<click_observers.length; i++) {
				if(click_observers[i])
					click_observers[i].notify_click(ev, target);
			}
		});

	}
	
	var callback = function(r,rt) {
		if(r.exc) msgprint(r.ext);
		
		setup_globals(r);
		setup_history(r);
		setup_events();

		page_body = new Body();
		
		for(var i=0; i<startup_list.length; i++) {
			startup_list[i]();
		}		
		
		$dh('startup_div');
		$ds('body_div');
	}
	$c('startup',{},callback,null,1);
	
}

window.onload = startup;
