class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.label = { 'item_code': 0 , 'warehouse': 1 , 'qty': 2, 'mar': 3,'stock_uom':4, 'actual_qty':5, 'diff': 6} # with mar
    #self.label = { 'item_code': 0 , 'warehouse': 1 , 'qty': 2, 'stock_uom': 3, 'actual_qty': 4, 'diff':5} 
  
  def autoname(self):
     self.doc.name = make_autoname('SR/' + self.doc.fiscal_year + '/.######')
  
  def admin_errprint(self,text):
    if session['user'] == 'Administrator':
      errprint(text)
  
  def admin_msgprint(self, text):
    if session['user'] == 'Administrator':
      msgprint(text)
  
  def update_next_step(self,next_step):
    self.admin_msgprint(next_step)
    sql("update `tabStock Reconciliation` set next_step = '%s' where name = '%s'" % (next_step,self.doc.name))
  
  def add_remark(self, text, next_step, first_time = 0):
    #self.admin_msgprint("add_remark")
    if first_time:
      sql("update `tabStock Reconciliation` set remark = '' where name = '%s'" % self.doc.name)
    else:
      sql("update `tabStock Reconciliation` set remark = concat(remark, '%s') where name = '%s'" % (text + "<br>",self.doc.name))
      #self.admin_msgprint("remark: " + cstr(sql("select remark from `tabStock Reconciliation` where name = '%s'" % self.doc.name)))
    self.update_next_step(next_step)
  
  def validate_data(self,stock):
    #self.admin_msgprint("validate_data")
    #self.admin_msgprint("add_remark first time")
    self.add_remark('','Validate Data',1)
    if not self.doc.reconciliation_date:
      msgprint("Please enter Reconciliation Date")
      raise Exception , "Validation Error. "
    if not self.doc.file_list:
      msgprint("Please Attach File");
      set(self.doc,'next_step','Upload File and Save Document')
      raise Exception , "Validation Error. "
    check_item,check_warehouse,count = 1, 1, 1

    for s in stock:
      count +=1
      check_it = self.validate_item(s[self.label['item_code']],count)
      if not check_it:
        check_item = 0
      check_wh = self.validate_warehouse(s[self.label['warehouse']],count)
      if not check_wh:
        check_warehouse = 0

    if check_item and check_warehouse:
      text = "Validation Completed Successfully..."
      self.add_remark(text,'Submit Document',0)
    return check_item and check_warehouse

  def validate_item(self,item,count,check_item = 1):
    if not sql("select item_code from `tabItem` where name = '%s'"% (item)):
      #self.admin_msgprint("No Item in Item Master")
      text = "There is no Item Master with Item Code " + cstr(item) + " at Row No. " + cstr(count) + " in Attached File."
      self.add_remark(text,'Validate Data',0)
      check_item = 0
    return check_item

  def validate_warehouse(self,wh,count, check_warehouse = 1):
    if not sql("select name from `tabWarehouse` where name = %s", wh, as_dict = 1):
      self.admin_msgprint("No Warehouse in Warehouse Master")
      text = "There is no Warehouse Master with name " + cstr(wh) + " at Row No. " + cstr(count) + " in Attached File."
      self.add_remark(text,'Validate Data',0)
      check_warehouse = 0
    return check_warehouse

  def stock_reconciliations(self,submit = 0):
    #self.admin_msgprint("stock_reconciliation")
    if not self.doc.reconciliation_date :
      msgprint("Please Enter Reconciliation Date.")
      raise Exception
    if not self.doc.posting_time :
      msgprint("Please Enter Posting Time.")
      raise Exception
    rec_stock_detail = self.get_reconciliation_stock_details(submit)
    if not rec_stock_detail:
      msgprint("Please Check there are no items in the attached file.")
      raise Exception, " Validation Error."
    count = 1
    for stock in rec_stock_detail:
      count += 1
      #self.admin_msgprint("Row" + cstr(count))
      cur_stock_detail = self.get_current_stock(stock[self.label['item_code']],stock[self.label['warehouse']])
      stock.append(cur_stock_detail['stock_uom'])
      stock.append(cur_stock_detail['actual_qty'])
      if not stock[self.label['mar']] == '~':
        self.update_mar(stock) # with MAR
      diff = flt(stock[self.label['qty']]) - flt(cur_stock_detail['actual_qty'])
      
      if diff:
        self.make_sl_entry(1,stock,diff)

    text = "Stock Reconciliation Completed Successfully..."
    #self.add_remark(text,'Completed',0) # without MAR
    #self.add_remark(text,'Validation',0)
    self.add_data_in_CSV(rec_stock_detail)
    self.add_remark(text,'Completed',0)
    #if not submit:
    #  sql("commit")

  def update_mar(self,d):
    if not d[self.label['qty']] and not d[self.label['actual_qty']]:
       d[self.label['qty']] = 1
       self.make_sl_entry(1,d)
       self.make_sl_entry(-1,d)
       d[self.label['qty']] = 0
    else:
      sql("update `tabStock Ledger Entry` set incoming_rate = '%s', ma_rate = '%s' where item_code = '%s' and is_cancelled = 'No' and warehouse = '%s'" % (flt(d[self.label['mar']]), flt(d[self.label['mar']]),d[self.label['item_code']], d[self.label['warehouse']]))

  def get_current_stock(self, item_code, warehouse):
    self.admin_msgprint("get_current_stock")
    bin = sql("select name from `tabBin` where item_code = '%s' and warehouse = '%s'" % (item_code, warehouse))
    prev_sle = bin and get_obj('Bin', bin[0][0]).get_prev_sle('', self.doc.reconciliation_date,self.doc.posting_time) or 0
    if item_code == 'M080212':
      errprint(prev_sle)
    #stock = sql("select bin_aqat as 'actual_qty', stock_uom from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date < '%s' order by posting_date desc, posting_time desc, name desc limit 1" % (item_code, warehouse, self.doc.reconciliation_date), as_dict =1)
    #stock = sql("select actual_qty,stock_uom from `tabBin` where warehouse = %s and item_code = %s ",(warehouse,item_code), as_dict = 1) 
    stock_uom = sql("select stock_uom from `tabItem` where name = %s",item_code)
    return {'actual_qty': prev_sle and prev_sle[0][0] or 0,'stock_uom': stock_uom[0][0]}

  def make_sl_entry(self, update_stock, stock,diff):
    self.admin_msgprint("make_sl_entry")
    values = []
    values.append({
        'item_code'          : stock[self.label['item_code']],
        'warehouse'          : stock[self.label['warehouse']],
        'transaction_date'   : now(),
        'posting_date'       : self.doc.reconciliation_date,
        'posting_time'       : self.doc.posting_time,
        'voucher_type'       : self.doc.doctype,
        'voucher_no'         : self.doc.name,
        'voucher_detail_no'  : self.doc.name,
        'actual_qty'         : flt(update_stock) * flt(diff),
        'stock_uom'          : stock[self.label['stock_uom']],
        'incoming_rate'      : stock[self.label['mar']] or 0,
        'company'            : self.doc.company,
        'fiscal_year'        : self.doc.fiscal_year,
        'is_cancelled'       : (update_stock==1) and 'No' or 'Yes'
     })
        
    get_obj('Stock Ledger', 'Stock Ledger').update_stock(values)

  def get_reconciliation_stock_details(self,submit = 0):
    import csv 
    stock = csv.reader(self.get_csv_file_data().splitlines())
   
    stock = self.convert_into_list(stock)
    self.verify_column_names(stock[0])
    stock.pop(0)
    check = self.validate_data(stock)
    if not check:
      #msgprint("Validation Error")
      #raise Exception
      return 0
    if submit:
      return stock

  def convert_into_list(self,stock):
    count = 1
    st_list = []
    for s in stock:
      #if len(s) < 3 or len(s) > 3: # without MAR 
      if len(s) < 4 or len(s) > 4:
        msgprint("Data entered at Row No " + cstr(count) + " in Attachment File is not in correct format.")
        raise Exception
      l = [s[0],s[1],s[2],s[3]]
      st_list.append(l)
      count += 1
    return st_list
  
  def verify_column_names(self, stock):
    
    if stock[self.label['item_code']].strip() != 'Item Code':
      msgprint("Value at Row 0 and Column 0 should be Item Code")
      raise Exception
    if stock[self.label['warehouse']].strip() != 'Warehouse':
      msgprint("Value at Row 0 and Column 1 should be Warehouse")
      raise Exception
    if stock[self.label['qty']].strip() != 'Qty':
      msgprint("Value at Row 0 and Column 1 should be Qty")
      raise Exception
    if stock[self.label['mar']].strip() != 'MAR':
      msgprint("Value at Row 0 and Column 1 should be MAR")
      raise Exception
    
  def get_csv_file_data(self):
    self.admin_msgprint("get_csv_file_data")
    filename = self.doc.file_list.split(',')
    content = sql("select blob_content from `tabFile Data` where file_name = '%s' and name = '%s'" % (filename[0], filename[1]))
    content = content and content[0][0] or ''
    if not type(content) == str:
      content = content.tostring()
    return content

  def getCSVelement(self,v):
    v = cstr(v)
    if not v: return ''
    if (',' in v) or ('' in v) or ('"' in  v):
      if '"' in v: v = v.replace('"', '""')
      return '"'+v+'"'
    else: return v or ''

  def add_data_in_CSV(self,data):
    filename = self.doc.file_list.split(',')
    head = []
    #for h in ['Item Code','Warehouse','Qty','Actual','Difference']:  #without MAR
    for h in ['Item Code','Warehouse','Qty','Actual','Difference','MAR']:
      head.append(self.getCSVelement(h))
    dset = (','.join(head) + NEWLINE)
    for d in data:
      #l = [d[self.label['item_code']],d[self.label['warehouse']],d[self.label['qty']],d[self.label['actual_qty']],flt(d[self.label['qty']])-flt(d[self.label['actual_qty']])] # without MAR
      l = [d[self.label['item_code']],d[self.label['warehouse']],d[self.label['qty']],d[self.label['actual_qty']],flt(d[self.label['qty']])-flt(d[self.label['actual_qty']]),d[self.label['mar']]]
      s =[]
      for i in l:
        s.append(self.getCSVelement(i))
      dset +=(','.join(s)+NEWLINE)
    self.admin_errprint(cstr(dset))
    sql("update `tabFile Data` set blob_content = '%s' where file_name = '%s' and name = '%s'" % (dset, filename[0], filename[1]))

  def on_submit(self):
    self.stock_reconciliations(submit = 1)