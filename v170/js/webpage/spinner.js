function get_scroll_top() {
	var st = 0;
	if(document.documentElement && document.documentElement.scrollTop)
		st = document.documentElement.scrollTop;
	else if(document.body && document.body.scrollTop)
		st = document.body.scrollTop;
	return st;
}

function set_loading() {
	var d = $i('loading_div')
	if(!d)return;
	d.style.top = (get_scroll_top()+10)+'px';
	$ds(d);
	pending_req++;
}
function hide_loading() {
	var d = $i('loading_div')
	if(!d)return;
	pending_req--;
	if(!pending_req)$dh(d);
}

