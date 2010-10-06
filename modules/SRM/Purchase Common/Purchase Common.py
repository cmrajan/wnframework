class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist

    self.chk_tol_for_list = ['Indent - Purchase Order', 'Purchase Order - Purchase Receipt', 'Purchase Order - Payable Voucher']

    self.update_qty = {'Indent - Purchase Order'            : 'ordered_qty',
                       'Purchase Order - Purchase Receipt'  : 'received_qty',
                       'Purchase Order - Payable Voucher'   : 'billed_qty',
                       'Purchase Receipt - Payable Voucher' : 'billed_qty'}

    self.update_percent_field = {'Indent - Purchase Order'            : 'per_ordered',
                                 'Purchase Order - Purchase Receipt'  : 'per_received',
                                 'Purchase Order - Payable Voucher'   : 'per_billed',
                                 'Purchase Receipt - Payable Voucher' : 'per_billed'}

    # used in validation for items and update_prevdoc_detail
    self.doctype_dict = {'Indent'             : 'Indent Detail',
                         'RFQ'                : 'RFQ Detail',
                         'Supplier Quotation' : 'Supplier Quotation Detail',
                         'Purchase Order'     : 'PO Detail',
                         'Purchase Receipt'   : 'Purchase Receipt Detail'}
  
  def get_default_schedule_date( self, obj):
    for d in getlist( obj.doclist, obj.fname):
      item = sql("select lead_time_days from `tabItem` where name = '%s'" % cstr(d.item_code) , as_dict = 1)
      ltd = item and cint(item[0]['lead_time_days']) or 0
      if ltd and obj.doc.transaction_date:
        if d.fields.has_key('lead_time_date'):
          d.lead_time_date = cstr(add_days( obj.doc.transaction_date, cint(ltd)))
        if not d.fields.has_key('prevdoc_docname') or (d.fields.has_key('prevdoc_docname') and not d.prevdoc_docname):
          d.schedule_date =  cstr( add_days( obj.doc.transaction_date, cint(ltd)))
        
  # Client Trigger functions
  #------------------------------------------------------------------------------------------------

  # Get Supplier Details 
  def get_supplier_details(self, name = ''):
    details = sql("select address from `tabSupplier` where name = '%s'" %(name), as_dict = 1)
    ret = {
      'supplier_address'  :  details and details[0]['address'] or ''
    }
    return cstr(ret)

  # Get Item Details
  def get_item_details( self, obj, arg =''):
    arg = eval(arg)
    item = sql("select item_name,item_group, brand, description, min_order_qty, stock_uom, default_warehouse,lead_time_days, last_purchase_rate from `tabItem` where name = %s", (arg['item_code']), as_dict = 1)
    
    # get warehouse 
    if arg['warehouse']:
      wh = arg['warehouse']
    else:
      wh = item and item[0]['default_warehouse'] or ''
      
    ret = {
      'item_name'          : item and item[0]['item_name'] or '',
      'item_group'         : item and item[0]['item_group'] or '',
      'brand'              : item and item[0]['brand'] or '',
      'description'        : item and item[0]['description'] or '',
      'qty'                : 0,
      'uom'                : item and item[0]['stock_uom'] or '',
      'stock_uom'          : item and item[0]['stock_uom'] or '',
      'conversion_factor'  : '1',
      'warehouse'          : wh
    }
    
    # get min_order_qty from item
    if obj.doc.doctype in ['Indent','RFQ']:
      ret['min_order_qty'] = item and flt(item[0]['min_order_qty']) or 0
    
    # get projected qty from bin
    if ret['warehouse']:
      bin = sql("select projected_qty from `tabBin` where item_code = %s and warehouse = %s", (arg['item_code'], ret['warehouse']), as_dict=1)
      ret['projected_qty'] = bin and flt(bin[0]['projected_qty']) or 0

    # get schedule date, lead time date
    if obj.doc.transaction_date and item and item[0]['lead_time_days']:
      ret['schedule_date'] =  cstr(add_days(obj.doc.transaction_date, cint(item[0]['lead_time_days'])))
      ret['lead_time_date'] = cstr(add_days(obj.doc.transaction_date, cint(item[0]['lead_time_days'])))
    
    #  get last purchase rate as per stock uom and default currency for following list of doctypes
    if obj.doc.doctype in ['Supplier Quotation', 'Purchase Order', 'Purchase Receipt']:
      ret['purchase_rate'] = item and flt(item[0]['last_purchase_rate']) or 0
      ret['import_rate'] = flt(item and flt(item[0]['last_purchase_rate']) or 0) / flt(obj.doc.fields.has_key('conversion_rate') and flt(obj.doc.conversion_rate) or 1)
    
    return cstr(ret)

  # Get UOM Details
  def get_uom_details(self, arg = ''):
    arg = eval(arg)
    lpr = sql("select last_purchase_rate from `tabItem` where name = %s", arg['item_code'], as_dict =1)
    uom = sql("select conversion_factor from `tabUOM Conversion Detail` where parent = %s and uom = %s", (arg['item_code'],arg['uom']), as_dict = 1)
    ret = {
      'conversion_factor' : uom and flt(uom[0]['conversion_factor']) or 0,
      'qty'         : flt(arg['stock_qty']) / flt(uom and flt(uom[0]['conversion_factor']) or 0),
      'purchase_rate'     : (lpr and flt(lpr[0]['last_purchase_rate']) * flt(uom and flt(uom[0]['conversion_factor']) or 0)) or 0,
      }
    return str(ret)

  # get last purchase rate
  def get_last_purchase_rate( self, obj):
    for d in getlist(obj.doclist, obj.fname):
      if d.item_code:
        rate = sql("select purchase_rate,last_purchase_rate from `tabItem` where name = '%s'"% cstr(d.item_code), as_dict = 1 )
        if rate and rate[0]:
          # as last_purchase_rate is as per stock uom, so purchase_rate = last_purchase_rate * conversion_factor
          d.purchase_rate =  rate and flt(rate[0]['last_purchase_rate']) * flt(d.conversion_factor) or rate and flt(rate[0]['purchase_rate']) * flt(d.conversion_factor)or 0
        else:
          msgprint("%s has no Last Purchase Rate."% d.item_code)

  # validation
  # -------------------------------------------------------------------------------------------------------
  
  # validate fields
  def validate_mandatory(self, obj):
    # check amendment date
    if obj.doc.amended_from and not obj.doc.amendment_date:
      msgprint("Please enter amendment date")
      raise Exception

  # validate for same items and  validate is_stock_item , is_purchase_item also validate uom and conversion factor
  def validate_for_items(self, obj):
    check_list=[]
    for d in getlist( obj.doclist, obj.fname):
      # validation for valid qty  
      if flt(d.qty) < 0 or (d.parenttype != 'Purchase Receipt' and not flt(d.qty)):
        msgprint("Please enter valid qty for item %s" % cstr(d.item_code))
        raise Exception
      
      # udpate with latest quantities
      bin = sql("select projected_qty from `tabBin` where item_code = %s and warehouse = %s", (d.item_code, d.warehouse), as_dict = 1)
      
      f_lst ={'projected_qty': bin and flt(bin[0]['projected_qty']) or 0, 'ordered_qty': 0, 'received_qty' : 0, 'billed_qty': 0}
      if d.doctype == 'Purchase Receipt Detail':
        f_lst.pop('received_qty')
      for x in f_lst :
        if d.fields.has_key(x):
          d.fields[x] = f_lst[x]

      item = sql("select is_stock_item, is_purchase_item, is_active from tabItem where name=%s", d.item_code)
      if not item:
        msgprint("Item %s does not exist in Item Master." % cstr(d.item_code))
        raise Exception
      
      # validate stock item
      if item[0][0]=='Yes':
        if not d.warehouse:
          msgprint("Warehouse is mandatory for %s, since it is a stock item" % d.item_code)
          raise Exception
   
      # validate purchase item
      if not item[0][1]=='Yes':
        msgprint("Item %s is not purchase item." % (d.item_code))
        raise Exception
        
      # validate active item
      if not item[0][2]=='Yes':
        msgprint("Item %s is Inactive." % (d.item_code))
        raise Exception  

      # validate uom and conversion factor
      if d.fields.has_key('uom'):
        con_fact = sql("select conversion_factor from `tabUOM Conversion Detail` where parent = %s and uom = %s", (d.item_code,d.uom), as_dict = 1)
        if not con_fact:
          msgprint("There is no conversion factor for UOM : " +cstr(d.uom) +" in Item : " + cstr(d.item_code))
          raise Exception
      
      if d.fields.has_key('prevdoc_docname') and d.prevdoc_docname:
        # check warehouse, uom  in previous doc and in current doc are same.
        data = sql("select item_code, warehouse, uom from `tab%s` where name = '%s'" % ( self.doctype_dict[d.prevdoc_doctype], d.prevdoc_detail_docname), as_dict = 1)
       
        if not data:
          msgprint("Please fetch data in Row " + cstr(d.idx) + " once again or please contact Administrator.")
          raise Exception

        # Check if Item Code has been modified.
        if not cstr(data[0]['item_code']) == cstr(d.item_code):
          msgprint("Please check Item %s is not present in %s %s ." % (d.item_code, d.prevdoc_doctype, d.prevdoc_docname))
          raise Exception

        # Check if Warehouse has been modified.
        if not cstr(data[0]['warehouse']) == cstr(d.warehouse):
          msgprint("Please check warehouse %s of Item %s which is not present in %s %s ." % (d.warehouse, d.item_code, d.prevdoc_doctype, d.prevdoc_docname))
          raise Exception

        #  Check if UOM has been modified.
        if not cstr(data[0]['uom']) == cstr(d.uom) and not cstr(d.prevdoc_doctype) == 'Indent':
          msgprint("Please check UOM %s of Item %s which is not present in %s %s ." % (d.uom, d.item_code, d.prevdoc_doctype, d.prevdoc_docname))
          raise Exception

      # list criteria that should not repeat
      e = [d.schedule_date, d.item_code, d.warehouse, d.uom, d.fields.has_key('prevdoc_docname') and d.prevdoc_docname or '', d.fields.has_key('prevdoc_detail_docname') and d.prevdoc_detail_docname or '']
      
      # check for same items
      if e in check_list:
        msgprint("Item %s has been entered more than once with same schedule date, warehouse and uom." % d.item_code)
        raise Exception
      else:
        check_list.append(e)

  # validate conversion rate
  def validate_conversion_rate(self, obj):
    default_currency = get_obj('Manage Account').doc.default_currency
    if not default_currency:
      msgprint('Message: Please enter default currency in Manage Account')
      raise Exception
    
    if (obj.doc.currency == default_currency and flt(obj.doc.conversion_rate) != 1.00) or not obj.doc.conversion_rate or (obj.doc.currency != default_currency and flt(obj.doc.conversion_rate) == 1.00):
      msgprint("Message: Please Enter Appropriate Conversion Rate.")
      raise Exception

  def validate_doc(self, obj, prevdoc_doctype, prevdoc_docname):
    if prevdoc_docname :
      get_name = sql("select name from `tab%s` where name = '%s'" % (prevdoc_doctype, prevdoc_docname))
      name = get_name and get_name[0][0] or ''
      if name:  #check for incorrect docname
        dt = sql("select company, docstatus from `tab%s` where name = '%s'" % (prevdoc_doctype, name))
        company_name = dt and cstr(dt[0][0]) or ''
        docstatus = dt and dt[0][1] or 0
        
        # check for docstatus 
        if (docstatus != 1):
          msgprint(cstr(prevdoc_doctype) + ": " + cstr(prevdoc_docname) + " is not Submitted Document.")
          raise Exception

        # check for company
        if (company_name != obj.doc.company):
          msgprint(cstr(prevdoc_doctype) + ": " + cstr(prevdoc_docname) + " does not belong to the Company: " + cstr(obj.doc.company))
          raise Exception

        if prevdoc_doctype in ['Supplier Quotation','Purchase Order', 'Purchase Receipt']:
          dt = sql("select supplier, currency from `tab%s` where name = '%s'" % (prevdoc_doctype, name))
          supplier = dt and dt[0][0] or ''
          currency = dt and dt[0][1] or ''
            
          # check for supplier
          if (supplier != obj.doc.supplier):
            msgprint("Purchase Order: " + cstr(d.prevdoc_docname) + " supplier :" + cstr(supplier) + " does not match with supplier of current document.")
            raise Exception
           
          # check for curency
          if (currency != obj.doc.currency):
            msgprint("Purchase Order: " + cstr(d.prevdoc_docname) + " currency :" + cstr(currency) + " does not match with currency of current document.")
            raise Exception

      else: # if not name than
        msgprint(cstr(prevdoc_doctype) + ": " + cstr(prevdoc_docname) + " is not a valid " + cstr(prevdoc_doctype))
        raise Exception
        

# Validate values with reference document
  #---------------------------------------
  def validate_reference_value(self, obj):
    ref_doc = []
    for d in getlist(obj.doclist, obj.fname):
      if d.prevdoc_doctype and d.prevdoc_docname and d.prevdoc_doctype not in ref_doc:
        mapper_name = d.prevdoc_doctype + '-' + obj.doc.doctype
        get_obj('DocType Mapper', mapper_name, with_children = 1).validate_reference_value(obj, obj.doc.name)
        ref_doc.append(d.prevdoc_doctype)


  # Check for Stopped status 
  def check_for_stopped_status(self, doctype, docname):
    stopped = sql("select name from `tab%s` where name = '%s' and status = 'Stopped'" % ( doctype, docname))
    if stopped:
      msgprint("One cannot do any transaction against %s : %s, it's status is 'Stopped'" % ( doctype, docname))
      raise Exception
      
  # Check Docstatus of Next DocType on Cancel AND of Previous DocType on Submit
  def check_docstatus(self, check, doctype, docname , detail_doctype = ''):
    
    if check == 'Next':
      # Convention := doctype => Next Doctype, docname = current_docname , detail_doctype = Next Doctype Detail Table

      submitted = sql("select t1.name from `tab%s` t1,`tab%s` t2 where t1.name = t2.parent and t2.prevdoc_docname = '%s' and t1.docstatus = 1" % ( doctype, detail_doctype, docname))
      if submitted:
        msgprint(cstr(doctype) + " : " + cstr(submitted[0][0]) + " has already been submitted !")
        raise Exception

    if check == 'Previous':
      # Convention := doctype => Previous Doctype, docname = Previous Docname 
      submitted = sql("select name from `tab%s` where docstatus = 1 and name = '%s'" % (doctype, docname))
      if not submitted:
        msgprint(cstr(doctype) + " : " + cstr(submitted[0][0]) + " not submitted !")
        raise Exception
        
  # Update Ref Doc
  # =======================================================
  def get_qty(self,curr_doctype,ref_tab_fname,ref_tab_dn,ref_doc_tname, transaction, curr_parent_name):
    # Get total Quantities of current doctype (eg. PR) except for qty of this transaction
    #------------------------------
    # please check as UOM changes from Indent - Purchase Order ,so doing following else uom should be same .
    # i.e. in PO uom is NOS then in PR uom should be NOS
    # but if in Indent uom KG it can change in PO
    
    get_qty = (transaction == 'Indent - Purchase Order') and 'qty * conversion_factor' or 'qty'
    
    qty = sql("select sum(%s) from `tab%s` where %s = '%s' and docstatus = 1 and parent != '%s' and parent not like 'old%%'" % ( get_qty, curr_doctype, ref_tab_fname, ref_tab_dn, curr_parent_name))
    qty = qty and flt(qty[0][0]) or 0 
    
    # get total qty of ref doctype
    #--------------------
    max_qty = sql("select qty from `tab%s` where name = '%s' and docstatus = 1"% (ref_doc_tname, ref_tab_dn))
    max_qty = max_qty and flt(max_qty[0][0]) or 0
    
    return cstr(qty)+'~~~'+cstr(max_qty)  



  def update_refdoc_qty(self, curr_qty, curr_doctype, ref_dn, ref_dt, ref_tab_fname, ref_tab_dn, transaction, item_code, is_submit, curr_parent_doctype, curr_parent_name):
    # Get Quantity
    #------------------------------
    curr_ref_qty = self.get_qty(curr_doctype,ref_tab_fname,ref_tab_dn,self.doctype_dict[ref_dt], transaction, curr_parent_name)
    qty, max_qty, max_qty_plus_tol = flt(curr_ref_qty.split('~~~')[0]), flt(curr_ref_qty.split('~~~')[1]), flt(curr_ref_qty.split('~~~')[1])

    # Qty above Tolerance should be allowed only once.
    # But there is special case for Transaction 'Indent-Purhcase Order' that there should be no restriction
    # One can create any no. of PO against same Indent!!!
    
    if qty >= max_qty and is_submit:
      reason = (curr_parent_doctype == 'Purchase Order') and 'Ordered' or (curr_parent_doctype == 'Purchase Receipt') and 'Received' or (curr_parent_doctype == 'Payable Voucher') and 'Billed'
      msgprint("Error: Item Code : '%s' of '%s' is already %s." %(item_code,ref_dn,reason))
      raise Exception
    
    tolerance = flt(get_value('Manage Account',None,'tolerance') or 0)

    if is_submit:
      qty = qty + flt(curr_qty)
      
      # Calculate max_qty_plus_tol i.e. max_qty with tolerance 
      #-----------------------------------------------------------------
      if transaction in self.chk_tol_for_list:
        max_qty_plus_tol = max_qty * (1 + (flt(tolerance)/ 100))

        if max_qty_plus_tol < qty:
          reason = (curr_parent_doctype == 'Purchase Order') and 'Ordered' or (curr_parent_doctype == 'Purchase Receipt') and 'Received' or (curr_parent_doctype == 'Payable Voucher') and 'Billed'
          msgprint("error:Already %s Qty for %s is %s and maximum allowed Qty is %s" % (cstr(reason), item_code, cstr(flt(qty) - flt(curr_qty)) , cstr(max_qty_plus_tol)))
          raise Exception

    # Update qty
    #------------------
    sql("update `tab%s` set %s = '%s',modified = now() where name = '%s'" % (self.doctype_dict[ref_dt],self.update_qty[transaction] , flt(qty), ref_tab_dn))
    
  def update_ref_doctype_dict(self, curr_qty, curr_doctype, ref_dn, ref_dt, ref_tab_fname, ref_tab_dn, transaction, item_code, is_submit, curr_parent_doctype, curr_parent_name):
    # update qty 
    self.update_refdoc_qty( curr_qty, curr_doctype, ref_dn, ref_dt, ref_tab_fname, ref_tab_dn, transaction, item_code, is_submit, curr_parent_doctype, curr_parent_name)
    
    # append distinct ref_dn in doctype_dict
    if not self.ref_doctype_dict.has_key(ref_dn) and self.update_percent_field.has_key(transaction):
      self.ref_doctype_dict[ref_dn] = [ ref_dt, self.doctype_dict[ref_dt],transaction]


  # update prevdoc detail
  # --------------------
  def update_prevdoc_detail(self, obj, is_submit):
    import math
    self.ref_doctype_dict= {}
    for d in getlist(obj.doclist, obj.fname):
      
      if d.fields.has_key('prevdoc_docname') and d.prevdoc_docname:
        transaction = cstr(d.prevdoc_doctype) + ' - ' + cstr(obj.doc.doctype)
        curr_qty = (transaction == 'Indent - Purchase Order') and flt(d.qty) * flt(d.conversion_factor) or flt(d.qty)
        self.update_ref_doctype_dict( flt(curr_qty), d.doctype, d.prevdoc_docname, d.prevdoc_doctype, 'prevdoc_detail_docname', d.prevdoc_detail_docname, transaction, d.item_code, is_submit, obj.doc.doctype, obj.doc.name)
      
      # for payable voucher
      if d.fields.has_key('purchase_order') and d.purchase_order:
        curr_qty = sql("select sum(qty) from `tabPV Detail` where po_detail = '%s' and parent = '%s'" % (cstr(d.po_detail), cstr(obj.doc.name)))
        curr_qty = curr_qty and flt(curr_qty[0][0]) or 0
        self.update_ref_doctype_dict( curr_qty, d.doctype, d.purchase_order, 'Purchase Order', 'po_detail', d.po_detail, 'Purchase Order - ' + cstr(obj.doc.doctype), d.item_code, is_submit,  obj.doc.doctype, obj.doc.name)

      if d.fields.has_key('purchase_receipt') and d.purchase_receipt:
         self.update_ref_doctype_dict( flt(d.qty), d.doctype, d.purchase_receipt, 'Purchase Receipt', 'pr_detail', d.pr_detail, 'Purchase Receipt - ' + cstr(obj.doc.doctype), d.item_code, is_submit,  obj.doc.doctype, obj.doc.name)
      
    for ref_dn in self.ref_doctype_dict:
      # Calculate percentage
      #----------------------
      ref_doc_obj = get_obj(self.ref_doctype_dict[ref_dn][0],ref_dn,with_children = 1)
      count = 0
      percent = 0
      for d in getlist(ref_doc_obj.doclist,ref_doc_obj.fname):
        ref_qty = d.fields[self.update_qty[self.ref_doctype_dict[ref_dn][2]]]
        if flt(d.qty) - flt(ref_qty) <= 0:
          percent += 100
        else:
          percent += (flt(ref_qty)/flt(d.qty) * 100)
        count += 1
      percent_complete = math.floor(flt(percent)/ flt(count))
      
      # update percent complete and modified
      #-------------------------------------
      sql("update `tab%s` set %s = '%s', modified = '%s' where name = '%s'" % (self.ref_doctype_dict[ref_dn][0], self.update_percent_field[self.ref_doctype_dict[ref_dn][2]], percent_complete, obj.doc.modified, ref_dn))

  #update last purchse rate
  #------------------------------
  def update_last_purchase_rate(self, obj, is_submit):
    for d in getlist(obj.doclist,obj.fname):
      # get last purchase rate from Purchase Order
      po_lpr = sql ("select t2.purchase_rate/t2.conversion_factor as rate, t1.transaction_date as date from `tabPurchase Order` t1, `tabPO Detail` t2  where t1.name = t2.parent and t2.item_code = '%s' and t1.docstatus = 1 and t1.name != '%s' order by t1.transaction_date DESC limit 1"% (d.item_code, obj.doc.name), as_dict = 1 )
      # get last purchase rate from purchase receipt
      pr_lpr = sql ("select t2.purchase_rate/t2.conversion_factor as rate, t1.posting_date as date, t1.posting_time from `tabPurchase Receipt` t1, `tabPurchase Receipt Detail` t2  where t1.name = t2.parent and t2.item_code = '%s' and t1.docstatus = 1  and t1.name != '%s' order by t1.posting_date DESC, t1.posting_time DESC limit 1"% (d.item_code, obj.doc.name), as_dict = 1 )
      # compare dates of Po & Pr
      date_diff1  = sql("select DATEDIFF('%s', '%s')" % ( po_lpr and po_lpr[0]['date'] or '0000-00-00', pr_lpr and pr_lpr[0]['date'] or '0000-00-00'))

      if flt(date_diff1[0][0]) == 0  or flt(date_diff1[0][0]) < 0:  lpr = [pr_lpr and pr_lpr[0]['rate'] or 0, pr_lpr and pr_lpr[0]['date'] or '0000-00-00', 'Purchase Receipt'] 
      elif flt(date_diff1[0][0]) > 0 : lpr = [po_lpr and po_lpr[0]['rate'] or 0, po_lpr and po_lpr[0]['date'] or '0000-00-00', 'Purchase Order']

      # compare dates of above lpr and current doctype
      date_diff2  = sql("select DATEDIFF('%s', '%s')" % ( lpr[1], (obj.doc.doctype  == 'Purchase Order') and obj.doc.transaction_date or obj.doc.posting_date ))

      if is_submit == 1 and flt(date_diff2[0][0]) == 0 or flt(date_diff2[0][0]) < 0: lpr = [flt(d.purchase_rate) / flt(d.conversion_factor)]

      # update last purchsae rate
      sql("update `tabItem` set last_purchase_rate = '%s' where name = '%s'" % (flt(lpr[0]),d.item_code))
      
  def validate_fiscal_year(self,fiscal_year,transaction_date,dn):
    fy=sql("select year_start_date from `tabFiscal Year` where name='%s'"%fiscal_year)
    ysd=fy and fy[0][0] or ""
    yed=add_days(str(ysd),365)    
    if str(transaction_date) < str(ysd) or str(transaction_date) > str(yed):
      msgprint("'%s' Not Within The Fiscal Year"%(dn))
      raise Exception      
