//------------------------------------------------------------------------------------------
//caller setup and onload
cur_frm.cscript.table_fname = 'pf_details';
cur_frm.cscript.table_name = 'PF Detail';

cur_frm.cscript.item_code = function(doc, cdt, cdn) {
  var d = locals[cdt][cdn];  
  if (d.item_code) {
    get_server_fields('get_items_details',d.item_code,'pf_details',doc,cdt,cdn,1);
  }
}

cur_frm.cscript.onload = function(doc, cdt, cdn) {
  if (!doc.transaction_date) {
    doc.transaction_date = date.obj_to_str(new Date());
  }
 
}