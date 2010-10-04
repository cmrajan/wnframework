class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.defaults = get_defaults()
    self.tname = 'Purchase Receipt Detail'
    self.fname = 'purchase_receipt_details'
    self.count = 0

  # Client Trigger Functions
  #----------------------------------------------------------------------------------------------------

  def get_default_schedule_date(self):
    get_obj(dt = 'Purchase Common').get_default_schedule_date(self)
    
#-----------------Validation For Fiscal Year------------------------
  def validate_fiscal_year(self):
    get_obj(dt = 'Purchase Common').validate_fiscal_year(self.doc.fiscal_year,self.doc.transaction_date,'Transaction Date')
    
  # Get Supplier Details 
  def get_supplier_details(self, name = ''):
    return cstr(get_obj(dt='Purchase Common').get_supplier_details(name))
  
  # Get Item Details
  def get_item_details(self, arg = ''):
    return cstr(get_obj(dt='Purchase Common').get_item_details(self,arg))
  
  # Get UOM Details
  def get_uom_details(self, arg = ''):
    return cstr(get_obj(dt='Purchase Common').get_uom_details(arg))
  
  # get available qty at warehouse
  def get_bin_details(self, arg = ''):
    return cstr(get_obj(dt='Purchase Common').get_bin_details(arg))

  # Pull Purchase Order
  def get_po_details(self):
    self.validate_prev_docname()
    get_obj('DocType Mapper', 'Purchase Order-Purchase Receipt').dt_map('Purchase Order', 'Purchase Receipt', self.doc.purchase_order_no, self.doc, self.doclist, "[['Purchase Order','Purchase Receipt'],['PO Detail', 'Purchase Receipt Detail']]")
  
  # validate if PO has been pulled twice
  def validate_prev_docname(self):
    for d in getlist(self.doclist, 'purchase_receipt_details'): 
      if self.doc.purchase_order_no and d.prevdoc_docname and self.doc.purchase_order_no == d.prevdoc_docname:
        msgprint(cstr(self.doc.purchase_order_no) + " Purchase Order details have already been pulled. ")
        raise Exception

  # validation
  #-------------------------------------------------------------------------------------------------------------
  # validate accepted and rejected qty
  def validate_accepted_rejected_qty(self):
    for d in getlist(self.doclist, "purchase_receipt_details"):
      
      if not d.qa_reported == 'Yes':
        d.qa_reported = 'No'      

      # If Reject Qty than Rejected warehouse is mandatory    
      if flt(d.rejected_qty) and (not self.doc.rejected_warehouse):
        msgprint("Rejected Warehouse is necessary if there are rejections. See 'Receipt Items'")
        raise Exception

      # Check Received Qty = Accepted Qty + Rejected Qty 
      if ((flt(d.qty) + flt(d.rejected_qty)) != flt(d.received_qty)):
        raise Exception
        msgprint("Sum of Accepted Qty and Rejected Qty must be equal to Received quantity. Error for Item: " + cstr(d.item_code))
  
  # validate doc
  def validate_doc(self,pc_obj):
    # Validate values with reference document
      pc_obj.validate_reference_value(obj = self)

  # check whether serial no is required  
  def validate_serial_no(self):
    for d in getlist(self.doclist, 'purchase_receipt_details'):
      ar_required = sql("select has_serial_no from tabItem where name = '%s'" % d.item_code)
      ar_required = ar_required and ar_required[0][0] or ''
      if ar_required == 'Yes' and not d.serial_no:
        msgprint("Serial no is mandatory for item: "+ d.item_code)
        raise Exception
      elif ar_required != 'Yes' and d.serial_no:
        msgprint("If serial no required, please select 'Yes' in 'Has Serial No' in Item master")
        raise Exception

  # update valuation rate
  def update_valuation_rate(self):
    total_b_cost = flt(self.doc.buying_cost_transport) + flt(self.doc.buying_cost_taxes) + flt(self.doc.buying_cost_other)
    for d in getlist(self.doclist, 'purchase_receipt_details'):
      if flt(self.doc.net_total) and flt(d.qty):
        d.valuation_rate = (flt(d.purchase_rate) + ((flt(d.amount) * (total_b_cost)) / (self.doc.net_total * flt(d.qty))) + (flt(d.rm_supp_cost) / flt(d.qty))) / flt(d.conversion_factor)
   
  
  # Check for Stopped status 
  def check_for_stopped_status(self, pc_obj):
    check_list =[]
    for d in getlist(self.doclist, 'purchase_receipt_details'):
      if d.fields.has_key('prevdoc_docname') and d.prevdoc_docname and d.prevdoc_docname not in check_list:
        check_list.append(d.prevdoc_docname)
        pc_obj.check_for_stopped_status( d.prevdoc_doctype, d.prevdoc_docname)
   
  # validate
  def validate(self):
    self.validate_fiscal_year()
    # set status as "Draft"
    set(self.doc, 'status', 'Draft')
    
    self.validate_accepted_rejected_qty()
    
    pc_obj = get_obj(dt='Purchase Common')
    # validate for Items
    pc_obj.validate_for_items(self)
    pc_obj.validate_mandatory(self)
    pc_obj.validate_conversion_rate(self)
    self.validate_doc(pc_obj)
    self.validate_serial_no()
    
    self.check_for_stopped_status(pc_obj) 
    # update valuation rate
    self.update_valuation_rate()
  
  # On Update
  # ----------------------------------------------------------------------------------------------------    
  def on_update(self):
    if self.doc.rejected_warehouse:
      for d in getlist(self.doclist,'purchase_receipt_details'):
        d.rejected_warehouse = self.doc.rejected_warehouse

    self.update_rw_material_detail()

  # On Submit
  # -----------------------------------------------------------------------------------------------------

 # Update Stock
  def update_stock(self, is_submit):
    pc_obj = get_obj('Purchase Common')
    self.values = []
    for d in getlist(self.doclist, 'purchase_receipt_details'):
      # Check if is_stock_item == 'Yes'
      if sql("select is_stock_item from tabItem where name=%s", d.item_code)[0][0]=='Yes':
        ord_qty = 0
        pr_qty = flt(d.qty) * flt(d.conversion_factor) 
        
        # Check If Prevdoc Doctype is Purchase Order  
        if cstr(d.prevdoc_doctype) == 'Purchase Order':
          # get qty and pending_qty of prevdoc 
          curr_ref_qty = pc_obj.get_qty( d.doctype, 'prevdoc_detail_docname', d.prevdoc_detail_docname, 'PO Detail', 'Purchase Order - Purchase Receipt', self.doc.name)
          max_qty, qty, curr_qty = flt(curr_ref_qty.split('~~~')[1]), flt(curr_ref_qty.split('~~~')[0]), 0
          
          if flt(qty) + flt(pr_qty) > flt(max_qty):
            curr_qty = (flt(max_qty) - flt(qty)) * flt(d.conversion_factor)
          else:
            curr_qty = flt(pr_qty)
          
          ord_qty = -flt(curr_qty)
          # update order qty in bin
          bin = get_obj('Warehouse', d.warehouse).update_bin(0, 0, (is_submit and 1 or -1) * flt(ord_qty), 0, 0, d.item_code, self.doc.transaction_date)
        # UPDATE actual qty to warehouse by pr_qty
        self.make_sl_entry(d, d.warehouse, flt(pr_qty), d.valuation_rate, is_submit)
        # UPDATE actual to rejected warehouse by rejected qty
        if d.rejected_qty:
          self.make_sl_entry(d, self.doc.rejected_warehouse, flt(d.rejected_qty) * flt(d.conversion_factor), d.valuation_rate, is_submit)

    self.bk_flush_supp_wh(is_submit)
    
    if self.values:
      get_obj('Stock Ledger', 'Stock Ledger').update_stock(self.values)

  # make Stock Entry
  def make_sl_entry(self, d, wh, qty, in_value, is_submit):
    
    self.values.append({
      'item_code'           : d.fields.has_key('item_code') and d.item_code or d.rm_item_code,
      'warehouse'           : wh,
      'transaction_date'    : self.doc.transaction_date,
      'posting_date'        : self.doc.posting_date,
      'posting_time'        : self.doc.posting_time,
      'voucher_type'        : 'Purchase Receipt',
      'voucher_no'          : self.doc.name,
      'voucher_detail_no'   : d.name, 
      'actual_qty'          : qty, 
      'stock_uom'           : d.stock_uom,
      'incoming_rate'       : in_value,
      'company'             : self.doc.company,
      'fiscal_year'         : self.doc.fiscal_year,
      'is_cancelled'        : (is_submit==1) and 'No' or 'Yes'
    })

  def validate_inspection(self):
    for d in getlist(self.doclist, 'purchase_receipt_details'):     #Enter inspection date for all items that require inspection
      ins_reqd = sql("select inspection_required from `tabItem` where name = %s", (d.item_code), as_dict = 1)
      ins_reqd = ins_reqd and ins_reqd[0]['inspection_required'] or 'No'        
      if ((ins_reqd == 'Yes') and (d.qc != 'No')):
        d.qc = 'Yes'
        if not d.inspection_date:
          msgprint("Item: " + d.item_code + " requires Inspection to completed before acceptance of material. Please Enter Inspection Date")
          raise Exception

  # Check for Stopped status 
  def check_for_stopped_status(self, pc_obj):
    check_list =[]
    for d in getlist(self.doclist, 'purchase_receipt_details'):
      if d.fields.has_key('prevdoc_docname') and d.prevdoc_docname and d.prevdoc_docname not in check_list:
        check_list.append(d.prevdoc_docname)
        pc_obj.check_for_stopped_status( d.prevdoc_doctype, d.prevdoc_docname)
  
  # On Submit        
  def on_submit(self):
    # Check for Approving Authority
    get_obj('Authorization Control').validate_approving_authority(self.doc.doctype, self.doc.net_total)

    # Set status as Submitted
    set(self.doc,'status', 'Submitted')
    pc_obj = get_obj('Purchase Common')
        
    # Step 1 :=> Validate Inspection
    self.validate_inspection()

    # Step 2 :=> Update Previous Doc i.e. update pending_qty and Status accordingly
    pc_obj.update_prevdoc_detail(self, is_submit = 1)
        
    # Step 3 :=> Update Stock 
    self.update_stock(is_submit = 1)
    
    # Step 4 :=> Create Serial Record
    self.create_serial_record()
    
    # Step 5 :=>Update last purchase rate 
    pc_obj.update_last_purchase_rate(self, 1)
    
  # create Serial no
  def create_serial_record(self):
    import datetime
    for d in getlist(self.doclist, 'purchase_receipt_details'):
      if d.serial_no:
        asset = sql("select make, label from tabItem where name = %s", (d.item_code), as_dict = 1)
        serial_nos = cstr(d.serial_no).split(',')
        count = 0
        for s in serial_nos:
          if s:
            count += 1
        if not count == flt(d.qty):
          msgprint("Please enter serial nos for all "+ cstr(d.qty) + " quantity")
          raise Exception
        for a in serial_nos:
          if a:
            exists = sql("select name, status from `tabSerial No` where name = '%s' " % (a))
            if exists and exists[0][1] != 'Not in Use':
              msgprint("Serial No: "+ a + " already exist into the system")
              raise Exception
            elif exists and exists[0][1] == 'Not in Use':
              sql("update `tabSerial No` set status = 'In Store',pr_no = '%s' where name = '%s'" % (cstr(self.doc.name), cstr(d.item_code)))
            else:
              serial = Document('Serial No')
              serial.serial_no = a
              serial.purchase_date = self.doc.transaction_date
              serial.purchase_rate = d.purchase_rate
              serial.item_code = d.item_code
              serial.status = 'In Store'
              serial.pr_no = self.doc.name
              serial.status = 'In Store'
              if asset:
                serial.label = asset[0]['label']
                serial.make = asset[0]['make']
              serial.save(1)


  #On Cancel
  #----------------------------------------------------------------------------------------------------

  def check_next_docstatus(self):
    submit_rv = sql("select t1.name from `tabPayable Voucher` t1,`tabPV Detail` t2 where t1.name = t2.parent and t2.purchase_receipt = '%s' and t1.docstatus = 1" % (self.doc.name))
    if submit_rv:
      msgprint("Payable Voucher : " + cstr(self.submit_rv[0][0]) + " has already been submitted !")
      raise Exception , "Validation Error."

  def cancel_serial_no(self):
    sql("update `tabSerial No` set is_cancelled = 'Yes' where pr_no = '%s' " % cstr(self.doc.name))
  
  def on_cancel(self):
    pc_obj = get_obj('Purchase Common')
    
    self.check_for_stopped_status(pc_obj)
    # 1.Check if Payable Voucher has been submitted against current Purchase Order
    #pc_obj.check_docstatus(check = 'Next', doctype = 'Payable Voucher', docname = self.doc.name, detail_doctype = 'PV Detail')
    
    submitted = sql("select t1.name from `tabPayable Voucher` t1,`tabPV Detail` t2 where t1.name = t2.parent and t2.purchase_receipt = '%s' and t1.docstatus = 1" % self.doc.name)
    if submitted:
      msgprint("Payable Voucher : " + cstr(submitted[0][0]) + " has already been submitted !")
      raise Exception

    # 2.Set Status as Cancelled
    set(self.doc,'status','Cancelled')
    
    # 3.Update Bin  
    self.update_stock(is_submit = 0)
    
    # 4.Update Indents Pending Qty and accordingly it's Status 
    pc_obj.update_prevdoc_detail(self, is_submit = 0)

    # 5. Cancel Serial No   
    self.cancel_serial_no()

    # 6. Update last purchase rate 
    pc_obj.update_last_purchase_rate(self, 0)
        
#----------- code for Sub-contracted Items -------------------
  #--------check for sub-contracted items and accordingly update PR raw material detail table--------
#----------- code for Sub-contracted Items -------------------
  #--------check for sub-contracted items and accordingly update PR raw material detail table--------
  def update_rw_material_detail(self):
  
    for d in getlist(self.doclist,'purchase_receipt_details'):
      item_det = sql("select is_sub_contracted_item, is_purchase_item from `tabItem` where name = '%s'"%(d.item_code))
      
      if item_det[0][0] == 'Yes':
        if item_det[0][1] == 'Yes':
          if not self.doc.is_subcontracted:
            msgprint("Please enter whether purchase receipt to be made for subcontracting or for purchase in 'Is Subcontracted' field .")
            raise Exception
          if self.doc.is_subcontracted == 'Yes':
            if not self.doc.supplier_warehouse:
              msgprint("Please Enter Supplier Warehouse for subcontracted Items")
              raise Exception         
            self.add_bom(d)
          else:
            self.doc.clear_table(self.doclist,'pr_raw_material_details',1)
            self.doc.save()
        elif item_det[0][1] == 'No':
          if not self.doc.supplier_warehouse:
            msgprint("Please Enter Supplier Warehouse for subcontracted Items")
            raise Exception
          self.add_bom(d)
        
      self.delete_irrelevant_raw_material()
      #---------------calculate amt in  PR Raw Material Detail-------------
      self.calculate_amount(d)

      
  def add_bom(self, d):
    #----- fetching default bom from Bill of Materials instead of Item Master --
    bom_det = sql("select t1.item, t2.item_code, t2.qty_consumed_per_unit, t2.moving_avg_rate, t2.value_as_per_mar, t2.stock_uom, t2.name, t2.description from `tabBill Of Materials` t1, `tabBOM Material` t2 where t2.parent = t1.name and t1.item = '%s' and ifnull(t1.is_default,0) = 1" % d.item_code)
    if not bom_det:
      msgprint("No default BOM exists for item: %s" % d.item_code)
      raise Exception
    else:
      #-------------- add child function--------------------
      chgd_rqd_qty = []
      for i in bom_det:
        
        if i and not sql("select name from `tabPR Raw Material Detail` where reference_name = '%s' and bom_detail_no = '%s' and parent = '%s' " %(d.name, i[6], self.doc.name)):

          rm_child = addchild(self.doc, 'pr_raw_material_details', 'PR Raw Material Detail', 1, self.doclist)

          rm_child.reference_name = d.name
          rm_child.bom_detail_no = i and i[6] or ''
          rm_child.main_item_code = i and i[0] or ''
          rm_child.rm_item_code = i and i[1] or ''
          rm_child.description = i and i[7] or ''
          rm_child.stock_uom = i and i[5] or ''
          rm_child.rate = i and flt(i[3]) or flt(i[4])
          rm_child.conversion_factor = d.conversion_factor
          rm_child.required_qty = flt(i  and flt(i[2]) or 0) * flt(d.qty) * flt(d.conversion_factor)
          rm_child.consumed_qty = flt(i  and flt(i[2]) or 0) * flt(d.qty) * flt(d.conversion_factor)
          rm_child.amount = flt(flt(rm_child.consumed_qty)*flt(rm_child.rate))
          rm_child.save()
          chgd_rqd_qty.append(cstr(i[1]))
        else:
          act_qty = flt(i  and flt(i[2]) or 0) * flt(d.qty) * flt(d.conversion_factor)
          for pr_rmd in getlist(self.doclist, 'pr_raw_material_details'):
            if i and i[6] == pr_rmd.bom_detail_no and (flt(act_qty) != flt(pr_rmd.required_qty) or i[1] != pr_rmd.rm_item_code or i[7] != pr_rmd.description):
              chgd_rqd_qty.append(cstr(i[1]))
              pr_rmd.main_item_code = i[0]
              pr_rmd.rm_item_code = i[1]
              pr_rmd.description = i[7]
              pr_rmd.stock_uom = i[5]
              pr_rmd.required_qty = flt(act_qty)
              pr_rmd.consumed_qty = flt(act_qty)
              pr_rmd.rate = i and flt(i[3]) or flt(i[4])
              pr_rmd.amount = flt(flt(pr_rmd.consumed_qty)*flt(pr_rmd.rate))
              pr_rmd.save()
      if chgd_rqd_qty:
        msgprint("Please check consumed quantity for Raw Material Item Code: '%s'in Raw materials Detail Table" % ((len(chgd_rqd_qty) > 1 and ','.join(chgd_rqd_qty[:-1]) +' and ' + cstr(chgd_rqd_qty[-1:][0]) ) or cstr(chgd_rqd_qty[0])))
              

  # Delete irrelevant raw material from PR Raw material details
  #--------------------------------------------------------------  
  def delete_irrelevant_raw_material(self):
    for d in getlist(self.doclist,'pr_raw_material_details'):
      if not sql("select name from `tabPurchase Receipt Detail` where name = '%s' and parent = '%s'" % (d.reference_name, self.doc.name)):
        d.parent = 'old_par:'+self.doc.name
        d.save()
    
  def calculate_amount(self, d):
    amt = 0
    for i in getlist(self.doclist,'pr_raw_material_details'):
      
      if(i.reference_name == d.name):
        #if i.consumed_qty == 0:
         # msgprint("consumed qty cannot be 0. Please Enter consumed qty ")
          #raise Exception
        i.amount = flt(i.consumed_qty)* flt(i.rate)
        amt += i.amount
    d.rm_supp_cost = amt
    d.save()
    

  # --------------- Back Flush function called on submit and on cancel from update stock
  def bk_flush_supp_wh(self, is_submit):
    for d in getlist(self.doclist, 'pr_raw_material_details'):
      #--------- -ve quantity is passed as raw material qty has to be decreased when PR is submitted and it has to be increased when PR is cancelled
      consumed_qty = - flt(d.consumed_qty)
      self.make_sl_entry(d, self.doc.supplier_warehouse, flt(consumed_qty), 0, is_submit)