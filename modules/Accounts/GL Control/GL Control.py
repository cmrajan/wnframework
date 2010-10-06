class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d, dl
    self.entries = []
    self.month_list = {1:'January', 2:'February', 3:'March', 4:'April', 5:'May', 6:'June', 7:'July', 8:'August', 9:'September', 10:'October',11:'November',12:'December'}

  # Get Company List
  # ----------------
  def get_companies(self,arg=''):
    d = get_defaults()
    ret = sql("select name, abbr from tabCompany where is_active = 'Yes'")
    pl = {}
    for r in ret:
      inc = get_value('Account','Income - '+r[1], 'balance')
      exp = get_value('Account','Expenses - '+r[1], 'balance')
      pl[r[0]] = flt(flt(inc) - flt(exp))
    return {'cl':[r[0] for r in ret], 'pl':pl}

  # Get current balance
  # --------------------
  def get_bal(self,arg):
    ac, fy = arg.split('~~~')
    det = sql("select t1.balance, t2.debit_or_credit from `tabAccount Balance` t1, `tabAccount` t2 where t1.fiscal_year = %s and t2.name=%s and t1.parent = t2.name", (fy, ac))
    bal = det and flt(det[0][0]) or 0
    dr_or_cr = det and flt(det[0][1]) or ''
    return fmt_money(bal) + ' ' + dr_or_cr

  def get_period_balance(self,arg):
    acc, f, t = arg.split('~~~')
    c, fy = '', get_defaults()['fiscal_year']

    det = sql("select debit_or_credit, lft, rgt, is_pl_account from tabAccount where name=%s", acc)
    if f: c += (' and t1.posting_date >= "%s"' % f)
    if t: c += (' and t1.posting_date <= "%s"' % t)
    bal = sql("select sum(ifnull(t1.debit,0))-sum(ifnull(t1.credit,0)) from `tabGL Entry` t1 where t1.account='%s' and ifnull(is_opening, 'No') = 'No' and is_cancelled='No' %s" % (acc, c))
    bal = bal and flt(bal[0][0]) or 0
    
    if det[0][0] != 'Debit':
      bal = (-1) * bal

    # add opening for balance sheet accounts
    if det[0][3] == 'No':
      opening = flt(sql("select opening from `tabAccount Balance` where parent=%s and fiscal_year=%s", (acc, fy))[0][0])
      bal = bal + opening

    return flt(bal)
 
  def get_period_difference(self,arg, cost_center =''):
    # used in General Ledger Page Report
    # used for Budget where cost center passed as extra argument
    acc, f, t = arg.split('~~~')
    c, fy = '', get_defaults()['fiscal_year']

    det = sql("select debit_or_credit, lft, rgt, is_pl_account from tabAccount where name=%s", acc)
    if f: c += (' and t1.posting_date >= "%s"' % f)
    if t: c += (' and t1.posting_date <= "%s"' % t)
    if cost_center: c += (' and t1.cost_center = "%s"' % cost_center)
    bal = sql("select sum(ifnull(t1.debit,0))-sum(ifnull(t1.credit,0)) from `tabGL Entry` t1 where t1.account='%s' %s" % (acc, c))
    bal = bal and flt(bal[0][0]) or 0

    if det[0][0] != 'Debit':
      bal = (-1) * bal

    return flt(bal)
 
  # Get Children (for tree)
  # -----------------------
  def get_cl(self, arg):
    fy = get_defaults()['fiscal_year']
    parent, parent_acc_name, company, type = arg.split(',')
    
    # get children account details
    if type=='Account':
      if parent=='Company':
        cl = sql("select t1.name, t1.group_or_ledger, t1.debit_or_credit, t2.balance, t1.account_name from tabAccount t1, `tabAccount Balance` t2 where t1.parent_account is NULL or t1.parent_account='' and t1.is_active='Yes' and t1.company=%s and t1.name = t2.parent and t2.fiscal_year = %s order by t1.name asc", (company, fy),as_dict=1)
      else:
        cl = sql("select t1.name, t1.group_or_ledger, t1.debit_or_credit, t2.balance, t1.account_name from tabAccount t1, `tabAccount Balance` t2 where t1.parent_account=%s and t1.is_active='Yes' and t1.company=%s and t1.name = t2.parent and t2.fiscal_year = %s order by t1.name asc",(parent, company, fy) ,as_dict=1)

      # remove Decimals
      for c in cl: c['balance'] = flt(c['balance'])
      
    # get children cost center details
    elif type=='Cost Center':
      if parent=='Company':
        cl = sql("select name,group_or_ledger, cost_center_name from `tabCost Center`  where parent_cost_center is NULL or parent_cost_center='' and is_active='Yes' and company_name=%s order by name asc",(company),as_dict=1)
      else:
        cl = sql("select name,group_or_ledger,cost_center_name from `tabCost Center` where parent_cost_center=%s and is_active='Yes' and company_name=%s order by name asc",(parent,company),as_dict=1)
    
    return {'parent':parent, 'parent_acc_name':parent_acc_name, 'cl':cl}
    
  # Add a new account
  # -----------------
  def add_ac(self,arg):
    arg = eval(arg)
    ac = Document('Account')
    for d in arg.keys():
      ac.fields[d] = arg[d]
    ac.is_active = 'Yes'
    ac.old_parent = ''      
    ac_obj = get_obj(doc=ac)
    ac_obj.validate()
    ac_obj.doc.save(1)
    ac_obj.on_update()

    return ac_obj.doc.name
  
  # Add a new cost center
  #----------------------
  def add_cc(self,arg):
    arg = eval(arg)
    cc = Document('Cost Center')
    # map fields
    for d in arg.keys():
      cc.fields[d] = arg[d]
    # map company abbr
    other_info = sql("select company_abbr from `tabCost Center` where name='%s'"%arg['parent_cost_center'])
    cc.company_abbr = other_info and other_info[0][0] or arg['company_abbr']
    
    cc_obj = get_obj(doc=cc)
    cc_obj.validate()
    cc_obj.doc.save(1)
    cc_obj.on_update()

    return cc_obj.doc.name
    
    
  # Make Single Entry
  # -----------------
  def get_val(self, src, d, parent=None):
    if not src: 
      return None
    if src.startswith('parent:'):
      return parent.fields[src.split(':')[1]]
    elif src.startswith('value:'):
      return eval(src.split(':')[1])
    elif src:
      return d.fields.get(src)  
      
  def check_if_in_list(self, le):
    for e in self.entries:
      if e.account == le.account and (cstr(e.against_voucher)==cstr(le.against_voucher)) and (cstr(e.against_voucher_type)==cstr(le.against_voucher_type)) and (cstr(e.cost_center)==cstr(le.cost_center)):
        return [e]
    return 0
  
  # Make a dictionary(le) for every gl entry and append to a list(self.entries)
  #----------------------------------------------------------------------------
  def make_single_entry(self,parent,d,le_map,cancel):
    flist = ['account','cost_center','against','debit','credit','remarks','voucher_type','voucher_no','transaction_date','posting_date','fiscal_year','against_voucher','against_voucher_type','company','is_opening']

    # Check budget before gl entry
    #check budget only if account is expense account
    is_expense_acct = sql("select name from tabAccount where is_pl_account='Yes' and debit_or_credit='Debit' and name=%s",self.get_val(le_map['account'], d, parent))
    if is_expense_acct and self.get_val(le_map['cost_center'], d, parent):
      get_obj('Budget Control').check_budget([self.get_val(le_map[k], d, parent) for k in flist if k in ['account','cost_center','debit','credit','posting_date','fiscal_year','company']],cancel)
    
    le = Document('GL Entry')
    
    self.check_budget(flist,parent,d,le_map,cancel)    
    for k in flist:
      le.fields[k] = self.get_val(le_map[k], d, parent)
          
    # if there is already an entry in this account then just add it to that entry
    same_head = self.check_if_in_list(le)
    if same_head:
      same_head = same_head[0]
      same_head.debit  = flt(same_head.debit)  + flt(le.debit)
      same_head.credit = flt(same_head.credit) + flt(le.credit)
    else:
      self.entries.append(le)
    
  # Save GL Entries
  # ----------------
  def save_entries(self, cancel, adv_adj):
    for le in self.entries:
      # cancel
      if cancel:
        tmp=le.debit
        le.debit, le.credit = le.credit, tmp      
        
      le_obj = get_obj(doc=le)
      # validate except on_cancel
      if not cancel:
        le_obj.validate()

      # save
      le.save(1)
      le_obj.on_update(adv_adj)
    
      # update total debit / credit
      self.td += flt(le.debit)
      self.tc += flt(le.credit)
      
  # Make Multiple Entries
  # ---------------------
  def make_gl_entries(self, doc, doclist, cancel=0, adv_adj = 0):
    # get entries
    le_map_list = sql("select * from `tabGL Mapper Detail` where parent = %s", doc.doctype, as_dict=1)

    self.td, self.tc = 0.0, 0.0

    for le_map in le_map_list:
      if le_map['table_field']:
        for d in getlist(doclist,le_map['table_field']):
          self.make_single_entry(doc,d,le_map,cancel)
      else:
        self.make_single_entry(None,doc,le_map,cancel)
        
    # save entries
    self.save_entries(cancel,adv_adj)
        
    # check total debit / credit
    # Due to old wrong entries (total debit != total credit) some voucher could be cancelled
    if abs(self.td - self.tc) > 0.001 and not cancel:
      msgprint("Debit and Credit not equal for this voucher: Diff (Debit) is %s" % (self.td-self.tc))
      raise Exception

    # set as cancelled
    if cancel:
      vt, vn = self.get_val(le_map['voucher_type'],  doc, doc), self.get_val(le_map['voucher_no'],  doc, doc)
      sql("update `tabGL Entry` set is_cancelled='Yes' where voucher_type=%s and voucher_no=%s", (vt, vn))
  
  # Get account balance on any date
  # --------------------------------
  def get_as_on_balance(self, account_name, fiscal_year, as_on, credit_or_debit, is_pl):
    ysd = sql("select year_start_date from `tabFiscal Year` where name='%s'" % fiscal_year)
    ysd = ysd and ysd[0][0] or ''

    bal = sql("select SUM(t1.debit), SUM(t1.credit) from `tabGL Entry` t1, `tabAccount` t2 WHERE t1.posting_date >= %s AND t1.posting_date <= %s and t1.is_opening = 'No' AND t1.account = t2.name AND t1.account = %s and t1.is_cancelled = 'No'", (ysd,as_on,account_name))
    bal = bal and (flt(bal[0][0]) - flt(bal[0][1])) or 0
    if credit_or_debit == 'Credit' and bal:
      bal = -bal
    if is_pl=='No':
      op = sql("select opening from `tabAccount Balance` where parent=%s and fiscal_year=%s", (account_name, fiscal_year))[0][0]
      bal += flt(op)
    return flt(bal)

  # Get as on balance (modified function)
  # -------------------------------------
  def get_as_on_balance_modified(self, account_name, fiscal_year, as_on, credit_or_debit, is_pl, lft, rgt, ysd):
    bal = sql("select SUM(t1.debit), SUM(t1.credit) from `tabGL Entry` t1, `tabAccount` t2 WHERE t1.posting_date >= %s AND t1.posting_date <= %s and t1.is_opening = 'No' AND t1.account = t2.name AND t2.lft >= %s AND t2.rgt <= %s and t1.is_cancelled = 'No'", (ysd,as_on,lft, rgt))
    bal = bal and (flt(bal[0][0]) - flt(bal[0][1])) or 0
    if credit_or_debit == 'Credit' and bal:
      bal = -bal
    if is_pl=='No':
      op = sql("select opening from `tabAccount Balance` where parent=%s and fiscal_year=%s", (account_name, fiscal_year))
      op = op and op[0][0] or 0
      bal += flt(op)
    return flt(bal)
  
  # Get as on balance (latest function)
  # -------------------------------------
  def get_as_on_balance_latest(self, as_on, debit_or_credit, lft, rgt):
    bal = sql("select SUM(t1.debit), SUM(t1.credit),t1.previous_closing_balance from `tabGL Entry` t1, `tabAccount` t2 WHERE t1.posting_date = %s and t1.is_opening = 'No' AND t1.account = t2.name AND t2.lft >= %s AND t2.rgt <= %s and t1.is_cancelled = 'No' group by t1.account", (as_on,lft, rgt))
    trans_today, prev_bal = 0,0
    for d in bal:
      trans_today += flt(d[0]) - flt(d[1])
      prev_bal += flt(d[2])
      
    if debit_or_credit == 'Credit' and trans_today:
      trans_today = -trans_today
    bal = prev_bal + trans_today
    return flt(bal)
  
  # Get month list for which budget is applicable
  #-----------------------------------------------
  def get_month_list(self, trans_dt):
    ysd = getdate(get_defaults()['year_start_date'])
    
    if ysd and trans_dt:
      # get list of months
      mnth_lst = []
      
      # if trans date is between April to December
      if abs(trans_dt.year - ysd.year) ==0:
        for m in range(ysd.month,trans_dt.month+1):
          mnth_lst.append(self.month_list[m])
          
      # if trans date is between January to March
      elif abs(trans_dt.year - ysd.year) == 1:
        for m in range(ysd.month,13):
          mnth_lst.append(self.month_list[m])
        for m in range(1,trans_dt.month+1):
          mnth_lst.append(self.month_list[m])
          
      # if trans_date is wrong
      else:
        msgprint('Please check current financial year')
        raise Exception
      return mnth_lst
    
  # Get monthly budget
  #-------------------
  def get_monthly_budget(self, distribution_id, cur_fiscal_year, trans_dt, budget_allocated):
    mnth_lst = self.get_month_list(trans_dt)

    # monthly budget as per distribution id
    if distribution_id:
      percentage_total = 0
      for m in mnth_lst:
        per_total = sql("select t2.percentage_allocation from `tabBudget Distribution Detail` t2, `tabBudget Distribution` t1 where t1.distribution_id=%s and t1.fiscal_year=%s and t2.parent = t1.name and t2.month=%s",(distribution_id,cur_fiscal_year,m))
        per_total = per_total and flt(per_total[0][0]) or 0
        percentage_total += per_total
      monthly_budget = (flt(budget_allocated) * flt(percentage_total)) / 100
      
    # monthly budget if no distribution id
    else:
      monthly_budget = (flt(budget_allocated)/12) * len(mnth_lst)
    
    return monthly_budget
      
  # Check budget
  #-------------
  def check_budget(self,flist,parent,d,le_map,cancel):
    # get value from record
    bgt_acct = self.get_val(le_map['account'],d,parent)
    bgt_cost_center = self.get_val(le_map['cost_center'],d,parent)
    bgt_debit = self.get_val(le_map['debit'],d,parent)
    bgt_credit = self.get_val(le_map['credit'],d,parent)
    bgt_fiscal_year = self.get_val(le_map['fiscal_year'],d,parent)
    bgt_company = self.get_val(le_map['company'],d,parent)
    trans_dt = getdate(self.get_val(le_map['transaction_date'],d,parent))
    
    #check budget only if account is expense account
    is_expense_acct = sql("select name from tabAccount where is_pl_account='Yes' and debit_or_credit='Debit' and name=%s",bgt_acct)
    if is_expense_acct and bgt_cost_center:
      cur_fiscal_year = get_defaults()['fiscal_year']
      
      # get allocated budget
      bgt = sql("select budget_allocated,actual,distribution_id from `tabBudget Detail` where account='%s' and parent='%s' and fiscal_year='%s'" % (bgt_acct,bgt_cost_center,cur_fiscal_year))
      budget_allocated = bgt and bgt[0][0] or 0
      actual_amt = bgt and bgt[0][1] or 0
      distribution_id = bgt and bgt[0][2] or 0
      if budget_allocated:
        # set actual amt after current transaction
        if cancel:
          total_actual = flt(actual_amt) - flt(bgt_debit) + flt(bgt_credit)
        else:
          total_actual = flt(bgt_debit) - flt(bgt_credit) + flt(actual_amt)

        # Get monthly budget
        monthly_budget = self.get_monthly_budget(distribution_id, cur_fiscal_year, trans_dt, budget_allocated)
        
        # action if actual exceeds monthly budget
        if flt(total_actual) > flt(monthly_budget):
          action_on_budget_exceed_monthly = sql("select if_budget_exceeded from tabCompany where name=%s",bgt_company)[0][0] or ''
          if action_on_budget_exceed_monthly == 'Warn':
            msgprint("Your monthly expense will exceed budget for account - %s under cost center - %s" % (bgt_acct,bgt_cost_center))
          elif action_on_budget_exceed_monthly == 'Stop':
            msgprint("Your monthly budget for account %s under cost center %s will exceed, you can not have this transaction." % (bgt_acct,bgt_cost_center))
            raise Exception
        
        # action if actual exceeds annual budget
        if flt(total_actual) > flt(budget_allocated):
          action_on_budget_exceed_yearly = sql("select yearly_budget_exceeded from tabCompany where name=%s",bgt_company)[0][0] or ''
          if action_on_budget_exceed_yearly == 'Warn':
            msgprint("Your yearly expense will exceed budget for account - %s under cost center - %s" % (bgt_acct,bgt_cost_center))
          elif action_on_budget_exceed_yearly == 'Stop':
            msgprint("Your yearly budget for account %s under cost center %s will exceed, you can not have this transaction." % (bgt_acct,bgt_cost_center))
            raise Exception
            
        # update actual against budget allocated in cost center
        sql("update `tabBudget Detail` set actual = %s where account = '%s' and fiscal_year = '%s' and parent = '%s'" % (total_actual,cstr(bgt_acct),cstr(cur_fiscal_year),cstr(bgt_cost_center)))

  # ADVANCE ALLOCATION
  #-------------------
  def get_advances(self, obj, account_head, table_name,table_field_name, dr_or_cr):
    jv_detail = sql("select t1.name, t1.remark, t2.%s, t2.name, t1.total_tds_amount from `tabJournal Voucher` t1, `tabJournal Voucher Detail` t2 where t1.name = t2.parent and (t2.against_voucher is null or t2.against_voucher = '') and (t2.against_invoice is null or t2.against_invoice = '') and t2.account = '%s' and t2.is_advance = 'Yes' and t1.docstatus = 1 order by t1.voucher_date " % (dr_or_cr,account_head))

    obj.doc.clear_table(obj.doclist,table_field_name)
    for d in jv_detail:
      add = addchild(obj.doc, table_field_name, table_name, 1, obj.doclist)
      add.journal_voucher = d[0]
      add.jv_detail_no = d[3]
      add.remarks = d[1]
      add.advance_amount = flt(d[2])
      add.allocate_amount = 0
      if table_name == 'Advance Allocation Detail':
        add.tds_amount = flt(d[4])

  def clear_advances(self, obj,table_name,table_field_name):
    for d in getlist(obj.doclist,table_field_name):
      if not flt(d.allocated_amount):
        sql("update `tab%s` set parent = '' where name = '%s' and parent = '%s'" % (table_name, d.name, d.parent))
        d.parent = ''
          
  def update_against_document_in_jv(self, obj, table_field_name, against_document_no, against_document_doctype, account_head, dr_or_cr,doctype):
    for d in getlist(obj.doclist, table_field_name):
      self.validate_jv_entry(d, account_head, dr_or_cr)
      if flt(d.advance_amount) == flt(d.allocated_amount):
        # cancel JV
        jv_obj = get_obj('Journal Voucher', d.journal_voucher, with_children=1)
        get_obj(dt='GL Control').make_gl_entries(jv_obj.doc, jv_obj.doclist, cancel =1, adv_adj =1)

        # update ref in JV Detail
        sql("update `tabJournal Voucher Detail` set %s = '%s' where name = '%s'" % (doctype=='Payable Voucher' and 'against_voucher' or 'against_invoice', cstr(against_document_no), d.jv_detail_no))
        
        # re-submit JV
        jv_obj = get_obj('Journal Voucher', d.journal_voucher, with_children =1)
        get_obj(dt='GL Control').make_gl_entries(jv_obj.doc, jv_obj.doclist, cancel = 0, adv_adj =1)

      elif flt(d.advance_amount) > flt(d.allocated_amount):
        # cancel JV
        jv_obj = get_obj('Journal Voucher', d.journal_voucher, with_children=1)
        get_obj(dt='GL Control').make_gl_entries(jv_obj.doc, jv_obj.doclist, cancel =1, adv_adj = 1)
        
        # add extra entries
        self.add_extra_entry(jv_obj, d.journal_voucher, d.jv_detail_no, flt(d.allocated_amount), account_head, doctype, dr_or_cr, against_document_no)
        
        # re-submit JV
        jv_obj = get_obj('Journal Voucher', d.journal_voucher, with_children =1)
        get_obj(dt='GL Control').make_gl_entries(jv_obj.doc, jv_obj.doclist, cancel = 0, adv_adj = 1)
      else:
        msgprint("Allocation amount cannot be greater than advance amount")
        raise Exception

  def add_extra_entry(self,jv_obj,jv,jv_detail_no, allocate, account_head, doctype, dr_or_cr, against_document_no):
    # get old entry details
    
    jvd = sql("select %s, cost_center, balance, against_account from `tabJournal Voucher Detail` where name = '%s'" % (dr_or_cr,jv_detail_no))
    advance = jvd and flt(jvd[0][0]) or 0
    balance = flt(advance) - flt(allocate)

    # update old entry
    sql("update `tabJournal Voucher Detail` set %s = '%s', %s = '%s' where name = '%s'" % (dr_or_cr, flt(allocate), doctype == "Payable Voucher" and 'against_voucher' or 'against_invoice',cstr(against_document_no), jv_detail_no))

    # new entry with balance amount
    add = addchild(jv_obj.doc, 'entries', 'Journal Voucher Detail', 1, jv_obj.doclist)
    add.account = account_head
    add.cost_center = cstr(jvd[0][1])
    add.balance = cstr(jvd[0][2])
    add.fields[dr_or_cr] = balance
    add.against_account = cstr(jvd[0][3])
    add.is_advance = 'Yes'
    add.save(1)
  
  # check if advance entries are still valid
  # ----------------------------------------
  def validate_jv_entry(self, d, account_head, dr_or_cr):
    # 1. check if there is already a voucher reference
    # 2. check if amount is same
    # 3. check if is_advance is 'Yes'
    # 4. check if jv is submitted
    ret = sql("select t2.%s from `tabJournal Voucher` t1, `tabJournal Voucher Detail` t2 where t1.name = t2.parent and (t2.against_voucher = '' || t2.against_voucher is null) and (t2.against_invoice = '' || t2.against_invoice is null) and t2.account = '%s' and t1.name = '%s' and t2.name = '%s' and t2.is_advance = 'Yes' and t1.docstatus=1 and t2.%s = %s" % ( dr_or_cr, account_head, d.journal_voucher, d.jv_detail_no, dr_or_cr, d.advance_amount))
    if (not ret):
      msgprint("Please click on 'Get Advances Paid' button as the advance entries have been changed.")
      raise Exception
    return
    
  # TDS function definition
  #---------------------------
  def get_tds_amount(self, obj):
    # clear table
    self.doc.clear_table(obj.doclist, 'taxes')
    
    if obj.doc.doctype == 'Payable Voucher':
      supplier_account = obj.doc.credit_to
      total_amount=flt(obj.doc.grand_total)
      for d in getlist(obj.doclist,'advance_allocation_details'):
        if flt(d.tds_amount)!=0:
          total_amount -= flt(d.allocated_amount)
    elif obj.doc.doctype == 'Journal Voucher':
      supplier_account = obj.doc.supplier_account
      total_amount = obj.doc.total_debit

    total_tds = 0 
    if obj.doc.tds_category:
      
      # get total billed
      total_billed = 0
      pv = sql("select sum(ifnull(grand_total,0)), sum(ifnull(total_tds_on_voucher,0)) from `tabPayable Voucher` where tds_category = %s and credit_to = %s and fiscal_year = %s and docstatus = 1 and name != %s and is_opening != 'Yes'", (obj.doc.tds_category, supplier_account, obj.doc.fiscal_year, obj.doc.name))
      jv = sql("select sum(ifnull(total_debit,0)), sum(ifnull(total_tds_amount,0)) from `tabJournal Voucher` where tds_category = %s and supplier_account = %s and fiscal_year = %s and docstatus = 1 and name != %s and is_opening != 'Yes'", (obj.doc.tds_category, supplier_account, obj.doc.fiscal_year, obj.doc.name))
      tds_in_pv = pv and pv[0][1] or 0
      tds_in_jv = jv and jv[0][1] or 0
      total_billed += flt(pv and pv[0][0] or 0)+flt(jv and jv[0][0] or 0)+flt(total_amount)
      # get slab
      slab = sql("SELECT * FROM `tabTDS Rate Detail` t1, `tabTDS Rate Chart` t2 WHERE %s >= t1.slab_from AND t1.category = %s AND t1.parent=t2.name and %s between t2.applicable_from and t2.applicable_to LIMIT 1", (total_billed, obj.doc.tds_category, obj.doc.posting_date), as_dict = 1)
      if slab:
        if flt(tds_in_pv) <= 0 and flt(tds_in_jv) <= 0:
          total_amount = total_billed
        slab = slab[0]
        tds_types = ['Main','Surcharge','Edu Cess','SH Edu Cess']
        tds_dict = {'Main':'rate', 'Surcharge':'surcharge', 'Edu Cess':'ec', 'SH Edu Cess':'shec'}
	
	upper_limit = sql("SELECT t1.slab_to FROM `tabTDS Rate Detail` t1, `tabTDS Rate Chart` t2 WHERE t1.category = %s AND t1.parent=t2.name and %s between t2.applicable_from and t2.applicable_to LIMIT 1", (obj.doc.tds_category, obj.doc.posting_date))

	
        for t in tds_types:
          special_tds = sql("select special_tds_rate, special_tds_limit,sp_tds_rate_applicable from tabAccount where name = '%s'" % supplier_account) 
          
          if t == 'Main':
            if special_tds and special_tds[0][2]=='Yes' and (flt(special_tds[0][1])==0 or flt(special_tds[0][1]) >= flt(total_amount)):
              tds_rate =  flt(special_tds[0][0])
            else: 
              tds_rate=flt(slab[tds_dict[t]]) 
          else:
            if t == 'Surcharge' and total_amount <= flt(upper_limit[0][0]):
	      tds_rate = 0
	    else:   
              if special_tds and special_tds[0][2]=='Yes' and (flt(special_tds[0][1])==0 or flt(special_tds[0][1]) >= flt(total_amount)):
                tds_rate=flt(slab[tds_dict[t]])*flt(special_tds[0][0])/flt(slab['rate']) 
              else:
                tds_rate= flt(slab[tds_dict[t]])
         
          # get account
          if flt(slab[tds_dict[t]]):
            ac = sql("SELECT account_type,account_head,idx FROM `tabTDS Category Account` where parent=%s and company=%s and account_type=%s order by idx", (obj.doc.tds_category,obj.doc.company,t))
 
            if ac:
              d = addchild(obj.doc, 'taxes', 'PV Ded Tax Detail', 1, obj.doclist)
              d.tds_type = ac[0][0]
              d.tax_code = ac[0][1]
              d.tax_rate = tds_rate
              d.ded_amount = round(flt(tds_rate) * flt(total_amount) / 100)
              d.idx=ac[0][2]
              total_tds += flt(d.ded_amount)
            else:
              msgprint("No Account selected for %s in TDS Category %s" % (t, obj.doc.tds_category))
              raise Exception
    return flt(total_tds)

  def patch_gl_entry(self):
    jvd = sql("select parent, name, against_account, cost_center, against_voucher, against_invoice, account from `tabJournal Voucher Detail`",as_dict = 1)
    t = 0
    for i in jvd:
      if i['against_voucher']:
        against_voucher = i['against_voucher']
        against_voucher_type = 'Payable Voucher'
      elif i['against_invoice']:
        against_voucher = i['against_invoice']
        against_voucher_type = 'Receivable Voucher'
      else:
        against_voucher = ''
        against_voucher_type = ''
      sql("Start Transaction")
      sql("update `tabGL Entry` set against = '%s' where cost_center = '%s' and against_voucher_type = '%s' and against_voucher = '%s' and account = '%s' and voucher_no = '%s'"%(i['against_account'],i['cost_center'],against_voucher_type,against_voucher,i['account'], i['parent']))
      sql("Commit")
      t+=1      
      print(t)