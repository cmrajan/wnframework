// App.js

var profile;
var page_body;
var session = {};
var is_testing = false;
var user;
var user_defaults;
var user_roles;
var user_fullname;
var user_email;
var user_img = {};
var pscript = {};
var select_register = [];
var selector; 

function startup() {
	
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

		sys_defaults = r.sysdefaults;		
	}
	
	var setup_history = function(r) {
		rename_observers.push(nav_obj);
	}
	
	var callback = function(r,rt) {
		if(r.exc) msgprint(r.ext);
		
		setup_globals(r);
		setup_history(r);

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
