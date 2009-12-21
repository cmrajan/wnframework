// ABOUT
var about_dialog;
function show_about() {
	if(!about_dialog) {
		var d = new Dialog(360,480, 'About')
	
		d.make_body([
			['HTML', 'info']
		]);
		
		d.rows['info'].innerHTML = "<div style='padding: 16px;'><center>"
			+"<div style='text-align: center'><img src = 'images/ui/webnotes30x120.gif'></div>"
			+"<br><br>&copy; 2007-08 Web Notes Technologies Pvt. Ltd."
			+"<p><span style='color: #888'>Customized Web Based Solutions and Products</span>"
			+"<br>51 / 2406, Nishigandha, Opp MIG Cricket Club,<br>Bandra (East),<br>Mumbai 51</p>"
			+"<p>Phone: +91-22-6526-5364 (M-F 9-6)"
			+"<br>Email: info@webnotestech.com"
			+"<br><b>Customer Support: support@webnotestech.com</b></p>"
			+"<p><a href='http://www.webnotestech.com'>www.webnotestech.com</a></p></center>"
			+"</div>";
	
		about_dialog = d;
	}
	about_dialog.show();
}
function download_backup() {
  window.location = outUrl + "?cmd=backupdb&read_only=1&__account="+account_id
    + (__sid150 ? ("&sid150="+__sid150) : '')
	+ "&db_name="+account_id;
}

function enter_testing() {
	about_dialog.hide();
	if(is_testing) {
		end_testing();
		return;
	}
	var a  = prompt('Type in the password', '');
	if(a=='start testing') {
		$c('start_test',args={}, function() {
				$ds('testing_div'); 
				is_testing = true;
				$i('testing_mode_link').innerHTML = 'End Testing';
			}
		);
	} else {
		msgprint('Sorry, only administrators are allowed use the testing mode.');	
	}
}

function setup_testing() {
	about_dialog.hide();
	$c('setup_test',args={}, function() { } );
}

function end_testing() {
	$c('end_test',args={}, function() {
			$dh('testing_div'); 
			is_testing = false;
			$i('testing_mode_link').innerHTML = 'Enter Testing Mode'; 
		} 
	);
}
