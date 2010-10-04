class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d, dl 
    self.tname = 'PV Detail'
    self.fname = 'entries'

  def autoname(self):
    self.doc.name = make_autoname(self.doc.naming_series+'/.####')

  def get_company_abbr(self):
    return sql("select abbr from tabCompany where name=%s", self.doc.company)[0][0]    
  
  def get_rate(self,acc):
    rate = sql("select tax_rate from `tabAccount` where name='%s'"%(acc))

    ret={'add_tax_rate' :rate and flt(rate[0][0]) or 0 }
   
    return cstr(ret)
  
  def get_credit_to(self):
    acc_head = sql("select name from `tabAccount` where name = %s", (cstr(self.doc.supplier) + " - " + self.get_company_abbr()))
    supp_detail = sql("select address,pan_no,cst_no,bst_no,vat_tin_no from `tabSupplier` where name = %s", self.doc.supplier, as_dict =1)
    ret = {'supplier_address': supp_detail and supp_detail[0]['address'] or '',
           'pan_no' : supp_detail and supp_detail[0]['pan_no'] or '',
           'cst_no' : supp_detail and supp_detail[0]['cst_no'] or '',
           'bst_no' : supp_detail and supp_detail[0]['bst_no'] or '',
           'vat_tin_no' : supp_detail and supp_detail[0]['vat_tin_no'] or ''
    }
    if acc_head and acc_head[0][0]:
      ret['credit_to'] = acc_head[0][0]
    elif not acc_head and supp_detail:
      msgprint("%s does not have an Account Head in %s. You must first create it from the Supplier Master" % (self.doc.supplier, self.doc.company))
    return cstr(ret)

  def get_default_values(self,args):
    args = eval(args)
    ret = {}
    if sql("select name from `tabItem` where name = '%s'" % args['item_code']):
      if not args['expense_head'] or args['expense_head'] == 'undefined':
        expense_head = sql("select name from `tabAccount` where account_name in (select purchase_account from `tabItem` where name = '%s')" % args['item_code'])
        ret['expense_head'] = expense_head and expense_head[0][0] or ''
      if not args['cost_center'] or args['cost_center'] == 'undefined':
        cost_center = sql("select cost_center from `tabItem` where name = '%s'" % args['item_code'])
        ret['cost_center'] = cost_center and cost_center[0][0] or ''
    return cstr(ret)

  def get_supplier_auth(self):
    self.a_type = 'None'
    supplier = sql('select t1.authorization_document from tabSupplier t1, tabAccount t2 where t2.name=%s and t1.name = t2.account_name', self.doc.credit_to)
    if supplier:
      self.a_type = supplier[0][0]

  def update_exp_head_cc_as_default(self):
    # Updates Expense Head,Cost Center in Item master as Purchase Account if not there and Cost Center if not there
    for d in getlist(self.doclist,'entries'):
      item = sql("select name, purchase_account, cost_center from `tabItem` where name = '%s'" % (d.item_code))
      if item and not item[0][1]:
        sql("update `tabItem` set purchase_account = '%s' where name = '%s'" % (d.expense_head,d.item_code))
      if item and item[0][2]:
        sql("update `tabItem` set cost_center = '%s' where name = '%s'" % (d.cost_center,d.item_code))

  def pull_details(self):
    if self.doc.purchase_receipt_main:
      self.validate_duplicate_docname('purchase_receipt')
      self.doclist = get_obj('DocType Mapper', 'Purchase Receipt-Payable Voucher').dt_map('Purchase Receipt', 'Payable Voucher', self.doc.purchase_receipt_main, self.doc, self.doclist, "[['Purchase Receipt', 'Payable Voucher'],['Purchase Receipt Detail', 'PV Detail']]")

    elif self.doc.purchase_order_main:
      self.validate_duplicate_docname('purchase_order')
      self.doclist = get_obj('DocType Mapper', 'Purchase Order-Payable Voucher').dt_map('Purchase Order', 'Payable Voucher', self.doc.purchase_order_main, self.doc, self.doclist, "[['Purchase Order', 'Payable Voucher'],['PO Detail', 'PV Detail']]")
    
    ret = eval(self.get_credit_to())
    self.doc.supplier_address = ret['supplier_address']
    self.doc.pan_no = ret['pan_no']
    self.doc.cst_no =ret['cst_no']
    self.doc.bst_no = ret['bst_no']
    self.doc.vat_tin_no = ret['vat_tin_no']

    if ret.has_key('credit_to'):
      self.doc.credit_to = ret['credit_to']

  def validate_duplicate_docname(self,doctype):
    for d in getlist(self.doclist, 'entries'): 
      if doctype == 'purchase_receipt' and cstr(self.doc.purchase_receipt_main) == cstr(d.purchase_receipt):
        msgprint(cstr(self.doc.purchase_receipt_main) + " purchase receipt details have already been pulled. ")
        raise Exception , " Validation Error. "

      if doctype == 'purchase_order' and cstr(self.doc.purchase_order_main) == cstr(d.purchase_order) and not d.purchase_receipt:
        msgprint(cstr(self.doc.purchase_order_main) + " purchase order details have already been pulled. ")
        raise Exception , " Validation Error. "

  def check_conversion_rate(self):
    default_currency = get_obj('Manage Account').doc.default_currency
    if not default_currency:
      msgprint('Message: Please enter default currency in Manage Account')
      raise Exception
    if (self.doc.currency == default_currency and flt(self.doc.conversion_rate) != 1.00) or not self.doc.conversion_rate or (self.doc.currency != default_currency and flt(self.doc.conversion_rate) == 1.00):
      msgprint("Message: Please Enter Appropriate Conversion Rate.")
      raise Exception

  def validate_bill_no_date(self):
    if self.doc.bill_no and not self.doc.bill_date and self.doc.bill_no.lower().strip() not in ['na', 'not applicable', 'none']:
      msgprint("Please enter Bill Date")
      raise Exception

  def validate_credit_acc(self):
    acc = sql("select debit_or_credit, is_pl_account from tabAccount where name = '%s'" % self.doc.credit_to)
    if not acc:
      msgprint("Account: "+ self.doc.credit_to + "does not exist")
      raise Exception
    elif acc[0][0] and acc[0][0] != 'Credit':
      msgprint("Account: "+ self.doc.credit_to + "is not a credit account")
      raise Exception
    elif acc[0][1] and acc[0][1] != 'No':
      msgprint("Account: "+ self.doc.credit_to + "is a pl account")
      raise Exception
      
  def validate_bill_no(self):
    if self.doc.bill_no and self.doc.bill_no.lower().strip()  not in ['na', 'not applicable', 'none']:
      b_no = sql("select bill_no, name from `tabPayable Voucher` where bill_no = '%s' and credit_to = '%s' and docstatus = 1 and name != '%s' and is_opening != 'Yes'" % (self.doc.bill_no, self.doc.credit_to, self.doc.name))
      if b_no:
        msgprint("Please check you have already booked expense against Bill No. %s in Payable Voucher %s" % (cstr(b_no[0][0]), cstr(b_no[0][1])))
        raise Exception , "Validation Error"
      
      if not self.doc.remarks:
        self.doc.remarks = (self.doc.remarks or '') + NEWLINE + ("Against Bill %s dated %s" % (self.doc.bill_no, formatdate(self.doc.bill_date)))
        if self.doc.total_tds_on_voucher:
          self.doc.remarks = (self.doc.remarks or '') + NEWLINE + ("Grand Total: %s, TDS Amount: %s" %(self.doc.grand_total, self.doc.total_tds_on_voucher))
  

  #-------------------------------------------------------------------------------------
  # ADVANCE ALLOCATION
  #-------------------------------------------------------------------------------------

  def get_advances(self):
    get_obj('GL Control').get_advances( self, self.doc.credit_to, 'Advance Allocation Detail','advance_allocation_details','debit')

  def clear_advances(self):
    get_obj('GL Control').clear_advances( self, 'Advance Allocation Detail','advance_allocation_details')

  def update_against_document_in_jv(self, against_document_no, against_document_doctype):
    get_obj('GL Control').update_against_document_in_jv( self,'advance_allocation_details', against_document_no, against_document_doctype, self.doc.credit_to, 'debit',self.doc.doctype)

  def update_against_document_in_jv(self, against_document_no, against_document_doctype):
    get_obj('GL Control').update_against_document_in_jv( self,'advance_allocation_details', against_document_no, against_document_doctype, self.doc.credit_to, 'debit', self.doc.doctype)

  #============TDS==================
    
  # Stop backdated entry if tds applicable
  #---------------------------------------    
  
  def validate_backdated_entry(self):
    if self.doc.total_tds_on_voucher:
      future_pv= sql("Select name from `tabPayable Voucher` where credit_to='%s' and posting_date>'%s' and docstatus=1 and tds_category = '%s'" % (self.doc.credit_to,self.doc.posting_date, self.doc.tds_category))
      if future_pv:
        msgprint("Backdated payable voucher can not be made where tds is applicable")
        raise Exception
        
  # Build tds table if applicable
  #------------------------------
  
  def get_tds(self):
    if cstr(self.doc.is_opening) != 'Yes':
      if not self.doc.credit_to:
        msgprint("Please Enter Credit To account first")
        raise Exception
      else:
        tds_applicable = sql("select tds_applicable from tabAccount where name = '%s'" % self.doc.credit_to)
        if tds_applicable and cstr(tds_applicable[0][0]) == 'Yes':
          if not self.doc.tds_category:
            msgprint("Please select TDS Category")
            raise Exception
          else:
            self.doc.total_tds_on_voucher = get_obj('GL Control', with_children = 1).get_tds_amount(self)
            self.doc.total_amount_to_pay=flt(self.doc.grand_total)-flt(self.doc.total_tds_on_voucher)-flt(self.doc.other_tax_deducted)

  #if tds table is filled manually
  #----------------------------------
  def manually_ded_tax(self):
    tot_tds=0.0
    tot_other=0.0
    for d in getlist(self.doclist,'taxes'):
      if d.tds_type=='Not Applicable' :
        tot_other+=flt(d.ded_amount)
      else:
        tot_tds+=flt(d.ded_amount)
    
    self.doc.total_tds_on_voucher =flt(tot_tds)
    self.doc.other_tax_deducted = flt(tot_other)
    self.doc.total_amount_to_pay=flt(self.doc.grand_total)-flt(self.doc.total_tds_on_voucher)-flt(self.doc.other_tax_deducted)
  
  #check if tds applicable or not
  #----------------------------------
  def check_tds_applicable(self):
    if self.doc.total_tds_on_voucher and not self.doc.tds_category:
      msgprint("Please select TDS Category")
      raise Exception
    
    if self.doc.tds_category and not self.doc.total_tds_on_voucher:
      self.doc.tds_category=''

  def check_for_acc_head_of_supplier(self): 
    acc_head = sql("select name from `tabAccount` where name = %s", (cstr(self.doc.supplier) + " - " + self.get_company_abbr()))
    if self.doc.supplier:
      if acc_head and acc_head[0][0]:
        if not cstr(acc_head[0][0]) == cstr(self.doc.credit_to):
          msgprint("Credit To: %s do not match with Supplier: %s for Company: %s i.e. %s" %(self.doc.credit_to,self.doc.supplier,self.doc.company,cstr(acc_head[0][0])))
          raise Exception, "Validation Error "
      if not acc_head:
        msgprint("Supplier %s does not have an Account Head in %s. You must first create it from the Supplier Master" % (self.doc.supplier, self.doc.company))
        raise Exception, "Validation Error "

  # Check for Item.is_Purchase_item = 'Yes' and Item.is_active = 'Yes'
  def check_active_purchase_items(self):
    for d in getlist(self.doclist, 'entries'):
      if d.item_code:    # extra condn coz item_code is not mandatory in PV
        valid_item = sql("select is_active,is_purchase_item from tabItem where name = %s",d.item_code)
        if not valid_item[0][0] == 'Yes':
          msgprint("Item : '%s' is Inactive" %(d.item_code))
          raise Exception
        if not valid_item[0][1] == 'Yes':
          msgprint("Item : '%s' is not Purchase Item"%(d.item_code))
          raise Exception
  
  # validate
  # --------
  def validate(self):
    self.check_active_purchase_items()
    self.check_conversion_rate()
    self.validate_bill_no()
    self.validate_bill_no_date()
    self.get_supplier_auth()
    self.clear_advances()
    self.update_exp_head_cc_as_default()
    self.validate_credit_acc()
    self.validate_backdated_entry()
    self.check_for_acc_head_of_supplier()
    self.check_for_stopped_status()
    self.po_list, self.pr_list = [], []
    for d in getlist(self.doclist, 'entries'):
      self.validate_supplier_and_credit_to(d)
      self.validate_po_pr(d)
      if not d.purchase_order in self.po_list:
        self.po_list.append(d.purchase_order)
      if not d.purhcase_receipt in self.pr_list:
        self.pr_list.append(d.purchase_receipt)
        
    if not self.doc.manual_tax_deduction:
      self.get_tds()
    else:
      self.manually_ded_tax()
      self.check_tds_applicable()

    if not self.doc.is_opening:
      self.doc.is_opening = 'No'

  def validate_supplier_and_credit_to(self, d):
    supplier = ''
    if d.purchase_order and not d.purchase_order in self.po_list:
      supplier = sql("select supplier from `tabPurchase Order` where name = '%s'" % d.purchase_order)[0][0]
      doctype = 'purchase order'
      doctype_no = cstr(d.purchase_order)
      if supplier and not cstr(self.doc.supplier) == cstr(supplier):
        msgprint("Supplier name %s do not match with supplier name  of %s %s." %(self.doc.supplier,doctype,doctype_no))
        raise Exception , " Validation Error "

    if d.purchase_receipt and not d.purchase_receipt in self.pr_list:
      supplier = sql("select supplier from `tabPurchase Receipt` where name = '%s'" % d.purchase_receipt)[0][0]
      doctype = 'purchase receipt'
      doctype_no = cstr(d.purchase_receipt)
      if supplier and not cstr(self.doc.supplier) == cstr(supplier):
        msgprint("Supplier name %s do not match with supplier name  of %s %s." %(self.doc.supplier,doctype,doctype_no))
        raise Exception , " Validation Error "

  def validate_po_pr(self, d):
    # check po / pr for qty and rates and currency and conversion rate

    # check authorization of Supplier
    if self.a_type in ['Purchase Order', 'Purchase Receipt'] and not d.purchase_order:
      msgprint("Rates are required to be validated against a Purchase Order for this Supplier. Please put the PO Number for %s" % d.item_code)
      raise Exception

    if self.a_type in ['Purchase Receipt'] and not d.purchase_receipt:
      msgprint("Quantities are required to be validated against a Purchase Receipt for this Supplier. Please put the PR Number for %s" % d.item_code)
      raise Exception

    # always import_rate must be equal to import_rate of purchase order
    if d.purchase_order and not d.purchase_order in self.po_list:
      # currency
      currency = cstr(sql("select currency from `tabPurchase Order` where name = '%s'" % d.purchase_order)[0][0])
      if not cstr(currency) == cstr(self.doc.currency):
        msgprint("Purchase Order: " + cstr(d.purchase_order) + " currency : " + cstr(currency) + " does not match with currency of current document.")
        raise Exception

      # import_rate
      rate = flt(sql('select import_rate from `tabPO Detail` where item_code=%s and parent=%s and name = %s', (d.item_code, d.purchase_order, d.po_detail))[0][0])
      if abs(rate - flt(d.import_rate)) > 1:
        msgprint("Import Rate for %s in the Purchase Order is %s. Rate must be same as Purchase Order Rate" % (d.item_code,rate))
        raise Exception
                  
    ###############
    
    if d.purchase_receipt and not d.purchase_receipt in self.pr_list:
      # currency , conversion_rate
      data = sql("select currency, conversion_rate from `tabPurchase Receipt` where name = '%s'" % d.purchase_receipt, as_dict = 1)
      if not cstr(data[0]['currency']) == cstr(self.doc.currency):
        msgprint("Purchase Receipt: " + cstr(d.purchase_receipt) + " currency : " + cstr(data[0]['currency']) + " does not match with currency of current document.")
        raise Exception
         
      if not flt(data[0]['conversion_rate']) == flt(self.doc.conversion_rate):
        msgprint("Purchase Receipt: " + cstr(d.purchase_receipt) + " conversion_rate : " + cstr(data[0]['conversion_rate']) + " does not match with conversion_rate of current document.")
        raise Exception

#         qty
#        qty = flt(sql('select ifnull(qty,0) - ifnull(billed_qty,0) from `tabPurchase Receipt Detail` where item_code=%s and parent=%s and name = %s', (d.item, d.purchase_receipt, d.pr_detail))[0][0])
#        if flt(qty) < flt(d.qty):
#          msgprint("Un Billed Qty for Item %s in the Purchase Receipt is %s. Qty must be same or less than Purchase Receipt Un-Billed Qty" % (d.item, qty))
#          raise Exception
        
  def check_prev_docstatus(self):
    for d in getlist(self.doclist,'entries'):
      if d.purchase_order:
        submitted = sql("select name from `tabPurchase Order` where docstatus = 1 and name = '%s'" % d.purchase_order)
        if not submitted:
          msgprint("Purchase Order : "+ cstr(d.purchase_order) +" is not submitted")
          raise Exception , "Validation Error."
      if d.purchase_receipt:
        submitted = sql("select name from `tabPurchase Receipt` where docstatus = 1 and name = '%s'" % d.purchase_receipt)
        if not submitted:
          msgprint("Purchase Receipt : "+ cstr(d.purchase_receipt) +" is not submitted")
          raise Exception , "Validation Error."

  def check_for_stopped_status(self):
    check_list = []
    for d in getlist(self.doclist,'entries'):
      if d.purchase_order and not d.purchase_order in check_list and not d.purchase_receipt:
        check_list.append(d.purhcase_order)
        stopped = sql("select name from `tabPurchase Order` where status = 'Stopped' and name = '%s'" % d.purchase_order)
        if stopped:
          msgprint("One cannot do any transaction against 'Purchase Order' : %s, it's status is 'Stopped'" % (d.purhcase_order))
          raise Exception

  def on_submit(self):
    self.check_prev_docstatus()
    # Check for Approving Authority
    get_obj('Authorization Control').validate_approving_authority(self.doc.doctype, self.doc.grand_total)
    # this squence because outstanding may get -negative
    get_obj(dt='GL Control').make_gl_entries(self.doc, self.doclist)
    self.update_against_document_in_jv(self.doc.name, self.doc.doctype)
    get_obj(dt = 'Purchase Common').update_prevdoc_detail(self, is_submit = 1)


  def check_next_docstatus(self):
    submit_jv = sql("select t1.name from `tabJournal Voucher` t1,`tabJournal Voucher Detail` t2 where t1.name = t2.parent and t2.against_voucher = '%s' and t1.docstatus = 1" % (self.doc.name))
    if submit_jv:
      msgprint("Journal Voucher : " + cstr(submit_jv[0][0]) + " has been created against " + cstr(self.doc.doctype) + ". So " + cstr(self.doc.doctype) + " cannot be Cancelled.")
      raise Exception, "Validation Error."
    
  def on_cancel(self):
    self.check_next_docstatus()
    get_obj(dt='GL Control').make_gl_entries(self.doc, self.doclist, cancel=1)
    get_obj(dt = 'Purchase Common').update_prevdoc_detail(self, is_submit = 0)


  def get_item_details(self,arg):
    item_det = sql("select item_name, brand, description, item_group from tabItem where name=%s",arg,as_dict=1)
    ret = {
      'item_name' : item_det and item_det[0]['item_name'] or '',
      'brand' : item_det and item_det[0]['brand'] or '',
      'description' : item_det and item_det[0]['description'] or '',
      'item_group'  : item_det and item_det[0]['item_group'] or '',
      'rate' : 0.00,
      'qty' : 0.00,
      'amount' : 0.00,
      'expense_head' : '',
      'cost_center' : ''
    }
    return cstr(ret)