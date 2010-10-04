cur_frm.cscript.tname = "PO Detail";
cur_frm.cscript.fname = "po_details";

$import(Purchase Common)

//========================== On Load =================================================
cur_frm.cscript.onload = function(doc, cdt, cdn) {
  if(!doc.fiscal_year && doc.__islocal){ set_default_values(doc);}
  if (!doc.transaction_date) doc.transaction_date = dateutil.obj_to_str(new Date())
  if (!doc.conversion_rate) doc.conversion_rate = 1;
  if (!doc.currency) doc.currency = sys_defaults.currency;
  if (!doc.status) doc.status = 'Draft';
  if(doc.__islocal){ 
    cur_frm.cscript.get_default_schedule_date(doc);
  }
}

// ================================== Refresh ==========================================
cur_frm.cscript.refresh = function(doc, cdt, cdn) { 
  // Unhide Fields in Next Steps
  // ---------------------------------
  hide_field(['Make Purchase Receipt', 'Make Payable Voucher', 'Stop Purchase Order']);
  if(doc.docstatus == 1 && doc.status != 'Stopped'){
    var ch = getchildren('PO Detail',doc.name,'po_details');
    for(var i in ch){
      if(ch[i].qty > ch[i].received_qty) unhide_field(['Make Purchase Receipt','Stop Purchase Order']);
      if(ch[i].qty > ch[i].billed_qty) unhide_field(['Make Payable Voucher','Stop Purchase Order']);
    }
  }
  else
    hide_field(['Make Purchase Receipt', 'Make Payable Voucher', 'Stop Purchase Order']) ;
    
  if(doc.docstatus == 1 && doc.status == 'Stopped')
    unhide_field(['Unstop Purchase Order']);
  else
    hide_field(['Unstop Purchase Order']);

}

//======================= transaction date =============================
cur_frm.cscript.transaction_date = function(doc,cdt,cdn){
  if(doc.__islocal){ 
    cur_frm.cscript.get_default_schedule_date(doc);
  }
}


//==================== Indent No Get Query =======================================================
//===== Only those Indents status != 'Completed' and docstatus = 1 i.e. submitted=================
cur_frm.fields_dict['indent_no'].get_query = function(doc) {
  return 'SELECT DISTINCT `tabIndent`.`name` FROM `tabIndent` WHERE `tabIndent`.company = "' + doc.company + '" and `tabIndent`.`docstatus` = 1 and `tabIndent`.`status` != "Stopped" and ifnull(`tabIndent`.`per_ordered`,0) < 100 and `tabIndent`.%(key)s LIKE "%s" ORDER BY `tabIndent`.`name` DESC LIMIT 50';
}

//========================= Get Last Purhase Rate =====================================
cur_frm.cscript['Get Last Purchase Rate'] = function(doc, cdt, cdn){
  $c_obj(make_doclist(doc.doctype, doc.name), 'get_last_purchase_rate', '', 
      function(r, rt) { 
        refresh_field(cur_frm.cscript.fname);
        var doc = locals[cdt][cdn];
        cur_frm.cscript.calc_amount( doc, 2);
      }
  );

}

//========================= Make Purchase Receipt =======================================================
cur_frm.cscript['Make Purchase Receipt'] = function(doc,dt,dn) {
  n = createLocal('Purchase Receipt');
  $c('dt_map', args={
    'docs':compress_doclist([locals['Purchase Receipt'][n]]),
    'from_doctype':doc.doctype,
    'to_doctype':'Purchase Receipt',
    'from_docname':doc.name,
    'from_to_list':"[['Purchase Order','Purchase Receipt'],['PO Detail','Purchase Receipt Detail']]"
    }, function(r,rt) {
       loaddoc('Purchase Receipt', n);
    }
  );
}

//========================== Make Payable Voucher =====================================================
cur_frm.cscript['Make Payable Voucher'] = function(doc,dt,dn) {
  n = createLocal('Payable Voucher');
  $c('dt_map', args={
    'docs':compress_doclist([locals['Payable Voucher'][n]]),
    'from_doctype':doc.doctype,
    'to_doctype':'Payable Voucher',
    'from_docname':doc.name,
    'from_to_list':"[['Purchase Order','Payable Voucher'],['PO Detail','PV Detail']]"
    }, function(r,rt) {
       loaddoc('Payable Voucher', n);
    }
  );
}

//=========================== GET REPORT =========================================================
cur_frm.cscript['Get Report'] = function(doc,cdt,cdn) {
  var callback = function(report){
  report.set_filter('Purchase Receipt Detail', 'PO No',doc.name)
  report.dt.run();
 }
 loadreport('Purchase Receipt Detail','Itemwise Receipt Details', callback);
}

// Stop PURCHASE ORDER
// ==================================================================================================
cur_frm.cscript['Stop Purchase Order'] = function(doc,cdt,cdn) {
  var check = confirm("DO YOU REALLY WANT TO Stop PURCHASE ORDER : " + doc.name);

  if (check) {
    $c('runserverobj', args={'method':'update_status', 'arg': 'Stopped', 'docs': compress_doclist(make_doclist(doc.doctype, doc.name))}, function(r,rt) {
      cur_frm.refresh();
    });	
  }
}

// Unstop PURCHASE ORDER
// ==================================================================================================
cur_frm.cscript['Unstop Purchase Order'] = function(doc,cdt,cdn) {
  var check = confirm("DO YOU REALLY WANT TO Unstop PURCHASE ORDER : " + doc.name);

  if (check) {
    $c('runserverobj', args={'method':'update_status', 'arg': 'Submitted', 'docs': compress_doclist(make_doclist(doc.doctype, doc.name))}, function(r,rt) {
      cur_frm.refresh();
    });	
  }
}
