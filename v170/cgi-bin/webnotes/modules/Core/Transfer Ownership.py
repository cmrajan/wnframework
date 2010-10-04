class DocType:
  def __init__(self, d, dl):
    self.doc, self.doclist = d, dl

#-------------------------------------------------------------------------------------------------------------------------------------------------
#Transfer Ownership
#-----------------------------------------------------------------------------------------------------------------------------
  def change_ownership(self):
    if not self.doc.current_owner or not self.doc.new_owner:
      msgprint("Please enter current owner and new owner to transfer ownership")
      raise Exception
    elif self.doc.current_owner=='Administrator':
      msgprint("Administrator's ownership is not transferable")
      raise Exception
    else:
      doc_list=sql("""
      Select 
      t1.parent
      From 
      `tabDocPerm` t1,
      `tabProfile` t2,
      `tabUserRole` t3,
      `tabDocType` t4 
      Where 
      t1.create=1
      and t4.issingle=0
      and t2.name='%s'
      and t4.name=t1.parent  
      and t1.role=t3.role
      and t3.parent=t2.name
      """%(self.doc.current_owner))
      if doc_list:
        dl=[x[0] for x in doc_list]
        msgprint(dl)
        for d in dl:
          sql("update `tab%s` set owner='%s' where owner='%s'"%(cstr(d),self.doc.new_owner,self.doc.current_owner))
      
      msgprint("Owner of '%s' is transferred to '%s'" %(self.doc.current_owner,self.doc.new_owner))