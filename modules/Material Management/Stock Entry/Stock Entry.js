cur_frm.cscript.onload = function(doc, cdt, cdn) {
  cfn_set_fields(doc, cdt, cdn);
}

var cfn_set_fields = function(doc, cdt, cdn) {
  if (doc.purpose == 'Production Order'){
    unhide_field(['production_order', 'process', 'Get Items']);
    hide_field(['from_warehouse', 'to_warehouse','purchase_receipt_no','delivery_note_no']);
    doc.from_warehouse = '';
    doc.to_warehosue = '';
    if (doc.process == 'Backflush'){
      unhide_field('fg_completed_qty');
    }
    else{
      hide_field('fg_completed_qty');
      doc.fg_completed_qty = 0;
    }
  }
  else{
    unhide_field(['from_warehouse', 'to_warehouse']);
    hide_field(['production_order', 'process', 'Get Items', 'fg_completed_qty','purchase_receipt_no','delivery_note_no']);
    doc.production_order = '';
    doc.process = '';
    doc.fg_completed_qty = 0;
  }
  if(doc.purpose == 'Purchase Return'){
    unhide_field('purchase_receipt_no');
  }
  if(doc.purpose == 'Sales Return'){
    unhide_field('delivery_note_no');
  }
}

cur_frm.fields_dict['production_order'].get_query = function(doc) {
   return 'SELECT DISTINCT `tabProduction Order`.`name` FROM `tabProduction Order` WHERE `tabProduction Order`.`docstatus` = 1 AND `tabProduction Order`.`qty` > ifnull(`tabProduction Order`.`produced_qty`,0) AND `tabProduction Order`.`name` like "%s" ORDER BY `tabProduction Order`.`name` DESC LIMIT 50';
}

cur_frm.cscript.purpose = function(doc, cdt, cdn) {
  cfn_set_fields(doc, cdt, cdn);
}

cur_frm.cscript.process = function(doc, cdt, cdn) {
  cfn_set_fields(doc, cdt, cdn);
}

cur_frm.cscript.item_code = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  cal_back = function(doc){ cur_frm.cscript.calc_amount(doc)}
  // get values
  str_arg = "{'item_code': '" + d.item_code + "', 'warehouse': '" + (cstr(doc.purpose) != 'Production Order' ? cstr(doc.from_warehouse): cstr(d.s_warehouse)) + "'}";
  get_server_fields('get_item_details',str_arg,'mtn_details',doc,cdt,cdn,1,cal_back);
}

cur_frm.cscript.transfer_qty = function(doc,cdt,cdn) {
  var d = locals[cdt][cdn];
  if (doc.from_warehouse && (flt(d.transfer_qty) > flt(d.actual_qty))) {
    alert("Transfer Quantity is more than Available Qty");
  }
}
