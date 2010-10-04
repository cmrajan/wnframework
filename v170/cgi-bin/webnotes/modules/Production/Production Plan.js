// Onload
//------------------------------------------------------------------------------------------
cur_frm.cscript.onload = function(doc, cdt, cdn) {
  cfn_set_fields(doc, cdt, cdn);
}

// Refresh
//------------------------------------------------------------------------------------------
cur_frm.cscript.refresh = function(doc, cdt, cdn) { 
  cfn_set_fields(doc, cdt, cdn);
}

//utility functions
//------------------------------------------------------------------------------------------
var cfn_set_fields = function(doc, cdt, cdn) {
  // Show MRP Button variable
  show_mrp_button = 0;

  var el = getchildren('PP Detail',doc.name,'pp_details');
  for(var i in el){
    // If there are some Rows on which MRP is not Runned then set show_mrp_button

    if(flt(el[i].mrp) != 1){
      show_mrp_button = 1;        
    }
  }

  // If show_mrp_button is set 
  if(show_mrp_button == 1){
    unhide_field('RUN MRP')
  }
  else{
    hide_field('RUN MRP')
  }

  // if document is not saved then unhide RUN MRP BUTTON
  if(doc.__islocal == 1){
    hide_field('RUN MRP');
  }
}

// Get Query for BOM NO
//-----------------------------------------------------------------------------------------
cur_frm.fields_dict['pp_details'].grid.get_field('bom_no').get_query = function(doc) {
  var d = locals[this.doctype][this.docname];
  return 'SELECT DISTINCT `tabBill Of Materials`.`name` FROM `tabBill Of Materials` WHERE `tabBill Of Materials`.`item` = "' + d.item_code + '" AND `tabBill Of Materials`.`name` like "%s" ORDER BY `tabBill Of Materials`.`name` LIMIT 50';
}
