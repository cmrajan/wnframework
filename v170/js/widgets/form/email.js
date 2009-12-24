// EMAIL

// Autosuggest defaults
_e.email_as_field = 'email_id';
_e.email_as_dt = 'Contact';
_e.email_as_in = 'email_id,contact_name';

sendmail = function(emailto, emailfrom, cc, subject, message, fmt, with_attachments) {
	var fn = function(html) {
		$c('sendmail', {
			'sendto':emailto, 
			'sendfrom': emailfrom?emailfrom:'',
			'cc':cc?cc:'',
			'subject':subject,
			'message':message,
			'body':html,
			'with_attachments':with_attachments ? 1 : 0,
			'dt':cur_frm.doctype,
			'dn':cur_frm.docname
			}, 
			function(r, rtxt) { 
				//
			}
		);
	}
	
	// build print format
	_p.build(fmt, fn);
}

_e.make = function() {
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
		_e.dialog.hide();
	}

	d.onhide = function() {
		hide_autosuggest();
	}

	d.make_body([
		 ['Data','To','Example: abc@hotmail.com, xyz@yahoo.com']
		,['Select','Format']
		,['Data','Subject']
		,['Data','From','Optional']
		,['Check','Send With Attachments','Will send all attached documents (if any)']
		,['Text','Message']
		,['Button','Send',email_go]]
	);

	d.widgets['From'].value = (user_email ? user_email:'');
	
	$td(d.rows['Format'].tab,0,1).cur_sel = d.widgets['Format'];
	
    // ---- add auto suggest ---- 
    var opts = { script: '', json: true, maxresults: 10 };
    
    var as = new AutoSuggest(d.widgets['To'], opts);
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
      $c('get_contact_list',{'select':_e.email_as_field, 'from':_e.email_as_dt, 'where':_e.email_as_in, 'txt':(last_txt ? strip(last_txt) : '%')},call_back);
      return;
    }
	
	var sel;

	_e.dialog = d;
}

