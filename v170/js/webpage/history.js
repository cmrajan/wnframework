// Navigation Object

var nav_obj = {}
nav_obj.ol = [];
nav_obj.open_notify = function(t, dt, dn) {
	// last should not be this (refresh)
	if(nav_obj.length) {
		var tmp = nav_obj[nav_obj.length-1];
		if(tmp[0]==t && tmp[1]==dt && tmp[2]==dn) return;
	}

	// remove from list (if exists)
	var tmp = [];
	for(var i in nav_obj.ol)
		if(!(nav_obj.ol[i][0]==t && nav_obj.ol[i][1]==dt && nav_obj.ol[i][2]==dn)) tmp.push(nav_obj.ol[i]);
	nav_obj.ol = tmp;

	// add to top
	nav_obj.ol.push([t, dt, dn])	
	
	// add to "back" history
	dhtmlHistory.add(t+'~~~'+ dt + (dn ? ('~~~'+dn): ''),'');

	// update back link
	if(!(has_back_link && dt)) return;
	var l = $i('back_link');
	var tmp = nav_obj.ol[nav_obj.ol.length-2];
	if(tmp)
		l.innerHTML = ('<< Back to '+(tmp[0]=='Page' ? tmp[1] : (tmp[1] + ' ' + tmp[2]))).bold();
	else
		l.innerHTML = '';
}

nav_obj.rename_notify = function(dt, oldn, newn) {
	for(var i in nav_obj.ol)
		if(nav_obj.ol[i][1]==dt && nav_obj.ol[i][2]==oldn) nav_obj.ol[i][2]=newn;
} 

nav_obj.show_last_open = function() {
	var l = nav_obj.ol[nav_obj.ol.length-2];
	delete nav_obj.ol[nav_obj.ol.length-1]; // delete current open

	if(!l) loadpage('_home');
	else if(l[0]=='Page') { 
		loadpage(l[1]);
	} else if(l[0]=='Report') {
		loadreport(l[1],l[2]);
	} else if(l[0]=='DocType') {
		loaddoc(l[1],l[2]);
	} else if(l[0]=='Application') {
		loadapp(l[1]);
	}
}