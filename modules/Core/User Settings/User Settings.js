//--------------------- User Setting-Profile ---------------------------

// Trigger on table fields to check value change 

cur_frm.cscript.first_name = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  if(d.first_name){
    d.changed = 1;
  }
}

cur_frm.cscript.last_name = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  if(d.last_name){
    d.changed = 1;
  }
}

cur_frm.cscript.email = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  if(d.email){
    d.changed = 1;
  }
}

cur_frm.cscript.phone = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  d.changed = 1;
}

cur_frm.cscript.enabled = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  d.changed = 1;
}


// ------------------------- User Setting-Role -------------------------------

// get profile list

cur_frm.cscript.select_role = function(doc, cdt, cdn){
  doc.select_profile = '';
  hide_field('select_profile');
  hide_field('Add Current Role');
  hide_field('Update Users');
}

cur_frm.cscript['Get Profiles'] = function(doc, cdt, cdn){
  $c('runserverobj', args={'method':'get_role_users', 'docs':compress_doclist (make_doclist (doc.doctype,doc.name))},
    function(r, rt) {
      refresh_field('role_users');
      unhide_field('select_profile');
      unhide_field('Add Current Role');
      unhide_field('Update Users');
    }
  );
}

// Trigger on table fields to check value change 

cur_frm.cscript.remove = function(doc, cdt, cdn){
  var d = locals[cdt][cdn];
  if(d.remove){
    d.changed = 1;
  }
}

//--------------------- User Setting-Role Permission---------------------------

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
  doc.select_doctype = '';
  doc.for_level = '';
  hide_field('select_doctype');
  hide_field('for_level');
  hide_field('Add Permission');
  hide_field('Update Permissions');
}

// get doctype list
cur_frm.cscript['Get Doctypes'] = function(doc, cdt, cdn){
  $c('runserverobj', args={'method':'get_doctypes', 'docs':compress_doclist (make_doclist (doc.doctype,doc.name))},
    function(r, rt) {
      refresh_field('role_permissions');
      unhide_field('select_doctype');
      unhide_field('for_level');
      unhide_field('Add Permission');
      unhide_field('Update Permissions');
    }
  );
}