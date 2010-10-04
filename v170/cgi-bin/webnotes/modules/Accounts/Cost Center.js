//Account filtering for cost center
cur_frm.fields_dict['budget_details'].grid.get_field('account').get_query = function(doc) {
  var mydoc = locals[this.doctype][this.docname];
  return 'SELECT DISTINCT `tabAccount`.`name`,`tabAccount`.debit_or_credit,`tabAccount`.group_or_ledger FROM `tabAccount` WHERE `tabAccount`.`company` = "' + doc.company_name + '" AND `tabAccount`.`is_pl_account` = "Yes" AND `tabAccount`.`group_or_ledger` != "Group" AND `tabAccount`.`group_or_ledger` is not NULL AND `tabAccount`.debit_or_credit = "Debit" AND `tabAccount`.`name` LIKE "%s" ORDER BY `tabAccount`.`name` LIMIT 50';
  }

cur_frm.fields_dict['parent_cost_center'].get_query = function(doc){
  return 'SELECT DISTINCT `tabCost Center`.name FROM `tabCost Center` WHERE `tabCost Center`.group_or_ledger="Group" AND `tabCost Center`.is_active="Yes" AND `tabCost Center`.company_name="'+ doc.company_name+'" AND `tabCost Center`.company_name is not NULL AND `tabCost Center`.name LIKE "%s" ORDER BY `tabCost Center`.name LIMIT 50';
}

//parent cost center
cur_frm.cscript.parent_cost_center = function(doc,cdt,cdn){
  if(!doc.company_name){
    alert('Please enter company name first');
  }
}

//company abbr
cur_frm.cscript.company_name = function(doc,cdt,cdn){
  get_server_fields('get_abbr','','',doc,cdt,cdn,1);
}

//onload if cost center is group
cur_frm.cscript.onload = function(doc, cdt, cdn) {
  /*if(doc.__islocal){
    var callback = function(r,rt){
      refresh_field('budget_details');
    }
     $c_obj([doc],'get_fiscal_years','',callback);
//    $c(runserverobj, args={'method':'get_fiscal_years', 'docs':compress_doclist([doc])},callback);
  }*/
  
  if(!doc.__islocal && doc.docstatus == 0){
    get_field(doc.doctype,'group_or_ledger',doc.name).permlevel = 1;
//    refresh_field('budget_details');
    refresh_field('group_or_ledger');
    get_field(doc.doctype,'company_name',doc.name).permlevel = 1;
    refresh_field('company_name');
  }
   
  if(doc.group_or_ledger == 'Group') {
    hide_field('budget_details');
  }
  else{
    unhide_field('budget_details');
  }
   
}

cur_frm.cscript.group_or_ledger = function(doc,cdt,cdn){
  if(doc.group_or_ledger == 'Group'){
    hide_field('budget_details');
  }
  else{
    unhide_field('budget_details');
  }
}

//cur_frm.cscript.validate = cur_frm.cscript.onload;