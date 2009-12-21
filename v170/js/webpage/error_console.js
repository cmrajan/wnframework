// Error Console:

var err_console;
var err_list = [];

function errprint(t) {
	err_list[err_list.length] = ('<pre style="font-family: Courier, Fixed; font-size: 11px; border-bottom: 1px solid #AAA; overflow: auto; width: 90%;">'+t+'</pre>');
}

function submit_error(e) {
	if(isIE) {
		var t = 'Explorer: ' + e + '\n' + e.description;
	} else {
		var t = 'Mozilla: ' + e.toString() + '\n' + e.message + '\nLine Number:' + e.lineNumber;// + '\nStack:' + e.stack;
	}
	$c('client_err_log', args ={'error':t});
	errprint(e + '\nLine Number:' + e.lineNumber + '\nStack:' + e.stack);
}

function setup_err_console() {
	err_console = new Dialog(640, 480, 'Error Console')
	err_console.make_body([
		['HTML', 'Error List'],
		['Button', 'Ok'],
		['Button', 'Clear']
	]);
	err_console.widgets['Ok'].onclick = function() {
		err_console.hide();
	}
	err_console.widgets['Clear'].onclick = function() {
		err_list = [];
		err_console.rows['Error List'].innerHTML = '';
	}
	err_console.onshow = function() {
		err_console.rows['Error List'].innerHTML = '<div style="padding: 16px; height: 360px; width: 90%; overflow: auto;">' 
			+ err_list.join('<div style="height: 10px; margin-bottom: 10px; border-bottom: 1px solid #AAA"></div>') + '</div>';
	}
}

startup_list.push(setup_err_console);
