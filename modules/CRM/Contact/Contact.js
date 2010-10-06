//---------- on refresh ----------------------
cur_frm.cscript.refresh = function(doc,cdt,cdn){

  is_flds = ['is_supplier','is_customer','is_sales_partner','is_primary_contact'];
  
  if(doc.__islocal){  //if local                                                          
    hide_field(['Create Login']);
    hide_field('disable_login');
    set_field_permlevel('email_id',1);
  }
 

  //if has login
  if(!doc.__islocal){
    if(doc.has_login!='Yes'){ hide_field('disable_login'); unhide_field(['Create Login']);set_field_permlevel('email_id',1);}
    else{ unhide_field('disable_login'); hide_field(['Create Login']); set_field_permlevel('email_id',2);}
  }
  
  //setting permlevel for email field
  if(!doc.email_id){ set_field_permlevel('email_id',1); }
//  else{ set_field_permlevel('email_id',2); }
  
  if(doc.is_supplier != 1) hide_field('supplier_name'); 
  if(doc.is_customer != 1) hide_field('customer_name'); 
  if(doc.is_sales_partner != 1) hide_field('sales_partner');
  
  /*if(!doc.contact_type || doc.contact_type == 'Individual' || doc.contact_type == ''){
    hide_company_fields(doc,cdt,cdn);
  }
  else{ for(i in is_flds){unhide_field(is_flds[i])}}*/
}


//------------- Trigger on customer ---------------------
cur_frm.cscript.is_customer = function(doc,cdt,cdn){
  if(doc.is_customer){ unhide_field('customer_name'); }
  else{
    doc.customer_name = ''; refresh_field('customer_name');
    doc.customer_address = ''; refresh_field('customer_address');
    doc.customer_group = ''; refresh_field('customer_group');
    hide_field('customer_name'); 
  }
}

//------------- Trigger on supplier -----------------------
cur_frm.cscript.is_supplier = function(doc,cdt,cdn){
  if(doc.is_supplier) { unhide_field('supplier_name'); }
  else{
    doc.supplier_name = ''; refresh_field('supplier_name');
    doc.supplier_address = ''; refresh_field('supplier_address');
    doc.supplier_type = ''; refresh_field('supplier_type');
    hide_field('supplier_name');
  }
}

//--------------- Trigger on sales partner ---------------------
cur_frm.cscript.is_sales_partner = function(doc,cdt,cdn){
  if(doc.is_sales_partner){ unhide_field('sales_partner'); }
  else{
    doc.sales_partner = ''; refresh_field('sales_partner');
    doc.sales_partner_address = ''; refresh_field('sales_partner_address');
    doc.partner_type = ''; refresh_field('partner_type');
    hide_field('sales_partner');
  }
}

//-------------- validate ------------------------------------
cur_frm.cscript.validate = function(doc,cdt,cdn){
    if(doc.has_login != 'Yes'){
      hide_field('disable_login');
    }
    else{ 
      unhide_field('disable_login');
    }
}

//------------ Trigger on contact type-------------------------
/*
cur_frm.cscript.contact_type = function(doc,cdt,cdn){
  //new
  if(!doc.contact_type || doc.contact_type == '' || doc.contact_type == 'Individual'){
    hide_company_fields(doc,cdt,cdn);
  }
  else{
    unhide_field(['is_customer','is_supplier','is_sales_partner','is_primary_contact']);
  }
}*/

//----------- Trigger on supplier name ------------------------
cur_frm.cscript.supplier_name = function(doc,cdt,cdn){
  arg = {'dt':'Supplier','dn':doc.supplier_name,'fld':'supplier_address','type':'supplier_type'};
  get_server_fields('get_address',docstring(arg),'',doc,cdt,cdn,1);
}

//------------ Trigger on customer name ------------------------
cur_frm.cscript.customer_name = function(doc,cdt,cdn){
  arg = {'dt':'Customer','dn':doc.customer_name,'fld':'customer_address','type':'customer_group'};
  get_server_fields('get_address',docstring(arg),'',doc,cdt,cdn,1);
}

//------------ Trigger on sales partner ------------------------
cur_frm.cscript.sales_partner = function(doc,cdt,cdn){
  arg = {'dt':'Sales Partner','dn':doc.sales_partner,'fld':'sales_partner_address','type':'partner_type'};
  get_server_fields('get_address',docstring(arg),'',doc,cdt,cdn,1);
}

//------------- Hiding company fields --------------------------
hide_company_fields = function(doc,cdt,cdn){
    is_condn = ['is_customer','is_supplier','is_sales_partner'];
    all_flds = ['customer_name','customer_address','customer_group',
    'supplier_name','supplier_address','supplier_type',
    'sales_partner','sales_partner_address','partner_type','is_primary_contact'];

    for (i in is_condn){
      doc[is_condn[i]] = 0;
      refresh_field(is_condn[i]);
    }
    
    for (a in all_flds){
      doc[all_flds[a]] = '';
      refresh_field(all_flds[a]);
    }

    hide_field(['is_customer','is_supplier','is_sales_partner','supplier_name','customer_name','sales_partner','is_primary_contact']);
    hide_field(['customer_address','supplier_address','sales_partner_address','customer_group','supplier_type','partner_type']);
}

//create profile trigger
cur_frm.cscript['Create Login'] = function(doc,cdt,cdn){
  $c('runserverobj',args={'method':'create_profile','docs':compress_doclist([doc])},
    function(r,rt){
      //alert(r.message);
    }
  );
}