// constants
var NEWLINE = '\n';
var login_file = 'index.cgi';

// user
var profile;
var session = {};
var account_name;
var is_testing = false;
var user;
var user_defaults;
var user_roles;
var user_fullname;
var user_email;
var user_img = {};
var home_page;

var page_body;
var pscript = {};
var selector; 
var keypress_observers = [];
var click_observers = [];

var editAreaLoader;

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
var FILTER_SEP = '\1';

// calendar 
var _c = {};

var widget_files = {
	'ReportBuilder':'report_builder/report_builder.js'
	,'_f.FrmContainer':'form.compressed.js'
	,'_c.CalendarPopup':'widgets/form/date_picker.js'
	,'_r.ReportContainer':'report.compressed.js'
	,'_p.PrintQuery':'widgets/print_query.js'
}

// API globals
var frms={};
var cur_frm;
var pscript = {};
var validated = true;
var validation_message = '';

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