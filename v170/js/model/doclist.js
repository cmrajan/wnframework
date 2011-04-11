function compress_doclist(list) {
	var kl = {}; var vl = []; var flx = {};
	for(var i=0; i<list.length;i++) {
		var o = list[i];
		var fl = [];
		if(!kl[o.doctype]) { // make key only once # doctype must be first
			var tfl = ['doctype', 'name', 'docstatus', 'owner', 'parent', 'parentfield', 'parenttype', 'idx', 'creation', 'modified', 'modified_by', '__islocal', '__deleted','__newname', '__modified', '_user_tags'];  // for text
			var fl =  ['doctype', 'name', 'docstatus', 'owner', 'parent', 'parentfield', 'parenttype', 'idx', 'creation', 'modified', 'modified_by', '__islocal', '__deleted','__newname', '__modified', '_user_tags'];  // for unique

			for(key in fields[o.doctype]) { // all other values
				if((!in_list(fl, key)) && (!in_list(no_value_fields, fields[o.doctype][key].fieldtype))) {
					fl[fl.length] = key; // save value list
					tfl[tfl.length] = key //.replace(/'/g, "\\'").replace(/\n/g, "\\n");
				}
			}
			flx[o.doctype] = fl;
			kl[o.doctype] = tfl
		}
		var nl = [];
		var fl = flx[o.doctype];
		// check all
		for(var j=0;j<fl.length;j++) {
			var v = o[fl[j]];
			nl.push(v);
		}
		vl.push(nl);
	}
		
	return JSON.stringify({'_vl':vl, '_kl':kl});
}

function expand_doclist(docs) {
	var l = [];
	for(var i=0;i<docs._vl.length;i++) 
		l[l.length] = zip(docs._kl[docs._vl[i][0]], docs._vl[i]);
	return l;
}
function zip(k,v) {
	var obj = {};
	for(var i=0;i<k.length;i++) {
		obj[k[i]] = v[i];
	}
	return obj;
}

function save_doclist(dt, dn, save_action, onsave, onerr) {
	var doc = locals[dt][dn];
	var doctype = locals['DocType'][dt];
	
	var tmplist = [];
	
	// make doc list
	var doclist = make_doclist(dt, dn, 1);
	var all_clear = true;
	
	if(save_action!='Cancel') {
		for(var n in doclist) {
			// type / mandatory checking
			var tmp = check_required(doclist[n].doctype, doclist[n].name);
			if(doclist[n].docstatus+''!='2'&&all_clear) // if not deleted
				all_clear = tmp;
		}
	}
		
	var f = frms[dt];
	if(f && !all_clear) { // has errors
		if(f)f.savingflag = false;
		return 'Error';
	}
		
	var _save = function() {
		//if(user=='Administrator')errprint(out);
		page_body.set_status('Saving...')
		
		$c('webnotes.widgets.form.savedocs', {'docs':compress_doclist(doclist), 'docname':dn, 'action': save_action, 'user':user }, 
			function(r, rtxt) {
				if(f){ f.savingflag = false;}
				if(r.saved) {
					if(onsave)onsave(r);
				} else {
					if(onerr)onerr(r);
				}
			}, function() {
				if(f){ f.savingflag = false; } /*time out*/ 
			},0,(f ? 'Saving...' : '')
		);
	}

	// ask for name
	if(doc.__islocal && (doctype && doctype.autoname && doctype.autoname.toLowerCase()=='prompt')) {
		var newname = prompt('Enter the name of the new '+ dt, '');
		if(newname) { 
				doc.__newname = strip(newname); _save();
		} else {
			msgprint('Not Saved'); onerr();
		}
	} else {
		_save();
	}
}

function check_required(dt, dn) {
	var doc = locals[dt][dn];
	if(doc.docstatus>1)return true;
	var fl = fields_list[dt];
	
	if(!fl)return true; // no doctype loaded
	
	var all_clear = true;
	var errfld = [];
	for(var i=0;i<fl.length;i++) {
		var key = fl[i].fieldname;
		var v = doc[key];
				
		if(fl[i].reqd && is_null(v) && fl[i].fieldname) {
			errfld[errfld.length] = fl[i].label;
			
			// Bring to front "Section"
			if(cur_frm) {
				// show as red
				var f = cur_frm.fields_dict[fl[i].fieldname];
				if(f) {
					// in form
					if(f.set_as_error) f.set_as_error(1);
					
					// switch to section
					if(!cur_frm.error_in_section && f.parent_section) {
						cur_frm.set_section(f.parent_section.sec_id);
						cur_frm.error_in_section = 1;
					}
				}
			}
						
			if(all_clear)all_clear = false;
		}
	}
	if(errfld.length)msgprint('<b>Following fields are required:</b>\n' + errfld.join('\n'));
	return all_clear;
}
