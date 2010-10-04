class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.tname = 'Sales Order Detail'
    self.fname = 'sales_order_details'
    self.person_tname = 'Target Detail'
    self.partner_tname = 'Partner Target Detail'
    self.territory_tname = 'Territory Target Detail'
    
# DOCTYPE TRIGGER FUNCTIONS
# ==============================================================================
#************Fiscal Year Validation*****************************
  def validate_fiscal_year(self):
    get_obj('Sales Common').validate_fiscal_year(self.doc.fiscal_year,self.doc.transaction_date,'Sales Order Date')
  
  # ******************* Pull Quotation Details ********************
  def pull_quotation_details(self):
    self.doc.clear_table(self.doclist, 'other_charges')
    self.doc.clear_table(self.doclist, 'sales_order_details')
    self.doc.clear_table(self.doclist, 'sales_team')
    self.doc.clear_table(self.doclist, 'tc_details')
    get_obj('DocType Mapper', 'Quotation-Sales Order').dt_map('Quotation', 'Sales Order', self.doc.quotation_no, self.doc, self.doclist, "[['Quotation', 'Sales Order'],['Quotation Detail', 'Sales Order Detail'],['RV Tax Detail','RV Tax Detail'],['Sales Team','Sales Team'],['TC Detail','TC Detail']]")
  
  # ******************* Get Customer Details ***********************
  def get_customer_details(self, name):
    return cstr(get_obj('Sales Common').get_customer_details(name))

  # ****** Get contact person details based on customer selected ****
  def get_contact_details(self,arg):
    return cstr(get_obj('Sales Common').get_contact_details(arg))

  # *********** Get Commission rate of Sales Partner ****************
  def get_comm_rate(self, sales_partner):
    return get_obj('Sales Common').get_comm_rate(sales_partner, self)

  # ************** Clear Sales Order Details Table ******************	
  def clear_sales_order_details(self):
    self.doc.clear_table(self.doclist, 'sales_order_details')
    

# SALES ORDER DETAILS TRIGGER FUNCTIONS
# ================================================================================
  
  # ***************** Get Item Details ******************************
  def get_item_details(self, item_code):
    return get_obj('Sales Common').get_item_details(item_code, self)

  # *** Re-calculates Basic Rate & amount based on Price List Selected ***
  def get_adj_percent(self, arg=''):
    get_obj('Sales Common').get_adj_percent(self)

  # *** Get projected qty of item based on warehouse selected ****
  def get_available_qty(self,args):
    args = eval(args)
    tot_avail_qty = sql("select projected_qty from `tabBin` where item_code = '%s' and warehouse = '%s'" % (args['item_code'], args['warehouse']), as_dict=1)
    ret = {
       'projected_qty' : tot_avail_qty and flt(tot_avail_qty[0]['projected_qty']) or 0
    }
    return cstr(ret)
  
  
# OTHER CHARGES TRIGGER FUNCTIONS
# ====================================================================================
  
  # *********** Get Tax rate if account type is TAX ********************
  def get_rate(self,arg):
    return get_obj('Sales Common').get_rate(arg)

  # **** Pull details from other charges master (Get Other Charges) ****
  def get_other_charges(self):
    return get_obj('Sales Common').get_other_charges(self)
 
 
# GET TERMS & CONDITIONS
# =====================================================================================
  def get_tc_details(self):
    return get_obj('Sales Common').get_tc_details(self)


# VALIDATE
# =====================================================================================
  def validate(self):
    self.validate_fiscal_year()
    self.validate_mandatory()
    self.validate_po_date()
    #self.validate_reference_value()
    self.validate_for_items()
    sales_com_obj = get_obj(dt = 'Sales Common')
    sales_com_obj.check_active_sales_items(self)
    sales_com_obj.check_conversion_rate(self)
    sales_com_obj.validate_max_discount(self,'sales_order_details')        #verify whether rate is not greater than max_discount
    sales_com_obj.get_allocated_sum(self)  # this is to verify that the allocated % of sales persons is 100%
    
    sales_com_obj.make_packing_list(self,'sales_order_details')
    
    
    # ::::: get total in words :::::::
    self.doc.in_words = sales_com_obj.get_total_in_words('Rs', self.doc.rounded_total)
    self.doc.in_words_export = sales_com_obj.get_total_in_words(self.doc.currency, self.doc.rounded_total_export)
    
    # :::::: set SO status :::::::
    set(self.doc, 'status', 'Draft')
    
    #::::: invoke workflow engine :::
    #self.doc.save()
    #for d in self.doclist:
    #  d.parent = self.doc.name
    #  d.save()
    #rule_obj = get_obj(dt = 'Workflow Engine')
    #rule_obj.apply_rule(self)
    

  # Validate values with reference document
  #----------------------------------------
  def validate_reference_value(self):
    get_obj('DocType Mapper', 'Quotation-Sales Order', with_children = 1).validate_reference_value(self, self.doc.name)

  
  
  # ******************** Validate Mandatory *********************
  def validate_mandatory(self):
     #:::::::: validate transaction date v/s delivery date ::::::::::::
    #msgprint(self.doc.delivery_date)
    if self.doc.delivery_date:
      if getdate(self.doc.transaction_date) > getdate(self.doc.delivery_date):
        msgprint("Expected Delivery Date cannot be before Sales Order Date")
        raise Exception

  # ******************** Validate P.O Date *********************        
  def validate_po_date(self):
     #:::::::: validate p.o date v/s delivery date ::::::::::::
    #msgprint(self.doc.po_date)
    if self.doc.po_date and getdate(self.doc.po_date) >= getdate(self.doc.delivery_date):
      msgprint("Expected Delivery Date cannot be before Purchase Order Date")
      raise Exception
                        
    # :::::::::::: amendment date is necessary if document is amended ::::::::::::
    if self.doc.amended_from and not self.doc.amendment_date:
      msgprint("Please Enter Amendment Date")
      raise Exception
      
  
  # *************** Validations of Details Table ****************
  def validate_for_items(self):
    check_list = []
    flag = 0
    # :::::::::::: Sales Order Details Validations ::::::::::::
    for d in getlist(self.doclist, 'sales_order_details'):
      if cstr(self.doc.quotation_no) == cstr(d.prevdoc_docname):
        flag = 1
      if d.prevdoc_docname:
        if self.doc.quotation_date and getdate(self.doc.quotation_date) > getdate(self.doc.transaction_date):
          msgprint("Sales Order Date cannot be before Quotation Date")
          raise Exception
        # validates whether quotation no in doctype and in table is same
        if not cstr(d.prevdoc_docname) == cstr(self.doc.quotation_no):
          msgprint("Items in table does not belong to the Quotation No mentioned.")
          raise Exception
        # validates whether item is not entered twice
      e = [d.item_code, d.prevdoc_docname or '']
      if e in check_list:
        msgprint("Item %s has been entered twice." % d.item_code)
        raise Exception
      else:
        check_list.append(e)
        
      # used for production plan
      d.transaction_date = self.doc.transaction_date
      d.delivery_date = self.doc.delivery_date  
		
      # gets total projected qty of item in warehouse selected (this case arises when warehouse is selected b4 item)
      tot_avail_qty = sql("select projected_qty from `tabBin` where item_code = '%s' and warehouse = '%s'" % (d.item_code,d.reserved_warehouse))
      d.projected_qty = tot_avail_qty and flt(tot_avail_qty[0][0]) or 0
    
    if flag == 0:
      msgprint("There are no items of the quotation selected.")
      raise Exception
	
# ON SUBMIT
# ===============================================================================================
  def on_submit(self):
    self.check_prev_docstatus() 
    self.update_stock_ledger(update_stock = 1)
    self.set_sms_msg(1)
    # :::::::: update customer's last sales order no. ::::::::
    update_customer = sql("update `tabCustomer` set last_sales_order = '%s', modified = '%s' where name = '%s'" %(self.doc.name, self.doc.modified, self.doc.customer_name))
    # :::::::: set SO status :::::::::::
    set(self.doc, 'status', 'Submitted')
    get_obj('Sales Common').check_credit(self,self.doc.grand_total)
    # Check for Approving Authority
    get_obj('Authorization Control').validate_approving_authority(self.doc.doctype, self.doc.grand_total, self)
   
     
  # ***************** Checks Quotation Status **************************
  def check_prev_docstatus(self):
    for d in getlist(self.doclist, 'sales_order_details'):
      cancel_quo = sql("select name from `tabQuotation` where docstatus = 2 and name = '%s'" % d.prevdoc_docname)
      if cancel_quo:
        msgprint("Quotation :" + cstr(cancel_quo[0][0]) + " is already cancelled !")
        raise Exception , "Validation Error. "
               
  # ON CANCEL
  # ===============================================================================================
  def on_cancel(self):
    # Cannot cancel stopped SO
    if self.doc.status == 'Stopped':
      msgprint("Sales Order : '%s' cannot be cancelled as it is Stopped. Unstop it for any further transactions" %(self.doc.name))
      raise Exception
    self.check_nextdoc_docstatus()
    self.update_stock_ledger(update_stock = -1)
    self.set_sms_msg()
    # ::::::::: SET SO STATUS ::::::::::
    set(self.doc, 'status', 'Cancelled')
    
  # ************ CHECK NEXT DOCSTATUS ****************************************
  # does not allow to cancel document if DN or RV made against it is SUBMITTED 
  def check_nextdoc_docstatus(self):
    # ::::::: Checks Delivery Note ::::::::::
    submit_dn = sql("select t1.name from `tabDelivery Note` t1,`tabDelivery Note Detail` t2 where t1.name = t2.parent and t2.prevdoc_docname = '%s' and t1.docstatus = 1" % (self.doc.name))
    if submit_dn:
      msgprint("Delivery Note : " + cstr(submit_dn[0][0]) + " has been created against " + cstr(self.doc.doctype) + ". So " + cstr(self.doc.doctype) + " cannot be Cancelled.")
      raise Exception, "Validation Error."
    # ::::::: Checks Receivable Voucher :::::
    submit_rv = sql("select t1.name from `tabReceivable Voucher` t1,`tabRV Detail` t2 where t1.name = t2.parent and t2.delivery_note = '%s' and t1.docstatus = 1" % (self.doc.name))
    if submit_rv:
      msgprint("Receivable Voucher : " + cstr(submit_rv[0][0]) + " has already been submitted !")
      raise Exception , "Validation Error."

  def check_modified_date(self):
    mod_db = sql("select modified from `tabSales Order` where name = '%s'" % self.doc.name)
    date_diff = sql("select TIMEDIFF('%s', '%s')" % ( mod_db[0][0],cstr(self.doc.modified)))
    
    if date_diff and date_diff[0][0]:
      msgprint(cstr(self.doc.doctype) +" => "+ cstr(self.doc.name) +" has been modified. Please Refresh. ")
      raise Exception

  # STOP SALES ORDER
  # ==============================================================================================      
  # Stops Sales Order & no more transactions will be created against this Sales Order
  def stop_sales_order(self):
    self.check_modified_date()
    self.update_stock_ledger(update_stock = -1,clear = 1)
    # ::::::::: SET SO STATUS ::::::::::
    set(self.doc, 'status', 'Stopped')
    msgprint(self.doc.doctype + ": " + self.doc.name + " has been Stopped. To make transactions against this Sales Order you need to Unstop it.")

  # UNSTOP SALES ORDER
  # ==============================================================================================      
  # Unstops Sales Order & now transactions can be continued against this Sales Order
  def unstop_sales_order(self):
    self.check_modified_date()
    self.update_stock_ledger(update_stock = 1,clear = 1)
    # ::::::::: SET SO STATUS ::::::::::
    set(self.doc, 'status', 'Submitted')
    msgprint(self.doc.doctype + ": " + self.doc.name + " has been Unstopped.")


  # UPDATE STOCK LEDGER
  # ===============================================================================================
  def update_stock_ledger(self, update_stock, clear = 0):
    for d in self.get_item_list(clear):
      stock_item = sql("SELECT is_stock_item FROM tabItem where name = '%s'"%(d[1]),as_dict = 1)       # stock ledger will be updated only if it is a stock item
      if stock_item[0]['is_stock_item'] == "Yes":
        if not d[0]:
          msgprint("Message: Please enter Reserved Warehouse for item %s as it is stock item."% d[1])
          raise Exception
        bin = get_obj('Warehouse', d[0]).update_bin( 0, flt(update_stock) * flt(d[2]), 0, 0, 0, d[1], self.doc.transaction_date)

  # Gets Items from packing list
  #=================================
  def get_item_list(self, clear):
    return get_obj('Sales Common').get_item_list( self, clear)
    
  # SET MESSAGE FOR SMS
  #======================
  def set_sms_msg(self, is_submitted = 0):
    if is_submitted:
      if not self.doc.amended_from:
        msg = 'Sales Order: '+self.doc.name+' has been made against PO no: '+cstr(self.doc.po_no)
        set(self.doc, 'message', msg)
      else:
        msg = 'Sales Order has been amended. New SO no:'+self.doc.name
        set(self.doc, 'message', msg)
    else:
      msg = 'Sales Order: '+self.doc.name+' has been cancelled.'
      set(self.doc, 'message', msg)
    
  # SEND SMS
  # =========
  def send_sms(self):
    if not self.doc.customer_mobile_no:
      msgprint("Please enter customer mobile no")
    elif not self.doc.message:
      msgprint("Please enter the message you want to send")
    else:
      msgprint(get_obj("SMS Control", "SMS Control").send_sms([self.doc.customer_mobile_no,], self.doc.message))