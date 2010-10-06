cur_frm.cscript.onload = function(doc, cdt, cdn) {
  if (!doc.date){ 
  doc.date = date.obj_to_str(new Date());
  doc.contact_date=""
  }
}

cur_frm.cscript.refresh = function(doc, cdt, cdn) {

//On Saving Lead
//==============================================
    if(doc.__islocal != 1){
      unhide_field(['Create Contact']);
      unhide_field(['Create Enquiry']);
      unhide_field(['Create Customer']); 
      if(doc.status == 'Lead Lost') {
        unhide_field('order_lost_reason');
        hide_field(['Create Customer']);
        hide_field(['Create Contact']);
        hide_field(['Create Enquiry']);
      }
      else hide_field('order_lost_reason');
     }
  else{
    hide_field(['Create Customer']);
    hide_field(['Create Contact']);
    hide_field(['Create Enquiry']);
  }
}


// Client Side Triggers
// ===========================================================
// ************ Status ******************
cur_frm.cscript.status = function(doc, cdt, cdn){
  cur_frm.cscript.refresh(doc, cdt, cdn);
}

// *********** Country ******************
// This will show states belonging to country
cur_frm.cscript.country = function(doc, cdt, cdn) {
  var mydoc=doc;
  $c('runserverobj', args={'method':'check_state', 'docs':compress_doclist([doc])},
    function(r,rt){
      if(r.message) {
        var doc = locals[mydoc.doctype][mydoc.name];
        get_field(doc.doctype, 'state' , doc.name).options = r.message;
        refresh_field('state');
      }
    }
  );
}


// Convert Lead to Contact
// ===============================================================
cur_frm.cscript['Make Contact'] = function(doc){
  var cont = LocalDB.create('Contact');
  cont = locals['Contact'][cont];
  if (doc.type=='Client') {
    cont.contact_type='Company';
    cont.is_customer=1;
  }
  else if(doc.type=='Channel Partner' || doc.type=='Consultant'){
    cont.contact_type = 'Individual';
    cont.is_sales_partner=1;
  }
  cont.is_primary_contact='No';
  cont.first_name = doc.lead_name;
  cont.contact_no = doc.contact_no;
  cont.mobile_no = doc.mobile_no;
  cont.email_id = doc.email_id;
  loaddoc("Contact",cont.name);
}

// Create New File
// ===============================================================
cur_frm.cscript['Create New File'] = function(doc){
  new_doc("File");
}

//Trigger in Item Table
//===================================
cur_frm.cscript.item_code=function(doc,cdt,cdn){
  var d = locals[cdt][cdn];
  if (d.item_code) { get_server_fields('get_item_detail',d.item_code,'lead_item_detail',doc,cdt,cdn,1);}
}

// Create New Customer
// ===============================================================
cur_frm.cscript['Create Customer'] = function(doc){
  n = createLocal("Customer");
  $c('dt_map', args={
	  'docs':compress_doclist([locals["Customer"][n]]),
	  'from_doctype':'Lead',
	  'to_doctype':'Customer',
	  'from_docname':doc.name,
    'from_to_list':"[['Lead', 'Customer']]"
  }
  , function(r,rt) {
    loaddoc("Customer", n);
    }
    );
  }
  
// Create New Enquiry
// ===============================================================
cur_frm.cscript['Create Enquiry'] = function(doc){
  n = createLocal("Enquiry");
  $c('dt_map', args={
	  'docs':compress_doclist([locals["Enquiry"][n]]),
	  'from_doctype':'Lead',
	  'to_doctype':'Enquiry',
	  'from_docname':doc.name,
    'from_to_list':"[['Lead', 'Enquiry']]"
  }
  , function(r,rt) {
    loaddoc("Enquiry", n);
    }
    );
  }
  
// Create New Contact
// ===============================================================
cur_frm.cscript['Create Contact'] = function(doc){
  new_doc("Contact");
  }
  
// Fetching Campaign Name
//================================================================
cur_frm.cscript.source = function(doc, cdt, cdn){
 if (doc.source == 'Campaign'){
  unhide_field('campaign_name');
  }
 else {
  hide_field('campaign_name');
}
}