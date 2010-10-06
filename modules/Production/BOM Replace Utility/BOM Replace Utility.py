class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    
  def search_parent_bom_of_bom(self):
    pbom = sql("select parent from `tabBOM Material` where bom_no = '%s' and docstatus != 2 " % self.doc.s_bom )
    self.doc.clear_table(self.doclist,'replace_bom_details', 1)
    self.add_to_replace_bom_utility_detail(pbom, 'replace_bom_details')
  
  def search_parent_bom_of_item(self):
    pbom = sql("select parent from `tabBOM Material` where item_code = '%s' and (bom_no is NULL or bom_no = '') and docstatus != 2" % self.doc.s_item )
    self.doc.clear_table(self.doclist,'replace_item_details', 1)
    self.add_to_replace_bom_utility_detail(pbom, 'replace_item_details')
    
  def add_to_replace_bom_utility_detail(self, pbom, t_fname):
    for d in pbom:
      br_child = addchild( self.doc, t_fname, 'BOM Replace Utility Detail', 0,self.doclist)
      br_child.parent_bom = d[0]
      br_child.save()
    self.doc.save()  
    
  def replace_bom(self):
    # validate r_bom
    bom = sql("select name, is_active, docstatus from `tabBill Of Materials` where name = %s",self.doc.r_bom, as_dict =1)
    if not bom:
      msgprint("Please Enter Valid BOM to replace with.")
      raise Exception
    if bom and bom[0]['is_active'] != 'Yes':
      msgprint("BOM '%s' is not Active BOM." % cstr(self.doc.r_bom))
      raise Exception
    if bom and flt(bom[0]['docstatus']) != 1:
      msgprint("BOM '%s' is not Submitted BOM." % cstr(self.doc.r_bom))
      raise Exception
    
    # get item code of r_bom
    item_code = cstr(sql("select item from `tabBill Of Materials` where name = '%s' " % self.doc.r_bom)[0][0])
    # call replace bom engine
    self.replace_bom_engine('replace_bom_details', 'bom_no', self.doc.s_bom, self.doc.r_bom, item_code)
  
  def replace_item(self):
    item = sql("select name, is_active from `tabItem` where name = %s", self.doc.r_item, as_dict = 1)
    if not item:
      msgprint("Please enter Valid Item Code to replace with.")
      raise Exception
    if item and item[0]['is_active'] != 'Yes':
      msgprint("Item Code '%s' is not Active Item." % cstr(self.doc.r_item))
      raise Exception
    self.replace_bom_engine('replace_item_details', 'item_code', self.doc.s_item, self.doc.r_item)
    
  def replace_bom_engine(self, t_fname, fname, s_data, r_data, item_code = ''):
    if not r_data:
      msgprint("Please Enter '%s' and then click on '%s'." % ((t_fname == 'replace_bom_details') and 'BOM to Replace' or 'Item to Replace',(t_fname == 'replace_bom_details') and 'Replace BOM' or 'Replace Item' ))
      raise Exception
      
    for d in getlist(self.doclist, t_fname):
      if d.bom_created:
        msgprint("Please click on '%s' and then on '%s'." % ((t_fname == 'replace_bom_details') and 'Search BOM' or 'Search Item',(t_fname == 'replace_bom_details') and 'Replace BOM' or 'Replace Item' ))
        raise Exception
        
      if d.replace:
        # copy_doclist is the framework funcn which create duplicate document and returns doclist of new document
        # Reinder := Ask rushabh the replacement function for getdoc()
        # make copy
        if self.doc.create_new_bom:
          new_bom_dl = copy_doclist(getdoc('Bill Of Materials', d.parent_bom), no_copy = ['is_active', 'is_default', 'is_sub_assembly', 'remarks', 'flat_bom_details'])
        
          new_bom_dl[0].docstatus = 0
          new_bom_dl[0].save()
        else:
          new_bom_dl = get_obj('Bill Of Materials', d.parent_bom, with_children = 1).doclist

        # replace s_data with r_data in Bom Material Detail Table
        self.replace_data_in_bom_materials(new_bom_dl, fname, s_data, r_data, item_code)
       
        d.bom_created = new_bom_dl[0].name
        d.save()
       
  def replace_data_in_bom_materials(self, dl, fname, s_data, r_data, item_code =''):
    for d in getlist(dl, 'bom_materials'):
      if d.fields[fname] == s_data:
        d.fields[fname] = r_data
        if fname == 'bom_no':
          d.item_code = item_code
        d.save()
        