class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d,dl
    self.nsm_parent_field = 'parent_account'

  def autoname(self):
    company_abbr = sql("select abbr from tabCompany where name=%s", self.doc.company)[0][0]
    self.doc.name = self.doc.account_name + ' - ' + company_abbr

  def get_address(self):
    
    add=sql("Select address from `tab%s` where name='%s'"%(self.doc.master_type,self.doc.master_name))
    
    ret={'address':add[0][0]}
    
    return cstr(ret)
  
  def get_parent_details(self):
    n = sql("select is_pl_account, debit_or_credit from tabAccount where name=%s", self.doc.parent_account)

    self.doc.is_pl_account = n and n[0][0] or ''
    self.doc.debit_or_credit = n and n[0][1] or ''

  def validate(self): 
    #---------territory and parent account must be same for customer account------
    par_acc = ' - '.join(self.doc.parent_account.split(' - ')[:-1])
    cust_nm = sql("select name from tabCustomer where name=%s",self.doc.account_name)
    cust_nm = cust_nm and cust_nm[0][0] or ''
    supp_nm = sql("select name from tabSupplier where name=%s",self.doc.account_name)
    supp_nm = supp_nm and supp_nm[0][0] or ''
    if (self.doc.master_type == 'Customer' or self.doc.master_type == 'Supplier') and not self.doc.master_name:
      msgprint("Message: Please enter Master Name once the account is created.")
      #raise Exception

    #if self.doc.master_type == 'Customer' or cust_nm:
      #terr=sql("select name,territory from tabCustomer where name=%s ",(self.doc.master_name))
      #if terr and terr[0][0] and terr[0][1]!= par_acc :
        #msgprint('Parent account name for this customer account is not same as territory in customer master')
        #raise Exception

    #if self.doc.master_type == 'Supplier' or supp_nm:
      #terr=sql("select name,supplier_type from tabSupplier where name=%s",(self.doc.master_name))
      #if terr and terr[0][0] and terr[0][1]!=par_acc :
        #msgprint('Parent account name for this supplier account is not same as supplier type in supplier master')
        #raise Exception

    # ---------------------------- CHECK (rate is entered if account_type = Tax)-------------------#
    if self.doc.account_type == 'Tax' and not self.doc.tax_rate:
      msgprint("Please Enter Rate")    
      raise Exception

    # Parent Details
    # -------------- validation for account to be not created under ledger------
    
    if self.doc.parent_account:
      if(sql("select name from tabAccount where group_or_ledger = 'Group' and name =%s",self.doc.parent_account)):
        if not self.doc.is_pl_account:
          self.get_parent_details()
      else:
        msgprint('Account can not be created under ledger')
        raise Exception  
  
    # Account name must be unique
    # ---------------------------

    if (self.doc.__islocal or (not self.doc.name)) and sql("select name from tabAccount where account_name=%s and company=%s", (self.doc.account_name, self.doc.company)):
      msgprint("Account Name already exists, please rename")
      raise Exception

    # Debit / Credit
    # -------------

    if not self.doc.debit_or_credit:
      if self.doc.account_name in ['Income','Source of Funds']:
        self.doc.debit_or_credit = 'Credit'
      if self.doc.account_name in ['Expenses','Application of Funds']:
        self.doc.debit_or_credit = 'Debit'

    # Is PL Account 
    # -------------

    if not self.doc.is_pl_account:
      if self.doc.account_name in ['Income','Expenses']:
        self.doc.is_pl_account = 'Yes'
      if self.doc.account_name in ['Source of Funds','Application of Funds']:
        self.doc.is_pl_account = 'No'

    if not (self.doc.is_pl_account and self.doc.debit_or_credit):
      msgprint("Account must have a parent or must be one of root accounts: 'Income','Expenses','Source of Funds','Application of Funds'")
      raise Exception

    # Parent must be group
    # --------------------

    if self.doc.parent_account:
      parent = sql("select group_or_ledger from tabAccount where name=%s", self.doc.parent_account)
      if parent[0][0]=='Ledger':
        msgprint("Parent must be a Group not a Ledger")
        raise Exception

    # parent changed
    # --------------    
    if self.doc.old_parent and (self.doc.parent_account != self.doc.old_parent):
      self.change_parent_bal()


    # Defaults
    # --------

    if not self.doc.parent_account: self.doc.parent_account = ''

    
    # Account with balance cannot be inactive
    # ---------------------------------------
    
    if self.doc.is_active=='No':
      fiscal_year = get_obj('ERP Setup').doc.current_fiscal_year
      for d in getlist(self.doclist,'account_balances'):
        if d.fiscal_year == fiscal_year and not flt(d.balance) == 0:
          msgprint("Account with a balance cannot be inactive")
          raise Exception
    
  def update_balance(self, fy, bal, opening, flag = 1):

    # update in all parents
    sql("update `tabAccount Balance` t1, `tabAccount` t2 set t1.balance = t1.balance + (%s), t1.opening = t1.opening + (%s) where t1.fiscal_year = %s and t1.parent = t2.name and t2.lft<=%s and t2.rgt>=%s", (flt(flag)*flt(bal), flt(flag)*flt(opening), fy, self.doc.lft, self.doc.rgt))

  # change parent balance
  # ---------------------

  def change_parent_bal(self):
    fy = get_defaults()['fiscal_year']

    # get my opening, balance
    bal, opening = sql("select balance, opening from `tabAccount Balance` where parent = %s and fiscal_year = %s", (self.doc.name, fy))[0]

    # deduct balance from old_parent
    op = Document('Account',self.doc.old_parent)
    get_obj(doc=op).update_balance(fy, bal, opening, -1)
      
    # add to new parent_account
    flag = 1
    if op.debit_or_credit != self.doc.debit_or_credit:
      flag = -1
    get_obj('Account', self.doc.parent_account).update_balance(fy, bal, opening, flag)
    get_obj('Account', self.doc.parent_account).update_balance(fy, bal, opening, flag)

    msgprint('Balances updated for Current Fiscal Year')
  
  def on_update(self):
    # update Node Set Model
    # ---------------------
    update_nsm(self)
    
    # Add current fiscal year balance
    # -------------------------------

    d = get_defaults()
    if not d.has_key('fiscal_year'):
      msgprint('Please set Current Fiscal Year first in Account Setup')
      raise Exception
    fy = d['fiscal_year']
    has_bal = sql("select name from `tabAccount Balance` where parent=%s and fiscal_year=%s", (self.doc.name, fy))
    if not has_bal:
      d = addchild(self.doc, 'account_balances', 'Account Balance', 1, self.doclist)
      d.fiscal_year = fy
      d.balance = 0
      d.save()
      
  def credit_limit_common(self, account, company, tot_outstanding):
    acmgr_flag = self.check_user_role()
    cr_limit_cust=sql("select credit_limit from `tabAccount` where name='%s'" %account)
      
    cr_limit_comp=sql("select credit_limit from `tabCompany` where name='%s'" %company)
    if cr_limit_cust and flt(cr_limit_cust[0][0])!=0 and acmgr_flag==0:
      if flt(tot_outstanding)>flt(cr_limit_cust[0][0]):
        msgprint("Total Outstanding amount can not be greater than credit limit. Please contact your account manager.")
        raise Exception
    elif cr_limit_comp and flt(cr_limit_comp[0][0])!=0 and acmgr_flag==0 and flt(tot_outstanding)>flt(cr_limit_comp[0][0]):
      msgprint("Total Outstanding amount of company can not be greater than credit limit. Please contact your account manager.")
      raise Exception
      
  # Check user role for approval process
  #----------------------------------------
  def check_user_role(self):
    approving_authority=sql("select value from `tabSingles` where field='credit_controller' and doctype='Manage Account'")
    approving_authority = approving_authority and approving_authority[0][0] or ''
    acmgr_flag=0
    user_role = sql("select t1.role from `tabUserRole` t1 where t1.parent=%s", session['user'])
    user_role=[x[0] for x in user_role]
    for ur in user_role:
      if ur==approving_authority:
        acmgr_flag=1
    
    return acmgr_flag