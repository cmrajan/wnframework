cur_frm.cscript.tname = "Indent Detail";
cur_frm.cscript.fname = "indent_details";

$import(Purchase Common)

//========================== On Load =================================================
cur_frm.cscript.onload = function(doc, cdt, cdn) {
  if(!doc.fiscal_year && doc.__islocal){ set_default_values(doc);}
  if (!doc.transaction_date) doc.transaction_date = dateutil.obj_to_str(new Date())
  if (!doc.status) doc.status = 'Draft';
  if(doc.__islocal){ 
    cur_frm.cscript.get_default_schedule_date(doc);
  }
}

//======================= Refresh =====================================
cur_frm.cscript.refresh = function(doc, cdt, cdn) { 
  // Unhide Fields in Next Steps
  // ---------------------------------
  
  hide_field(['Make Purchase Order', 'Stop Indent']);
  if(doc.docstatus == 1 && doc.status != 'Stopped'){
    var ch = getchildren('Indent Detail',doc.name,'indent_details');
    for(var i in ch){
      if(flt(ch[i].qty) > flt(ch[i].ordered_qty)) unhide_field(['Make Purchase Order','Stop Indent']);
    }
  }
  else
    hide_field(['Make Purchase Order', 'Stop Indent']);
    
  if(doc.docstatus == 1 && doc.status == 'Stopped')
    unhide_field(['Unstop Indent']);
  else
    hide_field(['Unstop Indent']);
    
    if(doc.docstatus == 1)
    unhide_field(['Get Report']);
  else
    hide_field(['Get Report']);

}

//======================= validation ===================================
cur_frm.cscript.validate = function(doc,cdt,cdn){
  is_item_table(doc,cdt,cdn);
}
//======================= transaction date =============================
cur_frm.cscript.transaction_date = function(doc,cdt,cdn){
  if(doc.__islocal){ 
    cur_frm.cscript.get_default_schedule_date(doc);
  }
}

//=================== Quantity ===================================================================
cur_frm.cscript.qty = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];
  if (flt(d.qty) < flt(d.min_order_qty))
    alert("Warning: Indent Qty is less than Minimum Order Qty");
}

// On Button Click Functions
// ------------------------------------------------------------------------------

// Make Purchase Order
cur_frm.cscript['Make Purchase Order'] = function(doc,dt,dn) {
  n = createLocal('Purchase Order');
  $c('dt_map', args={
    'docs':compress_doclist([locals['Purchase Order'][n]]),
    'from_doctype':doc.doctype,
    'to_doctype':'Purchase Order',
    'from_docname':doc.name,
    'from_to_list':"[['Indent','Purchase Order'],['Indent Detail','PO Detail']]"
    }, function(r,rt) {
       loaddoc('Purchase Order', n);
    }
  );
}


// Get Report
cur_frm.cscript['Get Report'] = function(doc,cdt,cdn) {
  var callback = function(report){
  report.set_filter('PO Detail', 'Indent No',doc.name)
 }
 loadreport('PO Detail','Itemwise Purchase Details', callback);
}

// Stop INDENT
// ==================================================================================================
cur_frm.cscript['Stop Indent'] = function(doc,cdt,cdn) {
  var check = confirm("DO YOU REALLY WANT TO Stop INDENT : " + doc.name);

  if (check) {
    $c('runserverobj', args={'method':'update_status', 'arg': 'Stopped', 'docs': compress_doclist(make_doclist(doc.doctype, doc.name))}, function(r,rt) {
      cur_frm.refresh();
    });
  }
}

// Un Stop INDENT
//====================================================================================================
cur_frm.cscript['Unstop Indent'] = function(doc,cdt,cdn){
  var check = confirm("DO YOU REALLY WANT TO Unstop INDENT : " + doc.name);
  
  if (check) {
    $c('runserverobj', args={'method':'update_status', 'arg': 'Submitted','docs': compress_doclist(make_doclist(doc.doctype, doc.name))}, function(r,rt) {
      cur_frm.refresh();
    });
  }
}