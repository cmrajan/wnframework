# Note:
# You must add the DocType to the override_transfer dict, else it will replace everything
# ---------------------------------------------------------------------------------------

class DocType:
  def __init__(self, doc, doclist):
    self.doc, self.doclist = doc, doclist
    
    # Over-ride function dict
    # -----------------------
    
    self.override_transfer = {
      'DocType':'ovr_doctype',
      'DocType Mapper':'ovr_mapper',
      'TDS Rate Chart':'ovr_tds'
    }

  def ovr_doctype(self, doclist, ovr, ignore, onupdate):
    doclist = [Document(fielddata = d) for d in doclist]
    doc = doclist[0]
    orig_modified = doc.modified
    cur_doc = Document('DocType',doc.name)
    added = 0
    prevfield = ''
    prevlabel = ''
    idx = 0
    fld_lst = ''
        
    # fields
    # ------
    for d in getlist(doclist, 'fields'):
      fld = ''
      # if exists
      if d.fieldname:
        fld = sql("select name from tabDocField where fieldname=%s and parent=%s", (d.fieldname, d.parent))
      elif d.label: # for buttons where there is no fieldname
        fld = sql("select name from tabDocField where label=%s and parent=%s", (d.label, d.parent))

      if (not fld) and d.label: # must have label
        if prevfield:
          idx = sql("select idx from tabDocField where fieldname = %s and parent = %s",(prevfield,d.parent))[0][0]
        elif prevlabel and not prevfield:
          idx = sql("select idx from tabDocField where label = %s and parent = %s",(prevlabel,d.parent))[0][0]
        sql("update tabDocField set idx = idx + 1 where parent=%s and idx > %s", (d.parent, cint(idx)))          

        # add field
        nd = Document(fielddata = d.fields)
        nd.oldfieldname, nd.oldfieldtype = '', ''
        nd.idx = cint(idx)+1
        nd.save(new = 1, ignore_fields = ignore)
        fld_lst += NEWLINE+'Label : '+cstr(d.label)+' ~~~~~~ Fieldname : '+cstr(d.fieldname)
        added += 1
      if d.fieldname:
        prevfield = d.fieldname
        prevlabel = ''
      elif d.label:
        prevfield = ''
        prevlabel = d.label
        
    # Print Formats
    # ------
    for d in getlist(doclist, 'formats'):
      fld = ''
      # if exists
      if d.format:
        fld = sql("select name from `tabDocFormat` where format=%s and parent=%s", (d.format, d.parent))
            
      if (not fld) and d.format: # must have label
        # add field
        nd = Document(fielddata = d.fields)
        nd.oldfieldname, nd.oldfieldtype = '', ''
        nd.save(new = 1, ignore_fields = ignore)
        fld_lst += NEWLINE+'Format : '+cstr(d.format)
        added += 1
          
    # code
    # ----
    
    cur_doc.server_code_core = cstr(doc.server_code_core)
    cur_doc.client_script_core = cstr(doc.client_script_core)
    
    cur_doc.save(ignore_fields = ignore)

    if onupdate:
      so = get_obj('DocType', doc.name, with_children = 1)
      if hasattr(so, 'on_update'):
        so.on_update()
    
    set(doc,'modified',orig_modified)
    
    if in_transaction: sql("COMMIT")
    
    if added == 0:
      added_fields = ''
    else:
      added_fields =  ' <div style="color : RED">Added Fields :- '+ cstr(fld_lst)+ '</div>'
      
    return doc.name + (' Upgraded: %s fields added' % added)+added_fields
    
  
  def ovr_mapper(self, doclist, ovr, ignore, onupdate):
    doclist = [Document(fielddata = d) for d in doclist]
    doc = doclist[0]
    orig_modified = doc.modified
    cur_doc = Document('DocType Mapper',doc.name)
    added = 0
    fld_lst = ''
        
    # Field Mapper Details fields
    # ------
    for d in getlist(doclist, 'field_mapper_details'):
      fld = ''
      # if exists
      if d.from_field and d.to_field:
        fld = sql("select name from `tabField Mapper Detail` where from_field=%s and to_field=%s and parent=%s", (d.from_field, d.to_field, d.parent))
            
      if (not fld) and d.from_field and d.to_field: # must have label
        # add field
        nd = Document(fielddata = d.fields)
        nd.oldfieldname, nd.oldfieldtype = '', ''
        nd.save(new = 1, ignore_fields = ignore)
        fld_lst += NEWLINE+'From Field : '+cstr(d.from_field)+' ~~~~~~ To Field : '+cstr(d.to_field)
        added += 1
        
    # Table Mapper Details fields
    # ------
    for d in getlist(doclist, 'table_mapper_details'):
      fld = ''
      # if exists
      if d.from_table and d.to_table: 
        fld = sql("select name from `tabTable Mapper Detail` where from_table=%s and to_table = %s and parent=%s", (d.from_table, d.to_table, d.parent))
            
      if (not fld) and d.from_table and d.to_table: # must have label
        # add field
        nd = Document(fielddata = d.fields)
        nd.oldfieldname, nd.oldfieldtype = '', ''
        nd.save(new = 1, ignore_fields = ignore)
        fld_lst += NEWLINE+'From Table : '+cstr(d.from_table)+' ~~~~~~ To Table : '+cstr(d.to_table)
        added += 1
             
    cur_doc.save(ignore_fields = ignore)
    
    if onupdate:
      so = get_obj('DocType Mapper', doc.name, with_children = 1)
      if hasattr(so, 'on_update'):
        so.on_update()
    
    set(doc,'modified',orig_modified)
    
    if in_transaction: sql("COMMIT")
    
    if added == 0:
      added_fields = ''
    else:
      added_fields =  ' <div style="color : RED">Added Fields :- '+ cstr(fld_lst)+ '</div>' 
    return doc.name + (' Upgraded: %s fields added' % added)+added_fields
    
    
  def ovr_tds(self, doclist, ovr, ignore, onupdate):
    doclist = [Document(fielddata = d) for d in doclist]
    doc = doclist[0]
    orig_modified = doc.modified
    cur_doc = Document('TDS Rate Chart',doc.name)
    added = 0
    fld_lst = ''
        
    # TDS RATE CHART DETAIL fields
    # ------
    for d in getlist(doclist,'rate_chart_detail'):
      fld = ''
      # if exists
      if d.category and d.slab_from and d.slab_to:
        fld = sql("select name from `tabTDS Rate Detail` where category=%s and slab_from=%s and slab_to = %s and parent=%s", (d.category, d.slab_from, d.slab_to, d.parent))
              
      if (not fld) and d.category and d.slab_from and d.slab_to:
        # add field
        nd = Document(fielddata = d.fields)
        nd.oldfieldname, nd.oldfieldtype = '', ''
        nd.save(new = 1, ignore_fields = ignore)
        fld_lst += NEWLINE+'Category : '+cstr(d.category)+' ~~~~~~ Slab From : '+cstr(d.slab_from)+ ' ~~~~~~ Slab To : '+cstr(d.slab_to)
        added += 1
    
    cur_doc.save(ignore_fields = ignore)
    
    if onupdate:
      so = get_obj('TDS Rate Chart', doc.name, with_children = 1)
      if hasattr(so, 'on_update'):
        so.on_update()
    
    set(doc,'modified',orig_modified)
    
    if in_transaction: sql("COMMIT")
    if added == 0:
      added_fields = ''
    else:
      added_fields =  ' <div style="color : RED">Added Fields :- '+ cstr(fld_lst)+ '</div>' 
    
    return doc.name + (' Upgraded: %s fields added' % added)+added_fields