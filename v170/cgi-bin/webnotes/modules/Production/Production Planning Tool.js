cur_frm.cscript.onload = function(doc, cdt, cdn) {
  if(!doc.fiscal_year){ set_default_values(doc);}
}

cur_frm.cscript.item_code = function(doc,cdt,cdn) {
  var d = locals[cdt][cdn];
  if (d.item_code) {
    temp = "{'item_code':'"+(d.item_code?d.item_code:'')+"'}";
    get_server_fields('get_item_details', temp, 'pp_details', doc, cdt, cdn, 1);
  }
}

cur_frm.fields_dict['pp_details'].grid.get_field('item_code').get_query = function(doc) {
  return 'SELECT DISTINCT `tabItem`.`name`,`tabItem`.`item_name` FROM `tabItem` WHERE `tabItem`.`is_active` = "Yes" AND tabItem.%(key)s like "%s" ORDER BY `tabItem`.`name` LIMIT 50';
}

// Get Query for BOM NO
//-------------------------------------------------------------------------------
cur_frm.fields_dict['pp_details'].grid.get_field('bom_no').get_query = function(doc) {
  var d = locals[this.doctype][this.docname];
  return 'SELECT DISTINCT `tabBill Of Materials`.`name`, `tabBill Of Materials`.`remarks` FROM `tabBill Of Materials` WHERE `tabBill Of Materials`.`item` = "' + d.item_code + '" AND `tabBill Of Materials`.`is_active` = "Yes" AND `tabBill Of Materials`.`name` like "%s" ORDER BY `tabBill Of Materials`.`name` LIMIT 50';
}

cur_frm.cscript['Clear Document Table'] = function(doc, cdt, cdn){
   $c('runserverobj', args={'method':'clear_table', 'arg': 'pp_so_details', 'docs': compress_doclist(make_doclist(doc.doctype, doc.name))}, function(r,rt) {
      cur_frm.refresh();
    });	
}

cur_frm.cscript['Clear Item Table'] = function(doc, cdt, cdn){
   $c('runserverobj', args={'method':'clear_table', 'arg': 'pp_details', 'docs': compress_doclist(make_doclist(doc.doctype, doc.name))}, function(r,rt) {
      cur_frm.refresh();
    });	
}

cur_frm.cscript['Get Raw Material Report'] = function(doc, cdt, cdn) {
  $c_obj_csv(make_doclist(cdt, cdn), 'get_raw_materials_report', '');
}