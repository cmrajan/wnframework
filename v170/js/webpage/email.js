// EMAIL

function email_doc() {
	if(!cur_frm)return;
	// make selector
	sel = makeformatselector(cur_frm);
	$td(email_dialog.rows['Format'].tab,0,1).innerHTML = '';
	$td(email_dialog.rows['Format'].tab,0,1).appendChild(cur_frm.print_sel);
	email_dialog.widgets['Subject'].value = cur_frm.meta.name + ': ' + cur_frm.docname;
	email_dialog.show();
	frm_con.tbarlinks.selectedIndex = 0;
}

var email_as_field = 'email_id';
var email_as_dt = 'Contact';
var email_as_in = 'email_id,contact_name';

function makeemail() {
	var d = new Dialog(440, 440, "Send Email");
	$dh(d.wrapper);

	var email_go = function() {
		var emailfrom = d.widgets['From'].value;
		var emailto = d.widgets['To'].value;
		
		if(!emailfrom)
			emailfrom = user_email;
		
		// validate email ids
		var email_list = emailto.split(/[,|;]/);
		var valid = 1;
		for(var i=0;i<email_list.length;i++){
			if(!validate_email(email_list[i])) {
				msgprint('error:'+email_list[i] + ' is not a valid email id');
				valid = 0;
			}
		}
		
		// validate from
		if(emailfrom && !validate_email(emailfrom)) {
			msgprint('error:'+ emailfrom + ' is not a valid email id. To change the default please click on Profile on the top right of the screen and change it.');
			return;
		}
		
		if(!valid)return;
			
		var cc= emailfrom;
		
		if(!emailfrom) { 
			emailfrom = locals['Control Panel']['Control Panel'].auto_email_id; 
			cc = ''; 
		}
		sendmail(emailto, emailfrom, emailfrom, d.widgets['Subject'].value, d.widgets['Message'].value, sel_val(cur_frm.print_sel), d.widgets['Send With Attachments'].checked);
		email_dialog.hide();
	}

	d.onhide = function() {
		hide_autosuggest();
	}

	d.make_body([
		 ['Data','To','Example: abc@hotmail.com, xyz@yahoo.com']
		,['Data','Format']
		,['Data','Subject']
		,['Data','From','Optional']
		,['Check','Send With Attachments','Will send all attached documents (if any)']
		,['Text','Message']
		,['Button','Send',email_go]]
	);

	d.widgets['From'].value = (user_email ? user_email:'');
	
    // ---- add auto suggest ---- 
    var opts = { script: '', json: true, maxresults: 10 };
    
    var as = new bsn.AutoSuggest(d.widgets['To'], opts);
    as.custom_select = function(txt, sel) {
      // ---- add to the last comma ---- 
      var r = '';
      var tl = txt.split(',');
      for(var i=0;i<tl.length-1;i++) r=r+tl[i]+',';
      r = r+(r?' ':'')+sel;
      if(r[r.length-1]==NEWLINE) r=substr(0,r.length-1);
      return r;
    }
    
    // ---- override server call ---- 
    as.doAjaxRequest = function(txt) {
      var pointer = as; var q = '';
      
      // ---- get last few letters typed ---- 
      var last_txt = txt.split(',');
      last_txt = last_txt[last_txt.length-1];
      
      // ---- show options ---- 
      var call_back = function(r,rt) {
        as.aSug = [];
        if(!r.cl) return;
        for (var i=0;i<r.cl.length;i++) {
          as.aSug.push({'id':r.cl[i], 'value':r.cl[i], 'info':''});
        }
        as.createList(as.aSug);
      }
      $c('get_contact_list',{'select':email_as_field, 'from':email_as_dt, 'where':email_as_in, 'txt':(last_txt ? strip(last_txt) : '%')},call_back);
      return;
    }
	
	var sel;

	email_dialog = d;
}

