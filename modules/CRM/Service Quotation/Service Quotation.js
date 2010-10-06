cur_frm.cscript.tname = "Service Quotation Detail";
cur_frm.cscript.fname = "service_quotation_details";
cur_frm.cscript.other_fname = "other_charges";
cur_frm.cscript.sales_team_fname = "sales_team";

$import(Sales Common)
$import(Other Charges)

cur_frm.cscript.refresh = function(doc, cdt, cdn) {
  if(!doc.status)
    doc.status = 'Open';
  if(doc.quotation_type == 'Others')
    unhide_field('others_detail');
  
  if(doc.docstatus == 1 && doc.status != 'Closed')
    unhide_field(['Make Service Order','Send SMS', 'message', 'customer_mobile_no']);
  else
    hide_field(['Make Service Order','Send SMS', 'message', 'customer_mobile_no']);
    
  if(inList(user_roles, 'CRM Manager')) {
    hide_field('Send For Approval');
    unhide_field('Send Feedback');
  }
  else {
    unhide_field('Send For Approval');
    hide_field('Send Feedback');
  }
}

cur_frm.fields_dict['contact_person'].get_query = function(doc, cdt, cdn) {
  return 'SELECT `tabContact`.contact_name FROM `tabContact` WHERE `tabContact`.is_customer = 1 AND `tabContact`.customer_name = "'+ doc.customer_name+'" AND `tabContact`.contact_name LIKE "%s" ORDER BY `tabContact`.name ASC LIMIT 50';
}

/*----------------Make Service Order Mapper-------------------------------------------------------------------------*/

cur_frm.cscript['Make Service Order'] = function(doc, cdt, cdn) {
  if (doc.docstatus == 1) { 
  n = createLocal("Service Order");
  $c('dt_map', args={
	  'docs':compress_doclist([locals["Service Order"][n]]),
	  'from_doctype':'Service Quotation',
	  'to_doctype':'Service Order',
	  'from_docname':doc.name,
    'from_to_list':"[['Service Quotation', 'Service Order'], ['Service Quotation Detail', 'Service Order Detail'],['RV Tax Detail','RV Tax Detail'], ['Sales Team', 'Sales Team'],['TC Detail','TC Detail']]"
  }
  , function(r,rt) {
    loaddoc("Service Order", n);
    }
    );
  }
}

//------------------------pull serial details-----------------------------

cur_frm.cscript.serial_no = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  get_server_fields('get_serial_details', d.serial_no,'service_quotation_details',doc, cdt, cdn, 1);
}
// -------------------------------set qty and rate ----------------------------

cur_frm.cscript.amount = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  ret = {'qty':1, 'basic_rate':d.amount};
  set_multiple('Service Quotation Detail', d.name, ret, 'service_quotation_details');
  cur_frm.cscript.recalc(doc, 4);
}
// -------------------------------display others detail----------------------------

cur_frm.cscript.quotation_type = function(doc,cdt,cdn) {
  if (doc.quotation_type == 'Others') {
    unhide_field('others_detail');
  } else {
    hide_field('others_detail');
  }
}
//----------------------------Validate-------------------------------------------------

cur_frm.cscript.validate = function(doc,cdt,cdn) {
  if (doc.quotation_type == 'Others' && ! doc.others_detail) {
    msgprint("Please enter 'Others Detail' in 'Quotation'");
    validated = false;
  }
}