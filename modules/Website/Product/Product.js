// setup code

if(!cur_frm.fields_dict.description.input) {
  // force initialization (to make the element)
  cur_frm.fields_dict.description.make_input();
  var myid = cur_frm.fields_dict.description.input.getAttribute("id");


  // make the editor
  tinyMCE.init({
    theme : "advanced",
    mode : "exact",
    elements: myid,
    plugins:"table,style",
    theme_advanced_toolbar_location : "top",
    theme_advanced_toolbar_align : "left",
    theme_advanced_statusbar_location : "bottom",
    extended_valid_elements: "div[id|dir|class|align|style]",


    // w/h
    width: '100%',
    height: '360px',

    // buttons
    theme_advanced_buttons1 : "save,newdocument,|,bold,italic,underline,strikethrough,|,justifyleft,justifycenter,justifyright,justifyfull,|,styleselect,formatselect,fontselect,fontsizeselect",
    theme_advanced_buttons2 : "cut,copy,paste,pastetext,pasteword,|,search,replace,|,bullist,numlist,|,outdent,indent,blockquote,|,undo,redo,|,link,unlink,cleanup,help,code,|,forecolor,backcolor",
    theme_advanced_buttons3 : "tablecontrols,|,hr,removeformat,visualaid,|,sub,sup,|,charmap,emotions,iespell,media,advhr,|,ltr,rtl",

    // framework integation
    init_instance_callback : "cur_frm.cscript.editor_init_callback",
    onchange_callback : "cur_frm.fields_dict.description.input.onchange"

  });

  // set the editor (on callback)
  cur_frm.cscript.editor_init_callback = function(inst) {
    cur_frm.fields_dict.description.editor = tinyMCE.get(cur_frm.fields_dict.description.input.getAttribute("id"));
  }
}

/*
cur_frm.fields_dict['product_variance'].grid.get_field('variance_image').get_query = function(doc) {
  return 'SELECT DISTINCT `tabFile`.file_list FROM `tabFile` WHERE `tabFile`.file_list LIKE "%s" ORDER BY `tabFile`.file_list LIMIT 50';
}

cur_frm.fields_dict['product_features'].grid.get_field('feature_image').get_query = function(doc) {
  return 'SELECT DISTINCT `tabFile`.file_list FROM `tabFile` WHERE `tabFile`.file_list LIKE "%s" ORDER BY `tabFile`.file_list LIMIT 50';
}*/