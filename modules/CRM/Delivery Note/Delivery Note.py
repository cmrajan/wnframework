class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.tname = 'Delivery Note Detail'
    self.fname = 'delivery_note_details'

    
# DOCTYPE TRIGGERS FUNCTIONS
# ==============================================================================
#************Fiscal Year Validation*****************************
  def validate_fiscal_year(self):
    get_obj('Sales Common').validate_fiscal_year(self.doc.fiscal_year,self.doc.transaction_date,'Voucher Date')

  # ******************* Get Customer Details ***********************
  def get_customer_details(self, name):
    return cstr(get_obj('Sales Common').get_customer_details(name))

  # ****** Get contact person details based on customer selected ****
  def get_contact_details(self):
    return cstr(get_obj('Sales Common').get_contact_details(self))

  # *********** Get Commission rate of Sales Partner ****************
  def get_comm_rate(self, sales_partner):
    return get_obj('Sales Common').get_comm_rate(sales_partner, self)
  
  # *************** Pull Sales Order Details ************************
  def pull_sales_order_details(self):
    self.validate_prev_docname()
    self.doc.clear_table(self.doclist,'other_charges')
    self.doclist = get_obj('DocType Mapper', 'Sales Order-Delivery Note').dt_map('Sales Order', 'Delivery Note', self.doc.sales_order_no, self.doc, self.doclist, "[['Sales Order', 'Delivery Note'],['Sales Order Detail', 'Delivery Note Detail'],['RV Tax Detail','RV Tax Detail'],['Sales Team','Sales Team']]")
  
  # ::::: Validates that Sales Order is not pulled twice :::::::
  def validate_prev_docname(self):
    for d in getlist(self.doclist, 'delivery_note_details'): 
      if self.doc.sales_order_no == d.prevdoc_docname:
        msgprint(cstr(self.doc.sales_order_no) + " sales order details have already been pulled. ")
        raise Exception, "Validation Error. "

        
# DELIVERY NOTE DETAILS TRIGGER FUNCTIONS
# ================================================================================

  # ***************** Get Item Details ******************************
  def get_item_details(self, item_code):
    return get_obj('Sales Common').get_item_details(item_code, self)

  # *** Re-calculates Basic Rate & amount based on Price List Selected ***
  def get_adj_percent(self, arg=''):
    get_obj('Sales Common').get_adj_percent(self)

  # ********** Get Actual Qty of item in warehouse selected *************
  def get_actual_qty(self,args):
    args = eval(args)
    actual_qty = sql("select actual_qty from `tabBin` where item_code = '%s' and warehouse = '%s'" % (args['item_code'], args['warehouse']), as_dict=1)
    ret = {
       'actual_qty' : actual_qty and flt(actual_qty[0]['actual_qty']) or 0
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

    
# VALIDATE
# ====================================================================================
  def validate(self):
    self.validate_fiscal_year()
    sales_com_obj = get_obj(dt = 'Sales Common')
    sales_com_obj.check_stop_sales_order(self)
    sales_com_obj.check_active_sales_items(self)
    self.validate_mandatory()
    #self.validate_prevdoc_details()
    self.validate_reference_value()
    self.validate_for_items()
    self.validate_serial_no()
    sales_com_obj.make_packing_list(self,'delivery_note_details')
    sales_com_obj.validate_max_discount(self, 'delivery_note_details')             #verify whether rate is not greater than max discount
    sales_com_obj.get_allocated_sum(self)  # this is to verify that the allocated % of sales persons is 100%    
    sales_com_obj.check_conversion_rate(self)
    # ::::::: Get total in Words ::::::::
    self.doc.in_words = sales_com_obj.get_total_in_words('Rs', self.doc.rounded_total)
    self.doc.in_words_export = sales_com_obj.get_total_in_words(self.doc.currency, self.doc.rounded_total_export)
    
    # ::::::: Set actual qty for each item in selected warehouse :::::::
    self.update_current_stock()
    # :::::: set DN status :::::::
    set(self.doc, 'status', 'Draft')
    
 
  # ************** Validate Mandatory *************************
  def validate_mandatory(self):
    # :::::::::: Amendment Date ::::::::::::::
    if self.doc.amended_from and not self.doc.amendment_date:
      msgprint("Please Enter Amendment Date")
      raise Exception, "Validation Error. "
    # :::::::::: Will be used later in Sales Return :::::::::::
    if (self.doc.is_sample and not self.doc.to_warehouse):
      msgprint("Please enter 'to warehouse' for the samples")
      raise Exception, "Validation Error. "
     
  # Validate values with reference document
  #----------------------------------------
  def validate_reference_value(self):
    get_obj('DocType Mapper', 'Sales Order-Delivery Note', with_children = 1).validate_reference_value(self, self.doc.name)
  
	  
  # ******* Validate Previous Document Details ************
  def validate_prevdoc_details(self):
    for d in getlist(self.doclist,'delivery_note_details'):
           
      prevdoc = d.prevdoc_doctype
      prevdoc_docname = d.prevdoc_docname
      
      if prevdoc_docname and prevdoc:
        # ::::::::::: Validates Transaction Date of DN and previous doc (i.e. SO , PO, PR) *********
        trans_date = sql("select transaction_date from `tab%s` where name = '%s'" %(prevdoc,prevdoc_docname))[0][0]
        if trans_date and getdate(self.doc.transaction_date) < (trans_date):
          msgprint("Your Voucher Date cannot be before "+cstr(prevdoc)+" Date.")
          raise Exception
        # ::::::::: Validates DN and previous doc details ::::::::::::::::::
        get_name = sql("select name from `tab%s` where name = '%s'" % (prevdoc, prevdoc_docname))
        name = get_name and get_name[0][0] or ''
        if name:  #check for incorrect docname
          if prevdoc == 'Sales Order':
            dt = sql("select company, docstatus, customer_name, currency, sales_partner from `tab%s` where name = '%s'" % (prevdoc, name))
            cust_name = dt and dt[0][2] or ''
            if cust_name != self.doc.customer_name:
              msgprint(cstr(prevdoc) + ": " + cstr(prevdoc_docname) + " customer name :" + cstr(cust_name) + " does not match with customer name : " + cstr(self.doc.customer_name) + " of current document.")
              raise Exception, "Validation Error. "
            sal_partner = dt and dt[0][4] or ''
            if sal_partner != self.doc.sales_partner:
              msgprint(cstr(prevdoc) + ": " + cstr(prevdoc_docname) + " sales partner name :" + cstr(sal_partner) + " does not match with sales partner name : " + cstr(self.doc.sales_partner_name) + " of current document.")
              raise Exception, "Validation Error. "
          else:
            dt = sql("select company, docstatus, supplier, currency from `tab%s` where name = '%s'" % (prevdoc, name))
            supp_name = dt and dt[0][2] or ''
            company_name = dt and dt[0][0] or ''
            docstatus = dt and dt[0][1] or 0
            currency = dt and dt[0][3] or ''
            if (currency != self.doc.currency):
              msgprint(cstr(prevdoc) + ": " + cstr(prevdoc_docname) + " currency : "+ cstr(currency) + "does not match with Currency: " + cstr(self.doc.currency) + "of current document")
              raise Exception, "Validation Error."
            if (company_name != self.doc.company):
              msgprint(cstr(prevdoc) + ": " + cstr(prevdoc_docname) + " does not belong to the Company: " + cstr(self.doc.company_name))
              raise Exception, "Validation Error."
            if (docstatus != 1):
              msgprint(cstr(prevdoc) + ": " + cstr(prevdoc_docname) + " is not Submitted Document.")
              raise Exception, "Validation Error."
        else:
          msgprint(cstr(prevdoc) + ": " + cstr(prevdoc_docname) + " is not a valid " + cstr(prevdoc))
          raise Exception, "Validation Error."

  # ******************** Validate Items **************************        
  def validate_for_items(self):
    check_list, prev_wh_list = [], []
    for d in getlist(self.doclist,'delivery_note_details'):
      if d.prevdoc_doctype:
        if d.prevdoc_doctype == 'Sales Order' :
          data = sql("select item_code, reserved_warehouse from `tabSales Order Detail` where item_code = '%s' and parent = '%s'" % (d.item_code,d.prevdoc_docname))
          prev_wh_list = [i[1] for i in data]
        if d.prevdoc_doctype == 'Purchase Receipt':
          data = sql("select item_code, rejected_warehouse from `tabPurchase Receipt Detail` where item_code = '%s' and parent = '%s'" % (d.item_code,d.prevdoc_docname))
          prev_wh_list = [i[1] for i in data]
        if d.prevdoc_doctype == 'Purchase Order':
          data = sql("select item_code from `tabPO Material Issue Detail` where item_code = '%s' and parent = '%s'" % (d.item_code,d.prevdoc_docname))
        # check if delivered from the same warehouse as reserved or received
        # ------------------------------------------------------------------
        if prev_wh_list and (not d.warehouse in prev_wh_list):
          msgprint("Please check Warehouse:%s of Item:%s is not present in %s:%s." % (d.warehouse,d.item_code,d.prevdoc_doctype,d.prevdoc_docname))
          raise Exception

        
      # check for double entry
      # ----------------------
      e = [d.item_code, d.prevdoc_docname or '']
      if e in check_list:
        msgprint("Item %s has been entered twice." % d.item_code)
        raise Exception
      else:
        check_list.append(e)

  # ********* UPDATE CURRENT STOCK *****************************
  def update_current_stock(self):
    for d in getlist(self.doclist, 'delivery_note_details'):
      bin = sql("select actual_qty from `tabBin` where item_code = %s and warehouse = %s", (d.item_code, d.warehouse), as_dict = 1)
      d.actual_qty = bin and flt(bin[0]['actual_qty']) or 0

    for d in getlist(self.doclist, 'packing_details'):
      bin = sql("select actual_qty from `tabBin` where item_code =  %s and warehouse = %s", (d.item_code, d.warehouse), as_dict = 1)
      d.actual_qty = bin and flt(bin[0]['actual_qty']) or 0
  
  # ******* CHECKS WHETHER SERIAL NO IS REQUIRED IS NOT ********
  def validate_serial_no(self):
    for d in getlist(self.doclist, 'delivery_note_details'):
      ar_required = sql("select has_serial_no from tabItem where name = '%s'" % d.item_code)
      ar_required = ar_required and ar_required[0][0] or ''
      if ar_required == 'Yes' and not d.serial_no:
        msgprint("Serial No is mandatory for item: "+ d.item_code)
        raise Exception
      elif ar_required != 'Yes' and cstr(d.serial_no).strip():
        msgprint("If serial no required, please select 'Yes' in 'Has Serial No' in Item :"+d.item_code)
        raise Exception


# ON SUBMIT
# =================================================================================================
  def on_submit(self):
    # :::: check whether user has permission to submit the document ::::::::::
    approved_by = cstr(get_obj('Manage Account',with_children = 1).get_approval_permissions(self.doc.doctype,self.doc.grand_total,session['user']))
    set(self.doc,'approved_by',approved_by)
    
    set(self.doc, 'message', 'Items against your Order #%s have been delivered. Delivery #%s: ' % (self.doc.po_no, self.doc.name))
    self.check_qty_in_stock()
    #self.validate_qty()
    self.check_serial_no()

    # Check for Approving Authority
    get_obj('Authorization Control').validate_approving_authority(self.doc.doctype, self.doc.grand_total, self)

    get_obj("Sales Common").update_prevdoc_detail(1,self)
    self.update_stock_ledger(update_stock = 1)
    # :::::: set DN status :::::::
    set(self.doc, 'status', 'Submitted')
    
    #------------Check Credit Limit---------------------
    self.credit_limit()

    
  # *********** Checks whether actual quantity is present in warehouse *************
  def check_qty_in_stock(self):
    for d in getlist(self.doclist, 'packing_details'):
      is_stock_item = sql("select is_stock_item from `tabItem` where name = '%s'" % d.item_code)[0][0]
      if is_stock_item == 'Yes' and flt(d.qty) > flt(d.actual_qty):
        msgprint("For Item: " + cstr(d.item_code) + " at Warehouse: " + cstr(d.warehouse) + " Quantity: " + cstr(d.qty) +" is not Available. (Must be less than or equal to " + cstr(d.actual_qty) + " )")
        raise Exception, "Validation Error"
  
  # ****** validates that qty entered is not more than previous doc qty ********
  '''def validate_qty(self):
    for d in getlist(self.doclist, 'delivery_note_details'):
      if d.prevdoc_doctype == 'Purchase Order' :
        doctype = 'Purchase Order'; qty_type = 'Quantity'; detail_field = 'qty'; detail_table = 'PO Material Issue Detail';
      if d.prevdoc_doctype == 'Purchase Receipt':
        doctype = 'Purchase Receipt'; qty_type = 'Rejected Quantity'; detail_field = 'rejected_qty'; detail_table = 'Purchase Receipt Detail';
      if d.prevdoc_doctype == 'Sales Order':
        doctype = 'Sales Order'; qty_type = 'Pending Quantity'; detail_field = 'pending_qty'; detail_table = 'Sales Order Detail';
      if d.prevdoc_doctype:
        qty = sql("select ifnull(sum(%s),0) from `tab%s` where parent = '%s' and item_code = '%s'" %(cstr(detail_field), cstr(detail_table),cstr(d.prevdoc_docname),cstr(d.item_code)))[0][0]
        if flt(d.qty) > flt(qty):
          msgprint("Quantity Entered for Item: " + cstr(d.item_code) + " is more than " + cstr(doctype) + " " + cstr(qty_type)+ " : " + cstr(qty))
          raise Exception, "Validation Error"
      '''    
         
  # ********** Update Serial No. Details *************
  def check_serial_no(self):
    import datetime
    for d in getlist(self.doclist, 'delivery_note_details'):
      if d.serial_no:
        serial_nos = cstr(d.serial_no).split(',')
        if not flt(len(serial_nos)) == flt(d.qty):
          msgprint("Please enter serial nos for all "+ cstr(d.qty) + " quantity")
          raise Exception
        for a in serial_nos:
          if a:
            exists = sql("select name from `tabSerial No` where name = '%s' and item_code = '%s' and status = 'In Store'" % (a, d.item_code))
            if not exists:
              msgprint("Item "+ d.item_code +" of Serial No: "+ a + " does not exists in the system")
              raise Exception
            else:
              self.update_serial_record(a,self.doc.transaction_date,self.doc.name,'Delivered')

              
# ON CANCEL
# =================================================================================================  
  def on_cancel(self):
    sales_com_obj = get_obj(dt = 'Sales Common')
    sales_com_obj.check_stop_sales_order(self)
    self.check_next_docstatus()
    self.back_update_serial_no()
    sales_com_obj.update_prevdoc_detail(0,self)
    self.update_stock_ledger(update_stock = -1)
    # :::::: set DN status :::::::
    set(self.doc, 'status', 'Cancelled')
  
  # ******************** Check Next DocStatus **************************
  def check_next_docstatus(self):
    submit_rv = sql("select t1.name from `tabReceivable Voucher` t1,`tabRV Detail` t2 where t1.name = t2.parent and t2.delivery_note = '%s' and t1.docstatus = 1" % (self.doc.name))
    if submit_rv:
      msgprint("Receivable Voucher : " + cstr(submit_rv[0][0]) + " has already been submitted !")
      raise Exception , "Validation Error."

    submit_in = sql("select t1.name from `tabInstallation Note` t1, `tabInstalled Item Details` t2 where t1.name = t2.parent and t2.prevdoc_docname = '%s' and t1.docstatus = 1" % (self.doc.name))
    if submit_in:
      msgprint("Installation Note : "+cstr(submit_in[0][0]) +" has already been submitted !")
      raise Exception , "Validation Error."

  # ******************** Check Serial No ******************************
  def back_update_serial_no(self):
    import datetime
    for d in getlist(self.doclist, 'delivery_note_details'):
      if d.serial_no:
        serial_nos = cstr(d.serial_no).split(',')
        for a in serial_nos:
          self.update_serial_record(a,'','','In Store')


# UPDATE SERIAL RECORD
# ===================================================================================================
  def update_serial_record(self,serial_no,date,name,status):
    sql("update `tabSerial No` set delivery_date = %s, delivery_note_no = %s, status = %s, modified = %s, modified_by = %s where name = %s",(date,name,status,self.doc.modified,self.doc.modified_by,serial_no))


# UPDATE STOCK LEDGER
# =================================================================================================
  def update_stock_ledger(self, update_stock, clear = 0):
    self.values = []
    for d in self.get_item_list(clear):
      stock_item = sql("SELECT is_stock_item, is_sample_item FROM tabItem where name = '%s'"%(d[1]), as_dict = 1) # stock ledger will be updated only if it is a stock item
      if stock_item[0]['is_stock_item'] == "Yes":
        if not d[0]:
          msgprint("Message: Please enter Reserved Warehouse for item %s as it is stock item."% d[1])
          raise Exception
        # if prevdoc_doctype = "Sales Order" 
        if d[3] < 0 :
          # Reduce Reserved Qty from warehouse
          bin = get_obj('Warehouse', d[0]).update_bin( 0, flt(update_stock) * flt(d[3]), 0, 0, 0, d[1], self.doc.transaction_date)
        # Reduce actual qty from warehouse
        self.make_sl_entry( d, d[0], - flt(d[2]) , 0, update_stock)

      # Delivery to warehouse
      if stock_item[0]['is_sample_item'] == 'Yes':      
        if not self.doc.to_warehouse:   
          msgprint("Message: Please enter Sample Warehouse for item %s as it is stock item."% d[1])
          raise Exception
          
        # Add Actual qty to Sample Warehouse i.e. To Warehouse
        self.make_sl_entry( d, self.doc.to_warehouse, flt(d[2]), 0, update_stock)
    get_obj('Stock Ledger', 'Stock Ledger').update_stock(self.values)
    
  # ***************** Gets Items from packing list *****************
  def get_item_list(self, clear):
   return get_obj('Sales Common').get_item_list( self, clear)
	
  # ********************** Make Stock Entry ************************************
  def make_sl_entry(self, d, wh, qty, in_value, update_stock):
    self.values.append({
      'item_code'           : d[1],
      'warehouse'           : wh,
      'transaction_date'    : self.doc.transaction_date,
      'posting_date'        : self.doc.posting_date,
      'posting_time'        : self.doc.posting_time,
      'voucher_type'        : 'Delivery Note',
      'voucher_no'          : self.doc.name,
      'voucher_detail_no'   : '', 
      'actual_qty'          : qty, 
      'stock_uom'           : d[4],
      'incoming_rate'       : in_value,
      'company'             : self.doc.company,
      'fiscal_year'         : self.doc.fiscal_year,
      'is_cancelled'        : (update_stock==1) and 'No' or 'Yes'
    })
    
    
        
# SEND SMS
# ============================================================================================
  def send_sms(self):
    if not self.doc.customer_mobile_no:
      msgprint("Please enter customer mobile no")
    elif not self.doc.message:
      msgprint("Please enter the message you want to send")
    else:
      msgprint(get_obj("SMS Control", "SMS Control").send_sms([self.doc.customer_mobile_no,], self.doc.message))

#------------ check credit limit of items in DN Detail which are not fetched from sales order----------
  def credit_limit(self):
    amount, total = 0, 0
    for d in getlist(self.doclist, 'delivery_note_details'):
      if not d.prevdoc_docname:
        amount += d.amount
    if amount != 0:
      total = (amount/self.doc.net_total)*self.doc.grand_total
      get_obj('Sales Common').check_credit(self, total)