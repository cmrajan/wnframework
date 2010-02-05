function get_scroll_top() {
	var st = 0;
	if(document.documentElement && document.documentElement.scrollTop)
		st = document.documentElement.scrollTop;
	else if(document.body && document.body.scrollTop)
		st = document.body.scrollTop;
	return st;
}

function set_loading() {
	var d = $i('loading_div');
	if(!d)return;

	if(ui_effects)$(d).corners();
	//d.style.left = (cint(get_screen_dims().w)/2 - 40) + 'px';
	d.style.top = (get_scroll_top()+10)+'px';

	if(ui_effects) $(d).fadeIn();
	else $ds(d);
	pending_req++;
}
function hide_loading() {
	var d = $i('loading_div')
	if(!d)return;
	pending_req--;
	if(!pending_req){
		if(ui_effects) $(d).fadeOut();
		else $dh(d);
	}
}

