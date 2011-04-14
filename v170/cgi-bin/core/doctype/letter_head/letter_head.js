cur_frm.cscript.validate = function(doc, dt, dn) {
	return 1;
}

cur_frm.cscript['Set From Image'] = function(doc, dt, dn) {
	if(!doc.file_list) {
		msgprint('Please attach an image file first');
		return;
	}
	if(doc.content) {
		if(!confirm('Are you sure you want to overwrite the existing HTML?'))
			return;
	}

	var url = window.location.href;
	if(url.search('#')!=-1) url = url.split('#')[0];
	if(url.search(/\?/)!=-1) url = url.split('?')[0]
	if(url.search('index.cgi')!=-1) url = url.split('index.cgi')[0]
	
	if(url.substr(url.length-1, 1)=='/') 
		url = url.substr(0, url.length-1)

	var file_name = doc.file_list.split(',')[0]

	if(!in_list(['gif','jpg','jpeg','png'], file_name.split('.')[1])) {
		msgprint("Please upload a web friendly (GIF, JPG or PNG) image file for the letter head");
		return;
	}

	img_link = '<div><img src="'+ url +'/cgi-bin/getfile.cgi?name=' + file_name + 
		'&acx=' + locals['Control Panel']['Control Panel'].account_id + '"/></div>'
	
	doc.content = img_link;
	refresh_field('content');
}