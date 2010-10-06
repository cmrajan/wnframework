class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    
  def get_tax_rate(self, tax_type):
    rate = sql("select tax_rate from tabAccount where name = %s", tax_type)
    ret = {
      'tax_rate'  :  rate and flt(rate[0][0]) or 0
    }
    return str(ret)

  def on_update(self):
    check_list = []
    for d in getlist(self.doclist,'uom_conversion_details'):
      if not self.doc.stock_uom:
        msgprint("Please enter Stock UOM first.")
        raise Exception
      
      if cstr(d.uom) in check_list:
        msgprint("UOM %s has been entered more than once in Conversion Factor Details." % cstr(d.uom))
        raise Exception
      
      if not cstr(d.uom) in check_list:
        check_list.append(cstr(d.uom))
              
      if cstr(d.uom) == cstr(self.doc.stock_uom):
        if flt(d.conversion_factor) != 1:
          msgprint("Conversion Fator of UOM : %s should be equal to 1. As UOM : %s is Stock UOM of Item: %s." % ( cstr(d.uom), cstr(d.uom), cstr(self.doc.name)))
          raise Exception
        # else set uom_exist as true
        uom_exist='true'
      elif cstr(d.uom) != cstr(self.doc.stock_uom) and flt(d.conversion_factor) == 1:
        msgprint("Conversion Factor of UOM : %s should not be equal to 1. As UOM : %s is not Stock UOM of Item: %s." % ( cstr(d.uom), cstr(d.uom), cstr(self.doc.name)))
        raise Exception
    
    if not cstr(self.doc.stock_uom) in check_list :
      child = addchild( self.doc, 'uom_conversion_details', 'UOM Conversion Detail', 1, self.doclist)
      child.uom = self.doc.stock_uom
      child.conversion_factor = 1
      child.save()
  
  # Check whether Ref Rate is not entered twice for same Price List and Currency
  def check_ref_rate_detail(self):
    check_list=[]
    for d in getlist(self.doclist,'ref_rate_details'):
      if [cstr(d.price_list_name),cstr(d.ref_currency)] in check_list:
        msgprint("Ref Rate is entered twice for Price List : '%s' and Currency : '%s'." % (d.price_list_name,d.ref_currency))
        raise Exception
      else:
        check_list.append([cstr(d.price_list_name),cstr(d.ref_currency)])
        

  # Check whether Tax Rate is not entered twice for same Tax Type
  def check_item_tax(self):
    check_list=[]
    for d in getlist(self.doclist,'item_tax'):
      account_type = sql("select account_type from tabAccount where name = %s",d.tax_type)
      account_type = account_type and account_type[0][0] or ''
      if account_type != 'Tax':
        msgprint("'%s' is not Tax Account"%(d.tax_type))
        raise Exception, "Tax Account validation"
      else:
        if d.tax_type in check_list:
          msgprint("Rate is entered twice for Tax : '%s'." % (d.tax_type))
          raise Exception
        else:
          check_list.append(d.tax_type)        

  def check_for_active_boms(self, check):
    if check in ['Is Active', 'Is Purchase Item']:
      bom_mat = sql("select distinct t1.parent from `tabBOM Material` t1, `tabBill Of Materials` t2 where t1.item_code ='%s' and (t1.bom_no = '' or t1.bom_no is NULL) and t2.name = t1.parent and t2.is_active = 'Yes' and t2.docstatus = 1 and t1.docstatus =1 " % self.doc.name )
      if bom_mat and bom_mat[0][0]:
        msgprint("%s should be 'Yes'. As Item %s is present in one or many Active BOMs." % (cstr(check), cstr(self.doc.name)))
        raise Exception
    if check == 'Is Active' or ( check == 'Is Manufactured Item' and self.doc.is_sub_contracted_item != 'Yes') or (check ==  'Is Sub Contracted Item' and self.doc.is_manufactured_item != 'Yes') :
      bom = sql("select name from `tabBill Of Materials` where item = '%s' and is_active ='Yes'" % cstr(self.doc.name))
      if bom and bom[0][0]:
        msgprint("%s should be 'Yes'. As Item %s is present in one or many Active BOMs." % (cstr(check), cstr(self.doc.name)))
        raise Exception
    if check in ['Is Active', 'Is Pro Applicable']:
      flat_bom = sql("select distinct t1.parent from `tabFlat BOM Detail` t1, `tabBill Of Materials` t2 where t1.item_code ='%s' and t2.name = t1.parent and t2.is_active = 'Yes' and t2.docstatus = 1 and t1.docstatus =1 and t1.is_pro_applicable = 'Yes'" % self.doc.name )
      if flat_bom and flat_bom[0][0]:
        msgprint(" %s should be 'Yes'. As Item %s is present in one or many Active BOMs." % (cstr(check), cstr(self.doc.name)))
        raise Exception
    
  def validate(self):
    fl = {'is_active'             :'Is Active',
          'is_manufactured_item'  :'Is Manufactured Item',
          'is_sub_contracted_item':'Is Sub Contracted Item',
          'is_purchase_item'      :'Is Purchase Item',
          'is_pro_applicable'     :'Is Pro Applicable'}
    for d in fl:
      if cstr(self.doc.fields[d]) != 'Yes':
        self.check_for_active_boms(check = fl[d])
    self.check_ref_rate_detail()
    self.check_item_tax()
    if not self.doc.min_order_qty:
      self.doc.min_order_qty = 0
    self.check_non_asset_warehouse()
    
    if self.doc.is_pro_applicable == 'Yes' and self.doc.is_manufactured_item != 'Yes':
      msgprint("If Is Pro Applicable is 'Yes' then, Is Manufactured Item should be 'Yes'.")
      raise Exception
      
    if self.doc.is_sub_contracted_item == 'Yes' and self.doc.is_pro_applicable == 'Yes':
      msgprint("If Is Sub Contracted Item is 'Yes' then, Is Pro Applicable cannot be 'Yes' and Vice Versa")
      raise Exception
      
    if self.doc.is_pro_applicable == 'Yes' and self.doc.is_stock_item == 'No':
      msgprint("As Is Pro Applicable is 'Yes', then Is Stock Item Should be 'Yes' as we maintain it's stock.")
      raise Exception
      
    if self.doc.is_stock_item == "Yes" and not self.doc.default_warehouse:
      msgprint(" As Is Stock Item is 'Yes', please enter default warehouse. ")
    #self.check_min_inventory_level()

  def check_non_asset_warehouse(self):
    if self.doc.is_asset_item == "Yes":
      existing_qty = sql("select t1.warehouse, t1.actual_qty from tabBin t1, tabWarehouse t2 where t1.item_code=%s and (t2.warehouse_type!='Fixed Asset' or t2.warehouse_type is null) and t1.warehouse=t2.name and t1.actual_qty > 0", self.doc.name)
      for e in existing_qty:
        msgprint("%s Units exist in Warehouse %s, which is not an Asset Warehouse." % (e[1],e[0]))
      if existing_qty:
        msgprint("Please transfer the above quantities to an asset warehouse before changing this item to an asset item.")
        self.doc.is_asset_item = 'No'
        raise Exception

  def check_min_inventory_level(self):
    if self.doc.minimum_inventory_level:
      total_qty = sql("select sum(projected_qty) from tabBin where item_code = %s",self.doc.name)
      if flt(total_qty) < flt(self.doc.minimum_inventory_level):
        msgprint("Your minimum inventory level is reached")
        send_to = []
        send = sql("select t1.email from `tabProfile` t1,`tabUserRole` t2 where t2.role = 'SRM Manager' and t2.parent = t1.name") 
        for d in send:
          send_to.append(d[0])
        msg = '''
Minimum Inventory Level Reached

Item Code: %s
Item Name: %s
Minimum Inventory Level: %s
Total Available Qty: %s

''' % (self.doc.item_code, self.doc.item_name, self.doc.minimum_inventory_level, total_qty)

	sendmail(send_to, sender='automail@webnotestech.com', subject='Minimum Inventory Level Reached', parts=[['text/plain', msg]])

  def get_file_details(self, arg = ''):
    file = sql("select file_group, description from tabFile where name = %s", eval(arg)['file_name'], as_dict = 1)

    ret = {
      'file_group'  :  file and file[0]['file_group'] or '',
      'description'  :  file and file[0]['description'] or ''
      
    }
    return str(ret)