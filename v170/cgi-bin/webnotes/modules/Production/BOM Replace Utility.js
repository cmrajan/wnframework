
// Get Query functions 
cur_frm.fields_dict['s_bom'].get_query = function(doc) {
  return 'SELECT `tabBill Of Materials`.`name` FROM `tabBill Of Materials` WHERE `tabBill Of Materials`.`docstatus` = 1 AND `tabBill Of Materials`.%(key)s LIKE "%s" ORDER BY `tabBill Of Materials`.`name` DESC LIMIT 50';
}

cur_frm.fields_dict['r_bom'].get_query = function(doc) {
  return 'SELECT `tabBill Of Materials`.`name` FROM `tabBill Of Materials` WHERE `tabBill Of Materials`.`docstatus` = 1 AND `tabBill Of Materials`.`is_active` = "Yes" and `tabBill Of Materials`.%(key)s LIKE "%s" ORDER BY `tabBill Of Materials`.`name` DESC LIMIT 50';
}

cur_frm.fields_dict['s_item'].get_query = function(doc) {
  return 'SELECT DISTINCT `tabItem`.name FROM `tabItem` WHERE `tabItem`.is_active = "Yes" AND (`tabItem`.is_purchase_item = "Yes" OR`tabItem`.is_sub_contracted_item = "Yes") AND `tabItem`.item_code LIKE "%s" ORDER BY `tabItem`.item_code LIMIT 50';
}

cur_frm.fields_dict['r_item'].get_query = function(doc) {
  return 'SELECT DISTINCT `tabItem`.name FROM `tabItem` WHERE `tabItem`.is_active = "Yes" AND (`tabItem`.is_purchase_item = "Yes" OR`tabItem`.is_sub_contracted_item = "Yes") AND `tabItem`.item_code LIKE "%s" ORDER BY `tabItem`.item_code LIMIT 50';
}

// Client Triggers

