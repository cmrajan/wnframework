var _loading_div;
function set_loading() {
	/* if(!_loading_div) {
		_loading_div = $a(popup_cont, 'div', 'loading_div');
		var t = make_table(_loading_div, 1, 2, '90px', [null, null], {verticalAlign:'middle'});
		$y(t,{borderCollapse: 'collapse'});
		$a($td(t,0,0), 'img').src="images/ui/loading.gif";
		$td(t,0,1).innerHTML = 'Loading...'
		if(!isIE)$y($td(t,0,0),{paddingTop:'2px'});
	}
	var d = _loading_div;
	if(!d)return;

	if(isIE6) {
		d.style.top = (get_scroll_top()+10)+'px';
		scroll_list.push(function() { 
			_loading_div.style.top = (get_scroll_top()+10)+'px'; 
		})
	} else {
		$y(d, {position: 'fixed', top: '10px'});
	} */

	$ds(page_body.wntoolbar.spinner);
	pending_req++;
}

function hide_loading() {
	var d = page_body.wntoolbar.spinner;
	if(!d)return;
	pending_req--;
	if(!pending_req){
		$dh(d);
		/*if(isIE6) {
			document.body.onscroll = null;
		}*/
	}
}