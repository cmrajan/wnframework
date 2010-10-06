/* Get Item Code */

cur_frm.cscript.item_code = function(doc, dt, dn) {
  var d = locals[dt][dn];

  $c_get_values({
    fields:'description,uom'       // fields to be updated
    ,table_field:'sales_bom_items'           // [optional] if the fields are in a table
    ,select:'description,stock_uom' // values to be returned
    ,from:'tabItem'
    ,where:'name="'+d.item_code+'"'
  }, doc, dt, dn);

}

cur_frm.cscript['Find Sales BOM'] = function(doc, dt, dn) {
  $c_obj(make_doclist(dt,dn), 'check_duplicate', 1, '');
}