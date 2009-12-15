var msg_dialog;
function msgprint(msg, static, callback) {

	if(!msg_dialog) {
		msg_dialog = new Dialog(300, 200, "Message");
		msg_dialog.make_body([['HTML','Msg'],])
		msg_dialog.onhide = function() {
			msg_dialog.msg_area.innerHTML = '';
			$dh(msg_dialog.msg_icon);
			if(msg_dialog.custom_onhide) msg_dialog.custom_onhide();
		}
		var t = make_table(msg_dialog.rows['Msg'], 1, 2, '100%',['20px','250px'],{padding:'2px',verticalAlign: 'Top'});
		msg_dialog.msg_area = $td(t,0,1);
		msg_dialog.msg_icon = $a($td(t,0,0),'img');
	}

	// blur bg
	if(!msg_dialog.display) msg_dialog.show();

	// set message content
	var has_msg = msg_dialog.msg_area.innerHTML ? 1 : 0;

	var m = $a(msg_dialog.msg_area,'div','');
	if(has_msg)$y(m,{marginTop:'4px'});

	$dh(msg_dialog.msg_icon);
	if(msg.substr(0,6).toLowerCase()=='error:') {
		msg_dialog.msg_icon.src = 'images/icons/error.gif'; $di(msg_dialog.msg_icon); msg = msg.substr(6);
	} else if(msg.substr(0,8).toLowerCase()=='message:') {
		msg_dialog.msg_icon.src = 'images/icons/application.gif'; $di(msg_dialog.msg_icon); msg = msg.substr(8);
	} else if(msg.substr(0,3).toLowerCase()=='ok:') {
		msg_dialog.msg_icon.src = 'images/icons/accept.gif'; $di(msg_dialog.msg_icon); msg = msg.substr(3);
	}

	m.innerHTML = replace_newlines(msg);
	
	msg_dialog.custom_onhide = callback;
	
}