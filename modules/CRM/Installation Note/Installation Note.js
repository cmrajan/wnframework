cur_frm.cscript.tname = "Installed Item Details";
cur_frm.cscript.fname = "installed_item_details";

cur_frm.cscript.onload = function(doc, dt, dn) {
  if(!doc.status) set_multiple(dt,dn,{status:'Draft'});
}

cur_frm.fields_dict['delivery_note_no'].get_query = function(doc) {
  doc = locals[this.doctype][this.docname];
  var cond = '';
  if(doc.customer_name) {
    cond = '`tabDelivery Note`.customer_name = "'+doc.customer_name+'" AND';
  }
  return repl('SELECT DISTINCT `tabDelivery Note`.name FROM `tabDelivery Note`, `tabDelivery Note Detail` WHERE `tabDelivery Note`.company = "%(company)s" AND `tabDelivery Note`.docstatus = 1 AND ifnull(`tabDelivery Note`.per_installed,0) < 100 AND %(cond)s `tabDelivery Note`.name LIKE "%s" ORDER BY `tabDelivery Note`.name DESC LIMIT 50', {company:doc.company, cond:cond});
}

cur_frm.fields_dict['contact_person'].get_query = function(doc, cdt, cdn) {
  return 'SELECT `tabContact`.contact_name FROM `tabContact` WHERE `tabContact`.is_customer = 1 AND `tabContact`.customer_name = "'+ doc.customer_name+'" AND `tabContact`.contact_name LIKE "%s" ORDER BY `tabContact`.contact_name ASC LIMIT 50';
}

cur_frm.cscript.customer_name = function(doc, cdt, cdn) {
  get_server_fields('get_customer_details','','',doc, cdt, cdn, 1);
}