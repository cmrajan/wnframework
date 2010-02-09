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

	if($.browser.msie && flt($.browser.version)<7) {
		d.style.top = (get_scroll_top()+10)+'px';
		window.onscroll = function() {
			$i('loading_div').style.top = (get_scroll_top()+10)+'px';
		}
	} else {
		$y($i('loading_div'), {position: 'fixed', top: '10px'});
	} 

	$ds(d);
	pending_req++;
}
function hide_loading() {
	var d = $i('loading_div');
	if(!d)return;
	pending_req--;
	if(!pending_req){
		$dh(d);
		if($.browser.msie && flt($.browser.version)<7) {
			document.body.onscroll = null;
		}
	}
}

