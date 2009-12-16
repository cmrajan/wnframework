// Local DB 
//-----------

var locals = {};
var fields = {}; // fields[doctype][fieldname]
var fields_list = {}; // fields_list[doctype]
var LocalDB={};

LocalDB.getchildren = function(child_dt, parent, parentfield, parenttype) { 
	var l = []; 
	for(var key in locals[child_dt]) {
		var d = locals[child_dt][key];
		if((d.parent == parent)&&(d.parentfield == parentfield)) {
			if(parenttype) {
				if(d.parenttype==parenttype)l.push(d);
			} else { // ignore for now
				l.push(d);
			}
		}
	} 
	l.sort(function(a,b){return (cint(a.idx)-cint(b.idx))}); return l; 
}

// Add Doc

LocalDB.add=function(dt, dn) {
	if(!locals[dt]) locals[dt] = {}; if(locals[dt][dn]) delete locals[dt][dn];
	locals[dt][dn] = {'name':dn, 'doctype':dt, 'docstatus':0};
	return locals[dt][dn];
}

// Delete Doc

LocalDB.delete_doc=function(dt, dn) {
	var doc = get_local(dt, dn);

	for(var ndt in locals) { // all doctypes
		if(locals[ndt]) {
			for(var ndn in locals[ndt]) {
				var doc = locals[ndt][ndn];
				if(doc && doc.parenttype==dt && (doc.parent==dn||doc.__oldparent==dn)) {
					locals[ndt][ndn];
				}
			}
		}
	}
	delete locals[dt][dn];
}

function get_local(dt, dn) { return locals[dt] ? locals[dt][dn] : null; }

// Sync Records from Server

LocalDB.sync = function(list) {
	if(list._kl)list = expand_doclist(list);
	for(var i=0;i<list.length;i++) {
		var d = list[i];
		if(!d.name) // get name (local if required)
			d.name = LocalDB.get_localname(d.doctype);

		LocalDB.add(d.doctype, d.name);
		locals[d.doctype][d.name] = d;

		// cleanup for a second-loading
		if(d.doctype=='DocType') {
			fields_list[d.name] = [];
		} else if(d.doctype=='DocField') { // field dictionary / list 
			if(!fields_list[d.parent])fields_list[d.parent] = [];
			fields_list[d.parent][fields_list[d.parent].length] = d;

			if(d.fieldname) {
				if(!fields[d.parent])fields[d.parent] = {};	
				fields[d.parent][d.fieldname] = d;
			} else if(d.label) {
				if(!fields[d.parent])fields[d.parent] = {};	
				fields[d.parent][d.label] = d;
			}
		} else if(d.doctype=='Event') {
			if((!d.localname) && calendar && (!calendar.has_event[d.name]))
				calendar.set_event(d);
		}
		if(d.localname)
			notify_rename_observers(d.doctype, d.localname, d.name);
	}
}

// Get Local Name
local_name_idx = {};
LocalDB.get_localname=function(doctype) {
	if(!local_name_idx[doctype]) local_name_idx[doctype] = 1;
	var n = 'Unsaved '+ doctype + '-' + local_name_idx[doctype];
	local_name_idx[doctype]++;
	return n;
}

// Create Local Doc
LocalDB.create= function(doctype, n) {
	if(!n) n = LocalDB.get_localname(doctype);
	var doc = LocalDB.add(doctype, n)
	doc.__islocal=1; doc.owner = user;	
	set_default_values(doc);
	return n;
}

LocalDB.get_default_value = function(fn, ft, df) {
	if(df=='_Login' || df=='__user')
		return user;
	else if(df=='_Full Name')
		return user_fullname;
	else if(ft=='Date'&& (df=='Today' || df=='__today')) {
		return get_today(); }
	else if(df)
		return df;
	else if(user_defaults[fn])
		return user_defaults[fn][0];
	else if(sys_defaults[fn])
		return sys_defaults[fn];
}

LocalDB.add_child = function(doc, childtype, parentfield) {
	// create row doc
	var n = LocalDB.create(childtype);
	var d = locals[childtype][n];
	d.parent = doc.name;
	d.parentfield = parentfield;
	d.parenttype = doc.doctype;
	return d;
}

LocalDB.no_copy_list = ['amended_from','amendment_date','cancel_reason'];
LocalDB.copy=function(dt, dn, from_amend) {
	var newdoc = LocalDB.create(dt);
	for(var key in locals[dt][dn]) {
		if(key!=='name' && key.substr(0,2)!='__') { // dont copy name and blank fields
			locals[dt][newdoc][key] = locals[dt][dn][key];
		}
		//if(user_defaults[key]) {
		//	locals[dt][newdoc][key] = user_defaults[key][0];
		//}
		var df = get_field(dt, key);
		if(df && ((!from_amend && cint(df.no_copy)==1) || in_list(LocalDB.no_copy_list, df.fieldname))) { // blank out 'No Copy'
			locals[dt][newdoc][key]='';
		}
	}
	return locals[dt][newdoc];
}

// Renaming notification list
// --------------------------

var rename_observers = [];
function notify_rename_observers(dt, old_name, new_name) {
	// delete from local
	try {
		var old = locals[doc.doctype][doc.localname]; 
		old.parent = null; old.__deleted = 1;
	} catch(e) {
		alert("[rename_from_local] No Document for: "+ doc.localname);
	}

	// everyone who observers			
	for(var i=0; i<rename_observers.length;i++) {
		rename_observers.length.rename_notify(dt, old_name, new_name);
	}	
}

// Meta Data
//----------

var Meta={};
var local_dt = {};

// Make Unique Copy of DocType for each record for client scripting
Meta.make_local_dt = function(dt, dn) {
	var dl = make_doclist('DocType', dt);
	if(!local_dt[dt]) 	  local_dt[dt]={};
	if(!local_dt[dt][dn]) local_dt[dt][dn]={};
	for(var i=0;i<dl.length;i++) {
		var d = dl[i];
		if(d.doctype=='DocField') {
			var key = d.fieldname ? d.fieldname : d.label; 
			local_dt[dt][dn][key] = copy_dict(d);
		}
	}
}

Meta.get_field=function(dt, fn, dn) { 
	if(dn && local_dt[dt]&&local_dt[dt][dn]){
		return local_dt[dt][dn][fn];
	} else {
		if(fields[dt]) var d = fields[dt][fn];
		if(d) return d;
	}
	return {};
}
Meta.set_field_property=function(fn, key, val, doc) {
	if(!doc && (cur_frm.doc))doc = cur_frm.doc;
	try{
		local_dt[doc.doctype][doc.name][fn][key] = val;
		refresh_field(fn);
	} catch(e) {
		alert("Client Script Error: Unknown values for " + doc.name + ',' + fn +'.'+ key +'='+ val);
	}
}

var getchildren = LocalDB.getchildren;
var get_field = Meta.get_field;
var createLocal = LocalDB.create;