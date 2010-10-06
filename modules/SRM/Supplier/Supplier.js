cur_frm.cscript.refresh = function(doc,dt,dn) {
  if(doc.__islocal) hide_field(["Create Account Head","Company",'Manage Contacts'])
  else unhide_field(["Create Account Head","Company",'Manage Contacts'])
}

cur_frm.cscript['Manage Contacts'] = function(doc,cdt,cdn){
  var fn = function(){ pscript.load_from_supplier(doc.name); }
  loadpage('Contact Page',fn);
}

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