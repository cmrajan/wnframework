class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.defaults = get_defaults()
    self.tname = 'PO Detail'
    self.fname = 'po_details'
		
  def get_default_schedule_date(self):
    get_obj(dt = 'Purchase Common').get_default_schedule_date(self)
    
  def validate_fiscal_year(self):
    get_obj(dt = 'Purchase Common').validate_fiscal_year(self.doc.fiscal_year,self.doc.transaction_date,'PO Date')


  # Client Trigger Functions
  #----------------------------------------------------------------------------------------------------
  # Get Supplier Details 
  def get_supplier_details(self, name = ''):
    return cstr(get_obj(dt='Purchase Common').get_supplier_details(name))

  # Get Item Details
  def get_item_details(self, arg =''):
    return cstr(get_obj(dt='Purchase Common').get_item_details(self,arg))

  # Get UOM Details
  def get_uom_details(self, arg = ''):
    return cstr(get_obj(dt='Purchase Common').get_uom_details(arg))

  # get available qty at warehouse
  def get_bin_details(self, arg = ''):
    return cstr(get_obj(dt='Purchase Common').get_bin_details(arg))

  # Pull Indent
  def get_indent_details(self):
    self.validate_prev_docname()     
    get_obj('DocType Mapper','Indent-Purchase Order').dt_map('Indent','Purchase Order',self.doc.indent_no, self.doc, self.doclist, "[['Indent Detail', 'PO Detail']]")

  # validate if indent has been pulled twice
  def validate_prev_docname(self):
    for d in getlist(self.doclist, 'po_details'): 
      if d.prevdoc_docname and self.doc.indent_no == d.prevdoc_docname:
        msgprint(cstr(self.doc.indent_no) + " indent details have already been pulled. ")
        raise Exception

  # get last purchase rate
  def get_last_purchase_rate(self):
    get_obj('Purchase Common').get_last_purchase_rate(self)


    
  # validation
  #-------------------------------------------------------------------------------------------------------------
  def validate_doc(self,pc_obj):
    # Please Check Supplier Quotation - Purchase ORder Transaction , it has to be discussed
    if self.doc.supp_quo_no:
      pc_obj.validate_doc(obj = self, prevdoc_doctype = 'Supplier Quotation', prevdoc_docname = cstr(self.doc.supp_quo_no))
    else:
      # Validate values with reference document
      pc_obj.validate_reference_value(obj = self)

  # Check for Stopped status 
  def check_for_stopped_status(self, pc_obj):
    check_list =[]
    for d in getlist(self.doclist, 'po_details'):
      if d.fields.has_key('prevdoc_docname') and d.prevdoc_docname and d.prevdoc_docname not in check_list:
        check_list.append(d.prevdoc_docname)
        pc_obj.check_for_stopped_status( d.prevdoc_doctype, d.prevdoc_docname)

    
  # Validate
  def validate(self):
    self.validate_fiscal_year()
    # Step 1:=> set status as "Draft"
    set(self.doc, 'status', 'Draft')
    
    # Step 2:=> get Purchase Common Obj
    pc_obj = get_obj(dt='Purchase Common')
    
    # Step 3:=> validate mandatory
    pc_obj.validate_mandatory(self)

    # Step 4:=> validate for items
    pc_obj.validate_for_items(self)

    # Step 5:=> validate conversion rate
    pc_obj.validate_conversion_rate(self)
    
    # Step 6:=> validate_doc
    self.validate_doc(pc_obj)
    
    # Step 7:=> Check for stopped status
    self.check_for_stopped_status(pc_obj)
    

  
  # update bin
  # ----------
  def update_bin(self, is_submit, is_stopped = 0):
    pc_obj = get_obj('Purchase Common')
    for d in getlist(self.doclist, 'po_details'):
      #1. Check if is_stock_item == 'Yes'
      if sql("select is_stock_item from tabItem where name=%s", d.item_code)[0][0]=='Yes':
        
        ind_qty, po_qty = 0, flt(d.qty) * flt(d.conversion_factor)
        if is_stopped:
          po_qty = flt(d.qty) > flt(d.received_qty) and flt(flt(flt(d.qty) - flt(d.received_qty)) * flt(d.conversion_factor))or 0 
        
        # No updates in Indent on Stop / Unstop
        if cstr(d.prevdoc_doctype) == 'Indent' and not is_stopped:
          # get qty and pending_qty of prevdoc 
          curr_ref_qty = pc_obj.get_qty( d.doctype, 'prevdoc_detail_docname', d.prevdoc_detail_docname, 'Indent Detail', 'Indent - Purchase Order', self.doc.name)
          max_qty, qty, curr_qty = flt(curr_ref_qty.split('~~~')[1]), flt(curr_ref_qty.split('~~~')[0]), 0
          
          if flt(qty) + flt(po_qty) > flt(max_qty):
            curr_qty = flt(max_qty) - flt(qty)
            # special case as there is no restriction for Indent - Purchase Order 
            curr_qty = (curr_qty > 0) and curr_qty or 0
          else:
            curr_qty = flt(po_qty)
          
          ind_qty = -flt(curr_qty)

        #==> Update Bin's Indent Qty by +- ind_qty and Ordered Qty by +- qty
        get_obj('Warehouse', d.warehouse).update_bin(0, 0, (is_submit and 1 or -1) * flt(po_qty), (is_submit and 1 or -1) * flt(ind_qty), 0, d.item_code, self.doc.transaction_date)


  def check_modified_date(self):
    mod_db = sql("select modified from `tabPurchase Order` where name = '%s'" % self.doc.name)
    date_diff = sql("select TIMEDIFF('%s', '%s')" % ( mod_db[0][0],cstr(self.doc.modified)))
    
    if date_diff and date_diff[0][0]:
      msgprint(cstr(self.doc.doctype) +" => "+ cstr(self.doc.name) +" has been modified. Please Refresh. ")
      raise Exception

  # On Close
  #-------------------------------------------------------------------------------------------------
  def update_status(self, status):
    self.check_modified_date()
    # step 1:=> Set Status
    set(self.doc,'status',cstr(status))

    # step 2:=> Update Bin
    self.update_bin(is_submit = (status == 'Submitted') and 1 or 0, is_stopped = 1)

    # step 3:=> Acknowledge user
    msgprint(self.doc.doctype + ": " + self.doc.name + " has been %s." % ((status == 'Submitted') and 'Unstopped' or cstr(status)))


  # On Submit
  def on_submit(self):
    pc_obj = get_obj(dt ='Purchase Common')
    
    # Step 1 :=> Update Previous Doc i.e. update pending_qty and Status accordingly
    pc_obj.update_prevdoc_detail(self, is_submit = 1)

    # Step 2 :=> Update Bin 
    self.update_bin(is_submit = 1, is_stopped = 0)
    
    # Step 3 :=> Check For Approval Authority
    get_obj('Authorization Control').validate_approving_authority(self.doc.doctype, self.doc.net_total)
    
    # Step 4 :=> Update Current PO No. in Supplier as last_purchase_order.
    update_supplier = sql("update `tabSupplier` set last_purchase_order = '%s' where name = '%s'" % (self.doc.name, self.doc.supplier))

    # Step 5 :=> Update last purchase rate
    pc_obj.update_last_purchase_rate(self, is_submit = 1)

    # Step 6 :=> Set Status
    set(self.doc,'status','Submitted')
    
    self.doc.indent_no = ''
   
  # On Cancel
  # -------------------------------------------------------------------------------------------------------
  def on_cancel(self):
    pc_obj = get_obj(dt = 'Purchase Common')
    
    # 1.Check if PO status is stopped
    pc_obj.check_for_stopped_status(cstr(self.doc.doctype), cstr(self.doc.name))
    
    self.check_for_stopped_status(pc_obj)
    
    # 2.Check if Purchase Receipt has been submitted against current Purchase Order
    pc_obj.check_docstatus(check = 'Next', doctype = 'Purchase Receipt', docname = self.doc.name, detail_doctype = 'Purchase Receipt Detail')

    # 3.Check if Payable Voucher has been submitted against current Purchase Order
    #pc_obj.check_docstatus(check = 'Next', doctype = 'Payable Voucher', docname = self.doc.name, detail_doctype = 'PV Detail')
    
    submitted = sql("select t1.name from `tabPayable Voucher` t1,`tabPV Detail` t2 where t1.name = t2.parent and t2.purchase_order = '%s' and t1.docstatus = 1" % self.doc.name)
    if submitted:
      msgprint("Payable Voucher : " + cstr(submitted[0][0]) + " has already been submitted !")
      raise Exception

    # 4.Set Status as Cancelled
    set(self.doc,'status','Cancelled')

    # 5.Update Indents Pending Qty and accordingly it's Status 
    pc_obj.update_prevdoc_detail(self,is_submit = 0)
    
    # 6.Update Bin  
    self.update_bin( is_submit = 0, is_stopped = 0)
    
    # Step 7 :=> Update last purchase rate 
    pc_obj.update_last_purchase_rate(self, is_submit = 0)
