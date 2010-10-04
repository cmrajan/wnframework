class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist


  # update stock
  # ------------
    
  def update_stock(self, values):
    
    for v in values:
      sle_id = ''
      # reverse quantities for cancel
      if v['is_cancelled']=='Yes':
        v['actual_qty'] = -flt(v['actual_qty'])

        # cancel matching entry:
        sql("update `tabStock Ledger Entry` set is_cancelled='Yes' where voucher_no=%s and voucher_type=%s", (v['voucher_no'], v['voucher_type']))

      
      # make ledger entry
      if v["actual_qty"]:
        sle_id = self.make_entry(v)

      # update bin qty
      get_obj('Warehouse', v["warehouse"]).update_bin(flt(v["actual_qty"]), 0, 0, 0, 0, v["item_code"], v["posting_date"],sle_id,v["posting_time"])
      # get_obj("Item",v["item_code"]).check_min_inventory_level()       # to check minimum inventory level in item

  # make entry
  # ----------
  
  def make_entry(self, args):
    sle = Document(doctype = 'Stock Ledger Entry')
    for k in args.keys():
      # adds warehouse_type
      if k == 'warehouse': 
        sle.fields['warehouse_type'] = get_value('Warehouse' , args[k], 'warehouse_type')
      sle.fields[k] = args[k]

    sle_obj = get_obj(doc=sle)

    # validate
    sle_obj.validate()
    
    sle.save(new = 1)
    return sle.name


  def update_mar(self, start_from, end_to):
    sle = sql("select * from `tabStock Ledger Entry` order by posting_date asc, posting_time asc, name asc", as_dict=1)
    for d in range(start_from, end_to):
      sql("start transaction")
      self.update_item_valuation_new(sle[d])
      sql("commit")
      print(d)
 

  def update_item_valuation_new(self, sle):
    #print("select bin_aqat, ma_rate, name, posting_date, posting_time from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date <= '%s' and name != '%s' order by posting_date DESC,  posting_time DESC, name DESC limit 1" % (sle['item_code'], sle['warehouse'], sle['posting_date'], sle['name']))
    #print(sle['name'])
    prev_sle = sql("select bin_aqat, ma_rate, name, posting_date, posting_time from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date <= '%s' and name != '%s' order by posting_date DESC,  posting_time DESC, name DESC limit 1" % (sle['item_code'], sle['warehouse'], sle['posting_date'], sle['name']))
    #msgprint(prev_sle)
    #print(prev_sle)
    if prev_sle:
      #msgprint("select name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date ='%s' and posting_time = '%s' and name != '%s'" % (sle['item_code'], sle['warehouse'], prev_sle[0][3], prev_sle[0][4], prev_sle[0][2]))
      check = 0
      if prev_sle[0][3] == sle['posting_date']:
        if prev_sle[0][4] == sle['posting_time']:
		      check = sql("select name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date ='%s' and name != '%s'" % (sle['item_code'], sle['warehouse'], prev_sle[0][3], prev_sle[0][2]))
        elif prev_sle[0][4] > sle['posting_time']:
          ret1 = sql("select bin_aqat, ma_rate, name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date ='%s' and posting_time = '%s' and name < '%s' order by posting_date DESC, posting_time DESC, name DESC limit 1" % (sle['item_code'], sle['warehouse'], sle['posting_date'], sle['posting_time'], sle['name']))
          if ret1:
            prev_sle = ret1
          else:
            ret2 = sql("select bin_aqat, ma_rate, name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date ='%s' and posting_time < '%s' order by posting_date DESC, posting_time DESC, name DESC limit 1" % (sle['item_code'], sle['warehouse'], sle['posting_date'], sle['posting_time']))
            if ret2:
              prev_sle = ret2
            else:
              prev_sle = sql("select bin_aqat, ma_rate, name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date < '%s' order by posting_date DESC, posting_time DESC, name DESC limit 1" % (sle['item_code'], sle['warehouse'], prev_sle[0][3]))

      #elif prev_sle[0][3] < sle['posting_date']:
      #  check = sql("select name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date ='%s' and posting_time = '%s' and name != '%s'" % (sle['item_code'], sle['warehouse'], prev_sle[0][3], prev_sle[0][4], prev_sle[0][2]))
      if check:
        #msgprint("select bin_aqat, ma_rate, name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date <= '%s' and name < '%s' order by posting_date DESC, posting_time DESC, name DESC limit 1" % (sle['item_code'], sle['warehouse'], prev_sle[0][3], sle['name']))
        prev_sle = sql("select bin_aqat, ma_rate, name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date <= '%s' and name < '%s' order by posting_date DESC, posting_time DESC, name DESC limit 1" % (sle['item_code'], sle['warehouse'], prev_sle[0][3], sle['name']))
    #msgprint(sle)
    #msgprint(prev_sle)
    cqty = prev_sle and prev_sle[0][0] or 0
    ma_rate = prev_sle and prev_sle[0][1] or 0
    fcfs_rate, fcfs_val = 0, 0
    fcfs_bal = []
    in_rate = sle['incoming_rate']

    if sle['is_cancelled'] == 'Yes':
      r = sql("select incoming_rate from `tabStock Ledger Entry` where voucher_no = '%s' and voucher_detail_no = '%s' and is_cancelled = 'No'" % (sle['voucher_no'], sle['voucher_detail_no']))
      in_rate = r and r[0][0] or 0
      
    if sle['voucher_type'] == 'Stock Entry':
      if sle['voucher_no'][:3] in ('MTN', 'MIN', 'WMT'):
        mar = sql("select t1.ma_rate, t1.name from `tabStock Ledger Entry` t1, `tabStock Entry` t2 where t2.name = '%s' and t1.warehouse = t2.from_warehouse and t1.item_code = '%s' and t1.ma_rate > 0 and t1.posting_date <= '%s' and t1.name < '%s' order by t1.posting_date DESC, t1.posting_time DESC, t1.name DESC limit 1" % (sle['voucher_no'], sle['item_code'], sle['posting_date'], sle['name']))
        in_rate = mar and mar[0][0] or 0
      elif sle['voucher_no'][:2] == 'MR':
        lpr = sql("select last_purchase_rate from tabItem where name = '%s'" % sle['item_code'])
        in_rate = lpr and lpr[0][0] or 0

      sql("update `tabStock Ledger Entry` set incoming_rate = '%s' where name = '%s'" % (in_rate, sle['name']))
      sql("update `tabStock Entry Detail` set incoming_rate = '%s' where name = '%s'" % (in_rate, sle['voucher_detail_no']))

    if flt(in_rate) <= 0:
      in_rate = ma_rate
    
    # moving average
    if in_rate and ma_rate <= 0:
      ma_rate = in_rate
    elif sle['actual_qty'] > 0 and cqty + sle['actual_qty'] > 0 and ((cqty*ma_rate) + (sle['actual_qty']*in_rate))> 0:
      #msgprint(1)
      ma_rate = ((cqty*ma_rate) + (sle['actual_qty']*in_rate)) / (cqty + sle['actual_qty'])
      
          
    cqty += sle['actual_qty']
    
    sql("update `tabStock Ledger Entry` set bin_aqat=%s, ma_rate=%s, fcfs_rate=%s where name=%s", (cqty, flt(ma_rate), flt(fcfs_rate), sle['name']))

    # update in BIN
    # -------------
    sql("update `tabBin` set ma_rate=%s, fcfs_rate=%s, actual_qty=%s where item_code=%s and warehouse=%s", (flt(ma_rate), flt(fcfs_rate), cqty, sle['item_code'], sle['warehouse']))