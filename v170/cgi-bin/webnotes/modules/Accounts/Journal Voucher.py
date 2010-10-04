class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d,dl

  def autoname(self):
    self.doc.name = make_autoname(self.doc.naming_series+'/.####')

  def get_outstanding(self, args):
    args = eval(args)
    o_s = sql("select outstanding_amount from `tab%s` where name = '%s'" % (args['doctype'],args['docname']))
    if args['doctype'] == 'Payable Voucher':
      return cstr({'debit': o_s and flt(o_s[0][0]) or 0})
    if args['doctype'] == 'Receivable Voucher':
      return cstr({'credit': o_s and flt(o_s[0][0]) or 0})

      
  def create_remarks(self):
    r = []
    if self.doc.note: r.append(self.doc.note)
    if self.doc.cheque_no :
      if self.doc.cheque_date:
        r.append('Via cheque #%s dated %s' % (self.doc.cheque_no, formatdate(self.doc.cheque_date)))
      else :
        msgprint("Please enter cheque date")
        raise Exception
    
    for d in getlist(self.doclist, 'entries'):
      if d.against_invoice and d.credit:
        r.append('Rs %s against Invoice: %s' % (fmt_money(flt(d.credit)), d.against_invoice))
      if d.against_voucher and d.debit:
        bill_no = sql("select bill_no, bill_date from `tabPayable Voucher` where name=%s", d.against_voucher)[0]

#        if not bill_no or not bill_no[0] or not bill_no[1]:
#          msgprint("Please Enter Bill No , Bill Date in Payable Voucher %s" % d.against_voucher)
#          raise Exception, "Validation Error"
        r.append('Rs %s against Bill %s dated %s' % (fmt_money(flt(d.debit)), bill_no[0], (str(bill_no[1]) and formatdate(str(bill_no[1])) or '')))
    if self.doc.total_tds_amount:
      r.append("TDS Amount: %s" % self.doc.total_tds_amount)
  
    self.doc.remark = (NEWLINE).join(r)
  
  def validate_entries(self):
    for d in getlist(self.doclist, 'entries'):
      if not flt(d.credit) == 0 and not flt(d.debit) == 0:
        msgprint("Sorry you cannot credit and debit under same account head.")
        raise Exception, "Validation Error."

  def validate_backdated_entry(self):
    if self.doc.total_tds_amount:
      future_jv= sql("Select name from `tabJournal Voucher` where supplier_account='%s' and posting_date>'%s' and docstatus=1"%(self.doc.supplier_account,self.doc.posting_date))
      if future_jv:
        msgprint("Backdated journal voucher can not be made when tds is applicable")
        raise Exception
  
  # Check user role for approval process
  #----------------------------------------
  def check_user_role(self):
    approving_authority=sql("select value from `tabSingles` where field='credit_controller' and doctype='Manage Account'")

    acmgr_flag=0
    user_role = sql("select t1.role from `tabUserRole` t1 where t1.parent=%s", session['user'])
    user_role=[x[0] for x in user_role]
    for ur in user_role:
      if ur==approving_authority[0][0]:
        acmgr_flag=1
    
    return acmgr_flag
   
  #check date- posting date can not greater than credit days
  def check_credit_days(self):
    acmgr_flag = self.check_user_role()
    
    if self.doc.cheque_date:
      date_diff = (getdate(self.doc.cheque_date)-getdate(self.doc.posting_date)).days
    acc_list=[]
    for d in getlist(self.doclist,'entries'):
      ms=sql("select master_type from `tabAccount` where name='%s'"%d.account)
      if ms and ms[0][0]=='Customer':
        acc_list.append(d.account)

    
    if len(acc_list)!=0:
      for acc in acc_list:
        cr_days_cust=sql("select credit_days from `tabAccount` where name='%s'" % acc)
          
        cr_days_comp=sql("select credit_days from `tabCompany` where name='%s'" % self.doc.company)
        
        if cr_days_cust and cint(cr_days_cust[0][0])>0 and acmgr_flag==0:
          if cint(date_diff)> cint(cr_days_cust[0][0]):
            msgprint("Credit days can not be greater than %s" %cint(cr_days_cust[0][0]))
            raise Exception
        elif cr_days_comp and cint(cr_days_comp[0][0])>0 and cint(date_diff) >cint(cr_days_comp[0][0]) and acmgr_flag==0:
          msgprint("Credit days can not be greater than %s" %cint(cr_days_comp[0][0]))
          raise Exception
  
# validation of debit/credit account with rv debit to or pv credit to account
#----------------------------------------------------------------------------------- 
  def check_account_against_entries(self):
    for d in getlist(self.doclist,'entries'):
      if d.against_invoice:
        acc=sql("select debit_to from `tabReceivable Voucher` where name='%s'"%d.against_invoice)
        if acc and acc[0][0] != d.account:
          msgprint("Debit account is not matching with receivable voucher")
          raise Exception
      
      if d.against_voucher:
        acc=sql("select credit_to from `tabPayable Voucher` where name='%s'"%d.against_voucher)
        if acc and acc[0][0] != d.account:
          msgprint("Credit account is not matching with payable voucher")
          raise Exception
  
  def validate(self):
    if not self.doc.is_opening:
      self.doc.is_opening='No'
    self.validate_backdated_entry()
    # PL Accounts must have cost center
    
    # made this function
    self.get_against_account()

    self.validate_cheque_info()
    self.create_remarks()
    self.validate_entries()
    self.get_tds_category_account()
    self.validate_entries_for_advance()

  # Validate cheque info
  #----------------------
  
  def validate_cheque_info(self):
    # add check no and check date in remarks
    # -------------------------------------
    if self.doc.voucher_type == 'Bank Voucher' or self.doc.voucher_type == 'Contra Voucher':
      if (not self.doc.cheque_no) or (not self.doc.cheque_date):
        msgprint("Cheque No & Cheque Date is required for " + cstr(self.doc.voucher_type))
        raise Exception
        
    if self.doc.cheque_date and not self.doc.cheque_no:
      msgprint("Cheque No is mandatory if you entered Cheque Date")
      raise Exception
    
  # Gives reminder for making is_advance = 'yes' for advance entry.
  def validate_entries_for_advance(self):
    for d in getlist(self.doclist,'entries'):
      if not d.is_advance and not d.against_voucher and not d.against_invoice:
        master_type = sql("select master_type from tabAccount where name = '%s'" % d.account)
        master_type = master_type and master_type[0][0] or ''
        if (master_type == 'Customer' and flt(d.credit) > 0) or (master_type == 'Supplier' and flt(d.debit) > 0):
          msgprint("Message: Please check Is Advance as 'Yes' against Account %s if this is an advance entry." % d.account)
      

              
  # On Update - Update Feed
  # -----------------------
  def on_update(self):
    pass


  def on_submit(self):
    if self.doc.voucher_type == 'Bank Voucher' or self.doc.voucher_type == 'Contra Voucher' or self.doc.voucher_type == 'Journal Entry':
      self.check_credit_days()
    
    self.check_account_against_entries()
    
    get_obj(dt='GL Control').make_gl_entries(self.doc, self.doclist)

  def on_cancel(self):
    get_obj(dt='GL Control').make_gl_entries(self.doc, self.doclist, cancel=1)
    
    
  # get TDS 
  # ----------------------------
  
  def validate_backdated_entry(self):
    if self.doc.total_tds_amount:
      future_jv= sql("Select name from `tabJournal Voucher` where supplier_account='%s' and posting_date>'%s' and docstatus=1 and tds_category = '%s'"%(self.doc.supplier_account,self.doc.posting_date, self.doc.tds_category))
      if future_jv:
        msgprint("Backdated journal voucher can not be made where tds is applicable")
        raise Exception

  
  def get_tds_category_account(self):
    for d in getlist(self.doclist,'entries'):
      if flt(d.debit) > 0 and not d.against_voucher:
        acc = sql("select tds_applicable from `tabAccount` where name = '%s'" % d.account)
        tds_applicable = acc and acc[0][0] or 'No'
        if tds_applicable == 'Yes':
          if not self.doc.tds_applicable:
            msgprint("Please select TDS Applicable or Not")
            raise Exception
          elif self.doc.tds_applicable == 'Yes':
            if not self.doc.tds_category:
              msgprint("Please select TDS Category")
              raise Exception
            self.doc.supplier_account=d.account
          elif self.doc.tds_category:
            self.doc.clear_table(self.doclist,'taxes')
            self.doc.tds_category = ''
            self.doc.total_tds_amount = 0
          
          
  def get_tds(self):
    if cstr(self.doc.is_opening) != 'Yes':
      self.get_tds_category_account()
      if self.doc.supplier_account and self.doc.tds_category:
        self.doc.total_tds_amount = get_obj('GL Control', with_children = 1).get_tds_amount(self)
      self.get_balance()
  
  def get_balance(self):
    if not getlist(self.doclist,'entries'):
      msgprint("Please enter atleast 1 entry in 'GL Entries' table")
    else:

      flag, self.doc.total_debit, self.doc.total_credit = 0,0,0
      diff = flt(self.doc.difference)
      for d in getlist(self.doclist,'entries'):
        if (d.credit==0 or d.credit is None) and (d.debit==0 or d.debit is None) and (flt(diff) != 0):

          if diff>0:
            d.credit = flt(diff)
          elif diff<0:
            d.debit = flt(diff)
          flag = 1

      if flag == 0 and (flt(diff) != 0):
        jd = addchild(self.doc, 'entries', 'Journal Voucher Detail', 1, self.doclist)
        if diff>0:
          jd.credit = flt(diff)
        elif diff<0:
          jd.debit = flt(diff)
        
      for d in getlist(self.doclist,'entries'):

        self.doc.total_debit += flt(d.debit)
        self.doc.total_credit += flt(d.credit)
      self.doc.total_credit = flt(self.doc.total_credit) + flt(self.doc.total_tds_amount)
      self.doc.difference = flt(self.doc.total_debit) - flt(self.doc.total_credit)
      
  def get_against_account(self):
    # Debit = Credit
    debit, credit = 0.0, 0.0
    debit_list, credit_list = [], []
    for d in getlist(self.doclist, 'entries'):
      debit += flt(d.debit)
      credit += flt(d.credit)
      if flt(d.debit)>0 and (d.account not in debit_list): debit_list.append(d.account)
      if flt(d.credit)>0 and (d.account not in credit_list): credit_list.append(d.account)
    self.doc.total_debit = debit
    self.doc.total_credit = credit + flt(self.doc.total_tds_amount)
    if abs(self.doc.total_debit-self.doc.total_credit) > 0.001:
      msgprint("Debit must be equal to Credit for voucher %s. The difference is %s" % (self.doc.name,debit-credit))
      raise Exception

    
    # update against account
    # ----------------------
    for d in getlist(self.doclist, 'entries'):
      if flt(d.debit) > 0: d.against_account = ', '.join(credit_list)
      if flt(d.credit) > 0: d.against_account = ', '.join(debit_list)