// On Load

cur_frm.cscript.onload = function(doc,dt,dn) {
  if (!doc.voucher_date) doc.voucher_date = dateutil.obj_to_str(new Date());
  if(!doc.posting_date) doc.posting_date = dateutil.obj_to_str(new Date());
  if(doc.supplier)get_server_fields('get_credit_to','','',doc,dt,dn, call_back);
  var call_back = function(doc, dt, dn)
  {
    var doc = locals[doc.doctype][doc.name];
    var el = getchildren('PV Detail',doc.name,'entries');
    for(var i in el){
      if(el[i].item_code && (!el[i].expense_head || !el[i].cost_center)){
        args = "{'item_code':'" + el[i].item_code + "','expense_head':'" + el[i].expense_head + "','cost_center':'" + el[i].cost_center + "'}";
        get_server_fields('get_default_values', args, 'entries', doc, el[i].doctype, el[i].name);
      }
    }
    cur_frm.cscript.calc_total(doc);
  }
}

//==================== Item Code Get Query =======================================================
// Only Is Purchase Item = 'Yes' and Is Active Item = 'Yes' are allowed.
cur_frm.fields_dict['entries'].grid.get_field("item_code").get_query = function(doc, cdt, cdn) {
  return 'SELECT tabItem.name, tabItem.description FROM tabItem WHERE tabItem.is_purchase_item="Yes" AND tabItem.is_active = "Yes" AND tabItem.%(key)s LIKE "%s" LIMIT 50'
}

// Calculate
// ---------
cur_frm.cscript.calc_total = function(doc) {
   // expense
   var t_exp = 0.0;
   var el = getchildren('PV Detail',doc.name,'entries');
   for(var i in el) {
     if (flt(el[i].import_rate) > 0){
       set_multiple('PV Detail', el[i].name, {'rate': flt(doc.conversion_rate) * flt(el[i].import_rate) }, 'entries');
     }
     set_multiple('PV Detail', el[i].name, {'amount': flt(el[i].qty) * flt(el[i].rate) }, 'entries')
     t_exp += flt(el[i].amount);
   }
   doc.net_total = flt(t_exp);

   // add taxes
   var a_tax = 0.0;
   var el = getchildren('PV Add Tax Detail',doc.name,'add_taxes');
   for(var i in el) {
     a_tax += flt(el[i].add_amount);
   }

   doc.total_taxes = flt(a_tax);
   doc.grand_total = doc.net_total + doc.total_taxes;
	
   // taxes
   var t_tds_tax = 0.0;
   var t_oth_tax = 0.0
   var el = getchildren('PV Ded Tax Detail',doc.name,'taxes');
   for(var i in el) {
      if (el[i].tds_type == 'Not Applicable')  t_oth_tax += flt(el[i].ded_amount);
      else  t_tds_tax += flt(el[i].ded_amount);
   }
   doc.total_tds_on_voucher = flt(t_tds_tax);
   doc.other_tax_deducted = flt(t_oth_tax);

   // total amount to pay
   doc.total_amount_to_pay = flt(doc.net_total) + flt(doc.total_taxes) - flt(doc.total_tds_on_voucher) - flt(doc.other_tax_deducted );

  // outstanding amount 
  if(doc.docstatus==0) doc.outstanding_amount = flt(doc.net_total) + flt(doc.total_taxes) - flt(doc.total_tds_on_voucher) - flt(doc.other_tax_deducted ) - flt(doc.total_advance);
	
  refresh_many(['net_total','total_taxes','grand_total','total_tds_on_voucher','other_tax_deducted','total_amount_to_pay', 'outstanding_amount']);

}
var calc_tax_amount = function(doc,cdt,cdn) {
  var el = getchildren('PV Ded Tax Detail',doc.name,'taxes');
  for(var i in el) {
    if (el[i].tds_type=='Not Applicable'){
      el[i].ded_amount = flt(el[i].tax_rate * doc.grand_total / 100);
    }
    refresh_field('taxes');
  }
}
var calc_total_advance = function(doc,cdt,cdn) {
  var doc = locals[doc.doctype][doc.name];
  var el = getchildren('Advance Allocation Detail',doc.name,'advance_allocation_details')
  var tot_tds=0;
  var total_advance = 0;
  for(var i in el) {
    if (! el[i].allocated_amount == 0) {
      total_advance += flt(el[i].allocated_amount);
      tot_tds += flt(el[i].tds_allocated)
    }
  }
  doc.total_amount_to_pay = flt(doc.grand_total) - flt(doc.total_tds_on_voucher) - flt(doc.other_tax_deducted);
  doc.tds_amount_on_advance = flt(tot_tds);
  doc.total_advance = flt(total_advance);
  doc.outstanding_amount = flt(doc.total_amount_to_pay) - flt(total_advance);
  refresh_many(['total_adjustment_amount','outstanding_amount','tds_amount_on_advance']);
}

cur_frm.cscript.supplier = function(doc,cdt,cdn){
  get_server_fields('get_credit_to','','',doc,cdt,cdn);
}

cur_frm.cscript.calc_exp_row = function(doc,dt,dn) {
	var d = locals[dt][dn];
	d.amount = flt(d.qty * d.rate);
	refresh_field('amount',dn,'entries');
  if (! doc.conversion_rate){
    doc.conversion_rate = 1;
    refresh_field('conversion_rate');
  }
  set_multiple('PV Detail', dn, {'import_rate': flt(d.rate) / flt(doc.conversion_rate) }, 'entries');
  if(! d.expense_head){
    d.expense_head = doc.expense_head_main; 
    refresh_field('expense_head',dn,'entries');
  }
	d.cost_center = doc.cost_center_main; refresh_field('cost_center',dn,'entries');
  cur_frm.cscript.calc_total(doc)
}

cur_frm.cscript.conversion_rate = function(doc,cdt,cdn) {
  cur_frm.cscript.calc_total(doc,cdt,cdn);
}

cur_frm.cscript.qty  = function(doc,dt,dn) { cur_frm.cscript.calc_exp_row(doc,dt,dn); }
cur_frm.cscript.rate = function(doc,dt,dn) { cur_frm.cscript.calc_exp_row(doc,dt,dn); }

cur_frm.cscript.import_rate = function(doc,dt,dn) {
  var d = locals[dt][dn];
  set_multiple('PV Detail', d.name, {'rate': flt(d.import_rate) * flt(doc.conversion_rate) }, 'entries');
  cur_frm.cscript.calc_exp_row(doc,dt,dn)
}

cur_frm.cscript.calc_ded_tax_row = function(doc,dt,dn,fn,ratefn,amtfn) {
	var d = locals[dt][dn];
	if(d[ratefn]) {
		d[amtfn] = flt(d[ratefn] * doc.grand_total / 100);
		refresh_field(amtfn,dn,fn);
	}
	cur_frm.cscript.calc_total(doc);
}

cur_frm.cscript.calc_add_tax_row = function(doc,dt,dn,fn,ratefn,amtfn) {
	var d = locals[dt][dn];
	if(d[ratefn]) {
		d[amtfn] = flt(d[ratefn] * doc.net_total / 100);
		refresh_field(amtfn,dn,fn);
	}
	cur_frm.cscript.calc_total(doc);
}


cur_frm.cscript.tax_rate = function(doc,dt,dn) { cur_frm.cscript.calc_ded_tax_row(doc,dt,dn,'taxes','tax_rate','ded_amount'); }
cur_frm.cscript.add_tax_rate = function(doc,dt,dn) { cur_frm.cscript.calc_add_tax_row(doc,dt,dn,'add_taxes','add_tax_rate','add_amount'); }
cur_frm.cscript.add_amount = function(doc,dt,dn) { cur_frm.cscript.calc_total(doc); }
cur_frm.cscript.ded_amount = function(doc,dt,dn) { cur_frm.cscript.calc_total(doc); }


cur_frm.cscript.expense_head_main = function(doc,dt,dn) {
  cur_frm.cscript.update_expense_head_cost_center(doc,dt,dn);
}

cur_frm.cscript.cost_center_main = function(doc,dt,dn) {
  cur_frm.cscript.update_expense_head_cost_center(doc,dt,dn);
}

cur_frm.cscript['Recalculate'] = function(doc, dt, dn) {
  calc_tax_amount(doc,cdt,cdn)
  cur_frm.cscript.calc_total(doc, cdt, cdn);
  calc_total_advance(doc,cdt,cdn);
}

cur_frm.cscript['Get Items'] = function(doc, dt, dn) {
  var callback = function(r,rt) { 
    doc.purchase_order_main = '';
    doc.purchase_receipt_main = '';
    refresh_field('purchase_order_main');
    refresh_field('purchase_receipt_main');
  }
  get_server_fields('pull_details','','',doc, dt, dn,1,callback);
}


// TDS
// --------

cur_frm.cscript['Get TDS'] = function(doc, dt, dn) {
  var callback = function(r,rt) {
    cur_frm.refresh();
    cur_frm.cscript.calc_total(locals[dt][dn]);
  }
  if (! doc.manual_tax_deduction){
    $c_obj(make_doclist(dt,dn), 'get_tds', '', callback);
  }
}


// Copy main expense head to table
// -------------------------------

cur_frm.cscript.update_expense_head_cost_center = function(doc,dt,dn) {
  el = getchildren('PV Detail',doc.name,'entries')
  for(var i in el){
    if(!el[i].expense_head)el[i].expense_head = doc.expense_head_main;
    if(!el[i].cost_center)el[i].cost_center = doc.cost_center_main;
  }
  refresh_field('entries');
}


// Restrict account selections
// ---------------------------

cur_frm.fields_dict['credit_to'].get_query = function(doc) {
  return 'SELECT tabAccount.name FROM tabAccount WHERE tabAccount.debit_or_credit="Credit" AND tabAccount.is_pl_account="No" AND tabAccount.group_or_ledger="Ledger" AND tabAccount.is_active="Yes" AND tabAccount.company="'+doc.company+'" AND tabAccount.%(key)s LIKE "%s"'
}

cur_frm.fields_dict['expense_head_main'].get_query = function(doc) {
  return 'SELECT tabAccount.name FROM tabAccount WHERE tabAccount.debit_or_credit="Debit" AND tabAccount.group_or_ledger="Ledger" AND tabAccount.is_active="Yes" AND tabAccount.company="'+doc.company+'" AND tabAccount.%(key)s LIKE "%s"'
}

cur_frm.fields_dict['purchase_order_main'].get_query = function(doc) {
  if (doc.supplier){
    return 'SELECT `tabPurchase Order`.`name` FROM `tabPurchase Order` WHERE `tabPurchase Order`.`docstatus` = 1 AND `tabPurchase Order`.supplier = "'+ doc.supplier +'" AND `tabPurchase Order`.`status` != "Stopped" AND ifnull(`tabPurchase Order`.`per_billed`,0) < 100 AND `tabPurchase Order`.`company` = "' + doc.company + '" AND `tabPurchase Order`.%(key)s LIKE "%s" ORDER BY `tabPurchase Order`.`name` DESC LIMIT 50'
  } else {
    return 'SELECT `tabPurchase Order`.`name` FROM `tabPurchase Order` WHERE `tabPurchase Order`.`docstatus` = 1 AND `tabPurchase Order`.`status` != "Stopped" AND ifnull(`tabPurchase Order`.`per_billed`, 0) < 100 AND `tabPurchase Order`.`company` = "' + doc.company + '" AND `tabPurchase Order`.%(key)s LIKE "%s" ORDER BY `tabPurchase Order`.`name` DESC LIMIT 50'
  }
}

cur_frm.fields_dict['purchase_receipt_main'].get_query = function(doc) {
  if (doc.supplier){
    return 'SELECT `tabPurchase Receipt`.`name` FROM `tabPurchase Receipt` WHERE `tabPurchase Receipt`.`docstatus` = 1 AND `tabPurchase Receipt`.supplier = "'+ doc.supplier +'" AND `tabPurchase Receipt`.`status` != "Stopped" AND ifnull(`tabPurchase Receipt`.`per_billed`, 0) < 100 AND `tabPurchase Receipt`.`company` = "' + doc.company + '" AND `tabPurchase Receipt`.%(key)s LIKE "%s" ORDER BY `tabPurchase Receipt`.`name` DESC LIMIT 50'
  } else {
    return 'SELECT `tabPurchase Receipt`.`name` FROM `tabPurchase Receipt` WHERE `tabPurchase Receipt`.`docstatus` = 1 AND `tabPurchase Receipt`.`status` != "Stopped" AND ifnull(`tabPurchase Receipt`.`per_billed`, 0) < 100 AND `tabPurchase Receipt`.`company` = "' + doc.company + '" AND `tabPurchase Receipt`.%(key)s LIKE "%s" ORDER BY `tabPurchase Receipt`.`name` DESC LIMIT 50'
  }
}

cur_frm.fields_dict['entries'].grid.get_field("expense_head").get_query = function(doc) {
  return 'SELECT tabAccount.name FROM tabAccount WHERE tabAccount.debit_or_credit="Debit" AND tabAccount.group_or_ledger="Ledger" AND tabAccount.is_active="Yes" AND tabAccount.company="'+doc.company+'" AND tabAccount.%(key)s LIKE "%s"'
}

cur_frm.fields_dict['add_taxes'].grid.get_field("add_tax_code").get_query = function(doc) {
  return 'SELECT tabAccount.name FROM tabAccount WHERE tabAccount.group_or_ledger="Ledger" AND tabAccount.is_active="Yes" AND (tabAccount.account_type = "Tax" OR tabAccount.account_type = "Chargeable" OR tabAccount.account_type = "Expense Account") AND tabAccount.company="'+doc.company+'" AND tabAccount.%(key)s LIKE "%s"'
}

// Tax Deduction
cur_frm.fields_dict['taxes'].grid.get_field("tax_code").get_query = function(doc) {
  return 'SELECT tabAccount.name FROM tabAccount WHERE tabAccount.group_or_ledger="Ledger" AND tabAccount.is_active="Yes" AND (tabAccount.account_type = "Tax" OR tabAccount.account_type = "Chargeable") AND tabAccount.company="'+doc.company+'" AND tabAccount.%(key)s LIKE "%s"'
}

// Make Journal Voucher
// --------------------

cur_frm.cscript['Make Bank Voucher'] = function(doc, dt, dn) {
  var call_back = function(r,rt) {
    cur_frm.cscript.make_jv(doc,dt,dn,r.message);
  }
  args = {'credit_to':doc.credit_to, 'company':doc.company};
  $c_obj('ERP Setup', 'get_bank_defaults', docstring(args), call_back);

}

cur_frm.cscript.make_jv = function(doc, dt, dn, det) {
  var jv = LocalDB.create('Journal Voucher');
  jv = locals['Journal Voucher'][jv];
  jv.voucher_type = det.def_bv_type;
  jv.voucher_series = det.def_bv_series;
  jv.voucher_date = doc.voucher_date;
  jv.posting_date = doc.posting_date;
  jv.remark = repl('Payment against voucher %(vn)s for %(rem)s', {vn:doc.name, rem:doc.remarks});
  jv.total_debit = doc.outstanding_amount;
  jv.total_credit = doc.outstanding_amount;
  jv.fiscal_year = doc.fiscal_year;
  jv.company = doc.company;
  
  // debit to creditor
  var d1 = LocalDB.add_child(jv, 'Journal Voucher Detail', 'entries');
  d1.account = doc.credit_to;
  d1.debit = doc.outstanding_amount;
  d1.balance = det.acc_balance;
  d1.against_voucher = doc.name;
  
  // credit to bank
  var d1 = LocalDB.add_child(jv, 'Journal Voucher Detail', 'entries');
  d1.account = det.def_bank_account;
  d1.balance = det.bank_balance;
  d1.credit = doc.outstanding_amount;
  
  loaddoc('Journal Voucher', jv.name);
}

// Refresh
// -------

cur_frm.cscript.refresh = function(doc, dt, dn) {
  // Show / Hide button
  if(doc.docstatus==1 && doc.outstanding_amount > 0) { unhide_field('Make Bank Voucher'); }
  else hide_field('Make Bank Voucher');
}


/*---------------------- Client Side Validation --------------------------------------------*/

cur_frm.cscript.validate = function(doc, cdt, cdn) {
  cur_frm.cscript.calc_total(doc, cdt, cdn);
  calc_total_advance(doc, cdt, cdn);
}

//trigger on item
cur_frm.cscript.item_code = function(doc,cdt,cdn){
  var d = locals[cdt][cdn];
  if(d.item_code){
    get_server_fields('get_item_details',d.item_code,'entries',doc,cdt,cdn,1);
  }
}
//trigger on tax code
cur_frm.cscript.add_tax_code = function(doc,cdt,cdn) {
  var callback = function(doc){
    cur_frm.cscript.calc_add_tax_row(doc,cdt,cdn,'add_taxes','add_tax_rate','add_amount');
  }
  var d = locals[cdt][cdn];
  if(d.add_tax_code){
    get_server_fields('get_rate',d.add_tax_code,'add_taxes',doc,cdt,cdn,1,callback);
  }
  
}

//trigger on allocate
cur_frm.cscript.allocated_amount = function(doc,cdt,cdn){
  var d = locals[cdt][cdn];
  if (d.allocated_amount && d.tds_amount){
    d.tds_allocated=flt(d.tds_amount*(d.allocated_amount/d.advance_amount))
    refresh_field('tds_allocated', d.name, 'advance_allocation_details');
  }
  tot_tds=0
  el = getchildren('Advance Allocation Detail',doc.name,'advance_allocation_details')
  for(var i in el){
    tot_tds += el[i].tds_allocated
  }
  doc.tds_amount_on_advance = tot_tds
  refresh_field('tds_amount_on_advance');
  
  calc_total_advance(doc, cdt, cdn);
}

cur_frm.fields_dict['cost_center_main'].get_query = function(doc, cdt, cdn) {
  return 'SELECT `tabCost Center`.`name` FROM `tabCost Center` WHERE `tabCost Center`.`company_name` = "' +doc.company+'" AND `tabCost Center`.%(key)s LIKE "%s" AND `tabCost Center`.`group_or_ledger` = "Ledger" AND `tabCost Center`.`is_active`= "Yes" ORDER BY  `tabCost Center`.`name` ASC LIMIT 50';
}