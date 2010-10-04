class DocType:
  def __init__(self,doc,doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.fname = 'supplier_quotation_details'
    self.tname = 'Supplier Quotation Detail'

  def autoname(self):
    self.doc.name = make_autoname('SQ'+'/.#####')

  def get_contact_details(self):
    cd = sql("select concat_ws(' ',t1.first_name,t1.last_name),t1.cell_no,t1.email,t2.supplier_name,t2.supplier_address from `tabProfile` t1,`tabContact` t2 where t1.email=t2.email_id and t1.name=%s",session['user'])

    ret = {
      'contact_person'  : cd and cd[0][0] or '',
      'contact_no'      : cd and cd[0][1] or '',
      'email'           : cd and cd[0][2] or '',
      'supplier'   : cd and cd[0][3] or '',
      'supplier_address': cd and cd[0][4] or ''
    }
    return cstr(ret)

  def get_enq_details(self):
    self.doc.clear_table(self.doclist, 'supplier_quotation_details')
    get_obj('DocType Mapper','Enquiry-Supplier Quotation').dt_map('Enquiry','Supplier Quotation',self.doc.enq_no, self.doc, self.doclist, "[['Enquiry Detail', 'Supplier Quotation Detail']]")

  #update approval status
  def update_approval_status(self):
    if not self.doc.approval_status or self.doc.approval_status == 'Not Approved':
      set(self.doc, 'approval_status','Approved')
      #sql("update `tabSupplier Quotation` set approval_status = 'Approved' where name=%s",self.doc.name)
    if self.doc.approval_status == 'Approved':
      pc_obj = get_obj('Purchase Common')
      pc_obj.check_docstatus(check = 'Next', doctype = 'Purchase Order', docname = self.doc.name, detail_doctype = 'PO Detail')
      set(self.doc, 'approval_status', 'Not Approved')
      #sql("update `tabSupplier Quotation` set approval_status = 'Not Approved' where name=%s",self.doc.name)

  # On Validate
  #---------------------------------------------------------------------------------------------------------
  def validate(self):
    pc_obj = get_obj(dt='Purchase Common')
    pc_obj.validate_for_items(self)
    pc_obj.validate_doc(obj = self, prevdoc_doctype = 'Enquiry', prevdoc_docname = self.doc.enq_no)


  # On Submit
  #---------------------------------------------------------------------------------------------------------

  # checks whether previous documents doctstatus is submitted.
  def check_previous_docstatus(self):
    pc_obj = get_obj(dt = 'Purchase Common')
    for d in getlist(self.doclist, 'enq_details'):
      if d.prevdoc_docname:
        pc_obj.check_docstatus(check = 'Previous', doctype = 'Indent', docname = d.prevdoc_docname)

  # On Submit
  def on_submit(self):
    # checks whether previous documents doctstatus is submitted.
    self.check_previous_docstatus() 

  # On Cancel
  #---------------------------------------------------------------------------------------------------------
  #def check_next_docstatus(self):
  #  submitted = sql("selct name from `tabPurchase Order` where ref_sq = '%s' and docstatus = 1" % self.doc.name)
  #  if submitted:
  #    msgprint("Purchase Order : " + cstr(submitted[0][0]) + " has already been submitted !")
  #    raise Exception
    
  def on_cancel(self):
    pc_obj = get_obj('Purchase Common')
    pc_obj.check_docstatus(check = 'Next', doctype = 'Purchase Order', docname = self.doc.name, detail_doctype = 'PO Detail')
    #self.check_next_docstatus()