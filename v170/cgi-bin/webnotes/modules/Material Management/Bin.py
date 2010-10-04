class DocType:  
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
      
  # stock update
  # ------------
  def update_stock(self, actual_qty=0, reserved_qty=0, ordered_qty=0, indented_qty=0, planned_qty=0, dt=None, sle_id='', posting_time=''):
    if not dt: dt = nowdate()
    
    self.doc.actual_qty = flt(self.doc.actual_qty) + flt(actual_qty)
    self.doc.ordered_qty = flt(self.doc.ordered_qty) + flt(ordered_qty)            
    self.doc.reserved_qty = flt(self.doc.reserved_qty) + flt(reserved_qty)
    self.doc.indented_qty = flt(self.doc.indented_qty) + flt(indented_qty)
    self.doc.planned_qty = flt(self.doc.planned_qty) + flt(planned_qty)
    
    #self.doc.available_qty = flt(self.doc.actual_qty) + flt(self.doc.ordered_qty) + flt(self.doc.indented_qty) - flt(self.doc.reserved_qty)
    self.doc.projected_qty = flt(self.doc.actual_qty) + flt(self.doc.ordered_qty) + flt(self.doc.indented_qty) + flt(self.doc.planned_qty) - flt(self.doc.reserved_qty)

    
    self.doc.save()

    # if actual qty update valuation
    if actual_qty:
      prev_sle = self.get_prev_sle(sle_id, dt,posting_time)
      cqty = prev_sle and flt(prev_sle[0][0]) or 0
    
      # allow -ve (?)
      if flt(flt(cqty) + flt(actual_qty)) < 0 and flt(actual_qty) < 0:
        # Dear All, Scratch your brain one again!!! Resolved refering to TIC/TIC/3400
        # Please Try to understand when self.doc.actual_qty < 0 then only issue of material should be stopped i.e. actual_qty is also < 0.
        # But if self.doc.actual_qty < 0 then increase & decrease of ordered_qty, indented_qty, available_qty should be allowed.
        # Hence added "AND actual_qty < 0" 
        #msgprint(sle_id)
        #msgprint(dt)
        #msgprint(posting_time)
        #msgprint(flt(cqty))
        #msgprint(cstr(flt(cqty) + flt(actual_qty)))
        #msgprint(flt(actual_qty))
        msgprint('Negative Stock Not Allowed: Item %s, Warehouse %s' % (self.doc.item_code, self.doc.warehouse))
        raise Exception
      self.update_item_valuation(sle_id,dt,posting_time)

  def get_prev_sle(self, sle_id, posting_date,posting_time):
    import datetime
    hrs, mins = [ int(t) for t in str(posting_time).split(':')]
    prev_sle = sql("select bin_aqat, ma_rate, name, posting_date, posting_time from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date <= '%s' and name != '%s' order by posting_date DESC,  posting_time DESC, name DESC limit 1" % (self.doc.item_code, self.doc.warehouse, posting_date, sle_id))
    if prev_sle:
      check = 0
      if prev_sle[0][3] == getdate(str(posting_date)):
        if prev_sle[0][4] == datetime.timedelta(minutes = mins, hours = hrs):
          check = sql("select name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date ='%s' and name != '%s'" % (self.doc.item_code, self.doc.warehouse, prev_sle[0][3], prev_sle[0][2]))
          
        elif prev_sle[0][4] > datetime.timedelta(minutes = mins, hours = hrs):
          ret1 = sql("select bin_aqat, ma_rate, name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date ='%s' and posting_time = '%s' and name < '%s' order by posting_date DESC, posting_time DESC, name DESC limit 1" % (self.doc.item_code, self.doc.warehouse, posting_date, posting_time, sle_id))
          if ret1:
            prev_sle = ret1
            
          else:
            ret2 = sql("select bin_aqat, ma_rate, name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date ='%s' and posting_time < '%s' order by posting_date DESC, posting_time DESC, name DESC limit 1" % (self.doc.item_code, self.doc.warehouse, posting_date,posting_time))
            if ret2:
              prev_sle = ret2
              
            else:
              prev_sle = sql("select bin_aqat, ma_rate, name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date < '%s' order by posting_date DESC, posting_time DESC, name DESC limit 1" % (self.doc.item_code, self.doc.warehouse, prev_sle[0][3]))
              
      if check:
        prev_sle = sql("select bin_aqat, ma_rate, name from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date <= '%s' and name < '%s' order by posting_date DESC, posting_time DESC, name DESC limit 1" % (self.doc.item_code, self.doc.warehouse, prev_sle[0][3], sle_id))
        errprint("Final Check")
    return prev_sle
    
  # item valuation
  # -------------- 
  
  def update_item_valuation(self,sle_id, posting_date,posting_time):
    # get last SLEs for this bin.... this is required as there could be new back-dated entries
    # FCFS incorrect  
    #prev_sle = self.get_prev_sle(sle_id, posting_date,posting_time)
    prev_sle = sql("select bin_aqat, ma_rate, name, posting_date, posting_time from `tabStock Ledger Entry` where item_code = '%s' and warehouse = '%s' and posting_date < '%s' and name != '%s' order by posting_date DESC,  posting_time DESC, name DESC limit 1" % (self.doc.item_code, self.doc.warehouse, posting_date, sle_id))
    cqty = prev_sle and prev_sle[0][0] or 0
    ma_rate = prev_sle and prev_sle[0][1] or 0
    fcfs_rate, fcfs_val = 0, 0
    fcfs_bal = []
    
    sll = sql("select actual_qty, incoming_rate, name, voucher_type, voucher_no, voucher_detail_no, is_cancelled, posting_date from `tabStock Ledger Entry` where item_code=%s and warehouse=%s and posting_date >= %s order by posting_date asc, posting_time asc, name asc", (self.doc.item_code, self.doc.warehouse, posting_date))
    for s in sll:
      # IN
      in_rate = s[1]
      errprint(cqty)
      errprint(s[0])
      errprint(s[4])
      # validate if stock is going -ve in between for back dated entries
      if cqty + s[0] < 0  and s[6] != 'Yes':
        msgprint('Stock is getting Negative for Item %s, Warehouse %s on posting date %s' % (self.doc.item_code, self.doc.warehouse, s[7]))
        raise Exception

      if flt(in_rate) <= 0:
        in_rate = ma_rate


      # moving average
      if in_rate and ma_rate == 0:
        ma_rate = in_rate
      elif s[0] > 0 and (cqty + s[0])>0 and s[6] == 'No' and ((cqty*ma_rate) + (s[0]*in_rate))> 0:
        ma_rate = ((cqty*ma_rate) + (s[0]*in_rate)) / (cqty + s[0])

      if s[0] > 0:          
        # fcfs
        if not s[1]: in_rate = fcfs_rate

        fcfs_val += (s[0]*in_rate)
        fcfs_bal.append([s[0], in_rate]) # add batch to fcfs balance

      # OUT
      else: 
        # remove from fcfs balance
        withdraw = abs(s[0])
        while withdraw:
          if not fcfs_bal:
            break # nothing in store
            
          batch = fcfs_bal[0]
          
          if batch[0] < withdraw:
            # not enough in current batch, clear batch
            withdraw -= batch[0]
            fcfs_val -= (batch[0] * batch[1])
            del fcfs_bal[0]
          else:
            # all from current batch
            fcfs_val -= (withdraw * batch[1])
            batch[0] -= withdraw
            withdraw = 0
            
      cqty += s[0]
      
      if cqty:
        fcfs_rate = fcfs_val / cqty
      else: 
        fcfs_rate = in_rate # last incoming rate
      
      sql("update `tabStock Ledger Entry` set bin_aqat=%s, ma_rate=%s, fcfs_rate=%s where name=%s", (cqty, flt(ma_rate), flt(fcfs_rate), s[2]))
  
    # update in BIN
    # -------------
    sql("update `tabBin` set ma_rate=%s, fcfs_rate=%s, actual_qty=%s where name=%s", (flt(ma_rate), flt(fcfs_rate), cqty, self.doc.name))
  
 
  # item re-order
  # -------------
  
  def reorder_item(self):
    #check if re-order is required
    projected_qty = flt(self.doc.actual_qty)  + flt(self.doc.indented_qty) + flt(self.doc.ordered_qty)
    item_reorder_level = sql("select reorder_level from `%sItem` where name = '%s'" % (self.prefix, self.doc.item_code))[0][0] or 0
    if flt(item_reorder_level) > flt(projected_qty):
      msgprint("Item: " + self.doc.item_code + " is to be re-ordered. Indent raised (Not Implemented).")
  
  # validate bin  

  def validate(self):
    self.validate_mandatory()

  
  # set defaults in bin
  def validate_mandatory(self):
    qf = ['actual_qty', 'reserved_qty', 'ordered_qty', 'indented_qty']
    for f in qf:
      if (not self.doc.fields.has_key(f)) or (not self.doc.fields[f]): 
        self.doc.fields[f] = 0.0