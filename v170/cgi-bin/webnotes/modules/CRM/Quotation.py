class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.tname = 'Quotation Detail'
    self.fname = 'quotation_details'

# DOCTYPE TRIGGER FUNCTIONS
# ==============================================================================    
  # ******************* Pull Enquiry Details ********************
  def pull_enq_details(self):
    get_obj('DocType Mapper', 'Enquiry-Quotation').dt_map('Enquiry', 'Quotation', self.doc.enq_no, self.doc, self.doclist, "[['Enquiry', 'Quotation'],['Enquiry Detail', 'Quotation Detail']]")

#************Fiscal Year Validation*****************************
  def validate_fiscal_year(self):
    get_obj('Sales Common').validate_fiscal_year(self.doc.fiscal_year,self.doc.transaction_date,'Quotation Date')
    
  # ******************* Get Customer Details ***********************
  def get_customer_details(self, name = ''):
    return cstr(get_obj('Sales Common').get_customer_details(name))

  # ****** Get contact person details based on customer selected ****
  def get_contact_details(self, arg):
    return cstr(get_obj('Sales Common').get_contact_details(arg))

  # ******************* Get RFQ Details ******************************
  #def get_enq_details(self):
    #self.doc.clear_table(self.doclist,'quotation_details')
    #get_obj('DocType Mapper','Enquiry-Quotation').dt_map('Enquiry', 'Quotation',self.doc.enq_no, self.doc, self.doclist, "[['Enquiry', 'Quotation'],[ 'Enquiry Detail', 'Quotation Detail']]")

  # ************* Clear Quotation Details ***************************
  def clear_quotation_details(self):
    self.doc.clear_table(self.doclist, 'quotation_details')
    
# QUOTATION DETAILS TRIGGER FUNCTIONS
# ================================================================================    

   #************** Get Item Details *********************
  def get_item_details(self, item_code):
    return get_obj('Sales Common').get_item_details(item_code, self)
  
  # *** Re-calculates Basic Rate & amount based on Price List Selected ***
  def get_adj_percent(self, arg=''):
    get_obj('Sales Common').get_adj_percent(self)
    

# OTHER CHARGES TRIGGER FUNCTIONS
# ====================================================================================
  
  # *********** Get Tax rate if account type is TAX ********************
  def get_rate(self,arg):
    return get_obj('Sales Common').get_rate(arg)

  # **** Pull details from other charges master (Get Other Charges) ****
  def get_other_charges(self):
    return get_obj('Sales Common').get_other_charges(self)
  
     
# GET TERMS AND CONDITIONS
# ====================================================================
  def get_tc_details(self):
    return get_obj('Sales Common').get_tc_details(self)

    
# VALIDATE
# ==============================================================================================
  def validate(self):
    self.validate_fiscal_year()
    self.validate_mandatory()
    self.validate_for_items()
    sales_com_obj = get_obj('Sales Common')
    sales_com_obj.check_active_sales_items(self)
    sales_com_obj.validate_max_discount(self,'quotation_details') #verify whether rate is not greater than max_discount
    sales_com_obj.check_conversion_rate(self)
    # ::::::::::: get total in words ::::::::::::::::::
    self.doc.in_words = sales_com_obj.get_total_in_words('Rs', self.doc.rounded_total)
    self.doc.in_words_export = sales_com_obj.get_total_in_words(self.doc.currency, self.doc.rounded_total_export)
    
    # ::::::: Set Quotation Status :::::::::::::
    set(self.doc, 'status', 'Draft')
  
  def validate_mandatory(self):
    # :::::::::::: amendment date is necessary if document is amended ::::::::::::
    if self.doc.amended_from and not self.doc.amendment_date:
      msgprint("Please Enter Amendment Date")
      raise Exception
  
  # ************ Does not allow same item code to be entered twice **********
  def validate_for_items(self):
    check_list=[]
    for d in getlist(self.doclist,'quotation_details'):
      if cstr(d.item_code) in check_list:
        msgprint("Item %s has been entered twice." % d.item_code)
        raise Exception
      else:
        check_list.append(cstr(d.item_code))

        
# ON SUBMIT
# =========================================================================
  def on_submit(self):
    # Check for Approving Authority
    get_obj('Authorization Control').validate_approving_authority(self.doc.doctype, self.doc.grand_total, self)
    
    if not self.doc.amended_from:
      set(self.doc, 'message', 'Quotation: '+self.doc.name+' has been sent')
    else:
      set(self.doc, 'message', 'Quotation has been amended. New Quotation no:'+self.doc.name)

    # ::::: Set Quotation Status ::::::::
    set(self.doc, 'status', 'Submitted')
    
    
# ON CANCEL
# ==========================================================================
  def on_cancel(self):
    set(self.doc, 'message', 'Quotation: '+self.doc.name+' has been cancelled')
    set(self.doc,'status','Cancelled')
  
  
# SEND SMS
# =============================================================================
  def send_sms(self):
    if not self.doc.customer_mobile_no:
      msgprint("Please enter customer mobile no")
    elif not self.doc.message:
      msgprint("Please enter the message you want to send")
    else:
      msgprint(get_obj("SMS Control", "SMS Control").send_sms([self.doc.customer_mobile_no,], self.doc.message))
  
# Print other charges
# ===========================================================================
  def print_other_charges(self,docname):
    print_lst = []
    for d in getlist(self.doclist,'other_charges'):
      lst1 = []
      lst1.append(d.description)
      lst1.append(d.total)
      print_lst.append(lst1)
    return print_lst