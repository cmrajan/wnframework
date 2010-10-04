class DocType:
  def __init__(self,doc,doclist):
    self.doc = doc
    self.doclist = doclist
    
  def get_activity_list(self):
    out = {}
    dt_list = [d[0] for d in sql("select distinct t2.name from tabDocField t1, tabDocType t2 where t1.fieldname='status' and t1.docstatus=0 and (t2.istable is null or t2.istable = 0) and t1.parent = t2.name")]
    if not dt_list:
      return out

    # get list of activity dt
    for dt in dt_list:
      if dt in session['data']['readtypes']:
        out[dt] = {}
        # get status list
        sl = sql("select distinct status from `tab%s`" % dt)
        
        for s in sl:
          if s[0]:
            # get count
            cnt = sql("select count(*) from `tab%s` where status = '%s' and modified > '%s'" % (dt, s[0], add_days(nowdate(), -7)))[0][0]
            out[dt][s[0]] = cint(cnt)
    return out
    
  def get_birth_list(self):
    bl = [(t[0] or '') + (t[0] and ' ' or '') + (t[1] or '') for t in sql("select first_name, last_name from tabProfile where DATEDIFF(CONCAT(YEAR(CURDATE()),'-',MONTH(birth_date),'-',DAY(birth_date)), CURDATE())=0")]
    return bl
    
  def get_todo_list(self):
    doclist = get_todo_list()
    tl = []
    for d in doclist:
      tl.append([d.description or '', d.priority or '', d.name or '', d.reference_type or '', d.reference_name or ''])

    return tl
    
  def get_events_list(self):
    doclist = get_cal_events(nowdate(), add_days(nowdate(), 7))
    el = []
    for d in doclist:
    	el.append([d.name, d.event_date, d.event_hour, d.description or '', d.ref_type or '', d.ref_name or ''])
    return el
  
  def get_news_list(self):
    ret = convert_to_lists(sql("select name,title,details from tabAnnouncement order by creation desc"))    
    return ret
    
  def clear_todo(self,item):
    sql("delete from `tabToDo Item` where name=%s",item)
    
    doclist = get_todo_list()
    tl = []
    for d in doclist:
      tl.append([d.description, d.priority, d.name, d.reference_type or '', d.reference_name or ''])

    return tl

  # tweets
  # --------------

  def send_tweet(self, arg):
    tw, tag = arg, ''
    if '~~~' in arg:
      tw, tag = arg.split('~~~')

    t = Document('Tweet')
    t.by = session['user']
    t.comment = tw
    t.tag = tag
    t.save(1)
    cnt = sql("select count(*) from tabTweet")[0][0]
    if cnt > 2500:
      sql("delelte from tabTweet order by name asc limit %s", (250-cnt))


  def get_buying_details(self):
    ret = {}    
    ret['rfq'] = convert_to_lists(sql("select distinct t1.name,t1.rfq_date,t1.docstatus from tabRFQ t1, tabContact t2 where t1.from_company=t2.customer_name and t2.email_id=%s and t1.rfq_type = 'From Customer' order by t1.rfq_date desc limit 5",session['user']))
    
    ret['qt'] = convert_to_lists(sql("select t1.name,t1.transaction_date from tabQuotation t1, tabContact t2 where t1.customer_name=t2.customer_name and t2.email_id=%s and t1.docstatus=1 order by t1.transaction_date desc limit 5",session['user']))
    
    ret['so'] = convert_to_lists(sql("select t1.name,t1.transaction_date from `tabSales Order` t1, tabContact t2 where t1.customer_name=t2.customer_name and t2.email_id=%s and t1.docstatus=1 order by t1.transaction_date desc limit 5",session['user']))
    
    ret['dn'] = convert_to_lists(sql("select t1.name,t1.transaction_date from `tabDelivery Note` t1, tabContact t2 where t1.customer_name=t2.customer_name and t2.email_id=%s and t1.docstatus=1 order by t1.transaction_date desc limit 5",session['user']))
    
    ret['rv'] = convert_to_lists(sql("select t1.name,t1.voucher_date from `tabReceivable Voucher` t1, tabContact t2 where t1.customer=t2.customer_name and t2.email_id=%s and t1.docstatus=1 order by t1.voucher_date desc limit 5",session['user']))
    return ret
    
  def get_selling_details(self):
    ret = {}
    ret['rfq'] = convert_to_lists(sql("select distinct t1.name,t1.rfq_date,t1.docstatus from tabRFQ t1, tabSupplier t2, tabContact t3 where ((t1.supplier_name=t3.supplier_name) or (t1.supplier_type=t2.supplier_type and t2.name=t3.supplier_name)) and t3.email_id=%s and t1.docstatus=1 and t1.rfq_type='From Company' order by t1.rfq_date desc limit 5",session['user']))
    
    ret['sq'] = convert_to_lists(sql("select t1.name,t1.quotation_date,t1.ref_no from `tabSupplier Quotation` t1, `tabContact` t2 where t1.supplier_name=t2.supplier_name and t2.email_id=%s order by t1.quotation_date desc limit 5",session['user']))
    
    ret['po'] = convert_to_lists(sql("select t1.name,t1.transaction_date from `tabPurchase Order` t1, tabContact t2 where t1.supplier = t2.supplier_name and t2.email_id=%s and t1.docstatus=1 order by t1.transaction_date desc limit 5",session['user']))
    
    ret['pr'] = convert_to_lists(sql("select t1.name, t1.transaction_date from `tabPurchase Receipt` t1, tabContact t2 where t1.supplier=t2.supplier_name and t2.email_id=%s and t1.docstatus=1 order by t1.transaction_date desc limit 5",session['user']))
    
    ret['pv'] = convert_to_lists(sql("select t1.name,t1.voucher_date from `tabPayable Voucher` t1, tabContact t2 where t1.supplier=t2.supplier_name and t2.email_id=%s and t1.docstatus=1 order by t1.voucher_date desc limit 5",session['user']))
    return ret

#dashboard
  def get_dashboard_values(self, arg=''):
    d = get_defaults()
    self.fiscal_year = d['fiscal_year']
    if arg:
      company = arg
    else:
      company = d['company']

    r = {}
    r['Income'] = self.bl('Income', company)
    r['Expenses'] = self.bl('Expenses', company)

    r['Profit'] = []
    for i in range(3):
      r['Profit'].append(r['Income'][i] - r['Expenses'][i])
    
    r['Current Assets'] = self.bl_bs('Current Assets', company, getdate(d['year_start_date']))
    r['Current Liabilities'] = self.bl_bs('Current Liabilities', company, getdate(d['year_start_date']))
    
    r['Working Capital'] = []
    for i in range(3):
      r['Working Capital'].append(r['Current Assets'][i] - r['Current Liabilities'][i])

    r['Bank Accounts'] = self.bl_bs('Bank Accounts', company, getdate(d['year_start_date']))
    
    r['Top Customers'] = convert_to_lists(self.get_top_5_cust(company))
    r['Top Expenses'] = convert_to_lists(self.get_top_5_exp(company))
    
    return r

  def bl(self, acc, company):
    dt = getdate(nowdate())

    r = []
    # cur
    r.append(self.get_cur_balance(acc, company))
    # this month
    r.append(self.get_balance(acc, get_first_day(dt), get_last_day(dt), company, self.fiscal_year))
    # last month
    r.append(self.get_balance(acc, get_first_day(dt,0,-1), get_last_day(get_first_day(dt,0,-1)), company, self.fiscal_year))
    return r

  def bl_bs(self, acc, company, sd):
    dt = getdate(nowdate())
    r = []
    # cur
    r.append(self.get_cur_balance(acc, company))
    # last month
    r.append(self.get_balance(acc, sd, get_last_day(get_first_day(dt,0,-1)), company, self.fiscal_year))
    # opening
    r.append(self.get_balance(acc, sd, sd, company, self.fiscal_year))
    return r

  def get_cur_balance(self, acc, company):
    bal = sql("select IFNULL(t1.balance,0) from `tabAccount Balance` t1, `tabAccount` t2 where t1.parent = %s and t1.fiscal_year=%s and t1.parent = t2.name and t2.company=%s", (acc,company,self.fiscal_year))
    return bal and flt(bal[0][0]) or 0

  def get_balance(self, acc, sd, ed, company, fy):
    a = sql("select account_name, name, debit_or_credit, lft, rgt, is_pl_account from `tabAccount` where account_name=%s and company=%s", (acc, company), as_dict=1)
    if a:
      a = a[0]
      bal = sql("select SUM(IFNULL(t1.debit,0)), SUM(IFNULL(t1.credit,0)) from `tabGL Entry` t1, `tabAccount` t2 WHERE t1.posting_date >= %s AND t1.posting_date <= %s AND t1.account = t2.name AND t2.lft >= %s AND t2.rgt <= %s and is_opening = 'No' and t1.is_cancelled = 'No'", (sd,ed,a['lft'],a['rgt']))
      if a['debit_or_credit']=='Debit':
        bal = flt(flt(bal[0][0]) - flt(bal[0][1]))
      else:
        bal = flt(flt(bal[0][1]) - flt(bal[0][0]))

      if a['is_pl_account']=='No':
        op = sql("select opening from `tabAccount Balance` where parent=%s and fiscal_year=%s", (acc, fy))
        op = op and op[0][0] or 0
        bal += flt(op)

      return flt(bal)

    else:
#      msgprint("Did not find %s for %s" % (acc, company))
      return 0

  def get_top_5_cust(self, company):
    rec_grp = sql("select receivables_group from tabCompany where name=%s", company)
    if rec_grp:
      pa_lft_rgt = sql("select lft, rgt from tabAccount where name=%s and company=%s", (rec_grp[0][0], company))[0]
      return sql("select t1.account_name, SUM(t2.debit) from tabAccount t1, `tabGL Entry` t2 where t1.lft > %s and t1.rgt < %s and t2.account = t1.name GROUP BY t1.name ORDER BY SUM(t2.debit) desc limit 5", (pa_lft_rgt[0], pa_lft_rgt[1]))
    else:
      return []

  def get_top_5_exp(self, company):
    a = sql("select distinct account_name, name, debit_or_credit, lft, rgt from `tabAccount` where account_name=%s and company=%s", ('Expenses', company), as_dict=1)[0]
    if a:
      return sql("select t1.account_name, SUM(t2.debit) from tabAccount t1, `tabGL Entry` t2 where t1.lft>%s and t1.rgt<%s and t1.group_or_ledger = 'Ledger' and t2.account = t1.name GROUP BY t1.name ORDER BY SUM(t2.debit) desc limit 5", (a['lft'],a['rgt']))

# GRAPHS
# ===============================================================================================      
  def get_graphs(self):
    self.cust_graph(arg = '')
    self.sales_graph(arg = '')
    self.profit_graph(arg = '')
    self.income_graph(arg = '')
  
  # *************************** TOP 10 CUSTOMERS *******************************
  def cust_graph(self,arg = ''):
    d = get_defaults()
    rec_grp = sql("select receivables_group from tabCompany where name=%s", d['company'])
    top_cust = ''
    if rec_grp:
      pa_lft_rgt = sql("select lft, rgt from tabAccount where name=%s and company=%s", (rec_grp[0][0], d['company']))[0]
      top_cust = sql("select t1.account_name, SUM(t2.debit) from tabAccount t1, `tabGL Entry` t2 where t1.lft > %s and t1.rgt < %s and t2.account = t1.name and t2.is_cancelled = 'No' GROUP BY t1.name ORDER BY SUM(t2.debit) desc limit 10", (pa_lft_rgt[0], pa_lft_rgt[1]))
    
      
    # An example from the matplotlib site
    import numpy as np
    import matplotlib.pyplot as plt
    
    
    N = len(top_cust)
    amt = []
    amt_std = []
    cust_name = []
    for d in top_cust:
      amt.append(d[1])
      amt_std.append(2)
      cust_name.append(cstr(d[0])[:5]+"...")

    ind = np.arange(N)  # the x locations for the groups
    width = 0.5       # the width of the bars

    fig = plt.figure(figsize = (6,4)) # figsize(width,heigth) in inches
    ax = fig.add_subplot(1.5,1,1)
    rects1 = ax.bar(ind+width, amt, width, color='m', edgecolor = 'b', yerr=amt_std)

    # add some
    ax.set_xlabel('Customer',fontsize = 10)
    ax.set_ylabel('Amount', fontsize = 10)
    ax.set_title('Top 10 Customers', bbox={'facecolor':'0.8', 'pad':6}, fontsize=12)
    ax.set_xticks(ind+width+0.25)
    ax.set_xticklabels((cust_name),fontsize = 8)
    for label1 in ax.get_xticklabels():
      label1.set_rotation(30)
      label1.set_horizontalalignment('right')
    for label2 in ax.get_yticklabels():
      label2.set_fontsize(8)

    def autolabel(rects):
      # attach some text labels
      for rect in rects:
        height = rect.get_height()
        ax.text(rect.get_x()+rect.get_width()/2., 1.05*flt(height), '%d'%int(height),
                fontsize = 8, ha='center', va='bottom', rotation = 30)

    autolabel(rects1)
    return plt
    
  
  # *************** TERRITORY WISE SALES (PIE CHART) *************************************
  def sales_graph(self,arg = ''):
    d = get_defaults()
    company = d['company']
    rec_grp = sql("select receivables_group from tabCompany where name=%s", company)
    if rec_grp:
      pa_lft_rgt = sql("select lft, rgt from tabAccount where name=%s and company=%s", (rec_grp[0][0], company))[0]
      det = sql("select t3.territory, SUM(t2.debit) from tabAccount t1, `tabGL Entry` t2, tabCustomer t3 where t1.lft > %s and t1.rgt < %s and t2.account = t1.name and t1.account_name = t3.name and t2.is_cancelled = 'No' GROUP BY t3.territory ORDER BY SUM(t2.debit)", (pa_lft_rgt[0], pa_lft_rgt[1]))
      
    if det:
      t = ''
      sum = 0
      territory = []
      fracs = []
      explode = []
      for d in det:
        sum += flt(d[1])
        territory.append(d[0])
        explode.append(0.04)
            
      for s in range(len(det)):
        fracs.append('%0.2f' %flt(flt(det[s][1]) * 100 / flt(sum)))
    
    import matplotlib.pyplot as plt

    # make a square figure and axes
    fig = plt.figure(1, figsize=(4,4))
    ax = plt.axes([0.1, 0.1, 0.8, 0.8])

    plt.pie(fracs, explode=explode, labels=territory, autopct='%1.1f%%', colors=('b', 'g', 'r', 'c', 'm', 'y', 'pink', 'brown'), shadow=True)
    plt.title('Territory Wise Sales', bbox={'facecolor':'0.8', 'pad':5}, fontsize=12)
    return plt
    

  # ******************* PROFIT MONTHWISE ****************************
  def profit_graph(self, arg = ''):
    prf, prf_std = [],[]
    income = 0
    expense = 0
    profit = 0
    d = get_defaults()
    year_start_date = sql("select year_start_date from `tabFiscal Year` where name = %s",d['fiscal_year'])[0][0]
    months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    get_months = []
    # get expense monthwise
    for exp in range(12):
      income = self.get_balance('Income', get_first_day(year_start_date,0,exp), get_last_day(get_first_day(year_start_date,0,exp)), d['company'], d['fiscal_year'])
      expense = self.get_balance('Expenses', get_first_day(year_start_date,0,exp), get_last_day(get_first_day(year_start_date,0,exp)), d['company'], d['fiscal_year'])
      profit = income - expense
      prf.append(profit)
      month_no = cstr(get_first_day(year_start_date,0,exp)).split('-')[1]
      get_months.append(months[cint(month_no)])
      prf_std.append(2)
    
    # An example from the matplotlib site
    import numpy as np
    import matplotlib.pyplot as plt
    N = 12
    ind = np.arange(N)  # the x locations for the groups
    width = 0.5     # the width of the bars

    fig = plt.figure(figsize = (6,4))
    ax = fig.add_subplot(1.5,1,1)
    rects3 = ax.bar(ind+width, prf, width, color='c', edgecolor = 'k', yerr=prf_std, align = 'center')
    
    # add some
    ax.set_ylabel('Amount',fontsize = 10)
    ax.set_xlabel('Month',fontsize = 10)
    ax.set_title('Monthwise Profit',bbox={'facecolor':'0.8', 'pad':6}, fontsize=12)
    ax.set_xticks(ind+width)
    ax.set_xticklabels((get_months),fontsize = 8)
    for label2 in ax.get_yticklabels():
      label2.set_fontsize(8)
    
    def autolabel(rects):
      # attach some text labels
      for rect in rects:
        height = rect.get_height()
        ax.text(rect.get_x()+rect.get_width()/2., 1.05*height, '%d'%int(height),
                fontsize = 8, ha='center', va='bottom')

    autolabel(rects3)
    return plt
    
    
    # ******************* INCOME MONTHWISE ****************************
  def income_graph(self, arg = ''):
    inc, inc_std = [],[]
    income = 0
    d = get_defaults()
    year_start_date = sql("select year_start_date from `tabFiscal Year` where name = %s",d['fiscal_year'])[0][0]
    months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    get_months = []
    # get expense monthwise
    for exp in range(12):
      income = self.get_balance('Income', get_first_day(year_start_date,0,exp), get_last_day(get_first_day(year_start_date,0,exp)), d['company'], d['fiscal_year'])
      inc.append(income)
      month_no = cstr(get_first_day(year_start_date,0,exp)).split('-')[1]
      get_months.append(months[cint(month_no)])
      inc_std.append(2)
    
    # An example from the matplotlib site
    import numpy as np
    import matplotlib.pyplot as plt
    N = 12
    ind = np.arange(N)  # the x locations for the groups
    width = 0.5     # the width of the bars

    fig = plt.figure(figsize = (6,4))
    ax = fig.add_subplot(1.5,1,1)
    rects3 = ax.bar(ind+width, inc, width, color='m', edgecolor = 'b', yerr=inc_std, align = 'center')
    
    # add some
    ax.set_ylabel('Amount',fontsize = 10)
    ax.set_xlabel('Month',fontsize = 10)
    ax.set_title('Monthwise Income',bbox={'facecolor':'0.8', 'pad':6}, fontsize=12)
    ax.set_xticks(ind+width)
    ax.set_xticklabels((get_months),fontsize = 8)
    for label2 in ax.get_yticklabels():
      label2.set_fontsize(8)
    
    def autolabel(rects):
      # attach some text labels
      for rect in rects:
        height = rect.get_height()
        ax.text(rect.get_x()+rect.get_width()/2., 1.05*height, '%d'%int(height),
                fontsize = 8, ha='center', va='bottom')

    autolabel(rects3)
    return plt