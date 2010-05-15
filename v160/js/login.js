/* Copyright 2005-2008, Rushabh Mehta (RMEHTA _AT_ GMAIL) 

    Web Notes Framework is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    For a copy of the GNU General Public License see 
    <http://www.gnu.org/licenses/>.
    
    Web Notes Framework is also available under a commercial license with
    patches, upgrades and support. For more information see 
    <http://webnotestech.com>
*/

function onLoginReply(r, rtext) {
 if(r.message=="Logged In"){
	$i('messages').innerHTML = '<span style="color: #3C6; font-weight: bold">Login Successful</span>';
    window.location.href='index.cgi?__account='+r.__account+'&sid150='+r.sid150;
 } else {
	$i('messages').innerHTML = '<span style="color: #C44; font-weight: bold">'+r.message+'</span>';
	if(r.exc)alert(r.exc);
 }
}

function doLogin() {
 var args = {};
 if(in_list(['frappe','michiganeng','indobakels','ecoreco','tastel','ncsci','sun advertising'], $i("inpAccount").value)) {
   alert('This account has been migrated to iWebNotes. You will now be redirected to www.iwebnotes.com. Please update your bookmarks');	
   window.location.href = 'http://iwebnotes.com';
   return;
 }
 args['usr']=$i("inpLogin").value;
 args['pwd']=$i("inpPassword").value;
 args['acx']=$i("inpAccount").value;
 $i('messages').innerHTML = "<b>Checking...</b>";
 $c("login", args, onLoginReply);
}

args = document.location.href.split('?');
if(args[1]) {
	args = args[1].split('&');
	args = args[0].split('=');
	if(args[0].toLowerCase()=='account') {
		$i('inpAccount').value = args[1];
		$i('inpAccount').style.display = 'none';
		$i('accountLabel').style.display = 'none';
	}
}

greentips = [
['Change a light', 'Replacing one regular light bulb with a compact fluorescent light will save 150 pounds of carbon dioxide per year.'],
['Use Public Transport',"Walk, bike, carpool or take metro transit more often. You'll save one pound of carbon dioxide for every mile you don't drive!"],
["Recycle more","You can save 2,400 pounds of carbon dioxide per year by recycling just half of your household waste."],
["Use less hot water","It takes a lot of energy to heat water. Use less hot water by installing a low-flow shower-head (350 pounds of carbon dioxide saved per year) and washing your clothes in cold or warm water (500 pounds save per year)."],
["Avoid products with a lot of packaging","You can save 1,200 pounds of carbon dioxide if you cut down your garbage by 10%."],
["Adjust your AC","Moving your thermostat down just 2 degrees in winter and up 2 degrees in summer could save about 2,000 pounds of carbon dioxide per year."],
["Plant a Tree","A single tree will absorb one ton of carbon dioxide over its lifetime."],
["Turn off electronic devices","Simply turning off your television, DVD player, stereo, and computer when you're not using them will save thousands of pounds of carbon dioxide per year."],
["From our users", "Use eco-friendly (Ecobuddy) notebooks & save trees. The paper used in these notebooks does not come from chopping down the trees. It is made from a renewable raw material - bagasse, namely sugarcane waste. After the cane has been crushed to make sugar, the left over pulp is turned into paper. - <u>Jitesh Save, Dahanu (26th June 08)</u>"],
["From our users", "Manufacturing of unnecessary or disposable goods often produces air pollution, so reduced purchasing of disposables will help. Follow the solid waste mantra - 'Reduce, Reuse, Repair, Recycle' - and this will reduce air pollution as well from transporting, treating, or disposing of unnecessary wastes - <u>Umair Sayyed, Mumbai (24th April 08)</u>"]
];

function show_green() {
	var idx = parseInt(Math.random() * greentips.length);	
	$i('green_tip1').innerHTML = greentips[idx][0] + ': ';
	$i('green_tip2').innerHTML = greentips[idx][1];
}

var forgot_shown = 0;
function show_forgot_password() {
	if(forgot_shown) { $ds('forgot_area'); forgot_shown = 0; }
	else { $dh('forgot_area'); forgot_shown = 1; }
}

function forgot_password() {
	if(account_required) {
		if(!$i('inpAccount').value) {
			alert("You must enter the 'Account' name. If you do not remember the account name, please contact your System Administrator");
			return;
		}
	}
	// no user
	if(!$i('inpForgot').value) {
		alert("Please enter your user name or email id");
		return;
	}
	$c("reset_password", {
		account:$i('inpAccount').value
		,user:$i('inpForgot').value
	}, function(r,rt) { } );
}

var account_required = 1;
var footer_text;
var show_account = true;
var show_green_tip = true;
var header_img = null;
var user_startup = null;

function login_startup() {
	// green tip
	if(show_green_tip) {
		$ds('greenbox');
		show_green();
	} else {
		$dh('greenbox');
	}
	// head
	if(header_img) {
		$i('login_head_img').src = header_img;
		$di('login_head_img');
	}
	
	// footer
	$i('login_footer').innerHTML = footer_text ? footer_text : 'Powered by Web Notes Framework';
	
	// account
	if(show_account) {
		$i('inpAccount').focus();
	} else {
		$dh('inpAccount');
		$dh('accountLabel');
		$i('inpLogin').focus();
	}
	
	if(isIE)$ds('getfirefox');

	addEvent('keydown', function(e, target) {
		if(isIE)var kc = window.event.keyCode;
		else var kc = e.keyCode;
		
		if(kc==13 && $i("inpPassword").value) doLogin();
	});
	
	if(user_startup)user_startup();
}

window.onload = login_startup;
