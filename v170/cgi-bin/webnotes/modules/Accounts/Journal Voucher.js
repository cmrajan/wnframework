cur_frm.cscript.onload = function(doc, cdt, cdn) {
  if (!doc.voucher_date) doc.voucher_date = dateutil.obj_to_str(new Date());
}

// Restrict Voucher based on Account
// ---------------------------------

cur_frm.fields_dict['entries'].grid.get_field('account').get_query = function(doc) {
  return "SELECT `tabAccount`.name FROM `tabAccount` WHERE `tabAccount`.company='"+doc.company+"' AND tabAccount.group_or_ledger = 'Ledger' AND tabAccount.is_active = 'Yes' AND `tabAccount`.name like '%s'";
}

cur_frm.fields_dict['entries'].grid.get_field('against_voucher').get_query = function(doc) {
  var d = locals[this.doctype][this.docname];
  return "SELECT `tabPayable Voucher`.name, `tabPayable Voucher`.credit_to, `tabPayable Voucher`.outstanding_amount,`tabPayable Voucher`.bill_no, `tabPayable Voucher`.bill_date FROM `tabPayable Voucher` WHERE `tabPayable Voucher`.credit_to='"+d.account+"' AND `tabPayable Voucher`.outstanding_amount > 0 AND `tabPayable Voucher`.docstatus = 1 AND `tabPayable Voucher`.name like '%s' ORDER BY `tabPayable Voucher`.name DESC LIMIT 200";
}

cur_frm.fields_dict['entries'].grid.get_field('against_invoice').get_query = function(doc) {
  var d = locals[this.doctype][this.docname];
  return "SELECT `tabReceivable Voucher`.name, `tabReceivable Voucher`.debit_to, `tabReceivable Voucher`.outstanding_amount FROM `tabReceivable Voucher` WHERE `tabReceivable Voucher`.debit_to='"+d.account+"' AND `tabReceivable Voucher`.outstanding_amount > 0 AND `tabReceivable Voucher`.docstatus = 1 AND `tabReceivable Voucher`.name LIKE '%s' ORDER BY `tabReceivable Voucher`.name DESC LIMIT 200";
}

cur_frm.fields_dict['entries'].grid.onrowadd = function(doc){
  var d = locals[this.doctype][this.docname];
  if(d.idx == 1){
    d.debit = 0;
    d.credit = 0;
  }
}



// Get Outstanding of Payable & Receivable Voucher
// -----------------------------------------------

cur_frm.cscript.against_voucher = function(doc,cdt,cdn) {
  var d = locals[cdt][cdn];
  if (d.against_voucher && !flt(d.debit)) {
    args = {'doctype': 'Payable Voucher', 'docname': d.against_voucher }
    get_server_fields('get_outstanding',docstring(args),'entries',doc,cdt,cdn,1,function(r,rt) { cur_frm.cscript.update_totals(doc); });
  }
}

cur_frm.cscript.against_invoice = function(doc,cdt,cdn) {
  var d = locals[cdt][cdn];
  if (d.against_invoice && !flt(d.credit)) {
    args = {'doctype': 'Receivable Voucher', 'docname': d.against_invoice }
    get_server_fields('get_outstanding',docstring(args),'entries',doc,cdt,cdn,1,function(r,rt) { cur_frm.cscript.update_totals(doc); });
  }
}


// Update Totals
// -------------

cur_frm.cscript.update_totals = function(doc) {
  var td=0.0; var tc =0.0;
  var el = getchildren('Journal Voucher Detail', doc.name, 'entries');
  for(var i in el) {
    td += flt(el[i].debit);
    tc += flt(el[i].credit);
  }
  tc += flt(doc.total_tds_amount)
  var doc = locals[doc.doctype][doc.name];
  doc.total_debit = td;
  doc.total_credit = tc;
  doc.difference = flt(td - tc);

  refresh_many(['total_debit','total_credit','difference']);
}

cur_frm.cscript.debit = function(doc,dt,dn) { cur_frm.cscript.update_totals(doc); }
cur_frm.cscript.credit = function(doc,dt,dn) { cur_frm.cscript.update_totals(doc); }
cur_frm.cscript['Get Balance'] = function(doc,dt,dn) {
  alert(1);
  cur_frm.cscript.update_totals(doc); 
  $c_obj(make_doclist(dt,dn), 'get_balance', '', function(r, rt){
  cur_frm.refresh();
  });
}
// Get balance
// -----------

cur_frm.cscript.account = function(doc,dt,dn) {
  var d = locals[dt][dn];
  $c_obj('GL Control','get_bal',d.account+'~~~'+doc.fiscal_year, function(r,rt) { d.balance = r.message; refresh_field('balance',d.name,'entries'); });
} 

// Bank
// ----

cur_frm.cscript.is_bank = function(doc,dt,dn) {
  return doc.voucher_type=='Bank Voucher' ? 1 : 0;
}

cur_frm.cscript.validate = function(doc,cdt,cdn) {
  cur_frm.cscript.update_totals(doc);
}

// TDS
// --------
cur_frm.cscript['Get TDS'] = function(doc, dt, dn) {
  $c_obj(make_doclist(dt,dn), 'get_tds', '', function(r, rt){
  cur_frm.refresh();
  //cur_frm.cscript.update_totals(doc);
  });
}

// Hide /Unhide fields
/*
cur_frm.cscript.is_adv = function(doc,dt,dn){
  if (doc.is_adv=='Yes'){
    unhide_field('credit_to');
    unhide_field('taxes');
    unhide_field('total_tds_amount');
    unhide_field('Get TDS');
  }
  else {
    hide_field('credit_to');
    hide_field('taxes');
    hide_field('total_tds_amount');
    hide_field('Get TDS');
  }
}*/

cur_frm.fields_dict["entries"].grid.get_field("cost_center").get_query = function(doc, cdt, cdn) {
  return 'SELECT `tabCost Center`.`name` FROM `tabCost Center` WHERE `tabCost Center`.`company_name` = "' +doc.company+'" AND `tabCost Center`.%(key)s LIKE "%s" AND `tabCost Center`.`group_or_ledger` = "Ledger" AND `tabCost Center`.`is_active`= "Yes" ORDER BY  `tabCost Center`.`name` ASC LIMIT 50';
}