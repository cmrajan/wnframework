cur_frm.cscript.tname = "Purchase Receipt Detail";
cur_frm.cscript.fname = "purchase_receipt_details";

$import(Purchase Common)

//========================== On Load ================================================================
cur_frm.cscript.onload = function(doc, cdt, cdn) {
  if(!doc.fiscal_year && doc.__islocal){ set_default_values(doc);}
  if (!doc.posting_date) doc.posting_date = dateutil.obj_to_str(new Date());
  if (!doc.transaction_date) doc.transaction_date = dateutil.obj_to_str(new Date());
  if (!doc.status) doc.status = 'Draft';
  if(doc.__islocal){ 
    cur_frm.cscript.get_default_schedule_date(doc);
  }
}

//========================== Refresh ===============================================================
cur_frm.cscript.refresh = function(doc, cdt, cdn) { 
  // Unhide Fields in Next Steps
  // ---------------------------------
  hide_field(['Make Payable Voucher']);
  if(doc.docstatus == 1){
    var ch = getchildren('Purchase Receipt Detail',doc.name,'purchase_receipt_details');
    for(var i in ch){
      if(ch[i].qty > ch[i].billed_qty) unhide_field(['Make Payable Voucher']);
    }
  }
  else{
    hide_field(['Make Payable Voucher']);
  }
}

//======================= posting date =============================
cur_frm.cscript.transaction_date = function(doc,cdt,cdn){
  if(doc.__islocal){ 
    cur_frm.cscript.get_default_schedule_date(doc);
  }
}


//========================= Received Qty =============================================================

cur_frm.cscript.received_qty = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  ret = {
      'qty' : 0,
      'stock_qty': 0,
      'rejected_qty' : 0
    }
  set_multiple('Purchase Receipt Detail', cdn, ret, 'purchase_receipt_details');
  cur_frm.cscript.calc_amount(doc, 2);
}

//======================== Qty (Accepted Qty) =========================================================

cur_frm.cscript.qty = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  // Step 1 :=> Check If Qty > Received Qty
  if (flt(d.qty) > flt(d.received_qty)) {
    alert("Accepted Qty cannot be greater than Received Qty")
    ret = {
      'qty' : 0,
      'stock_qty': 0,
      'rejected_qty' : 0
    }
    // => Set Qty = 0 and rejected_qty = 0
    set_multiple('Purchase Receipt Detail', cdn, ret, 'purchase_receipt_details');
    cur_frm.cscript.calc_amount(doc, 2);
    // => Return
    return
  }
  // Step 2 :=> Check IF Qty <= REceived Qty
  else {
    ret = {
      'rejected_qty':flt(d.received_qty) - flt(d.qty)
    }
    // => Set Rejected Qty = Received Qty - Qty
    set_multiple('Purchase Receipt Detail', cdn, ret, 'purchase_receipt_details');
    // => Calculate Amount
    cur_frm.cscript.calc_amount(doc, 2);
    cur_frm.cscript.update_stock_qty(doc,cdt,cdn);
  }  
}

//======================== Rejected Qty =========================================================
cur_frm.cscript.rejected_qty = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  // Step 1 :=> Check If Rejected Qty > Received Qty
  if (flt(d.rejected_qty) > flt(d.received_qty)) {
    alert("Rejected Qty cannot be greater than Received Qty") 
    ret = {
      'qty' : 0,
      'stock_qty': 0,
      'rejected_qty' : 0
    }
    // => Set Qty = 0 and rejected_qty = 0
    set_multiple('Purchase Receipt Detail', cdn, ret, 'purchase_receipt_details');
    cur_frm.cscript.calc_amount(doc, 2);
    // => Return
    return
  }
  // Step 2 :=> Check IF Rejected Qty <= REceived Qty
  else {
    ret = {
      'qty':flt(d.received_qty) - flt(d.rejected_qty)
    }
    // => Set Qty = Received Qty - Rejected Qty
    set_multiple('Purchase Receipt Detail', cdn, ret, 'purchase_receipt_details');
    // Calculate Amount
    cur_frm.cscript.calc_amount(doc, 2);
    cur_frm.cscript.update_stock_qty(doc,cdt,cdn);
  }
}

//================================= Purchase Order No Get Query ====================================
cur_frm.fields_dict['purchase_order_no'].get_query = function(doc) {
  if (doc.supplier)
    return 'SELECT DISTINCT `tabPurchase Order`.`name` FROM `tabPurchase Order` WHERE `tabPurchase Order`.`supplier` = "' +doc.supplier + '" and`tabPurchase Order`.`docstatus` = 1 and `tabPurchase Order`.`status` != "Stopped" and ifnull(`tabPurchase Order`.`per_received`, 0) < 100  and `tabPurchase Order`.`currency` = ifnull("' +doc.currency+ '","") and `tabPurchase Order`.company = "'+ doc.company +'" and `tabPurchase Order`.%(key)s LIKE "%s" ORDER BY `tabPurchase Order`.`name` DESC LIMIT 50';
  else
    return 'SELECT DISTINCT `tabPurchase Order`.`name` FROM `tabPurchase Order` WHERE `tabPurchase Order`.`docstatus` = 1 and `tabPurchase Order`.`company` = "'+ doc.company +'" and `tabPurchase Order`.`status` != "Stopped" and ifnull(`tabPurchase Order`.`per_received`, 0) < 100 and `tabPurchase Order`.%(key)s LIKE "%s" ORDER BY `tabPurchase Order`.`name` DESC LIMIT 50';
}

// On Button Click Functions
// ------------------------------------------------------------------------------


// ================================ Make Payable Voucher ==========================================
cur_frm.cscript['Make Payable Voucher'] = function(doc,dt,dn) {
  n = createLocal('Payable Voucher');
  $c('dt_map', args={
    'docs':compress_doclist([locals['Payable Voucher'][n]]),
    'from_doctype':doc.doctype,
    'to_doctype':'Payable Voucher',
    'from_docname':doc.name,
    'from_to_list':"[['Purchase Receipt','Payable Voucher'],['Purchase Receipt Detail','PV Detail']]"
    }, function(r,rt) {
       loaddoc('Payable Voucher', n);
    }
  );
}
