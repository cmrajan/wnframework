cur_frm.cscript.refresh = function(doc, cdt, cdn){
  if(doc.__islocal != 1){
    unhide_field(['Create Quotation']);
    }
  else{
    hide_field(['Create Enquiry']);
  }
 }

// ONLOAD
// ===================================================================================
cur_frm.cscript.onload = function(doc, cdt, cdn) {
  if(!doc.status) set_multiple(cdt,cdn,{status:'Draft'});
    if (!doc.date){ 
  doc.transaction_date = date.obj_to_str(new Date());
  }
 }
  
 //Fetch Item Details
//==============================================
cur_frm.cscript.item_code = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  if (d.item_code) {
    get_server_fields('get_item_details',d.item_code,'enquiry_details',doc,cdt,cdn,1);
  }
}

 //Fetch Customer Details
//==============================================
cur_frm.cscript.customer = function(doc, cdt, cdn){
  if (doc.customer) {
    get_server_fields('get_cust_address',doc.customer,'',doc,cdt,cdn,1);
  }
}
 
 
cur_frm.fields_dict['contact_person'].get_query = function(doc, cdt, cdn) {
  return 'SELECT `tabContact`.contact_name FROM `tabContact` WHERE `tabContact`.is_customer = 1 AND `tabContact`.customer_name = "'+ doc.customer+'" AND `tabContact`.is_active = "Yes" AND `tabContact`.contact_name LIKE "%s" ORDER BY `tabContact`.contact_name ASC LIMIT 50';
}

cur_frm.cscript.contact_person = function(doc, cdt, cdn){
  if (doc.contact_person) {
    arg = {};
    arg.contact_person = doc.contact_person;
    arg.customer = doc.customer;
    get_server_fields('get_contact_details',docstring(arg),'',doc,cdt,cdn,1);
  }
}

 // Create New Quotation
// ===============================================================
cur_frm.cscript['Create Quotation'] = function(doc){
  n = createLocal("Quotation");
  $c('dt_map', args={
	  'docs':compress_doclist([locals["Quotation"][n]]),
	  'from_doctype':'Enquiry',
	  'to_doctype':'Quotation',
	  'from_docname':doc.name,
    'from_to_list':"[['Enquiry', 'Quotation'],['Enquiry Detail','Quotation Detail']]"
  }
  , function(r,rt) {
    loaddoc("Quotation", n);
    }
    );
  }