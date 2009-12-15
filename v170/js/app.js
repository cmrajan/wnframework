// App.js

function startup() {
	var setup_globals = function(r) {
		profile = r.profile
		user = r.profile.name;		
		user_fullname = profile.first_name + (r.profile.last_name ? (' ' + r.profile.last_name) : '');
		user_defaults = profile.defaults;
		user_roles = profile.roles;
		user_email = profile.email;

		sys_defaults = r.sysdefaults;		
	}
	
	var callback = function(r,rt) {
		if(r.exc) msgprint(r.ext);
		
		setup_globals(r);
		setup_ui(r);
		setup_widgets(r);
		setup_home_page(r);		
	}
	load_profile();
}