function get_scroll_top() {
	var st = 0;
	if(document.documentElement && document.documentElement.scrollTop)
		st = document.documentElement.scrollTop;
	else if(document.body && document.body.scrollTop)
		st = document.body.scrollTop;
	return st;
}

var _loading_div;
function set_loading() {
	if(!_loading_div) {
		_loading_div = $a('dialogs', 'div', 'loading_div');
		_loading_div.innerHTML = 'Loading';
	}
	var d = _loading_div;
	if(!d)return;

	if($.browser.msie && flt($.browser.version)<7) {
		d.style.top = (get_scroll_top()+10)+'px';
		window.onscroll = function() { 
			d.style.top = (get_scroll_top()+10)+'px'; 
		}
	} else {
		$y(d, {position: 'fixed', top: '10px'});
	} 

	$ds(d);
	pending_req++;
}

function hide_loading() {
	var d = _loading_div;
	if(!d)return;
	pending_req--;
	if(!pending_req){
		$dh(d);
		if($.browser.msie && flt($.browser.version)<7) {
			document.body.onscroll = null;
		}
	}
}