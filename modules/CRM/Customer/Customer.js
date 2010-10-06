cur_frm.cscript.refresh = function(doc,dt,dn) {
  if(doc.__islocal) hide_field(['Create Account Head','Manage Contacts'])
  else unhide_field(['Create Account Head','Manage Contacts'])
}

cur_frm.cscript.country = function(doc, cdt, cdn) {
  var mydoc=doc;
  $c('runserverobj', args={'method':'check_state', 'docs':compress_doclist([doc])},
    function(r,rt){
      //alert(r.message)
      if(r.message) {
        var doc = locals[mydoc.doctype][mydoc.name];
        doc.state = '';
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

cur_frm.cscript.validate = function(doc, cdt, cdn) {
    // below part is commented coz it does not allow '.', need to find soln which only disallows "'"
  /*var regex = /^[a-zA-Z0-9_ ]+$/;
  if(doc.__islocal && regex.test(doc.customer_name)==false)
  {
    alert("Please enter a valid Customer name.");
    validated = false;
  } */
}

cur_frm.cscript.show_workorders = function() {
  loadreport("Sales Order", "Work Order List", function(f) { 
    f.set_filter("Sales Order", "Customer Name", cur_frm.doc.name); });
}

cur_frm.cscript.onload = function(doc, cdt, cdn) {
  // update report html
  if(!doc.__islocal){
    html_field = get_field(doc.doctype, 'Reports HTML', doc.name);
    html_field.options = '<h2>Related Reports</h2>';
    html_field.options += '<div class="link_type" onclick="cur_frm.cscript.show_workorders()">Work Orders</div>';
    refresh_field('Reports HTML');
  }
}

cur_frm.cscript['Manage Contacts'] = function(doc,cdt,cdn){
  var fn = function() { pscript.load_from_customer(doc.name); }
  loadpage('Contact Page',fn); 
}