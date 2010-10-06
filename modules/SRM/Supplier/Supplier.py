class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist

  def autoname(self):
    cust, emp = None, None
    try:
      cust = sql("select name from `tabCustomer` where name = '%s'" % (self.doc.vendor_name))
      cust = cust and cust[0][0]
    except: 
      pass
    
    if cust:
      msgprint("Customer by this name already exist")
      raise Exception
      
    try:
      emp = sql("select name from `tabEmployee` where name = '%s'" % (self.doc.vendor_name))
      emp = emp and emp[0][0]
    except:
      pass
    
    if emp:
      msgprint("Employee by this name already exist")
      raise Exception
    self.doc.name = self.doc.supplier_name.title()
    
  # make address
  def validate(self):  
    address_line = cstr(self.doc.address_line1).replace('"','"')
    if self.doc.address_line2:
      address_line = address_line + NEWLINE + self.doc.address_line2.replace('"','"')
    if self.doc.city:
      address_line = address_line + NEWLINE + cstr(self.doc.city)
    if self.doc.state:
      address_line = address_line + NEWLINE + cstr(self.doc.state) 
    if self.doc.country:
      address_line = address_line + NEWLINE + cstr(self.doc.country)
    if self.doc.pincode:
      address_line = address_line + NEWLINE + cstr(self.doc.pincode)
    self.doc.address = address_line

    #-----supplier type and parent account of supllier
    comp_abbr = sql("select abbr from tabCompany where name=%s",self.doc.company)
    comp_abbr = comp_abbr and comp_abbr[0][0] or ''
    if sql("select name from tabAccount where name=%s",(self.doc.name+' - '+comp_abbr)):
      if not sql("select name from tabAccount where name=%s and parent_account=%s",(self.doc.name+' - '+comp_abbr, self.doc.supplier_type+' - '+comp_abbr)):
        msgprint("Supplier Type and supplier's  parent account(Group) in Chart of Account are not same. Please change Group in Chart of Accounts")
        raise Exception
    else:
      msgprint('Account for this supplier does not exist')

  def check_state(self):
    return NEWLINE.join([i[0] for i in sql("select state_name from `tabState` where `tabState`.country='%s' " % self.doc.country)])
  
  # ACCOUNTS
  # -------------------------------------------

  def get_payables_group(self):
    g = sql("select payables_group from tabCompany where name=%s", self.doc.company)
    g = g and g[0][0] or ''
    if not g:
      msgprint("Update Company master, assign a default group for Payables")
      raise Exception
    return g

  def add_account(self, ac, par, abbr):
    arg = {'account_name':ac,'parent_account':par, 'group_or_ledger':'Group', 'company':self.doc.company,'account_type':'','tax_rate':'0'}
    t = get_obj('GL Control').add_ac(cstr(arg))
    msgprint("Created Group " + t)
  
  def get_company_abbr(self):
    return sql("select abbr from tabCompany where name=%s", self.doc.company)[0][0]
  
  def get_parent_account(self, abbr):
    if (not self.doc.supplier_type):
      msgprint("Supplier Type is mandatory")
      raise Exception
    
    if not sql("select name from tabAccount where name=%s", (self.doc.supplier_type + " - " + abbr)):

      # if not group created , create it
      self.add_account(self.doc.supplier_type, self.get_payables_group(), abbr)
    
    return self.doc.supplier_type + " - " + abbr
  
  
  # create accont head - in tree under zone + territory
  # -------------------------------------------------------
  def create_account_head(self):
    if self.doc.company :
      abbr = self.get_company_abbr() 
            
      if not sql("select name from tabAccount where name=%s", (self.doc.name + " - " + abbr)):
        parent_account = self.get_parent_account(abbr)
        
        arg = {'account_name':self.doc.name,'parent_account': parent_account, 'group_or_ledger':'Ledger', 'company':self.doc.company,'account_type':'','tax_rate':'0','master_type':'Supplier','master_name':self.doc.name,'address':self.doc.address}
        # create
        ac = get_obj('GL Control').add_ac(cstr(arg))
        msgprint("Created "+ac)
        
      else:
        msgprint("Account already exists under this company")
    else : 
      msgprint("Please select Company under which you want to create account head")