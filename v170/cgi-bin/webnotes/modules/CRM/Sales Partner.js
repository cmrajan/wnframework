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

var cfn_display_data = function(val, d, tbl) {
  var is_table = locals['DocType'][d.doctype].istable;
  for(var key in val)
  {
    d[key] = val[key];
    if (is_table && is_table != null)
      refresh_field(key, d.name, tbl);
    else {
      refresh_field(key);
    }
  }
}

cur_frm.cscript['Manage Contacts'] = function(doc,cdt,cdn){
  var fn = function() { pscript.load_from_partner(doc.name); }
  loadpage('Contact Page',fn); 
}

cur_frm.cscript.refresh = function(doc,cdt,cdn){
  if(doc.__islocal){
    hide_field('Manage Contacts');
  }
  else{ unhide_field('Manage Contacts'); }
}