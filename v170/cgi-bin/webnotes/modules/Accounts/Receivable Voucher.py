class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d, dl
    self.log = []
    self.tname = 'RV Detail'
    self.fname = 'entries'

  def autoname(self):
    self.doc.name = make_autoname(self.doc.naming_series+ '/.#####')

  def get_item_details(self, item_code):
    return get_obj('Sales Common').get_item_details(item_code, self)
  
  #---------- set due date as posting date + credit days ------------
  def set_due_date(self):
    if self.doc.debit_to:
      credit_days_cust=sql("select credit_days from `tabAccount` where name='%s'" %self.doc.debit_to)
    if self.doc.company:
      credit_days_comp=sql("select credit_days from `tabCompany` where name='%s'" %self.doc.company)
    
    if credit_days_cust and cint(credit_days_cust[0][0])>0:
      ret = { 'due_date' : add_days(self.doc.posting_date,cint(credit_days_cust[0][0])) }
      
    elif credit_days_comp and cint(credit_days_comp[0][0])>0:
      ret = { 'due_date' : add_days(self.doc.posting_date,cint(credit_days_comp[0][0])) }
      
    return cstr(ret)
  # -------------------- get tax rate if account type is tax  (Trigger written in other charges master)-------------------#
   
  def get_rate(self,arg):
    get_obj('Sales Common').get_rate(arg)

  #--------------------- pull details from other charges master (Get Other Charges) ---------------------------------#

  def get_other_charges(self):
    return get_obj('Sales Common').get_other_charges(self)
    
  #-----------------pull name and adress of customer from accounts table--------------#  
    
  def get_customer_details(self):
    e = sql("select master_name , address from `tabAccount` where name = '%s'" % self.doc.debit_to)
    ename = e and e[0][0] or ''
    eadd = e and e[0][1] or ''
    self.doc.customer = ename
    self.doc.customer_address = eadd

    
 # Pull 
 # ---------------


  def get_company_abbr(self):
    return sql("select abbr from tabCompany where name=%s", self.doc.company)[0][0]
 
  def get_debit_to(self):
    acc_head = sql("select name from `tabAccount` where name = %s", (cstr(self.doc.customer) + " - " + self.get_company_abbr()))
    
    if acc_head and acc_head[0][0]:
      ret = { 'debit_to' : acc_head[0][0] }
      return cstr(ret)
    else:
      msgprint("%s does not have an Account Head in %s. You must first create it from the Customer Master" % (self.doc.customer, self.doc.company))

  def get_customer_auth(self):
    self.a_type = 'None'
    customer = sql('select t1.authorization_document from tabSupplier t1, tabAccount t2 where t2.name=%s and t1.name = t2.account_name', self.doc.debit_to)
    if customer:
      self.a_type = customer[0][0]

  def pull_details(self):
    if self.doc.delivery_note_main:
      self.validate_prev_docname('delivery note')
      self.doc.clear_table(self.doclist,'other_charges')
      self.doclist = get_obj('DocType Mapper', 'Delivery Note-Receivable Voucher').dt_map('Delivery Note', 'Receivable Voucher', self.doc.delivery_note_main, self.doc, self.doclist, "[['Delivery Note', 'Receivable Voucher'],['Delivery Note Detail', 'RV Detail'],['RV Tax Detail','RV Tax Detail'],['Sales Team','Sales Team']]")

    elif self.doc.sales_order_main:
      self.validate_prev_docname('sales order')
      self.doc.clear_table(self.doclist,'other_charges')
      get_obj('DocType Mapper', 'Sales Order-Receivable Voucher').dt_map('Sales Order', 'Receivable Voucher', self.doc.sales_order_main, self.doc, self.doclist, "[['Sales Order', 'Receivable Voucher'],['Sales Order Detail', 'RV Detail'],['RV Tax Detail','RV Tax Detail']]")

  def validate_prev_docname(self,doctype):
    for d in getlist(self.doclist, 'entries'): 
      if doctype == 'delivery note' and self.doc.delivery_note_main == d.delivery_note:
        msgprint(cstr(self.doc.delivery_note_main) + " delivery note details have already been pulled. ")
        raise Exception , " Validation Error. "

      elif doctype == 'sales order' and self.doc.sales_order_main == d.sales_order and not d.delivery_note:
        msgprint(cstr(self.doc.sales_order_main) + " sales order details have already been pulled. ")
        raise Exception , " Validation Error. "

  # validate
  # --------
  def validate_income_account(self):
    for d in getlist(self.doclist,'entries'):
      item = sql("select name,is_asset_item,is_sales_item from `tabItem` where name = '%s'"% d.item_code)
      acc =  sql("select account_type from `tabAccount` where name = '%s'" % d.income_account)
      if not acc:
        msgprint("Account: "+d.income_account+" does not exist in the system")
        raise Exception
      elif item and item[0][1] == 'Yes' and not acc[0][0] == 'Fixed Asset Account':
        msgprint("Please select income head with account type 'Fixed Asset Account' as Item %s is an asset item" % d.item_code)
        raise Exception
      elif item and item[0][1] == 'Yes' and not acc[0][0] == 'Income Account':
        msgprint("Please select expense head with account type 'Income Account' as Item %s is an asset item" % d.item_code)
        raise Exception

  def validate_debit_acc(self):
    acc = sql("select debit_or_credit, is_pl_account from tabAccount where name = '%s'" % self.doc.debit_to)
    if not acc:
      msgprint("Account: "+ self.doc.credit_to + "does not exist")
      raise Exception
    elif acc[0][0] and acc[0][0] != 'Debit':
      msgprint("Account: "+ self.doc.credit_to + "is not a debit account")
      raise Exception
    elif acc[0][1] and acc[0][1] != 'No':
      msgprint("Account: "+ self.doc.credit_to + "is a pl account")
      raise Exception
  
  def validate_customer_and_debit_to(self):
    for d in getlist(self.doclist,'entries'):
      customer = ''
      if d.sales_order:
        customer = sql("select customer_name from `tabSales Order` where name = '%s'" % d.sales_order)[0][0]
        doctype = 'sales order'
        doctype_no = cstr(d.sales_order)
      if d.delivery_note:
        customer = sql("select customer_name from `tabDelivery Note` where name = '%s'" % d.delivery_note)[0][0]
        doctype = 'delivery note'
        doctype_no = cstr(d.delivery_note)
      if customer and not cstr(self.doc.customer) == cstr(customer):
        msgprint("Customer name %s do not match with customer name  of %s %s." %(self.doc.customer,doctype,doctype_no))
        raise Exception , " Validation Error "
    if self.doc.customer:
      acc_head = sql("select name from `tabAccount` where name = %s", (cstr(self.doc.customer) + " - " + self.get_company_abbr()))
      if acc_head and acc_head[0][0]:
        if not cstr(acc_head[0][0]) == cstr(self.doc.debit_to):
          msgprint("Debit To %s do not match with Customer %s for Company %s i.e. %s" %(self.doc.debit_to,self.doc.customer,self.doc.company,cstr(acc_head[0][0])))
          raise Exception, "Validation Error "
      if not acc_head:
         msgprint("%s does not have an Account Head in %s. You must first create it from the Customer Master" % (self.doc.customer, self.doc.company))
         raise Exception, "Validation Error "


  #-----------------------------------------------------------------
  # ADVANCE ALLOCATION
  #-----------------------------------------------------------------

  def get_advances(self):
    get_obj('GL Control').get_advances( self, self.doc.debit_to, 'Advance Adjustment Detail','advance_adjustment_details','credit')

  def clear_advances(self):
    get_obj('GL Control').clear_advances( self, 'Advance Adjustment Detail','advance_adjustment_details')

  def update_against_document_in_jv(self,against_document_no, against_document_doctype):
    get_obj('GL Control').update_against_document_in_jv( self, 'advance_adjustment_details', against_document_no, against_document_doctype, self.doc.debit_to, 'credit', self.doc.doctype)
  
  def pull_address(self):
    e = sql("select address from `tabCustomer` where name = '%s'" % self.doc.customer)
    ename = e and e[0][0] or ''
    ret = {
      'customer_address':ename      
    }
    return str(ret)
    

  def validate(self):
    sales_com_obj = get_obj(dt = 'Sales Common')
    sales_com_obj.check_stop_sales_order(self)
    sales_com_obj.check_active_sales_items(self)
    self.validate_customer_and_debit_to()
    self.clear_advances()
    sales_com_obj.check_conversion_rate(self)
    sales_com_obj.validate_max_discount(self, 'entries')   #verify whether rate is not greater than tolerance
    sales_com_obj.get_allocated_sum(self)  # this is to verify that the allocated % of sales persons is 100%
    self.get_customer_auth()
    self.validate_debit_acc()
    self.validate_income_account()
    #self.validate_so_dn()
    self.set_in_words()
    
    if not self.doc.is_opening:
      self.doc.is_opening='No'
    if not self.doc.customer:
      self.get_customer_details()
    #get_obj('Workflow Engine','RV Test').apply_rule(self)
      
  # Set totals in words
  #--------------------
  def set_in_words(self):
    self.doc.in_words = get_obj('Sales Common').get_total_in_words('Rs', self.doc.rounded_total)
    self.doc.in_words_export = get_obj('Sales Common').get_total_in_words(self.doc.currency, self.doc.rounded_total_export)  
      
      
  # need to give thought on this coz it does not allow to make RV of less than DN qty
  def validate_so_dn(self):
    # check so / dn for qty and rates
    for d in getlist(self.doclist, 'entries'):
      if self.a_type in ['Sales Order', 'Delivery Note'] and not d.sales_order:
        msgprint("Rates are required to be validated against a Sales Order for this Customer. Please put the Sales Order Number for %s" % d.item_code)
        raise Exception

      if self.a_type in ['Delivery Note'] and not d.delivery_note:
        msgprint("Quantities are required to be validated against a Delivery Note for this Customer. Please put the Delivery Note Number for %s" % d.item_code)
        raise Exception
      
      sample = sql("select is_sample_item from `tabItem` where name = '%s'" %(d.item_code),as_dict = 1) #if item is a sample item we can change the rate
 
      if d.sales_order:
        rate = flt(sql('select max(basic_rate) from `tabSales Order Detail` where item_code=%s and parent=%s and name = %s', (d.item_code, d.sales_order, d.so_detail))[0][0])
        if abs(rate - flt(d.basic_rate)) > 1 and sample[0]['is_sample_item'] == 'No':
          msgprint("Rate for %s in the Sales Order is %s. Rate must be same as Sales Order Rate" % (d.item_code, rate))
          raise Exception
        if not d.delivery_note:
          qty = flt(sql('select qty - ifnull(billed_qty,0) from `tabSales Order Detail` where item_code=%s and parent=%s and name = %s', (d.item_code, d.sales_order, d.so_detail))[0][0])
          if abs(qty - flt(d.qty)) >= 1 and sample[0]['is_sample_item'] == 'No':
            msgprint("Qty for %s in the Sales Order is %s. Rate must be same as Sales Order Rate" % (d.item_code, qty))
            raise Exception

      if d.delivery_note:
        qty = flt(sql('select qty - ifnull(billed_qty,0) from `tabDelivery Note Detail` where item_code=%s and parent=%s and name = %s', (d.item_code, d.delivery_note, d.dn_detail))[0][0])
        if abs(qty - flt(d.qty)) >= 1 and sample[0]['is_sample_item'] == 'No':
          msgprint("Qty for %s in the Delivery Note is %s. Rate must be same as Sales Order Rate" % (d.item_code, qty))
          raise Exception    

    
  def check_prev_docstatus(self):
    for d in getlist(self.doclist,'entries'):
      if d.sales_order:
        submitted = sql("select name from `tabSales Order` where docstatus = 1 and name = '%s'" % d.sales_order)
        if not submitted:
          msgprint("Sales Order : "+ cstr(d.sales_order) +" is not submitted")
          raise Exception , "Validation Error."

      if d.delivery_note:
        submitted = sql("select name from `tabDelivery Note` where docstatus = 1 and name = '%s'" % d.delivery_note)
        if not submitted:
          msgprint("Delivery Note : "+ cstr(d.delivery_note) +" is not submitted")
          raise Exception , "Validation Error."

  def on_submit(self):
    self.check_prev_docstatus()
    # Check for Approving Authority
    get_obj('Authorization Control').validate_approving_authority(self.doc.doctype, self.doc.grand_total, self)
    get_obj("Sales Common").update_prevdoc_detail(1,self)
    # this squence because outstanding may get -negative
    get_obj(dt='GL Control').make_gl_entries(self.doc, self.doclist)
    self.update_against_document_in_jv(self.doc.name, self.doc.doctype)   
    
    
  def check_next_docstatus(self):
    submit_jv = sql("select t1.name from `tabJournal Voucher` t1,`tabJournal Voucher Detail` t2 where t1.name = t2.parent and t2.against_invoice = '%s' and t1.docstatus = 1" % (self.doc.name))
    if submit_jv:
      msgprint("Journal Voucher : " + cstr(submit_jv[0][0]) + " has been created against " + cstr(self.doc.doctype) + ". So " + cstr(self.doc.doctype) + " cannot be Cancelled.")
      raise Exception, "Validation Error."

  def on_cancel(self):
    sales_com_obj = get_obj(dt = 'Sales Common')
    sales_com_obj.check_stop_sales_order(self)
    self.check_next_docstatus()
    sales_com_obj.update_prevdoc_detail(0,self)
    get_obj(dt='GL Control').make_gl_entries(self.doc, self.doclist, cancel=1)