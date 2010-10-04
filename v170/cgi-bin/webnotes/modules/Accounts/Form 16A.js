cur_frm.cscript.onload = function(doc,cdt,cdn){
  if(doc.company)get_server_fields('get_pan_tan','','',doc,cdt,cdn,1);
}

cur_frm.cscript.company = function(doc,cdt,cdn){
  if(doc.company)get_server_fields('get_pan_tan','','',doc,cdt,cdn);
}

cur_frm.cscript.party_name = function(doc,cdt,cdn){
  if(doc.party_name)get_server_fields('get_party_det','','',doc,cdt,cdn);
}


cur_frm.cscript.to_date = function(doc,cdt,cdn){
  if(doc.from_date>doc.to_date){
    alert("From date can not be greater than To date");
    doc.to_date='';
    refresh_field('to_date')
  }
}


