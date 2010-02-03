var fcount = 0;
var frozen = 0;
var dialog_message;

function freeze(msg, do_freeze) {
	// show message
	if(msg) {
		if(!dialog_message) {
			dialog_message = $a('dialogs','div','dialog_message');
			$(dialog_message).corner('5px');
		}

		var d = get_screen_dims();
		$y(dialog_message, {left : ((d.w - 250)/2) + 'px', top  : (get_scroll_top() + 200) + 'px'});
		dialog_message.innerHTML = '<div style="font-size:16px; color: #444; font-weight: bold; text-align: center;">'+msg+'</div>';
		$ds(dialog_message);
	} 
	
	// blur
	$ds($i('dialog_back'));
	$y($i('dialog_back'), {height: get_page_size()[1] + 'px'});
	fcount++;
	frozen = 1;
}
function unfreeze() {
	if(dialog_message)
		$(dialog_message).fadeOut();
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
