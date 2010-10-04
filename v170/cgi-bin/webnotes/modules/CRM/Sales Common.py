class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d,dl
    self.chk_tol_for_list = ['Sales Order - Delivery Note', 'Sales Order - Receivable Voucher']

    self.update_qty = {'Sales Order - Delivery Note'  : 'delivered_qty',
                       'Sales Order - Receivable Voucher'   : 'billed_qty',
                       'Delivery Note - Receivable Voucher' : 'billed_qty',
                       'Delivery Note - Installation Note' : 'installed_qty'}

    self.update_percent_field = {'Sales Order - Delivery Note'  : 'per_delivered',
                                 'Sales Order - Receivable Voucher'   : 'per_billed',
                                 'Delivery Note - Receivable Voucher' : 'per_billed',
                                 'Delivery Note - Installation Note' : 'per_installed'}

    self.doctype_dict = {'Sales Order'     : 'Sales Order Detail',
                         'Delivery Note'   : 'Delivery Note Detail',
                         'Installation Note' : 'Installed Item Details'}
                         
    self.ref_doctype_dict= {}
    
  
  # Get Customer Details along with its primary contact details
  # ==============================================================
  def get_customer_details(self, name = ''):
    details = sql("select address, zone, territory, customer_group, mobile_1 from `tabCustomer` where name = '%s'" %(name), as_dict = 1)
    ret = {
      'customer_address'  :  details and details[0]['address'] or '',
      'delivery_address'  :  details and details[0]['address'] or '',
      'zone'              :  details and details[0]['zone'] or '',
      'territory'         :  details and details[0]['territory'] or '',
      'customer_group'    :  details and details[0]['customer_group'] or '',
      'customer_mobile_no':  details and details[0]['mobile_1'] or ''
    }
    # ********** get primary contact details (this is done separately coz. , in case there is no primary contact thn it would not be able to fetch customer details in case of join query)
    contact_det = sql("select contact_name, contact_no, email_id from `tabContact` where customer_name = '%s' and is_customer = 1 and is_primary_contact = 'Yes'" %(name), as_dict = 1)
    ret['contact_person'] = contact_det and contact_det[0]['contact_name'] or ''
    ret['contact_no']     = contact_det and contact_det[0]['contact_no'] or ''
    ret['email_id']       = contact_det and contact_det[0]['email_id'] or ''
    
    return cstr(ret)
  
  
  # Get customer's contact person details
  # ==============================================================
  def get_contact_details(self, arg):
    arg = eval(arg)
    contact = sql("select contact_no, email_id from `tabContact` where contact_name = '%s' and customer_name = '%s'" %(arg['contact_person'],arg['customer']), as_dict = 1)
    ret = {
      'contact_no'       :    contact and contact[0]['contact_no'] or '',
      'email_id'         :    contact and contact[0]['email_id'] or ''
    }
    return str(ret)

    
  # Get Item Details
  # ===============================================================
  def get_item_details(self, item_code, obj):
    if not obj.doc.price_list_name:
      msgprint("Please Select Price List before selecting Items")
      raise Exception
    item = sql("select description, item_name, brand, item_group, stock_uom from `tabItem` where name = '%s'" %(item_code), as_dict=1)
    tax = sql("select tax_type, tax_rate from `tabItem Tax` where parent = %s" , item_code)
    t = {}
    for x in tax: t[x[0]] = flt(x[1])
    ret = {
      'description'        : item and item[0]['description'] or '',
      'item_group'         : item and item[0]['item_group'] or '',
      'item_name'          : item and item[0]['item_name'] or '',
      'brand'              : item and item[0]['brand'] or '',
      'stock_uom'          : item and item[0]['stock_uom'] or '',
      'qty'                : 0,   # this is done coz if item once fetched is fetched again thn its qty shld be reset to 0
      'adj_rate'           : 0,
      'amount'             : 0,
      'export_amount'      : 0,
      'item_tax_rate'      : str(t)
    }
    if(obj.doc.price_list_name):  #this is done to fetch the changed BASIC RATE and REF RATE based on PRICE LIST
      ref_rate =  self.get_ref_rate(item_code, obj.doc.price_list_name, obj.doc.currency)
      ret['ref_rate'] = flt(ref_rate) * flt(obj.doc.conversion_rate)
      ret['basic_rate'] = flt(ref_rate) * flt(obj.doc.conversion_rate)
      ret['export_rate'] = flt(ref_rate)
    return str(ret)
  
  # ***************** Get Ref rate as entered in Item Master ********************
  def get_ref_rate(self, item_code, price_list_name, currency):
    item_exists = sql("select name from tabItem where name = %s" , item_code)
    item_exists = item_exists and item_exists[0][0] or ''
    ref_rate = sql("select ref_rate from `tabRef Rate Detail` where parent = %s and price_list_name = %s and ref_currency = %s", (item_code, price_list_name, currency))
    rate = ref_rate and ref_rate[0][0] or 0
    if item_exists and not rate:
      msgprint("Please Enter Ref Rate for Price List : '%s' and Currency : '%s' for Item : '%s'"%(price_list_name, currency, item_code))
    return rate
    
  # ****** Re-calculates Basic Rate & amount based on Price List Selected ******
  def get_adj_percent(self, obj): 
    for d in getlist(obj.doclist, obj.fname):
      ref_rate = self.get_ref_rate(d.item_code,obj.doc.price_list_name,obj.doc.currency)
      d.adj_rate = flt(ref_rate)
      d.ref_rate = flt(ref_rate) * flt(obj.doc.conversion_rate)
      d.basic_rate = flt(ref_rate) * flt(obj.doc.conversion_rate)
      d.export_rate = flt(ref_rate)

    
  # Get other charges from Master
  # =================================================================================
  def get_other_charges(self,obj):
    self.doc.clear_table(obj.doclist,'other_charges')
    idx = 0
    other_charge = sql("select charge_type,row_id,description,account_head,rate,tax_amount from `tabRV Tax Detail` where parent = '%s' order by idx" %(obj.doc.charge), as_dict = 1)
    for other in other_charge:
      d =  addchild(obj.doc, 'other_charges', 'RV Tax Detail', 1, obj.doclist)
      d.charge_type = other['charge_type']
      d.row_id = other['row_id']
      d.description = other['description']
      d.account_head = other['account_head']
      d.rate = flt(other['rate'])
      d.tax_amount = flt(other['tax_amount'])
      d.idx = idx
      idx += 1
      
      
  # Get TERMS AND CONDITIONS
  # =======================================================================================
  def get_tc_details(self,obj):
    self.doc.clear_table(obj.doclist,'tc_details')
    idx = 0
    tc_detail = sql("select terms,description from `tabTC Detail` where parent = '%s'" %(obj.doc.tc_name), as_dict = 1)
    for tc in tc_detail:
      d =  addchild(obj.doc, 'tc_details', 'TC Detail', 1, obj.doclist)
      d.terms = tc['terms']
      d.description = tc['description']
      d.idx = idx
      idx += 1
    
#---------------------------------------- Get Tax Details -------------------------------#
  def get_tax_details(self, item_code, obj):
    tax = sql("select tax_type, tax_rate from `tabItem Tax` where parent = %s" , item_code)
    t = {}
    for x in tax: t[x[0]] = flt(x[1])
    ret = {
      'item_tax_rate'    :  tax and str(t) or ''
    }
    return str(ret)

  # Get Serial No Details
  # ==========================================================================
  def get_serial_details(self, serial_no, obj):
    item = sql("select item_code, make, label from `tabSerial No` where name = '%s'" %(serial_no), as_dict=1)
    tax = sql("select tax_type, tax_rate from `tabItem Tax` where parent = %s" , item[0]['item_code'])
    t = {}
    for x in tax: t[x[0]] = flt(x[1])
    ret = {
      'item_code'        : item and item[0]['item_code'] or '',
      'make'                : item and item[0]['make'] or '',
      'label'               : item and item[0]['label'] or '',
      'item_tax_rate'      : str(t)
    }
    return str(ret)
    
  # Get Commission rate
  # =======================================================================
  def get_comm_rate(self, sales_partner, obj):
    comm_rate = sql("select commission_rate from `tabSales Partner` where name = '%s'" %(sales_partner), as_dict=1)
    total_comm = flt(comm_rate[0]['commission_rate']) * flt(obj.doc.net_total) / 100
    ret = {
      'commission_rate'     :  comm_rate and flt(comm_rate[0]['commission_rate']) or 0,
      'total_commission'    :  flt(total_comm)
    }
    return str(ret)

  
  # To verify whether rate entered in details table does not exceed max discount %
  # =======================================================================================
  def validate_max_discount(self,obj, detail_table):
    for d in getlist(obj.doclist, detail_table):
      discount = sql("select max_discount from tabItem where name = '%s'" %(d.item_code),as_dict = 1)
      if discount and discount[0]['max_discount'] and (flt(d.adj_rate)>flt(discount[0]['max_discount'])):
        msgprint("You cannot give more than " + cstr(discount[0]['max_discount']) + " % discount on Item Code : "+cstr(d.item_code))
        raise Exception


  # Get sum of allocated % of sales person (it should be 100%)
  # ========================================================================
  # it indicates % contribution of sales person in sales
  def get_allocated_sum(self,obj):
    sum = 0
    for d in getlist(obj.doclist,'sales_team'):
      sum += flt(d.allocated_percentage)
    if (flt(sum) != 100) and getlist(obj.doclist,'sales_team'):
      msgprint("Total Allocated % of Sales Persons should be 100%")
      raise Exception
      
  # Check Conversion Rate (i.e. it will not allow conversion rate to be 1 for Currency other than default currency set in Manage Account)
  # ===========================================================================
  def check_conversion_rate(self, obj):
    default_currency = get_obj('Manage Account').doc.default_currency
    if (obj.doc.currency == default_currency and flt(obj.doc.conversion_rate) != 1.00) or not obj.doc.conversion_rate or (obj.doc.currency != default_currency and flt(obj.doc.conversion_rate) == 1.00):
      msgprint("Please Enter Appropriate Conversion Rate.")
      raise Exception
  

  # Get Tax rate if account type is TAX
  # =========================================================================
  def get_rate(self, arg):
    arg = eval(arg)
    rate = sql("select account_type, tax_rate from `tabAccount` where name = '%s'" %(arg['account_head']), as_dict=1)

    if arg['charge_type'] == 'Actual' and rate[0]['account_type'] == 'Tax':
      msgprint("You cannot select ACCOUNT HEAD of type TAX as your CHARGE TYPE is 'ACTUAL'")
      ret = {
        'account_head'  :  ''
      }
    elif rate[0]['account_type'] == 'Tax' and not arg['charge_type'] == 'Actual':
      ret = {
        'rate'  :  rate and flt(rate[0]['tax_rate']) or 0
      }
    return cstr(ret)
    

  # Make Packing List from Sales BOM
  # =======================================================================
  def has_sales_bom(self, item_code):
    return sql("select name from `tabSales BOM` where name=%s and is_active='Yes'", item_code)
  
  def get_sales_bom_items(self, item_code):
    return sql("select item_code, qty, uom from `tabSales BOM Detail` where parent=%s", item_code)

  def get_item_list(self, obj, clear):
    il = []
    for d in getlist(obj.doclist,obj.fname):
      reserved_qty = 0    # used  for delivery note
      qty = flt(d.qty)
      if clear:
         qty = flt(d.qty) > flt(d.delivered_qty) and flt(flt(d.qty) - flt(d.delivered_qty)) or 0
        
      # used in delivery note to reduce reserved_qty 
      if d.prevdoc_doctype == 'Sales Order':
        # Eg.: if SO qty is 10 and there is tolerance of 20%, then it will allow DN of 12.
        # But in this case reserved qty should only be reduced by 10 and not 12.
        curr_ref_qty = self.get_qty(d.doctype,'prevdoc_detail_docname',d.prevdoc_detail_docname,'Sales Order Detail',obj.doc.name)
        tot_qty = flt(curr_ref_qty.split('~~~')[0])
        max_qty = flt(curr_ref_qty.split('~~~')[1])
        if((flt(tot_qty) + flt(qty) > flt(max_qty))):
          reserved_qty = -(flt(max_qty)-flt(tot_qty))
        else:  
          reserved_qty = - flt(qty)
      
      if obj.fname == "sales_order_details":
        packing_warehouse = d.reserved_warehouse
      else:
        packing_warehouse = d.warehouse
      
      if self.has_sales_bom(d.item_code):
        for i in self.get_sales_bom_items(d.item_code):
          il.append([packing_warehouse, i[0], flt(flt(i[1])* qty), reserved_qty, i[2]])
      else:
        il.append([packing_warehouse, d.item_code, qty, reserved_qty, d.stock_uom]) 
    return il

  def add_packing_list_item(self,obj, item_code, qty, warehouse, prevdoc_doctype, idx, parent, actual_qty, parent_detail_docname):
    pi = addchild(obj.doc, 'packing_details', 'Delivery Note Packing Detail', 1, obj.doclist)
    pi.parent_item = parent
    pi.item_code = item_code
    pi.parent_detail_docname = parent_detail_docname
    item_details = sql("select description, stock_uom from tabItem where name=%s", item_code)
    pi.description = item_details and item_details[0][0] or ''
    pi.uom = item_details and item_details[0][1] or ''
    pi.qty = flt(qty)
    pi.actual_qty = flt(actual_qty)
    pi.warehouse = warehouse
    pi.prevdoc_doctype = prevdoc_doctype
    pi.idx = idx
  
  def make_packing_list(self,obj,fname):
    obj.doc.clear_table(obj.doclist, 'packing_details')
    
    idx = 0
    qty = ''
    # for DN actual qty should be fetched
    if fname == 'delivery_note_details':
      qty = 'actual_qty'
    else:
      qty = 'projected_qty'
    
    for d in getlist(obj.doclist, fname):
      if fname == "sales_order_details":
        packing_warehouse = d.reserved_warehouse
      else:
        packing_warehouse = d.warehouse
      if self.has_sales_bom(d.item_code):
        for i in self.get_sales_bom_items(d.item_code):
          bin = sql("select %s from `tabBin` where item_code = '%s' and warehouse = '%s'" %(qty,i[0], packing_warehouse), as_dict = 1)
          self.add_packing_list_item(obj,i[0], flt(i[1])*flt(d.qty), packing_warehouse, d.prevdoc_doctype, idx, d.item_code,bin and bin[0][qty] or 0, cstr(d.name))
          idx += 1
          
      else:
        bin = sql("select %s from `tabBin` where item_code =  '%s' and warehouse = '%s'" %(qty,d.item_code, packing_warehouse), as_dict = 1)
        self.add_packing_list_item(obj,d.item_code, d.qty, packing_warehouse, d.prevdoc_doctype, idx, d.item_code,bin and bin[0][qty] or 0, cstr(d.name))
        idx += 1
      

  # Get total in words
  # ==================================================================  
  def get_total_in_words(self, currency, amount):
    in_words = self.in_words(amount)
    if in_words:
      in_words = currency + ". " + in_words + " only."
    return in_words    

  def in_words(self,n):
    l = str(n).split('.')
    out = ''
    for n in l:
      n=int(n)
      if n > 0:
        known = {
          0: 'Zero',
          1: 'One',
          2: 'Two',
          3: 'Three',
          4: 'Four',
          5: 'Five',
          6: 'Six',
          7: 'Seven',
          8: 'Eight',
          9: 'Nine',
          10: 'Ten',
          11: 'Eleven',
          12: 'Twelve',
          13: 'Thirteen',
          14: 'Fourteen',
          15: 'Fifteen',
          16: 'Sixteen',
          17: 'Seventeen',
          18: 'Eighteen',
          19: 'Nineteen',
          20: 'Twenty',
          30: 'Thirty',
          40: 'Forty',
          50: 'Fifty',
          60: 'Sixty',
          70: 'Seventy',
          80: 'Eighty',
          90: 'Ninety'
        }
        def psn(n, known, xpsn):
          import sys; 
                            #print >>sys.stderr, n
          #n=cint(n)
          if n in known:
            return known[n]
          bestguess = str(n)
          remainder = 0
          if n<=20:
            print >>sys.stderr, n, "How did this happen?"
            assert 0
          elif n < 100:
            bestguess= xpsn((n//10)*10, known, xpsn) + '-' + xpsn(n%10, known, xpsn)
            return bestguess
          elif n < 1000:
            bestguess= xpsn(n//100, known, xpsn) + ' ' + 'Hundred'
            remainder = n%100
          elif n < 100000:
            bestguess= xpsn(n//1000, known, xpsn) + ' ' + 'Thousand'
            remainder = n%1000
          elif n < 10000000:
            bestguess= xpsn(n//100000, known, xpsn) + ' ' + 'Lakh'
            remainder = n%100000
          else:
            bestguess= xpsn(n//10000000, known, xpsn) + ' ' + 'Crore'
            remainder = n%10000000
          if remainder:
            if remainder >= 100:
              comma = ','
            else:
              comma = ''
            return bestguess + comma + ' ' + xpsn(remainder, known, xpsn)
          else:
            return bestguess
        if not out and len(l) > 1  and int(l[1]) > 0:
          out += psn(n, known, psn) + " and "
        elif out and len(l) > 1:
          out += psn(n, known, psn) + " Paise"
        else:
          out += psn(n, known, psn)
    return out
    
  # Get month based on date (required in sales person and sales partner)
  # ========================================================================
  def get_month(self,date):
    month_list = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    month_idx = cint(cstr(date).split('-')[1])-1
    return month_list[month_idx]
    
    
  # **** Check for Stop SO as no transactions can be made against Stopped SO. Need to unstop it. ***
  def check_stop_sales_order(self,obj):
    for d in getlist(obj.doclist,obj.fname):
      ref_doc_name = ''
      if d.fields.has_key('prevdoc_docname') and d.prevdoc_docname and d.prevdoc_doctype == 'Sales Order':
        ref_doc_name = d.prevdoc_docname
      elif d.fields.has_key('sales_order') and d.sales_order and not d.delivery_note:
        ref_doc_name = d.sales_order
      if ref_doc_name:
        so_status = sql("select status from `tabSales Order` where name = %s",ref_doc_name)
        so_status = so_status and so_status[0][0] or ''
        if so_status == 'Stopped':
          msgprint("You cannot do any transaction against Sales Order : '%s' as it is Stopped." %(ref_doc_name))
          raise Exception
          
          
  # ****** Check for Item.is_sales_item = 'Yes' and Item.is_active = 'Yes' *******
  def check_active_sales_items(self,obj):
    for d in getlist(obj.doclist, obj.fname):
      if d.item_code:    # extra condn coz item_code is not mandatory in RV
        valid_item = sql("select is_active,is_sales_item from tabItem where name = %s",d.item_code)
        if valid_item and valid_item[0][0] == 'No':
          msgprint("Item : '%s' is Inactive" %(d.item_code))
          raise Exception
        if valid_item and valid_item[0][1] == 'No':
          msgprint("Item : '%s' is not Sales Item"%(d.item_code))
          raise Exception
    
  # Update Ref Doc
  # =======================================================
  def get_qty(self,curr_doctype,ref_tab_fname,ref_tab_dn,ref_doc_tname,curr_parent_name):
    # Get total Quantities of current doctype (eg. DN) except for qty of this transaction
    #------------------------------
   
    qty = sql("select sum(qty) from `tab%s` where %s = '%s' and docstatus = 1 and parent != '%s'"% (curr_doctype, ref_tab_fname, ref_tab_dn, curr_parent_name))
    qty = qty and flt(qty[0][0]) or 0 

    # get total qty of ref doctype
    max_qty = sql("select qty from `tab%s` where name = '%s' and docstatus = 1"% (ref_doc_tname, ref_tab_dn))
    max_qty = max_qty and flt(max_qty[0][0]) or 0
    
    return cstr(qty)+'~~~'+cstr(max_qty)    
    
  
  def update_refdoc_qty(self, curr_qty, curr_doctype, ref_dn, ref_dt, ref_tab_dn, ref_tab_fname, transaction, item_code, is_submit, curr_parent_doctype, curr_parent_name):
    curr_ref_qty = self.get_qty(curr_doctype,ref_tab_fname,ref_tab_dn,self.doctype_dict[ref_dt], curr_parent_name)
    
    qty = flt(curr_ref_qty.split('~~~')[0])

    max_qty = max_qty_plus_tol = flt(curr_ref_qty.split('~~~')[1])
    msgprint(qty)
    msgprint(max_qty)
 
    # Qty above Tolerance should be allowed only once.
    if qty > max_qty and is_submit:
      reason = 'Completed'
      if curr_parent_doctype == 'Delivery Note':
        reason = 'Delivered'
      elif curr_parent_doctype == 'Receivable Voucher':
        reason = 'Billed'
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
        msgprint("error:Qty for %s (%s) cannot be greater than %s" % (item_code, cstr(qty), cstr(max_qty_plus_tol)))
        raise Exception

    # Update qty
    #------------------
    sql("update `tab%s` set %s = '%s' where name = '%s'" % (self.doctype_dict[ref_dt],self.update_qty[transaction] , flt(qty), ref_tab_dn))
    
  
  def update_ref_doctype_dict(self, curr_qty, curr_doctype, ref_dn, ref_dt, ref_tab_dn, ref_tab_fname, transaction, item_code, is_submit, curr_parent_doctype, curr_parent_name):
    # update qty 
    self.update_refdoc_qty(curr_qty, curr_doctype, ref_dn, ref_dt, ref_tab_dn, ref_tab_fname, transaction, item_code, is_submit, curr_parent_doctype, curr_parent_name)
    
    # append distinct ref_dn in doctype_dict
    if not self.ref_doctype_dict.has_key(ref_dn) and self.update_percent_field.has_key(transaction):
      self.ref_doctype_dict[ref_dn] = [ ref_dt, self.doctype_dict[ref_dt],transaction]


  # update prevdoc detail
  # --------------------
  def update_prevdoc_detail(self, is_submit, obj):
    import math
    for d in getlist(obj.doclist, obj.fname):
      if d.fields.has_key('prevdoc_docname') and d.prevdoc_docname:
        transaction = cstr(d.prevdoc_doctype) + ' - ' + cstr(obj.doc.doctype)
        ref_tab_fname = 'prevdoc_detail_docname'
        self.update_ref_doctype_dict( flt(d.qty), d.doctype, d.prevdoc_docname, d.prevdoc_doctype, d.prevdoc_detail_docname, ref_tab_fname, transaction, d.item_code, is_submit, obj.doc.doctype, obj.doc.name)
      
      # for receivable voucher
      if d.fields.has_key('sales_order') and d.sales_order:
        transaction = 'Sales Order - ' + cstr(obj.doc.doctype)
        ref_tab_fname = 'so_detail'
        curr_qty = sql("select sum(qty) from `tabRV Detail` where so_detail = '%s' and parent = '%s'" % (cstr(d.so_detail), cstr(obj.doc.name)))
        curr_qty = curr_qty and flt(curr_qty[0][0]) or 0
        self.update_ref_doctype_dict( curr_qty, d.doctype, d.sales_order, 'Sales Order', d.so_detail, ref_tab_fname, transaction, d.item_code, is_submit, obj.doc.doctype, obj.doc.name)

      if d.fields.has_key('delivery_note') and d.delivery_note:
        transaction = 'Delivery Note - ' + cstr(obj.doc.doctype)
        ref_tab_fname = 'dn_detail'
        self.update_ref_doctype_dict( flt(d.qty), d.doctype, d.delivery_note, 'Delivery Note', d.dn_detail, ref_tab_fname, transaction, d.item_code, is_submit, obj.doc.doctype, obj.doc.name)
      
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
      
      # update percent complete
      #-----------------------
      sql("update `tab%s` set %s = '%s', modified = '%s' where name = '%s'" % (self.ref_doctype_dict[ref_dn][0], self.update_percent_field[self.ref_doctype_dict[ref_dn][2]], percent_complete, obj.doc.modified, ref_dn))

  def check_credit(self,obj,grand_total):
    acc_head = sql("select name from `tabAccount` where company = '%s' and master_name = '%s'"%(obj.doc.company, obj.doc.customer_name))
    acc_head = acc_head and acc_head[0][0]  or ''
    if acc_head:
      tot_outstanding = 0
      dbcr = sql("select sum(debit), sum(credit) from `tabGL Entry` where account = '%s' and is_cancelled='No'" % acc_head)
      if dbcr:
        tot_outstanding = flt(dbcr[0][0])-flt(dbcr[0][1])

      exact_outstanding = flt(tot_outstanding) + flt(grand_total)
      get_obj('Account',acc_head).credit_limit_common(acc_head, obj.doc.company, exact_outstanding)

  def validate_fiscal_year(self,fiscal_year,transaction_date,dn):
    fy=sql("select year_start_date from `tabFiscal Year` where name='%s'"%fiscal_year)
    ysd=fy and fy[0][0] or ""
    yed=add_days(str(ysd),365)
    if str(transaction_date) < str(ysd) or str(transaction_date) > str(yed):
      msgprint("'%s' Not Within The Fiscal Year"%(dn))
      raise Exception      

  # get against document date  self.prevdoc_date_field
  #-----------------------------
  def get_prevdoc_date(self, obj):
    import datetime
    for d in getlist(obj.doclist, obj.fname):
      if d.prevdoc_doctype and d.prevdoc_docname:
        dt = sql("select transaction_date from `tab%s` where name = '%s'" % (d.prevdoc_doctype, d.prevdoc_docname))
        d.prevdoc_date = dt and dt[0][0].strftime('%Y-%m-%d') or ''      