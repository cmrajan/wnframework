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
					tfl[tfl.length] = key.replace(/'/g, "\\'").replace(/\n/g, "\\n");
				}
			}
			flx[o.doctype] = fl;
			kl[o.doctype] = "['"+tfl.join("', '")+"']";
		}
		var nl = [];
		var fl = flx[o.doctype];
		// check all
		for(var j=0;j<fl.length;j++) {
			var v = o[fl[j]];
			if(v==null) 
				v = NULL_CHAR;
			if(typeof(v)==typeof(1)) { // for numbers
				nl[nl.length] = v+'';
			} else {
	   			v = v+''; // convert to string
				nl[nl.length] = "'"+v.replace(/'/g, "\\'").replace(/\n/g, "\\n")+"'";
   			}
		}
		vl[vl.length] = '['+nl.join(', ')+']';
	}
	var sk = [];
	var kls = [];
	for(key in kl) kls[kls.length] = "'"+key+"':" + kl[key];

	var kls = '{'+kls.join(',')+'}';
	var vl = '['+vl.join(',')+']';
	
	//alert("{'_vl':"+vl+",'_kl':"+kls+"}");
	return "{'_vl':"+vl+",'_kl':"+kls+"}";
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
