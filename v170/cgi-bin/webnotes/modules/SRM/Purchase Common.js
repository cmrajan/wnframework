// Preset
// ------
// cur_frm.cscript.tname - Details table name
// cur_frm.cscript.fname - Details fieldname
var tname = cur_frm.cscript.tname;
var fname = cur_frm.cscript.fname;

cur_frm.cscript.get_default_schedule_date = function(doc){
    var ch = getchildren( tname, doc.name, fname);
    if (flt(ch.length) > 0){
      $c_obj(make_doclist(doc.doctype, doc.name), 'get_default_schedule_date', '', function(r, rt) { refresh_field(fname); });
    }
}

// ======================== Supplier =================================================
cur_frm.cscript.supplier = function(doc, cdt, cdn) {
  get_server_fields('get_supplier_details', doc.supplier,'', doc, cdt, cdn, 1);
}

// ======================== Conversion Rate ==========================================
cur_frm.cscript.conversion_rate = function(doc,cdt,cdn) {
  cur_frm.cscript.calc_amount( doc, 1);
}

//==================== Item Code Get Query =======================================================
// Only Is Purchase Item = 'Yes' and Is Active Item = 'Yes' are allowed.
cur_frm.fields_dict[fname].grid.get_field("item_code").get_query = function(doc, cdt, cdn) {
  return 'SELECT tabItem.name, tabItem.description FROM tabItem WHERE tabItem.is_purchase_item="Yes" AND tabItem.is_active = "Yes" AND tabItem.%(key)s LIKE "%s" LIMIT 50'
}

//==================== Get Item Code Details =====================================================
cur_frm.cscript.item_code = function(doc,cdt,cdn) {
  var d = locals[cdt][cdn];
  if (d.item_code) {
    temp = "{'item_code':'"+(d.item_code?d.item_code:'')+"', 'warehouse':'"+(d.warehouse?d.warehouse:'')+"'}"
    get_server_fields('get_item_details', temp, fname, doc, cdt, cdn, 1);
  }
}

//==================== Update Stock Qty ==========================================================
cur_frm.cscript.update_stock_qty = function(doc,cdt,cdn){
  d = locals[cdt][cdn]
  // Step 1:=> Check if qty , uom, conversion_factor
  if (d.qty && d.uom && d.conversion_factor){
    // Step 2:=> Set stock_qty = qty * conversion_factor
    d.stock_qty = flt(flt(d.qty) * flt(d.conversion_factor));
    // Step 3:=> Refer stock_qty field a that particular row.
    refresh_field('stock_qty' , d.name,fname);
  }
}

//==================== Purchase UOM Get Query =======================================================
//cur_frm.fields_dict[fname].grid.get_field("uom").get_query = function(doc, cdt, cdn) {
//  var d = locals[this.doctype][this.docname];
//  return 'SELECT `tabUOM Conversion Detail`.`uom` FROM `tabUOM Conversion Detail` WHERE `tabUOM Conversion Detail`.`parent` = "' + d.item_code + '" AND `tabUOM Conversion Detail`.uom LIKE "%s"'
//}


//==================== UOM ======================================================================
cur_frm.cscript.uom = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  if (d.item_code && d.uom) {
    call_back = function(doc, cdt, cdn){
      refresh_field('purchase_rate', d.name, fname);
      refresh_field('qty' , d.name, fname);
      refresh_field('conversion_factor' , d.name, fname);
      //var doc = locals[cdt][cdn];
      cur_frm.cscript.calc_amount(doc, 2);
    }
    str_arg = "{'item_code':'" +  d.item_code + "', 'uom':'" +  d.uom + "', 'stock_qty': '" + flt(d.stock_qty) + "'}"
    // Updates Conversion Factor, Qty and Purchase Rate
    get_server_fields('get_uom_details',str_arg, fname, doc,cdt,cdn,1, call_back);
    // don't make mistake of calling update_stock_qty() the get_uom_details returns stock_qty as per conversion factor properly
  }
}

//==================== Warehouse ================================================================
cur_frm.cscript.warehouse = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  if (d.item_code && d.warehouse) {
    str_arg = "{'item_code':'" +  (d.item_code?d.item_code:'') + "', 'warehouse':'" + (d.warehouse?d.warehouse:'') + "'}"
    get_server_fields('get_bin_details', str_arg, fname, doc, cdt, cdn, 1);
  }  
}

//=================== Quantity ===================================================================
cur_frm.cscript.qty = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  // Step 1: => Update Stock Qty 
  cur_frm.cscript.update_stock_qty(doc,cdt,cdn);
  // Step 2: => Calculate Amount
  cur_frm.cscript.calc_amount(doc, 2);
}


//=================== Purchase Rate ==============================================================
cur_frm.cscript.purchase_rate = function(doc, cdt, cdn) {
  // Calculate Amount
  cur_frm.cscript.calc_amount(doc, 2);
}

//==================== Import Rate ================================================================
cur_frm.cscript.import_rate = function(doc, cdt, cdn) {
  // Calculate Amount
  cur_frm.cscript.calc_amount(doc, 1);
}


//====================== Calculate Amount  ============================================================
cur_frm.cscript.calc_amount = function(doc, n) {
  // Set defaults
  doc = locals[doc.doctype][doc.name] 
  if (! doc.conversion_rate) doc.conversion_rate = 1;
  if(!n) n=0;
  var net_total = 0;
  var net_total_import = 0;
  
  var cl = getchildren(tname, doc.name, fname);
  
  for(var i=0;i<cl.length;i++) 
  {
    if(n == 1){ 
      set_multiple(tname, cl[i].name, {'purchase_rate': flt(doc.conversion_rate) * flt(cl[i].import_rate) }, fname);
      set_multiple(tname, cl[i].name, {'amount': flt(flt(cl[i].qty) * flt(doc.conversion_rate) * flt(cl[i].import_rate))}, fname);
    }
    if(n == 2){
      set_multiple(tname, cl[i].name, {'amount': flt(flt(cl[i].qty) * flt(cl[i].purchase_rate)), 'import_rate': flt(flt(cl[i].purchase_rate) / flt(doc.conversion_rate)) }, fname);
    }
    net_total += flt(flt(cl[i].qty) * flt(cl[i].purchase_rate));
    net_total_import += flt(flt(cl[i].qty) * flt(cl[i].import_rate));
    //update stock uom
    cur_frm.cscript.update_stock_qty(doc, tname, cl[i].name);
  }
  doc.net_total = flt(net_total) ;
  doc.net_total_import = flt(net_total_import) ;
  refresh_field('net_total');
  refresh_field('net_total_import');
}  

//==================== check if item table is blank ==============================================
var is_item_table = function(doc,cdt,cdn) {
  // Step 1 :=>Get all childrens/ rows from Detail Table
  var cl = getchildren(tname, doc.name, fname);
  // Step 2 :=> If there are no rows then set validated = false, I hope this will stop further execution of code.
  if (cl.length == 0) {
    alert("There is no item in table"); validated = false;
  }
}

//==================== Validate ====================================================================
cur_frm.cscript.validate = function(doc, cdt, cdn) {
  // Step 1:=> check if item table is blank
  is_item_table(doc,cdt,cdn);
  // Step 2:=> Calculate Amount
  cur_frm.cscript.calc_amount(doc, 1);
}
