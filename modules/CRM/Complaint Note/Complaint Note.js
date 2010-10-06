//caller setup and onload
if (caller == 'setup') {
  cur_frm.fields_dict['so_id'].get_query = function(doc) {
    if (!doc.customer_name) {
      alert("Please enter customer name");
      return 'SELECT DISTINCT `tabSales Order`.`name` FROM `tabSales Order` WHERE 1=2 ORDER BY `tabSales Order`.`name` LIMIT 50';
    }
    return 'SELECT DISTINCT `tabSales Order`.`name` FROM `tabSales Order` WHERE `tabSales Order`.`company_name` = "' + doc.company_name + '" and `tabSales Order`.`customer_name` = "' + doc.customer_name + '" and `tabSales Order`.`docstatus` = 1 and `tabSales Order`.`name` LIKE "' + (doc.so_id?doc.so_id:"") + '%" ORDER BY `tabSales Order`.`name` LIMIT 50';
  }
}

cur_frm.cscript.company_name = function(doc, cdt, cdn) {
  if (doc.company_name)
    get_server_fields('get_company_details','','',doc,cdt,cdn,1);
}
 
cur_frm.cscript.customer_name = function(doc, cdt, cdn) {
  if (doc.customer_name)
    get_server_fields('get_customer_details','','',doc,cdt,cdn,1);
}