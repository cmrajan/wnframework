cur_frm.cscript.refresh = function(doc,cdt,cdn){
  // Hide - Un Hide Buttons
  if (doc.is_default) hide_field('Set as Default BOM');
  else unhide_field('Set as Default BOM');
  
  if (flt(doc.docstatus) == 1){
    if (doc.is_active == 'Yes') { unhide_field('Inactivate BOM'); hide_field('Activate BOM');}
    else { hide_field('Inactivate BOM'); unhide_field('Activate BOM');}
  }
}

cur_frm.fields_dict['item'].get_query = function(doc) {
   return 'SELECT DISTINCT `tabItem`.`name`, `tabItem`.description FROM `tabItem` WHERE `tabItem`.`is_active` = "Yes" AND `tabItem`.`%(key)s` like "%s" ORDER BY `tabItem`.`name` LIMIT 50';
}

cur_frm.fields_dict['bom_materials'].grid.get_field('item_code').get_query = function(doc) {
  return 'SELECT DISTINCT `tabItem`.`name`, `tabItem`.description FROM `tabItem` WHERE `tabItem`.`is_active` = "Yes" AND `tabItem`.`%(key)s` like "%s" ORDER BY `tabItem`.`name` LIMIT 50';
}

cur_frm.fields_dict['bom_materials'].grid.get_field('bom_no').get_query = function(doc) {
   var d = locals[this.doctype][this.docname];
   return 'SELECT DISTINCT `tabBill Of Materials`.`name` FROM `tabBill Of Materials` WHERE `tabBill Of Materials`.`item` = "' + d.item_code + '" AND `tabBill Of Materials`.`is_active` = "Yes" AND `tabBill Of Materials`.`%(key)s` like "%s" ORDER BY `tabBill Of Materials`.`name` LIMIT 50';
}

cur_frm.cscript.item = function(doc, cdt, cdn) {
  if (doc.item) {
    get_server_fields('get_item_detail',doc.item,'',doc,cdt,cdn,1);
  }
}

cur_frm.cscript.workstation = function(doc,cdt,cdn) {
  var d = locals[cdt][cdn];
  if (d.workstation) {
    get_server_fields('get_workstation_details',d.workstation,'bom_operations',doc,cdt,cdn,1);
  }
}

cur_frm.cscript.item_code =function(doc,cdt,cdn) {
  var d = locals[cdt][cdn];
  if (d.item_code) {
    arg = "{'item_code' : '" + d.item_code + "', 'bom_no' : ''}";
    get_server_fields('get_bom_material_detail',arg,'bom_materials',doc,cdt,cdn,1);
  }
}

cur_frm.cscript.bom_no = function(doc,cdt,cdn) {
  var d = locals[cdt][cdn];
  if (d.item_code && d.bom_no) {
    arg = "{'item_code' : '" + d.item_code + "', 'bom_no' : '" + d.bom_no + "'}";
    get_server_fields('get_bom_material_detail',arg,'bom_materials',doc,cdt,cdn,1);
  }
}

cur_frm.cscript['Set as Default BOM'] = function(doc,cdt,cdn) {
  var check = confirm("Do you Really want to Set BOM " + doc.name + " as default for Item " + doc.item);
  if (check) {
    $c('runserverobj', args={'method':'set_as_default_bom', 'docs': compress_doclist([doc])}, function(r,rt) {
    refresh_field('is_default');
    hide_field('Set as Default BOM');
    refresh_field('Set as Default BOM');
    });	
  }
}

cur_frm.cscript['Activate BOM'] = function(doc,cdt,cdn) {
  var check = confirm("DO YOU REALLY WANT TO ACTIVATE BOM : " + doc.name);

  if (check) {
    $c('runserverobj', args={'method':'activate_inactivate_bom', 'arg': 'Activate', 'docs': compress_doclist(make_doclist(doc.doctype, doc.name))}, function(r,rt) {
      cur_frm.refresh();
    });	
  }
}

cur_frm.cscript['Inactivate BOM'] = function(doc,cdt,cdn) {
  var check = confirm("DO YOU REALLY WANT TO INACTIVATE BOM : " + doc.name);

  if (check) {
    $c('runserverobj', args={'method':'activate_inactivate_bom', 'arg': 'Inactivate', 'docs': compress_doclist(make_doclist(doc.doctype, doc.name))}, function(r,rt) {
      cur_frm.refresh();
    });	
  }
}