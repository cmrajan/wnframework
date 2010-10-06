class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d, dl

  # Validate mandatory
  #-------------------
  def check_mandatory(self):
    # Following fields are mandatory in GL Entry
    mandatory = ['account','remarks','voucher_type','voucher_no','fiscal_year','company']
    for k in mandatory:
      if not self.doc.fields.get(k):
        msgprint("GL Entry: %s is mandatory" % k)
        raise Exception
        
    # Zero value transaction is not allowed
    if not (self.doc.debit or self.doc.credit):
      msgprint("GL Entry: Debit or Credit amount is mandatory for %s" % self.doc.account)
      raise Exception
      
  # Cost center is required only if transaction made against pl account
  #--------------------------------------------------------------------
  def pl_must_have_cost_center(self):
    if sql("select name from tabAccount where name=%s and is_pl_account='Yes'", self.doc.account):
      if not self.doc.cost_center:
        msgprint("Error: Cost Center must be specified for PL Account: %s" % self.doc.account_name)
        raise Exception
    else: # not pl
      if self.doc.cost_center:
        self.doc.cost_center = ''
  
    
  # Account must be ledger, active and not freezed
  #--------------------------------------------------
  def account_must_be_ledger(self, adv_adj):
    ret = sql("select group_or_ledger, is_active, freeze_account, company from tabAccount where name=%s", self.doc.account)
    
    #check for user role Freezed
    acmgr_flag = get_obj('Account',self.doc.account).check_user_role()
    
    # 1. Checks whether Account type is group or ledger
    if ret and ret[0][0]=='Group':
      msgprint("Error: All accounts must be Ledgers. Account %s is a group" % self.doc.account)
      raise Exception

    # 2. Checks whether Account is_active = 'Yes' or 'No'
    if ret and ret[0][1]=='No':
      msgprint("Error: All accounts must be Active. Account %s is not active" % self.doc.account)
      raise Exception
      
    # 3. Checks whether Account has been freezed  or not    
    if ret and ret[0][2]== 'Yes' and not adv_adj and acmgr_flag==0:
      msgprint("Error: Account %s has been freezed. No more transactions are allowed against this account." % self.doc.account)
      raise Exception
      
    # 4. Check whether account is within the company
    if ret and ret[0][3] != self.doc.company:
      msgprint("Account: %s does not belong to the company: %s" % (self.doc.account, self.doc.company))
      raise Exception
      
  # Posting date must be in selected fiscal year and fiscal year is active
  #-------------------------------------------------------------------------
  def validate_posting_date(self):
    fy = sql("select is_active, year_start_date from `tabFiscal Year` where name=%s ", self.doc.fiscal_year)
    ysd = fy[0][1]
    yed = get_last_day(get_first_day(ysd,0,11))
    pd = getdate(self.doc.posting_date)
    if fy[0][0] != 'Yes':
      msgprint("Fiscal Year is not active")
      raise Exception
    if pd < ysd or pd > yed:
      msgprint("Posting date must be in the Selected Financial Year")
      raise Exception
      
      
  # Nobody can do GL Entries where posting date is before freezing date except 'Accounts Manager'
  #-------------------------------------------------------------------------------------------------
  def check_freezing_date(self, adv_adj):    
    if not adv_adj:
      pd,fd = getdate(self.doc.posting_date),0
      acc_frozen_upto = get_obj(dt = 'Manage Account').doc.acc_frozen_upto or ''
      if acc_frozen_upto:
        fd = getdate(acc_frozen_upto)

      bde_auth_role = get_value('Manage Account', None,'bde_auth_role')
      if fd and pd <= fd and (bde_auth_role and not bde_auth_role in session['data']['roles']):
        msgprint("Message:You are not authorized to do back dated entries for account: %s before %s." % (self.doc.account, str(fd)))
        raise Exception

  # Post Balance
  # ------------
  def post_balance(self, acc):
    # get details
    lft = sql("select lft, rgt, debit_or_credit from `tabAccount` where name='%s'" % acc)

    # amount to debit
    amt = flt(self.doc.debit) - flt(self.doc.credit)
    if lft[0][2] == 'Credit': amt = -amt

    # update
    pl = sql("update `tabAccount Balance` t1, `tabAccount` t2 set t1.balance = t1.balance + %s where t2.lft<=%s and t2.rgt>=%s and t1.parent = t2.name and t1.fiscal_year = '%s'" % (amt, cint(lft[0][0]), cint(lft[0][1]), self.doc.fiscal_year))

    # update opening
    if self.doc.is_opening=='Yes':
      pl = sql("update `tabAccount Balance` t1, `tabAccount` t2 set t1.opening = ifnull(t1.opening,0) + %s where t2.lft<=%s and t2.rgt>=%s and t1.parent = t2.name and t1.fiscal_year = '%s'" % (amt, cint(lft[0][0]), cint(lft[0][1]), self.doc.fiscal_year))

    
  # Voucher Balance
  # ---------------  
  def post_voucher_bal(self):
    # get final outstanding amt
    bal = flt(sql("select sum(debit)-sum(credit) from `tabGL Entry` where against_voucher=%s and against_voucher_type=%s", (self.doc.against_voucher, self.doc.against_voucher_type))[0][0] or 0.0)
    tds = 0
    
    if self.doc.against_voucher_type=='Payable Voucher':
      # amount to debit
      bal = -bal
      
      # Check if tds applicable
      tds = sql("select total_tds_on_voucher from `tabPayable Voucher` where name = '%s'" % self.doc.against_voucher)
      tds = tds and flt(tds[0][0]) or 0
    
    # Validation : Outstanding can not be negative
    if bal < 0 and not tds and self.doc.is_cancelled == 'No':
      msgprint("Outstanding for Voucher %s will become %s. Outstanding cannot be less than zero. Please match exact outstanding." % (self.doc.against_voucher, fmt_money(bal)))
      raise Exception
      
    # Update outstanding amt on against voucher
    sql("update `tab%s` set outstanding_amount=%s where name='%s'"% (self.doc.against_voucher_type,bal,self.doc.against_voucher))
    
    
  # Update Previous date closing balance on every gl entry
  # -------------------------------------------------------
  def update_previous_closing_balance(self):
    # Select the dates for which prev closing bal will be reposted
    gl_pd = sql("select distinct posting_date from `tabGL Entry` where account = '%s'and posting_date >= '%s' and is_cancelled = 'No' and company = '%s' order by posting_date asc" % (self.doc.account, self.doc.posting_date,self.doc.company))

    for cd in gl_pd:
      acc_obj = get_obj('Account',self.doc.account)
      
      # Select the previous date of entry
      pd = sql("select posting_date from `tabGL Entry` where posting_date < '%s' and account = '%s'  and is_cancelled = 'No' and company = '%s' and fiscal_year = '%s' order by posting_date desc limit 1" % (cd[0],self.doc.account,self.doc.company, self.doc.fiscal_year))
      
      # if first entry, then set prev date of entry to some arbitratry date
      prevdate = pd and pd[0][0] or getdate('1800-01-01')
      
      # Select total transaction value and prev closing bal from the prev day's entry
      prev_cl_bal = sql("select ifnull(sum(debit),0) - ifnull(sum(credit),0),ifnull(previous_closing_balance,0) from `tabGL Entry` where account = '%s' and posting_date = '%s' and is_cancelled = 'No' and company = '%s' group by account" % (self.doc.account,prevdate,self.doc.company))
      trans_value_on_day = prev_cl_bal and flt(prev_cl_bal[0][0]) or 0
      prev_closing_bal = prev_cl_bal and flt(prev_cl_bal[0][1]) or 0
      
      # if first entry of fiscal year and account is not a pl account
      if acc_obj.doc.is_pl_account == 'No' and not pd:
        op = sql("select opening from `tabAccount Balance` where parent=%s and fiscal_year=%s", (self.doc.account, self.doc.fiscal_year))
        prev_closing_bal = op and flt(op[0][0]) or 0
      
      # Set credit value as positive for Credit account
      if acc_obj.doc.debit_or_credit == 'Credit':
        trans_value_on_day = - trans_value_on_day
      
      # Get Previous day closing balance
      prev_closing_bal += flt(trans_value_on_day)
      
      # Set Previous day closing balance
      sql("update `tabGL Entry` set previous_closing_balance = '%s' where account = '%s' and posting_date = '%s' and is_cancelled = 'No' and company = '%s'" % (flt(prev_closing_bal),self.doc.account,cd[0],self.doc.company))
      
  #total outstanding can not be greater than credit limit for any time for any customer
  def check_credit_limit(self):
    #check for user role Freezed
    master_type=sql("select master_type from `tabAccount` where name='%s' " %self.doc.account)
    tot_outstanding = 0  #needed when there is no GL Entry in the system for that acc head
    if (self.doc.voucher_type=='Journal Voucher' or self.doc.voucher_type=='Receivable Voucher') and (master_type and master_type[0][0]=='Customer'):
      dbcr=sql("select sum(debit),sum(credit) from `tabGL Entry` where account = '%s' and is_cancelled='No'" % self.doc.account)
      if dbcr:
        tot_outstanding = flt(dbcr[0][0])-flt(dbcr[0][1])+flt(self.doc.debit)-flt(self.doc.credit)
      get_obj('Account',self.doc.account).credit_limit_common(self.doc.account, self.doc.company, tot_outstanding)
  
  #for opening entry account can not be pl account
  #-----------------------------------------------
  def check_pl_account(self):
    if self.doc.is_opening=='Yes':
      is_pl_account=sql("select is_pl_account from `tabAccount` where name='%s'"%(self.doc.account))
      if is_pl_account and is_pl_account[0][0]=='Yes':
        msgprint("For opening balance entry account can not be a PL account")
        raise Exception

  # Validate 
  # ---------
  def validate(self):  # not called on cancel
    self.check_mandatory()
    self.pl_must_have_cost_center()
    self.validate_posting_date()
    self.doc.is_cancelled = 'No' # will be reset by GL Control if cancelled
    self.check_credit_limit()
    self.check_pl_account()

  # On Update
  #-----------
  def on_update(self,adv_adj):
    # Account must be ledger, active and not freezed
    self.account_must_be_ledger(adv_adj)
    
    # Posting date must be after freezing date
    self.check_freezing_date(adv_adj)
    
    # update prev closing bal
    #self.update_previous_closing_balance()   # Commented because it is taking too much time to update in janak
    
    # Update current account balance
    self.post_balance(self.doc.account)
    
    # Update outstanding amt on against voucher
    if self.doc.against_voucher:
      self.post_voucher_bal()