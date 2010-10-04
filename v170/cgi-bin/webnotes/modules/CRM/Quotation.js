cur_frm.cscript.tname = "Quotation Detail";
cur_frm.cscript.fname = "quotation_details";
cur_frm.cscript.other_fname = "other_charges";
cur_frm.cscript.sales_team_fname = "sales_team";

$import(Sales Common)
$import(Other Charges)

// ONLOAD
// ===================================================================================
cur_frm.cscript.onload = function(doc, cdt, cdn) {
  if(!doc.status) set_multiple(cdt,cdn,{status:'Draft'});
  if(!doc.transaction_date) set_multiple(cdt,cdn,{transaction_date:get_today()});
  if(!doc.conversion_rate) set_multiple(cdt,cdn,{conversion_rate:'1.00'});
  if(!doc.currency && sys_defaults.currency) set_multiple(cdt,cdn,{currency:sys_defaults.currency});
  if(!doc.price_list_name && sys_defaults.price_list_name) set_multiple(cdt,cdn,{price_list_name:sys_defaults.price_list_name});
  if(!doc.company && sys_defaults.company) set_multiple(cdt,cdn,{company:sys_defaults.company});
  if(!doc.fiscal_year && sys_defaults.fiscal_year) set_multiple(cdt,cdn,{fiscal_year:sys_defaults.fiscal_year});  
}

// REFRESH
// ===================================================================================
cur_frm.cscript.refresh = function(doc, cdt, cdn) {
  if(doc.docstatus == 1) unhide_field(['Make Sales Order','Get Report']);
  else hide_field(['Make Sales Order','Get Report']);
  
  if (!doc.docstatus) hide_field(['Send SMS', 'message', 'customer_mobile_no']);
  else unhide_field(['Send SMS', 'message', 'customer_mobile_no']);
}

// DOCTYPE TRIGGERS
// ====================================================================================

// ************************ RFQ Get Query **********************
//cur_frm.fields_dict['enq_no'].get_query = function(doc){
  //return 'SELECT name FROM `tabEnquiry`';

//}
// ***************** Get Contact Person based on customer selected *****************
cur_frm.fields_dict['contact_person'].get_query = function(doc, cdt, cdn) {
  return 'SELECT `tabContact`.contact_name FROM `tabContact` WHERE `tabContact`.is_customer = 1 AND `tabContact`.customer_name = "'+ doc.customer_name +'" AND `tabContact`.is_active = "Yes" AND `tabContact`.contact_name LIKE "%s" ORDER BY `tabContact`.contact_name ASC LIMIT 50';
}


// Make Sales Order
// =====================================================================================
cur_frm.cscript['Make Sales Order'] = function(doc, cdt, cdn) {
  if (doc.docstatus == 1) { 
  n = createLocal("Sales Order");
  $c('dt_map', args={
	  'docs':compress_doclist([locals["Sales Order"][n]]),
	  'from_doctype':'Quotation',
	  'to_doctype':'Sales Order',
	  'from_docname':doc.name,
    'from_to_list':"[['Quotation', 'Sales Order'], ['Quotation Detail', 'Sales Order Detail'],['RV Tax Detail','RV Tax Detail'], ['Sales Team', 'Sales Team'], ['TC Detail', 'TC Detail']]"
  }
  , function(r,rt) {
    loaddoc("Sales Order", n);
    }
    );
  }
}


// GET REPORT
// ========================================================================================
cur_frm.cscript['Get Report'] = function(doc,cdt,cdn) {
  var callback = function(report){
  report.set_filter('Sales Order Detail', 'Quotation No.',doc.name)
 }
 loadreport('Sales Order Detail','Itemwise Sales Details', callback);
}