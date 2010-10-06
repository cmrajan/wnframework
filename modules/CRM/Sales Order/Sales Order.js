cur_frm.cscript.tname = "Sales Order Detail";
cur_frm.cscript.fname = "sales_order_details";
cur_frm.cscript.other_fname = "other_charges";
cur_frm.cscript.sales_team_fname = "sales_team";

$import(Sales Common)
$import(Other Charges)

// ONLOAD
// ================================================================================================
cur_frm.cscript.onload = function(doc, cdt, cdn) {
  if(!doc.status) set_multiple(cdt,cdn,{status:'Draft'});
  if(!doc.transaction_date) set_multiple(cdt,cdn,{transaction_date:get_today()});
}


// REFRESH
// ================================================================================================
cur_frm.cscript.refresh = function(doc, cdt, cdn) {
  // Unhide Fields in Next Steps
  // ---------------------------------
  hide_field(['Make Delivery Note', 'Make Receivable Voucher']);
  if(doc.docstatus == 1 && doc.status != 'Stopped'){
    var ch = getchildren('Sales Order Detail',doc.name,'sales_order_details');
    for(var i in ch){
      if(ch[i].qty > ch[i].delivered_qty) unhide_field(['Make Delivery Note','Stop Sales Order']);
      if(ch[i].qty > ch[i].billed_qty) unhide_field(['Make Receivable Voucher','Stop Sales Order']); 
    }
  }
  else
    hide_field(['Make Delivery Note', 'Make Receivable Voucher', 'Stop Sales Order']);
    
  if(doc.docstatus == 1 && doc.status == 'Stopped')
    unhide_field(['Unstop Sales Order']);
  else
    hide_field(['Unstop Sales Order']);
    
  
  if (!doc.docstatus) hide_field(['Send SMS', 'message', 'customer_mobile_no']);
  else unhide_field(['Send SMS', 'message', 'customer_mobile_no']);
  
    if(doc.docstatus == 1)
    unhide_field(['Get Report']);
  else
    hide_field(['Get Report']);

}


// DOCTYPE TRIGGERS
// ================================================================================================

// ***************** Get Contact Person based on customer selected *****************
cur_frm.fields_dict['contact_person'].get_query = function(doc, cdt, cdn) {
  return 'SELECT `tabContact`.contact_name FROM `tabContact` WHERE `tabContact`.is_customer = 1 AND `tabContact`.customer_name = "'+ doc.customer_name+'" AND `tabContact`.is_active = "Yes" AND `tabContact`.contact_name LIKE "%s" ORDER BY `tabContact`.contact_name ASC LIMIT 50';
}

// *************** Customized link query for QUOTATION ***************************** 
cur_frm.fields_dict['quotation_no'].get_query = function(doc) {
  return 'SELECT DISTINCT `tabQuotation`.`name` FROM `tabQuotation` WHERE `tabQuotation`.company = "' + doc.company + '" and `tabQuotation`.`docstatus` = 1 and `tabQuotation`.%(key)s LIKE "%s" ORDER BY `tabQuotation`.`name` DESC LIMIT 50';
}


// SALES ORDER DETAILS TRIGGERS
// ================================================================================================

// ***************** Get available qty in warehouse of item selected **************** 
cur_frm.cscript.reserved_warehouse = function(doc, cdt , cdn) {
  var d = locals[cdt][cdn];
  if (d.reserved_warehouse) {
    arg = "{'item_code':'" + d.item_code + "','warehouse':'" + d.reserved_warehouse +"'}";
    get_server_fields('get_available_qty',arg,'sales_order_details',doc,cdt,cdn,1);
  }
}


// MAKE DELIVERY NOTE
// ================================================================================================
cur_frm.cscript['Make Delivery Note'] = function(doc, cdt, cdn) {
  if (doc.docstatus == 1) { 
  n = createLocal("Delivery Note");
  $c('dt_map', args={
	  'docs':compress_doclist([locals["Delivery Note"][n]]),
	  'from_doctype':'Sales Order',
	  'to_doctype':'Delivery Note',
	  'from_docname':doc.name,
    'from_to_list':"[['Sales Order', 'Delivery Note'], ['Sales Order Detail', 'Delivery Note Detail'],['RV Tax Detail','RV Tax Detail'],['Sales Team','Sales Team']]"
  }
  , function(r,rt) {
    loaddoc("Delivery Note", n);
    }
    );
  }
}


// MAKE RECEIVABLE VOUCHER
// ================================================================================================
cur_frm.cscript['Make Receivable Voucher'] = function(doc,dt,dn) {
  n = createLocal('Receivable Voucher');
  $c('dt_map', args={
    'docs':compress_doclist([locals['Receivable Voucher'][n]]),
    'from_doctype':doc.doctype,
    'to_doctype':'Receivable Voucher',
    'from_docname':doc.name,
    'from_to_list':"[['Sales Order','Receivable Voucher'],['Sales Order Detail','RV Detail'],['RV Tax Detail','RV Tax Detail'],['Sales Team','Sales Team']]"
    }, function(r,rt) {
       loaddoc('Receivable Voucher', n);
    }
  );
}


// STOP SALES ORDER
// ==================================================================================================
cur_frm.cscript['Stop Sales Order'] = function(doc,cdt,cdn) {
  var check = confirm("DO YOU REALLY WANT TO STOP SALES ORDER : " + doc.name);

  if (check) {
    $c('runserverobj', args={'method':'stop_sales_order', 'docs': compress_doclist(make_doclist(doc.doctype, doc.name))}, function(r,rt) {
      cur_frm.refresh();
    });	
  }
}

// UNSTOP SALES ORDER
// ==================================================================================================
cur_frm.cscript['Unstop Sales Order'] = function(doc,cdt,cdn) {
  var check = confirm("DO YOU REALLY WANT TO UNSTOP SALES ORDER : " + doc.name);

  if (check) {
    $c('runserverobj', args={'method':'unstop_sales_order', 'docs': compress_doclist(make_doclist(doc.doctype, doc.name))}, function(r,rt) {
      cur_frm.refresh();
    });	
  }
}


// GET REPORT
// ================================================================================================
cur_frm.cscript['Get Report'] = function(doc,cdt,cdn) {
  var callback = function(report){
  report.set_filter('Delivery Note Detail', 'Against Doc No',doc.name)
  report.dt.run();
  }
  loadreport('Delivery Note Detail','Itemwise Delivery Details', callback);
}