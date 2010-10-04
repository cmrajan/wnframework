cur_frm.cscript.onload = function(doc,cdt,cdn){
  field_nm = ['rfq_date','rfq_type','closing_date','indent_no','from_company','company_address','contact_person','contact_no','terms_and_conditions','rfq_det','email']
  
  if(has_common(user_roles,['Partner','Supplier','Customer'])){
    hide_field('indent_no'); hide_field('supplier_type'); hide_field('send_to');hide_field('supplier_name'); hide_field('supplier_type'); hide_field(['Get Item Details']);
    if(doc.__islocal){
      doc.rfq_type = 'From Customer'; refresh_field('rfq_type');
      get_server_fields('get_contact_details','','',doc,cdt,cdn,1);
    }
  }
  else{
    //$ds(doc.indent_no); 
    unhide_field('indent_no');unhide_field('send_to'); unhide_field(['Get Item Details']);
    if(doc.__islocal){
      hide_field('supplier_name'); hide_field('supplier_type');
      doc.rfq_type = 'From Company'; refresh_field('rfq_type');
      get_server_fields('get_contact_details','','',doc,cdt,cdn,1);
    }
    else{
      if (doc.send_to == 'Individual Supplier'){ unhide_field('supplier_name'); hide_field('supplier_type');}
      if (doc.send_to == 'All Suppliers'){ hide_field('supplier_name'); hide_field('supplier_type');} 
      if (doc.send_to == 'Supplier Group'){ hide_field('supplier_name'); unhide_field('supplier_type');}
    }
  }
    
  //set editing permissions
  if(!doc.__islocal){
     if (user != doc.owner){
       set_read_only(field_nm);
     }
     else{
       set_edit(field_nm);
     }     
  }
}

//create quotation button
cur_frm.cscript.refresh = function(doc,cdt,cdn){
  if(doc.rfq_type == 'From Customer'){
    if(!has_common(user_roles,['Partner','Supplier','Customer']) && doc.docstatus == 1){
    //  alert('unhide button')
      unhide_field(['Create Quotation']);
    }
    else { hide_field(['Create Quotation']); }
  }
  else if(doc.rfq_type == 'From Company'){
    if(doc.docstatus == 1 && has_common(user_roles,['Partner','Customer','Supplier'])){
      unhide_field(['Create Quotation']);
    }
    else { hide_field(['Create Quotation']); }
  }
}

  //select send to
cur_frm.cscript.send_to = function(doc,cdt,cdn){
  if (doc.send_to == 'Individual Supplier'){
    doc.supplier_type = ''; refresh_field('supplier_type'); hide_field('supplier_type'); unhide_field('supplier_name');
  }
  else if (doc.send_to == 'Supplier Group'){
    doc.supplier_name = ''; refresh_field('supplier_name'); hide_field('supplier_name'); unhide_field('supplier_type');
  }
  else if(doc.send_to == 'All Suppliers'){
    doc.supplier_name = ''; refresh_field('supplier_name'); hide_field('supplier_name');
    doc.supplier_type = ''; refresh_field('supplier_type'); hide_field('supplier_type');
  }
}

  //set read only permission
set_read_only = function(field_nm){  
  for (i in field_nm){
    set_field_permlevel(field_nm[i],3);
  }
}
  //set edit permission
set_edit = function(field_nm){
  for(i in field_nm){
    set_field_permlevel(field_nm[i],0)
  }
}
/*
//trigger on item code
cur_frm.cscript.item_code = function(doc,cdt,cdn){
  var d = locals[cdt][cdn];
  if(d.item_code){
    arg = {'frm':'item_code', 'item_code':d.item_code}
    get_server_fields('get_item_details',docstring(arg),'rfq_details',doc,cdt,cdn,1);
  }
}
*/
//Create new quotation
cur_frm.cscript['Create Quotation'] = function(doc,cdt,cdn){
  if (doc.rfq_type == 'From Company'){
    n = createLocal("Supplier Quotation");
    $c('dt_map', args={
	    'docs':compress_doclist([locals["Supplier Quotation"][n]]),
	    'from_doctype':'RFQ',
	    'to_doctype':'Supplier Quotation',
	    'from_docname':doc.name,
      'from_to_list':"[['RFQ', 'Supplier Quotation'], ['RFQ Detail', 'Supplier Quotation Detail']]"
    }
    , function(r,rt) {
        loaddoc("Supplier Quotation", n);
      }
    );
  }
  else if (doc.rfq_type == 'From Customer'){
    n = createLocal("Quotation");
    $c('dt_map',args={
      'docs':compress_doclist([locals["Quotation"][n]]),
      'from_doctype':'RFQ',
      'to_doctype': 'Quotation',
      'from_docname':doc.name,
      'from_to_list':"[['RFQ','Quotation'],['RFQ Detail','Quotation Detail']]"
    }
    , function(r,rt){
        loaddoc("Quotation",n);
      }
    );
  }
}


/* user can directly select item name from database

cur_frm.cscript.item_name = function(doc,cdt,cdn){
  var d = locals[cdt][cdn];
  if(d.item_name){
    arg = {'frm':'item_name', 'item_code':d.item_name}
    get_server_fields('get_item_details',docstring(arg),'rfq_details',doc,cdt,cdn,1);
  }
}

cur_frm.fields_dict['rfq_details'].grid.get_field('item_name').get_query = function(doc){
  return 'SELECT DISTINCT `tabItem`.item_name FROM `tabItem` WHERE `tabItem`.item_name LIKE "%s" ORDER BY `tabItem`.item_name LIMIT 50';
}*/

//New code from indent


// get item query
cur_frm.fields_dict['rfq_details'].grid.get_field('item_code').get_query = function(doc){
  if (doc.rfq_type == 'From Company'){
    return 'SELECT DISTINCT `tabItem`.name, `tabItem`.item_name FROM `tabItem` WHERE `tabItem`.is_purchase_item = "Yes" and `tabItem`.name like "%s" ORDER BY `tabItem`.name LIMIT 50';
  }
  else if (doc.rfq_type == 'From Customer'){
    return 'SELECT DISTINCT `tabItem`.name, `tabItem`.item_name FROM `tabItem` WHERE `tabItem`.is_sales_item = "Yes" AND `tabItem`.name LIKE "%s" ORDER BY `tabItem`.name LIMIT 50';
  }
}

//get item details
cur_frm.cscript.item_code = function(doc,cdt,cdn) {
  var d = locals[cdt][cdn];
  if (d.item_code) {
    temp = "{'item_code':'"+(d.item_code?d.item_code:'')+"', 'warehouse':'"+(d.warehouse?d.warehouse:'')+"'}"
    get_server_fields('get_item_details', temp,  'rfq_details', doc, cdt, cdn, 1);
  }
}

// UOM

cur_frm.cscript.uom = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  str_arg = "{'item_code':'" +  d.item_code + "', 'uom':'" +  d.uom + "'}"
  var call_back = function(doc,cdt,cdn) { update_stock_qty(doc,cdt,cdn); }
  if (d.item_code && d.uom) 
    get_server_fields('get_uom_details',str_arg, 'rfq_details', doc,cdt,cdn,1);
}

var update_stock_qty = function(doc,cdt,cdn){
  d = locals[cdt][cdn];
  if (d.reqd_qty && d.uom && d.conversion_factor){
    d.stock_qty = flt(flt(d.reqd_qty) * flt(d.conversion_factor));
    refresh_field('stock_qty' , d.name,'rfq_details');
  }
}

/*
cur_frm.cscript.reqd_qty = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  if (flt(d.reqd_qty) < flt(d.min_order_qty))
    alert("Warning: RFQ Qty is less than Minimum Order Qty");
  if (flt(d.reqd_qty) <= 0) {
    alert("Please Enter a Valid Indent Qty");
    d.reqd_qty = '';
  } 
  update_stock_qty(doc,cdt,cdn);
}
*/

// validation if no item in the table
/*
cur_frm.cscript.validate = function(doc,cdt,cdn){
  is_item_table(doc,cdt,cdn);
}

//check if item table is blank
var is_item_table = function(doc,cdt,cdn) {
  var cl = getchildren('RFQ Detail', doc.name, 'rfq_details');
  if (cl.length == 0) {
    alert("There is no item in table"); validated = false;
  }
}*/