function compress_doclist(list) {
	var kl = {}; var vl = []; var flx = {};
	for(var i=0; i<list.length;i++) {
		var o = list[i];
		var fl = [];
		if(!kl[o.doctype]) { // make key only once # doctype must be first
			var tfl = ['doctype', 'name', 'docstatus', 'owner', 'parent', 'parentfield', 'parenttype', 'idx', 'creation', 'modified', 'modified_by', '__islocal', '__deleted','__newname', '__modified'];  // for text
			var fl =  ['doctype', 'name', 'docstatus', 'owner', 'parent', 'parentfield', 'parenttype', 'idx', 'creation', 'modified', 'modified_by', '__islocal', '__deleted','__newname', '__modified'];  // for unique

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
