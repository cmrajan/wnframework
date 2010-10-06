class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.prefix = is_testing and 'test' or 'tab'

  def autoname(self):
    supp = sql("select name from `tabSupplier` where name = '%s'" % (self.doc.customer_name))
    supp = supp and supp[0][0] or ''
    if supp:
      msgprint("Supplier by this name already exist")
      raise Exception
    else:
      self.doc.name = self.doc.customer_name
  
  # get parent account
  # ------------------

  def get_receivables_group(self):
    g = sql("select receivables_group from tabCompany where name=%s", self.doc.company)[0][0]
    if not g:
      msgprint("Update Company master, assign a default group for Receivables")
      raise Exception
    return g

  def add_account(self, ac, par, is_territory, abbr):

    # if not group created for zone, create it
    if is_territory and (not sql("select name from tabAccount where name=%s", par)):
      g = self.get_receivables_group()
      self.add_account(self.doc.zone, g, 0, abbr)
    
    arg = {'account_name':ac,'parent_account':par, 'group_or_ledger':'Group', 'company':self.doc.company,'account_type':'','tax_rate':'0'}
   
    t = get_obj('GL Control').add_ac(cstr(arg))
    msgprint("Created Group " + t)
  
  def get_company_abbr(self):
    return sql("select abbr from tabCompany where name=%s", self.doc.company)[0][0]
  
  def get_parent_account(self, abbr):
    if (not self.doc.zone) or (not self.doc.territory):
      msgprint("Zone and Territory are mandatory")
      raise Exception
    
    if not sql("select name from tabAccount where name=%s", (self.doc.territory + " - " + abbr)):

      # if not group created for territory, create it
      self.add_account(self.doc.territory, self.doc.zone + ' - ' + abbr, 1, abbr)
    
    return self.doc.territory + " - " + abbr
  
  
  # create accont head - in tree under zone + territory
  # ------------------
  def create_account_head(self):
    if self.doc.company :
      abbr = self.get_company_abbr()  
      if not sql("select name from tabAccount where name=%s", (self.doc.name + " - " + abbr)):
        parent_account = self.get_parent_account(abbr)
        
        arg = {'account_name':self.doc.name,'parent_account': parent_account, 'group_or_ledger':'Ledger', 'company':self.doc.company,'account_type':'','tax_rate':'0','master_type':'Customer','master_name':self.doc.name,'address':self.doc.address}
        # create
        ac = get_obj('GL Control').add_ac(cstr(arg))
        msgprint("Created "+ac)
      else:
        msgprint("Account already exists under this company")
    else :
      msgprint("Please Select Company under which you want to create account head")

  def check_state(self):
    return NEWLINE + NEWLINE.join([i[0] for i in sql("select state_name from `tabState` where `tabState`.country='%s' " % self.doc.country)])

  def validate(self):
    import string
    #self.update_lead_status()
    self.validate_account_head()

    if self.doc.is_hospital:
      if not self.doc.contact_person:
        msgprint("Please Enter Contact Person")
        raise Exception
      if not self.doc.designation:
        msgprint("Please Enter Designation")
        raise Exception
  
    if not (self.doc.address_line1)  and not (self.doc.city) and not (self.doc.state) and not (self.doc.country) and not (self.doc.pincode):
      return "Please enter address"
    else:
      address_line = self.doc.address_line1.replace('"','"')
      if self.doc.address_line2:
        address_line = self.doc.address_line1.replace('"','"') + NEWLINE + self.doc.address_line2.replace('"','"')
      if self.doc.city:
        address_line = address_line + NEWLINE + cstr(self.doc.city) 
      if self.doc.pincode:
        address_line = address_line + NEWLINE + 'Pin Code- ' + cstr(self.doc.pincode)
      if self.doc.state:
        address_line = address_line + NEWLINE + cstr(self.doc.state) 
      if self.doc.country:
        address_line = address_line + NEWLINE + cstr(self.doc.country)
      if self.doc.phone_1:
        address_line = address_line + NEWLINE + "Phone: " + self.doc.phone_1 
      if self.doc.email_1:
        address_line = address_line + NEWLINE + "E-mail: " + self.doc.email_1
      self.doc.address = address_line
     

    if not (self.doc.phone_1) and not (self.doc.phone_2) and not (self.doc.mobile_1) and not (self.doc.mobile_2) and not (self.doc.fax_1) and not (self.doc.fax_2):
      return "Please enter contact number"
    self.doc.telephone = "(O): " + cstr(self.doc.phone_1) +NEWLINE+ cstr(self.doc.phone_2) + NEWLINE + "(M): " + cstr(self.doc.mobile_1) +NEWLINE+cstr(self.doc.mobile_2) + NEWLINE + "(fax): " + cstr(self.doc.fax_1) +NEWLINE+cstr(self.doc.fax_2)
    

  def validate_account_head(self):
  #-------territory and parent account validate------
    comp_abbr = sql("select abbr from tabCompany where name=%s",self.doc.company)
    comp_abbr = comp_abbr and comp_abbr[0][0] or ''
    if sql("select name from tabAccount where name=%s",(self.doc.name+' - '+comp_abbr)):
      if not sql("select name from tabAccount where name=%s and parent_account=%s",(self.doc.name+' - '+comp_abbr, self.doc.territory+' - '+comp_abbr)):
        msgprint('Territory and parent account name for customer account are not same.')
        raise Exception
    else:
      msgprint('Account with this name does not exist.')

  def get_customer(self, customer_name):
    customer = sql("select * from `tabCustomer` where name = %s", (customer_name), as_dict = 1)
    return customer
  
  # Update Lead Status to Converted and make it readonly
  # ===========================================================================
  #def update_lead_status(self):
   # if self.doc.lead_name:
    #  sql("update tabLead set status = 'Converted' where name = %s",(self.doc.lead_name))