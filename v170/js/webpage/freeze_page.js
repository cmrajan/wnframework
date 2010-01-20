var fcount = 0;
var frozen = 0;

function freeze(msg, do_freeze) {
	// show message
	if(msg) {
		var div = $i('dialog_message');

		var d = get_screen_dims();
		div.style.left = ((d.w - 250)/2) + 'px';
		div.style.top  = (get_scroll_top() + 200) + 'px';
		
		div.innerHTML = '<div style="font-size:16px; color: #444; font-weight: bold; text-align: center;">'+msg+'</div>';
		$ds(div);
	} 
	
	// blur
	$ds($i('dialog_back'));
	$y($i('dialog_back'), {height: get_page_size()[1] + 'px'});
	fcount++;
	frozen = 1;
}
function unfreeze() {
	$dh($i('dialog_message'));
	if(!fcount)return; // anything open?
	fcount--;
	if(!fcount) {
		$dh($i('dialog_back'));
		show_selects();
		frozen = 0;
	}
}

// Selects for IE6
// ------------------------------------

function hide_selects() { }

function show_selects() { }


//var fmessage;
