class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist

  # mandatory
  # ---------
  
  def validate_mandatory(self):
    mandatory = ['item_code','warehouse','transaction_date','posting_date','voucher_type','voucher_no','actual_qty','company','fiscal_year']
    for k in mandatory:
      if self.doc.fields.get(k)==None:
        msgprint("Stock Ledger Entry: %s is mandatory" % k)
        raise Exception
      elif k == 'item_code':
        if not sql("select name from tabItem where name = '%s'" % self.doc.fields.get(k)):
          msgprint("Item Code: %s does not exist in the system. Please check." % self.doc.fields.get(k))
          raise Exception
      elif k == 'warehouse':
        if not sql("select name from tabWarehouse where name = '%s'" % self.doc.fields.get(k)):
          msgprint("Warehouse: %s does not exist in the system. Please check." % self.doc.fields.get(k))
          raise Exception

        
  def validate(self):
    self.validate_mandatory()