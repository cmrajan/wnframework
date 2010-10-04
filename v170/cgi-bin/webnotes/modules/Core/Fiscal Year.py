class DocType:
  def __init__(self, d, dl):
    self.doc, self.doclist = d,dl
  

  # Add a new row in all account for the fiscal year
  #---------------------------------------------------
  def open_new_balances(self):
    al, i = sql("select distinct name from tabAccount"), 0
    for a in al:
      if not sql("select name from `tabAccount Balance` where parent=%s and fiscal_year=%s", (a[0], self.doc.name)):
        d = Document('Account Balance')
        d.parent = a[0]
        d.parenttype = 'Account'
        d.parentfield = 'account_balances'
        d.fiscal_year = self.doc.name
        d.opening = 0
        d.balance = 0
        d.save(1)
        i += 1
    msgprint("%s new balances created" % i)

  # set opening balances from a past year
  # -------------------------------------
  # 1. resets current balance (bal - opening) for all B/S Accounts
  # 2. adds new opening

  def repost_balances(self):
    self.clear_opening_balance()
    self.clear_current_balance()
    self.set_opening_from_last_year()

    # update balance
    gl_list = sql("select name, account, debit, credit, is_opening from `tabGL Entry` where fiscal_year=%s and is_cancelled='No' and company=%s", (self.doc.name, self.doc.company))
    i = 0
    for g in gl_list:
      # get details
      lft = sql("select lft, rgt, debit_or_credit from `tabAccount` where name='%s'" % g[1])      
      # amount to debit
      amt = flt(g[2]) - flt(g[3])
      if lft[0][2] == 'Credit': amt = -amt

      # update
      pl = sql("update `tabAccount Balance` t1, `tabAccount` t2 set t1.balance = t1.balance + %s where t2.lft<=%s and t2.rgt>=%s and t1.parent = t2.name and t1.fiscal_year = '%s'" % (amt, cint(lft[0][0]), cint(lft[0][1]), self.doc.name))

      # update opening
      if g[4]=='Yes':
        pl = sql("update `tabAccount Balance` t1, `tabAccount` t2 set t1.opening = ifnull(t1.opening,0) + %s where t2.lft<=%s and t2.rgt>=%s and t1.parent = t2.name and t1.fiscal_year = '%s'" % (amt, cint(lft[0][0]), cint(lft[0][1]), self.doc.name))

      i += 1
      
    msgprint('%s entries resposted' % i)
  # Clear PV/RV outstanding
  #------------------------
  def clear_outstanding(self):
    # clear o/s of current year
    sql("update `tabPayable Voucher` set outstanding_amount = 0 where fiscal_year=%s and company=%s", (self.doc.name, self.doc.company))
    sql("update `tabReceivable Voucher` set outstanding_amount = 0 where fiscal_year=%s and company=%s", (self.doc.name, self.doc.company))

  # Update Voucher Outstanding
  #------------------------------
  def update_voucher_outstanding(self):
    # Clear outstanding
    self.clear_outstanding()

    against_voucher = sql("select against_voucher, against_voucher_type from `tabGL Entry` where fiscal_year=%s and is_cancelled='No' and company=%s group by against_voucher, against_voucher_type", (self.doc.name, self.doc.company))
    for d in against_voucher:
      # get voucher balance
      bal = sql("select sum(debit)-sum(credit) from `tabGL Entry` where against_voucher=%s and against_voucher_type=%s", (d[0], d[1]))
      bal = bal and flt(bal[0][0]) or 0.0
      if d[1] == 'Payable Voucher':
        bal = -bal
      # set voucher balance
      sql("update `tab%s` set outstanding_amount=%s where name='%s'"% (d[1], bal, d[0]))
 
  # Clear opening balance
  #------------------------      
  def clear_opening_balance(self):
    sql("update `tabAccount Balance` t1, tabAccount t2 set t1.opening = 0 where t1.fiscal_year=%s and t2.company=%s and t1.parent=t2.name", (self.doc.name, self.doc.company))
    msgprint("Opening Balances Cleared.")

  # Clear current balance
  #-----------------------
  def clear_current_balance(self):
    sql("update `tabAccount Balance` t1, tabAccount t2 set t1.balance=0 where t1.fiscal_year=%s and t2.company=%s and t1.parent=t2.name", (self.doc.name, self.doc.company))
    msgprint("Current Balances Cleared.")

  # Set Opening balance from previous year
  #---------------------------------------
  def set_opening_from_last_year(self):
    # message
    if not self.doc.past_year:
      msgprint("Warning: Opening balances were not imported")

    # do not repost from same year
    if self.doc.past_year == self.doc.name:
      msgprint("Cannot import from the current year")
      return
    # set opening balances
    if self.doc.past_year:
      al = sql("select distinct name, is_pl_account from tabAccount where company=%s", self.doc.company)

      i = 0
      for a in al:
        if a[1]=='No':
          # get past balance
          pbal = sql("select balance from `tabAccount Balance` where parent=%s and fiscal_year=%s", (a[0],self.doc.past_year))
          pbal = pbal and pbal[0][0] or 0

          # update for this year
          if pbal:
            sql("update `tabAccount Balance` set opening = %s, balance = %s where parent=%s and fiscal_year = %s", (pbal, pbal, a[0], self.doc.name))
            i+=1
            

      msgprint("%s balances updated" % i)

  # on update
  #-----------------
  def on_update(self):
    self.open_new_balances()