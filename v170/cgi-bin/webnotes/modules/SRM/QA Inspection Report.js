cur_frm.fields_dict['item_code'].get_query = function(doc) {
  if(doc.inspection_type == 'Incoming Stock Inspection'){
    return 'SELECT DISTINCT `tabPurchase Receipt Detail`.item_code FROM `tabPurchase Receipt Detail` WHERE `tabPurchase Receipt Detail`.parent = "' + doc.purchase_receipt_no + '" and `tabPurchase Receipt Detail`.qa_reported = "No" and `tabPurchase Receipt Detail`.item_code like "%s" ORDER BY `tabPurchase Receipt Detail`.item_code LIMIT 50';
  }
  else if(doc.inspection_type == 'Outgoing Stock Inspection'){
    return 'SELECT DISTINCT `tabDelivery Note Detail`.item_code FROM `tabDelivery Note Detail` WHERE `tabDelivery Note Detail`.parent = "' + doc.delivery_note_no + '" and `tabDelivery Note Detail`.item_code like "%s" ORDER BY `tabDelivery Note Detail`.item_code LIMIT 50';
  }
  else if(doc.inspection_type == 'InProcess Inspection'){
    return 'SELECT DISTINCT `tabItem`.name FROM `tabItem` WHERE `tabItem`.name like "%s" ORDER BY `tabItem`.name LIMIT 50';
  }
}

cur_frm.cscript.purchase_receipt_no = function(doc, cdt, cdn) {
  if (doc.purchase_receipt_no)
    get_server_fields('get_purchase_receipt_details','','',doc,cdt,cdn,1);
}

cur_frm.cscript.item_code = function(doc, cdt, cdn) {
  if (doc.item_code)
    get_server_fields('get_purchase_receipt_item_details','','',doc,cdt,cdn,1);
}

cur_frm.cscript.inspection_type = function(doc, cdt, cdn) {
  if(doc.inspection_type == 'Incoming Stock Inspection'){
    doc.delivery_note_no = '';
    doc.delivery_note_date = '';
    doc.delivery_note_detail = '';
    
    unhide_field('purchase_receipt_no');
    unhide_field('purchase_receipt_date');
    unhide_field('purchase_receipt_detail_no');
    hide_field('delivery_note_no');
    hide_field('delivery_note_date');
    hide_field('delivery_note_detail');
  }
  else if(doc.inspection_type == 'Outgoing Stock Inspection'){
    doc.purchase_receipt_no = '';
    doc.purchase_receipt_date = '';
    doc.purchase_receipt_detail_no = '';
    
    hide_field('purchase_receipt_no');
    hide_field('purchase_receipt_date');
    hide_field('purchase_receipt_detail_no');
    unhide_field('delivery_note_no');
    unhide_field('delivery_note_date');
    unhide_field('delivery_note_detail');
  }
  else if(doc.inspection_type == 'InProcess Inspection'){
    doc.purchase_receipt_no = '';
    doc.purchase_receipt_date = '';
    doc.purchase_receipt_detail_no = '';
    doc.delivery_note_no = '';
    doc.delivery_note_date = '';
    doc.delivery_note_detail = '';
    
    hide_field('purchase_receipt_no');
    hide_field('purchase_receipt_date');
    hide_field('purchase_receipt_detail_no');
    hide_field('delivery_note_no');
    hide_field('delivery_note_date');
    hide_field('delivery_note_detail');
  }
}