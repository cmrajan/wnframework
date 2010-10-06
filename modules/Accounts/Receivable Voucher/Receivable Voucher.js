cur_frm.cscript.tname = "RV Detail";
cur_frm.cscript.fname = "entries";
cur_frm.cscript.other_fname = "other_charges";
cur_frm.cscript.sales_team_fname = "sales_team";

$import(Sales Common)
$import(Other Charges)

// On Load

// -------

cur_frm.cscript.onload = function(doc,dt,dn) {
  if(doc.customer && (!doc.debit_to))get_server_fields('get_debit_to','','',doc,dt,dn);
    //cur_frm.cscript['Calculate Other Charges'](doc,cdt,cdn);
    if(!doc.voucher_date) set_multiple(dt,dn,{voucher_date:get_today()});
    if(!doc.posting_date) set_multiple(dt,dn,{posting_date:get_today()});
    if(!doc) set_multiple(dt,dn,{posting_date:get_today()});
}

// Set Due Date=posting date + credit days
//-----------------------------------------

cur_frm.cscript.debit_to = function(doc,dt,dn) {
  if(doc.debit_to && doc.posting_date && ! doc.due_date)get_server_fields('set_due_date','','',doc,dt,dn);
  }
  
cur_frm.cscript.posting_date = cur_frm.cscript.debit_to;

// Copy main income head to table
// -------------------------------

cur_frm.cscript.update_income_account = function(doc,dt,dn) {
	var d = locals[dt][dn];
	if(doc.income_account_main) {
		d.income_account = doc.income_account_main;
		refresh_many(['income_account'],dn,'entries');
	}
	if(doc.cost_center_main) {
		d.cost_center = doc.cost_center_main;
		refresh_many(['cost_center'],dn,'entries');
	}
}

cur_frm.cscript.update_income_account_from_main = function(doc,dt,dn) {
	el = getchildren('RV Detail',doc.name,'entries')
	for(var i in el){
          el[i].income_account = doc.income_account_main;
	  el[i].cost_center = doc.cost_center_main;
	}
	refresh_field('entries');
}


// Details Calculation
// -------------------

cur_frm.cscript.income_account_main = function(doc,dt,dn) {
  cur_frm.cscript.update_income_account_from_main(doc,dt,dn);
}
cur_frm.cscript.cost_center_main = function(doc,dt,dn) {
  cur_frm.cscript.update_income_account_from_main(doc,dt,dn);
}


cur_frm.cscript.calc_adjustment_amount = function(doc,cdt,cdn) {
  var doc = locals[doc.doctype][doc.name];
  var el = getchildren('Advance Adjustment Detail',doc.name,'advance_adjustment_details');
  var total_adjustment_amt = 0
  for(var i in el) {
      total_adjustment_amt += flt(el[i].allocated_amount)
  }
  doc.total_advance = flt(total_adjustment_amt);
  doc.outstanding_amount = flt(doc.grand_total) - flt(total_adjustment_amt);
  refresh_many(['total_advance','outstanding_amount']);
}

cur_frm.cscript.allocated_amount = function(doc,cdt,cdn){
  cur_frm.cscript.calc_adjustment_amount(doc,cdt,cdn);
}


cur_frm.cscript['Get Items'] = function(doc, dt, dn) {
  /*var call_back = function(r,rt) { 
    doc.sales_order_main = '';
    doc.delivery_note_main = '';
    refresh_field('sales_order_main');
    refresh_field('delivery_note_main');
  }
*/
  //$c_obj([doc], 'check_user', user, function(r,rt) { alert(r.message); });
  //$c_obj(doc.name, 'pull_details','entries', call_back);
  $c_obj(make_doclist(doc.doctype,doc.name),'pull_details','',
     function(r, rt) {
    doc.sales_order_main = '';
    doc.delivery_note_main = '';
    refresh_field('sales_order_main');
    refresh_field('delivery_note_main');
    }
  );
}

//------------------------------Sales Person Allocated amount------------------------------------------------

cur_frm.cscript.allocated_percentage = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  if (d.allocated_percentage) {
    var amount = flt(doc.gross_amount)*flt(d.allocated_percentage)/100;
    refresh_field('allocated_amount', d.name, 'sales_team');
  }
}


// Restrict account selections
// ---------------------------

cur_frm.fields_dict.debit_to.get_query = function(doc) {
  return 'SELECT tabAccount.name FROM tabAccount WHERE tabAccount.debit_or_credit="Debit" AND tabAccount.is_pl_account = "No" AND tabAccount.group_or_ledger="Ledger" AND tabAccount.is_active="Yes" AND tabAccount.company="'+doc.company+'" AND tabAccount.%(key)s LIKE "%s"'
}

cur_frm.fields_dict.income_account_main.get_query = function(doc) {
  return 'SELECT tabAccount.name FROM tabAccount WHERE tabAccount.debit_or_credit="Credit" AND tabAccount.group_or_ledger="Ledger" AND tabAccount.is_active="Yes" AND tabAccount.company="'+doc.company+'" AND tabAccount.account_type ="Income Account" AND tabAccount.%(key)s LIKE "%s"'
}

cur_frm.fields_dict.entries.grid.get_field("income_account").get_query = function(doc) {
  return 'SELECT tabAccount.name FROM tabAccount WHERE tabAccount.debit_or_credit="Credit" AND tabAccount.group_or_ledger="Ledger" AND tabAccount.is_active="Yes" AND tabAccount.company="'+doc.company+'" AND tabAccount.account_type ="Income Account" AND tabAccount.%(key)s LIKE "%s"'
}


cur_frm.fields_dict.sales_order_main.get_query = function(doc) {
  if (doc.so_conversion_rate)
    return 'SELECT DISTINCT `tabSales Order`.`name` FROM `tabSales Order` WHERE `tabSales Order`.company = "' + doc.company + '" and `tabSales Order`.`docstatus` = 1 and `tabSales Order`.`status` != "Stopped" and ifnull(`tabSales Order`.per_billed,0) < 100 and `tabSales Order`.`conversion_rate` =  " + doc.so_conversion_rate + " and `tabSales Order`.%(key)s LIKE "%s" ORDER BY `tabSales Order`.`name` DESC LIMIT 50';
  else
    return 'SELECT DISTINCT `tabSales Order`.`name` FROM `tabSales Order` WHERE `tabSales Order`.company = "' + doc.company + '" and `tabSales Order`.`docstatus` = 1 and `tabSales Order`.`status` != "Stopped" and ifnull(`tabSales Order`.per_billed,0) < 100 and `tabSales Order`.%(key)s LIKE "%s" ORDER BY `tabSales Order`.`name` DESC LIMIT 50';
}

cur_frm.fields_dict.delivery_note_main.get_query = function(doc) {
  if (doc.so_conversion_rate)
    return 'SELECT DISTINCT `tabDelivery Note`.`name` FROM `tabDelivery Note` WHERE `tabDelivery Note`.company = "' + doc.company + '" and `tabDelivery Note`.`docstatus` = 1 and ifnull(`tabDelivery Note`.per_billed,0) < 100 and `tabDelivery Note`.`conversion_rate` =  " + doc.so_conversion_rate + " and `tabDelivery Note`.%(key)s LIKE "%s" ORDER BY `tabDelivery Note`.`name` DESC LIMIT 50';
  else
    return 'SELECT DISTINCT `tabDelivery Note`.`name` FROM `tabDelivery Note` WHERE `tabDelivery Note`.company = "' + doc.company + '" and `tabDelivery Note`.`docstatus` = 1 and ifnull(`tabDelivery Note`.per_billed,0) < 100 and `tabDelivery Note`.%(key)s LIKE "%s" ORDER BY `tabDelivery Note`.`name` DESC LIMIT 50';
}

// Make Journal Voucher
// --------------------


cur_frm.cscript['Make Bank Voucher'] = function(doc, dt, dn) {
  var call_back = function(r,rt) {
    cur_frm.cscript.make_jv(doc,dt,dn,r.message);
  }
  args = {'credit_to':doc.debit_to, 'company':doc.company};
  $c_obj('ERP Setup', 'get_bank_defaults', docstring(args), call_back);
}

cur_frm.cscript.make_jv = function(doc, dt, dn, det) {
  var jv = LocalDB.create('Journal Voucher');
  jv = locals['Journal Voucher'][jv];
  jv.voucher_type = det.def_bv_type;
  jv.naming_series = det.def_bv_series;
  jv.voucher_date = doc.voucher_date;
  jv.posting_date = doc.posting_date;
  jv.company = doc.company;
  jv.remark = repl('Payment received against invoice %(vn)s for %(rem)s', {vn:doc.name, rem:doc.remarks});
  jv.fiscal_year = doc.fiscal_year;
  
  // debit to creditor
  var d1 = LocalDB.add_child(jv, 'Journal Voucher Detail', 'entries');
  d1.account = doc.debit_to;
  d1.credit = doc.outstanding_amount;
  d1.against_invoice = doc.name;
  d1.balance = det.acc_balance;
  
  // credit to bank
  var d1 = LocalDB.add_child(jv, 'Journal Voucher Detail', 'entries');
  d1.account = det.def_bank_account;
  d1.debit = doc.outstanding_amount;
  d1.balance = det.bank_balance;
  
  loaddoc('Journal Voucher', jv.name);
}

// Refresh
// -------

cur_frm.cscript.refresh = function(doc, dt, dn) {
  // Show / Hide button
  if((doc.docstatus==1)&&(doc.outstanding_amount!=0)) { unhide_field('Make Bank Voucher'); }
  else hide_field('Make Bank Voucher');
}

cur_frm.cscript.customer = function(doc,dt,dn) {
  if(doc.customer){
    get_server_fields('pull_address','','',doc, cdt, cdn, 1);
  }
}

cur_frm.fields_dict['cost_center_main'].get_query = function(doc, cdt, cdn) {
  return 'SELECT `tabCost Center`.`name` FROM `tabCost Center` WHERE `tabCost Center`.`company_name` = "' +doc.company+'" AND `tabCost Center`.%(key)s LIKE "%s" AND `tabCost Center`.`group_or_ledger` = "Ledger" AND `tabCost Center`.`is_active`= "Yes" ORDER BY  `tabCost Center`.`name` ASC LIMIT 50';
}