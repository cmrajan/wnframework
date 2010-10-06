cur_frm.cscript.onload = function(doc,cdt,cdn){
  if(doc.company)get_server_fields('get_pan_tan','','',doc,cdt,cdn,1);
  if (doc.docstatus==0) hide_field('Make Bank Voucher');
}


cur_frm.cscript.company = function(doc,cdt,cdn){
  if(doc.company)get_server_fields('get_pan_tan','','',doc,cdt,cdn);
}

cur_frm.cscript.to_date = function(doc,cdt,cdn){
  if(doc.from_date>doc.to_date){
    alert("From date can not be greater than To date");
    doc.to_date='';
    refresh_field('to_date');
}
}

cur_frm.cscript.tds_category = function(doc,cdt,cdn){
  if (doc.tds_category){
    var tds_acc_type = new Array();
    tds_acc_type=['Main','Surcharge','Edu Cess','Sh Edu Cess'];
    for(i=0;i<tds_acc_type.length;i++){
      args={'acc_type':tds_acc_type[i]}
      
      $c('runserverobj', args={'method':'get_acc_head', arg:docstring(args),'docs':compress_doclist([doc])}, 
        function(r, rt) {
          pscript.acc_head = r.message;
        }
      );
      if (tds_acc_type[i]=='Main') doc.main_acc = pscript.acc_head;
      else if (tds_acc_type[i]=='Surcharge') doc.surcharge_acc=pscript.acc_head;
      else if (tds_acc_type[i]=='Edu Cess') doc.edu_cess_acc=pscript.acc_head;
      else if (tds_acc_type[i]=='Sh Edu Cess') doc.sh_edu_cess_acc=pscript.acc_head;
    }
    alert(doc.main_acc);
    alert(doc.surcharge_acc);
    alert(doc.edu_cess_acc);
    alert(doc.sh_edu_cess_acc);
    refresh_field('main_acc');
    refresh_field('surcharge_acc');
    refresh_field('edu_cess_acc');
    refresh_field('sh_edu_cess_acc');
  }
}

cur_frm.cscript.total_tds = function(doc,cdt,cdn){
  var tot_main=0,tot_surcharge=0,tot_edu=0,tot_sh_edu=0,tot_tax=0;
  var tds_l = getchildren('TDS Payment Detail',doc.name,'tds_payment_details')
  for(var i=0; i<tds_l.length;i++){
    tot_main = flt(tot_main)+flt(tds_l[i].tds_main);
    tot_surcharge = flt(tot_surcharge)+flt(tds_l[i].surcharge);
    tot_edu = flt(tot_edu)+flt(tds_l[i].edu_cess);
    tot_sh_edu = flt(tot_sh_edu)+flt(tds_l[i].sh_edu_cess);
    tot_tax = flt(tot_tax)+flt(tds_l[i].total_tax_amount);
  }
  var tds_values = new Array();
  
  tds_values['Main'] = tot_main;
  tds_values['Surcharge'] = tot_surcharge;
  tds_values['Edu Cess'] = tot_edu;
  tds_values['Sh Edu Cess'] = tot_sh_edu;
  tds_values['TotalTDS'] = tot_tax;
  
  return tds_values;
}

// Make Journal Voucher
// --------------------

cur_frm.cscript['Make Bank Voucher'] = function(doc, dt, dn) {
  
  var call_back = function(r,rt) {
    cur_frm.cscript.make_jv(doc,dt,dn,r.message);
  }
  args = {'credit_to':'', 'company':doc.company};
  $c_obj('ERP Setup', 'get_bank_defaults', docstring(args), call_back);

}

cur_frm.cscript.make_jv = function(doc, dt, dn, det) {

  tds_values=cur_frm.cscript.total_tds(doc,cdt,cdn);
  
  
  var jv = LocalDB.create('Journal Voucher');
  jv = locals['Journal Voucher'][jv];
  jv.voucher_type = det.def_bv_type;
  jv.voucher_series = det.def_bv_series;
  jv.voucher_date = doc.transaction_date;
  jv.posting_date = doc.posting_date;
  jv.remark = repl('Payment against voucher %(vn)s for %(rem)s', {vn:doc.name, rem:doc.remarks});
  jv.total_debit = tds_values['TotalTDS'];
  jv.total_credit = tds_values['TotalTDS'];
  jv.fiscal_year = doc.fiscal_year;
  jv.company = doc.company;
  
  // debit to creditor
  
  var callback_tds = function(tds_value, credit_to){
    //pscript.credit_to=r.message;
    pscript.credit_to=credit_to;
    var d1 = LocalDB.add_child(jv, 'Journal Voucher Detail', 'entries');
    d1.account = pscript.credit_to;
    
    //d1.debit = tds_values[i];
    d1.debit = tds_value;
    //d1.balance = det.acc_balance;
    //d1.against_voucher = doc.name;
  }

  for (var i in tds_values){
    if (tds_values[i]>0 && i!= 'TotalTDS'){
      args={'acc_type':i, 'tds_value':tds_values[i]};
      
      $c('runserverobj', args={'method':'get_acc_head', arg:docstring(args), 'docs':compress_doclist([doc])}, 
        function(r, rt) {  
          callback_tds(r.message.tds_value, r.message.acc_head);
        }
      );
    }
  }
  // credit to bank
  j='TotalTDS'
  var d1 = LocalDB.add_child(jv, 'Journal Voucher Detail', 'entries');
  d1.account = det.def_bank_account;
  d1.balance = det.bank_balance;
  d1.credit = tds_values[j];
  
  loaddoc('Journal Voucher', jv.name);
  //alert("journal voucher made");
}

// Refresh
// -------

cur_frm.cscript.refresh = function(doc, dt, dn) {
  // Show / Hide button
  if(doc.docstatus==1) { unhide_field('Make Bank Voucher'); }
  else hide_field('Make Bank Voucher');
}