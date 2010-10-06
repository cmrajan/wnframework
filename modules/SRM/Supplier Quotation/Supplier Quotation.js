cur_frm.cscript.tname = "Supplier Quotation Detail";
cur_frm.cscript.fname = "supplier_quotation_details";

$import(Purchase Common)


// ======================= OnLoad =============================================
cur_frm.cscript.onload = function(doc,cdt,cdn){
  if(doc.__islocal){
    get_server_fields('get_contact_details','','',doc,cdt,cdn,1);
  }
}

//======================= Refresh ==============================================
cur_frm.cscript.refresh = function(doc,cdt,cdn){
  if(!has_common(user_roles,['Partner','Supplier','Customer']) && doc.approval_status == 'Approved' ){
    unhide_field(['Create PO']); 
  }
  else{ hide_field(['Create PO']); }  
}

//======================= Enquiry NO Get Query ===============================================
cur_frm.fields_dict['enq_no'].get_query = function(doc){
  return 'SELECT DISTINCT `tabEnquiry`.name FROM `tabEnquiry` WHERE `tabEnquiry`.enq_type="From Company" AND `tabEnquiry`.docstatus = 1 AND `tabEnquiry`.name LIKE "%s"';
}


// On Button Click Functions
//===========================================================================================

//======================== Create Purchase Order =========================================
cur_frm.cscript['Create PO'] = function(doc,cdt,cdn){
    n = createLocal("Purchase Order");
    $c('dt_map', args={
	    'docs':compress_doclist([locals["Purchase Order"][n]]),
	    'from_doctype':'Supplier Quotation',
	    'to_doctype':'Purchase Order',
	    'from_docname':doc.name,
      'from_to_list':"[['Supplier Quotation', 'Purchase Order'], ['Supplier Quotation Detail', 'PO Detail']]"
    }
    , function(r,rt) {
        loaddoc("Purchase Order", n);
      }
    );
}

//======================== Get Report ===================================================
cur_frm.cscript['Get Report'] = function(doc,cdt,cdn) {
  var callback = function(report){
  report.set_filter('PO Detail', 'Ref Doc',doc.name)
 }
 loadreport('PO Detail','Itemwise Purchase Details', callback);
}