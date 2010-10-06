cur_frm.cscript.tname = "Delivery Note Detail";
cur_frm.cscript.fname = "delivery_note_details";
cur_frm.cscript.other_fname = "other_charges";
cur_frm.cscript.sales_team_fname = "sales_team";

$import(Sales Common)
$import(Other Charges)


// ONLOAD
// ================================================================================================
cur_frm.cscript.onload = function(doc, dt, dn) {
  if(!doc.status) set_multiple(dt,dn,{status:'Draft'});
  if(!doc.transaction_date) set_multiple(dt,dn,{transaction_date:get_today()});
  if(!doc.posting_date) set_multiple(dt,dn,{posting_date:get_today()});
}


// REFRESH
// ================================================================================================
cur_frm.cscript.refresh = function(doc, cdt, cdn) { 
  hide_field(['Make Receivable Voucher']);
  hide_field(['Make Installation Note']);
  var ch = getchildren('Delivery Note Detail',doc.name,'delivery_note_details');
  var bill_qty = 1; // assume all qty's are billed
  var installed_qty = 1; //assume all qty's are installed
  
  for(var i in ch){
    if(ch[i].billed_qty < ch[i].qty) bill_qty = 0;
    if(ch[i].installed_qty < ch[i].qty) installed_qty = 0;
  }
  if(bill_qty == 0) unhide_field(['Make Receivable Voucher']);
  else hide_field(['Make Receivable Voucher']);
  
  if(installed_qty == 0) unhide_field(['Make Installation Note']);
  else hide_field(['Make Installation Note']);
  
  if (!doc.docstatus) hide_field(['Send SMS', 'message', 'customer_mobile_no']);
  else unhide_field(['Send SMS', 'message', 'customer_mobile_no']);  
  
  if (!doc.docstatus) { hide_field(['Make Receivable Voucher']); hide_field(['Make Installation Note']);}
  else { unhide_field(['Make Receivable Voucher']); unhide_field(['Make Installation Note']);}
 
 // will be used in furthur development
 // cfn_set_make_fields(doc, cdt, cdn);
 // cfn_set_fields(doc, cdt, cdn);
}


// UTILITY FUNCTIONS
// ================================================================================================
var cfn_set_fields = function(doc, cdt, cdn) { 
/*  var supplier_field_list = ['Supplier','supplier','supplier_address'];
  var customer_field_list = ['Customer','customer_name','customer_address','zone','customer_group','territory','Business Associate','sales_partner','commission_rate','total_commission','sales_order_no','Get Items'];
  if (doc.delivery_type == 'Rejected' && doc.purchase_receipt_no) {
    unhide_field('purchase_receipt_no');
    unhide_field(supplier_field_list);
    hide_field(customer_field_list);
    get_field(doc.doctype, 'delivery_type' , doc.name).permlevel = 1;
  }
  else if (doc.delivery_type == 'Subcontract' && doc.purchase_order_no) {
    unhide_field('purchase_order_no');
    unhide_field(supplier_field_list);
    hide_field(cutomer_field_list);
    get_field(doc.doctype, 'delivery_type' , doc.name).permlevel = 1;
  }
  else if (doc.delivery_type == 'Sample') unhide_field('to_warehouse');
  else get_field(doc.doctype, 'delivery_type' , doc.name).permlevel = 0;   
  */  
  
}

var cfn_set_make_fields = function(doc,cdt,cdn) {
  /*fld = ['Make Receivable Voucher', 'Close Delivery Note']
  hide_field(fld);
  if(doc.docstatus == 1 && doc.status != 'Completed') unhide_field(fld); */
}


// DOCTYPE TRIGGERS
// ================================================================================================

// ***************** Get Contact Person based on customer selected *****************
cur_frm.fields_dict['contact_person'].get_query = function(doc, cdt, cdn) {
  return 'SELECT `tabContact`.contact_name FROM `tabContact` WHERE `tabContact`.is_customer = 1 AND `tabContact`.customer_name = "'+ doc.customer_name+'" AND `tabContact`.is_active = "Yes" AND `tabContact`.contact_name LIKE "%s" ORDER BY `tabContact`.contact_name ASC LIMIT 50';
}

// *************** Customized link query for SALES ORDER based on customer and currency***************************** 
cur_frm.fields_dict['sales_order_no'].get_query = function(doc) {
  doc = locals[this.doctype][this.docname];
  var cond = '';
  if(doc.customer_name) {
    if(doc.currency) cond = '`tabSales Order`.customer_name = "'+doc.customer_name+'" and `tabSales Order`.currency = "'+doc.currency+'" and';
    else cond = '`tabSales Order`.customer_name = "'+doc.customer_name+'" and';
  }
  else {
    if(doc.currency) cond = '`tabSales Order`.currency = "'+doc.currency+'" and';
    else cond = '';
  }
  return repl('SELECT DISTINCT `tabSales Order`.`name` FROM `tabSales Order` WHERE `tabSales Order`.company = "%(company)s" and `tabSales Order`.`docstatus` = 1 and `tabSales Order`.`status` != "Stopped" and ifnull(`tabSales Order`.per_delivered,0) < 100 and %(cond)s `tabSales Order`.`name` like "%s" ORDER BY `tabSales Order`.`name` DESC LIMIT 50', {company:doc.company,cond:cond});
}

// ****************************** DELIVERY TYPE ************************************
cur_frm.cscript.delivery_type = function(doc, cdt, cdn) {
  if (doc.delivery_type = 'Sample') cfn_set_fields(doc, cdt, cdn);
}

cur_frm.cscript.serial_no = function(doc, cdt , cdn) {
  var d = locals[cdt][cdn];
  if (d.serial_no) {
     get_server_fields('get_serial_details',d.serial_no,'delivery_note_details',doc,cdt,cdn,1);
  }
}

cur_frm.cscript.warehouse = function(doc, cdt , cdn) {
  var d = locals[cdt][cdn];
  if ( ! d.item_code) {alert("please enter item code first"); return};
  if (d.warehouse) {
    arg = "{'item_code':'" + d.item_code + "','warehouse':'" + d.warehouse +"'}";
    get_server_fields('get_actual_qty',arg,'delivery_note_details',doc,cdt,cdn,1);
  }
}

cur_frm.fields_dict['transporter_name'].get_query = function(doc) {
  return 'SELECT DISTINCT `tabSupplier`.`name` FROM `tabSupplier` WHERE `tabSupplier`.supplier_type = "transporter" AND `tabSupplier`.`name` like "%s" ORDER BY `tabSupplier`.`name` LIMIT 50';
}

//-----------------------------------Make Receivable Voucher----------------------------------------------
cur_frm.cscript['Make Receivable Voucher'] = function(doc,dt,dn) {
  n = createLocal('Receivable Voucher');
  $c('dt_map', args={
    'docs':compress_doclist([locals['Receivable Voucher'][n]]),
    'from_doctype':doc.doctype,
    'to_doctype':'Receivable Voucher',
    'from_docname':doc.name,
    'from_to_list':"[['Delivery Note','Receivable Voucher'],['Delivery Note Detail','RV Detail'],['RV Tax Detail','RV Tax Detail'],['Sales Team','Sales Team']]"
    }, function(r,rt) {
       loaddoc('Receivable Voucher', n);
    }
  );
}

//-----------------------------------Make Installation Note----------------------------------------------
cur_frm.cscript['Make Installation Note'] = function(doc,dt,dn) {
  n = createLocal('Installation Note');
  $c('dt_map', args={
    'docs':compress_doclist([locals['Installation Note'][n]]),
    'from_doctype':doc.doctype,
    'to_doctype':'Installation Note',
    'from_docname':doc.name,
    'from_to_list':"[['Delivery Note','Installation Note'],['Delivery Note Detail','Installed Item Details']]"
    }, function(r,rt) {
       loaddoc('Installation Note', n);
    }
  );
}