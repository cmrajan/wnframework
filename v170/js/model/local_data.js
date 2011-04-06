// Local DB 
//-----------

var locals = {};
var fields = {}; // fields[doctype][fieldname]
var fields_list = {}; // fields_list[doctype]
var LocalDB={};
var READ = 0; var WRITE = 1; var CREATE = 2; var SUBMIT = 3; var CANCEL = 4; var AMEND = 5;

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
// ======================================================================================

LocalDB.add=function(dt, dn) {
	if(!locals[dt]) locals[dt] = {}; if(locals[dt][dn]) delete locals[dt][dn];
	locals[dt][dn] = {'name':dn, 'doctype':dt, 'docstatus':0};
	return locals[dt][dn];
}

// Delete Doc
// ======================================================================================

LocalDB.delete_doc=function(dt, dn) {
	var doc = get_local(dt, dn);

	for(var ndt in locals) { // all doctypes
		if(locals[ndt]) {
			for(var ndn in locals[ndt]) {
				var doc = locals[ndt][ndn];
				if(doc && doc.parenttype==dt && (doc.parent==dn||doc.__oldparent==dn)) {
					delete locals[ndt][ndn];
				}
			}
		}
	}
	delete locals[dt][dn];
}

function get_local(dt, dn) { return locals[dt] ? locals[dt][dn] : null; }

// Sync Records from Server
// ======================================================================================

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
			if(!d.parent) {
				alert('Error: No parent specified for field "' + d.label + '"');
			}
		
			if(!fields_list[d.parent])fields_list[d.parent] = [];
			fields_list[d.parent][fields_list[d.parent].length] = d;

			if(!fields[d.parent])
				fields[d.parent] = {};
			
			if(d.fieldname) {
				fields[d.parent][d.fieldname] = d;
			} else if(d.label) {
				fields[d.parent][d.label] = d;
			}
		} else if(d.doctype=='Event') {
			if((!d.localname) && _c.calendar && (!_c.calendar.has_event[d.name]))
				_c.calendar.set_event(d);
		}
		if(d.localname)
			notify_rename_observers(d.doctype, d.localname, d.name);
	}
}

// Get Local Name
// ======================================================================================

local_name_idx = {};
LocalDB.get_localname=function(doctype) {
	if(!local_name_idx[doctype]) local_name_idx[doctype] = 1;
	var n = 'New '+ get_doctype_label(doctype) + ' ' + local_name_idx[doctype];
	local_name_idx[doctype]++;
	return n;
}

// Create Local Doc
// ======================================================================================

LocalDB.set_default_values = function(doc) {
	var doctype = doc.doctype;
	var docfields = fields_list[doctype];
	if(!docfields) {
		return;
	}
	for(var fid=0;fid<docfields.length;fid++) {
		var f = docfields[fid];
		if(!in_list(no_value_fields, f.fieldtype) && doc[f.fieldname]==null) {
			var v = LocalDB.get_default_value(f.fieldname, f.fieldtype, f['default']);
			if(v) doc[f.fieldname] = v;
		}
	}
}
// ======================================================================================

LocalDB.is_doc_loaded = function(dt, dn) {
	var exists = false;
	if(locals[dt] && locals[dt][dn]) exists = true;
	if(exists && dt=='DocType' // if it is a doctype
		&& !locals[dt][dn].__islocal // and not copied
			&& !frms[dt]) // and not loaded
				 exists = false; // reload
	return exists;
}

// ======================================================================================

function check_perm_match(p, dt, dn) {
	if(!dn) return true;
	var out =false;
	if(p.match) {
		if(user_defaults[p.match]) {
			for(var i=0;i<user_defaults[p.match].length;i++) {
				 // user must have match field in defaults
				if(user_defaults[p.match][i]==locals[dt][dn][p.match]) {
				    // must match document
		  			return true;
				}
			}
			return false;
		} else if(!locals[dt][dn][p.match]) { // blanks are true
			return true;
		} else {
			return false;
		}
	} else {
		return true;
	}
}

/* Note: Submitted docstatus overrides the permissions. To ignore submit condition
pass ignore_submit=1 */

function get_perm(doctype, dn, ignore_submit) {

	var perm = [[0,0],];
	if(in_list(user_roles, 'Administrator')) perm[0][READ] = 1;
	var plist = getchildren('DocPerm', doctype, 'permissions', 'DocType');
	for(var pidx in plist) {
		var p = plist[pidx];
		var pl = cint(p.permlevel?p.permlevel:0);
		// if user role
		if(in_list(user_roles, p.role)) {
			// if field match
			if(check_perm_match(p, doctype, dn)) { // new style
				if(!perm[pl])perm[pl] = [];
				if(!perm[pl][READ]) { 
					if(cint(p.read))  perm[pl][READ]=1;   else perm[pl][READ]=0;
				}
				if(!perm[pl][WRITE]) { 
					if(cint(p.write)) { perm[pl][WRITE]=1; perm[pl][READ]=1; }else perm[pl][WRITE]=0;
				}
				if(!perm[pl][CREATE]) { 
					if(cint(p.create))perm[pl][CREATE]=1; else perm[pl][CREATE]=0;
				}
				if(!perm[pl][SUBMIT]) { 
					if(cint(p.submit))perm[pl][SUBMIT]=1; else perm[pl][SUBMIT]=0;
				}
				if(!perm[pl][CANCEL]) { 
					if(cint(p.cancel))perm[pl][CANCEL]=1; else perm[pl][CANCEL]=0;
				}
				if(!perm[pl][AMEND]) { 
					if(cint(p.amend)) perm[pl][AMEND]=1;  else perm[pl][AMEND]=0;
				}
			}
		}
	}

	if((!ignore_submit) && dn && locals[doctype][dn].docstatus>0) {
		for(pl in perm)
			perm[pl][WRITE]=0; // read only
	}
	return perm;
}

// ======================================================================================

LocalDB.create = function(doctype, n) {
	if(!n) n = LocalDB.get_localname(doctype);
	var doc = LocalDB.add(doctype, n)
	doc.__islocal=1; doc.owner = user;	
	LocalDB.set_default_values(doc);
	return n;
}

// ======================================================================================

LocalDB.delete_record = function(dt, dn)  {
	var d = locals[dt][dn];
	if(!d.__islocal) // newly created (not required to tag)
		d.__oldparent = d.parent;
	d.parent = 'old_parent:' + d.parent; // should be ..
	d.docstatus = 2;
	d.__deleted = 1;
}

// ======================================================================================

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

// ======================================================================================

LocalDB.add_child = function(doc, childtype, parentfield) {
	// create row doc
	var n = LocalDB.create(childtype);
	var d = locals[childtype][n];
	d.parent = doc.name;
	d.parentfield = parentfield;
	d.parenttype = doc.doctype;
	return d;
}

// ======================================================================================

LocalDB.no_copy_list = ['amended_from','amendment_date','cancel_reason'];
LocalDB.copy=function(dt, dn, from_amend) {
	var newdoc = LocalDB.create(dt);
	for(var key in locals[dt][dn]) {
		if(key!=='name' && key.substr(0,2)!='__') { // dont copy name and blank fields
			locals[dt][newdoc][key] = locals[dt][dn][key];
		}
		var df = get_field(dt, key);
		if(df && ((!from_amend && cint(df.no_copy)==1) || in_list(LocalDB.no_copy_list, df.fieldname))) { // blank out 'No Copy'
			locals[dt][newdoc][key]='';
		}
	}
	return locals[dt][newdoc];
}

// ======================================================================================

function make_doclist(dt, dn, deleted) {
	var dl = [];
	dl[0] = locals[dt][dn];
	
	// get children
	for(var ndt in locals) { // all doctypes
		if(locals[ndt]) {
			for(var ndn in locals[ndt]) {
				var doc = locals[ndt][ndn];
				if(doc && doc.parenttype==dt && (doc.parent==dn||(deleted&&doc.__oldparent==dn))) {
					dl[dl.length]=doc;
					//if(deleted&&(doc.__oldparent==dn))alert(doc.name+','+doc.__oldparent);
				}
			}
		}
	}
	return dl;
}

// Renaming notification list
// ======================================================================================

var rename_observers = [];
function notify_rename_observers(dt, old_name, new_name) {
	// delete from local
	try {
		var old = locals[dt][old_name]; 
		old.parent = null; old.__deleted = 1;
	} catch(e) {
		alert("[rename_from_local] No Document for: "+ old_name);
	}

	// everyone who observers			
	for(var i=0; i<rename_observers.length;i++) {
		if(rename_observers[i])
			rename_observers[i].rename_notify(dt, old_name, new_name);
	}	
}

// Meta Data
// ======================================================================================

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

// Get Dt label
// ======================================================================================
function get_doctype_label(dt) {
	if(session.dt_labels && session.dt_labels[dt])
		return session.dt_labels[dt]
	else
		return dt
}

function get_label_doctype(label) {
	if(session.rev_dt_labels && session.rev_dt_labels[label])
		return session.rev_dt_labels[label]
	else
		return label
}
// Global methods for API
// ======================================================================================

var getchildren = LocalDB.getchildren;
var get_field = Meta.get_field;
var createLocal = LocalDB.create;
