cur_frm.cscript.country = function(doc, cdt, cdn) {
  var mydoc=doc;
  $c('runserverobj', args={'method':'check_state', 'docs':compress_doclist([doc])},
    function(r,rt){
      if(r.message) {
        var doc = locals[mydoc.doctype][mydoc.name];
        cfn_display_data(eval('var a='+r.message+';a'), doc, '');
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