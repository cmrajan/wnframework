//--------------------------------------------------------------------------------------------------------
// Permissions
// Trigger on table fields to check value change 

cur_frm.cscript.level = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  if(d.level){
    d.changed = 1;
  }
}

cur_frm.cscript.read = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  d.changed = 1;
}

cur_frm.cscript.write = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  d.changed = 1;
}

cur_frm.cscript.create = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  d.changed = 1;
}

cur_frm.cscript.submit = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  d.changed = 1;
}

cur_frm.cscript.cancel = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  d.changed = 1;
}

cur_frm.cscript.amend = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  d.changed = 1;
}

cur_frm.cscript.match = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  d.changed = 1;
}

cur_frm.cscript.remove_permission = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  d.changed = 1;
}

cur_frm.cscript.select_permission_role = function(doc, cdt, cdn){
  doc.select_doc_for_perm = '';
  doc.for_level = '';
  hide_field('select_doc_for_perm');
  hide_field('for_level');
  hide_field('Add Permission');
  hide_field('Update Permissions');
}

// get doctype list
cur_frm.cscript['Get Doctypes'] = function(doc, cdt, cdn){
  $c('runserverobj', args={'method':'get_doctypes', 'docs':compress_doclist (make_doclist (doc.doctype,doc.name))},
    function(r, rt) {
      refresh_field('role_permissions');
      unhide_field('select_doc_for_perm');
      unhide_field('for_level');
      unhide_field('Add Permission');
      unhide_field('Update Permissions');
    }
  );
}