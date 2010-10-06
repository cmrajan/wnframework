class DocType :
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist

  def autoname(self):
    p = self.doc.fiscal_year
    self.doc.name = make_autoname('PF/' + self.doc.fiscal_year[2:5]+self.doc.fiscal_year[7:9] + '/.#####')

  def get_items_details(self,item_code):
    item = sql("select description, stock_uom from `tabItem` where name = %s",item_code , as_dict =1)
    ret = {
      'description' : item and item[0]['description'] or '',
      'qty'         : '',
      'stock_uom'   : item and item[0]['stock_uom'] or '',
      'start_date'  : '',
      'end_date'    : ''
    }
    return cstr(ret)

  #utility functions
  def validate_mandatory(self):
    if not self.doc.forecast_due_date:
      msgprint("Please Enter Forecast Due Date")
      raise Exception
    if (getdate(self.doc.transaction_date) > getdate(self.doc.forecast_due_date)):
      msgprint("Transaction Date can't be after forecast_due_date")
      raise Exception
    for d in getlist(self.doclist, 'pf_details'):
      if not d.item_code:
        msgprint("Please Enter Item Code at Row No. " + cstr(d.idx))
        raise Exception
      item = sql("select is_mrp_item from `tabItem` where name = %s", d.item_code,as_dict = 1)
      if not item[0]['is_mrp_item'] == 'Yes':
        msgprint("Please Delete Item " + cstr(d.item_code) + " at Row No. " + cstr(d.idx) + " because it is not a MRP item")
        raise Exception
      if not d.qty:
        msgprint("Please Enetr Quantity for Item No." + cstr(d.item_code) + "at Row No." + cstr(d.idx)) 
        raise Exception
      if not d.start_date:
        msgprint("Please Enter Start Date for Item No." + cstr(d.item_code) + " at Row No." + cstr(d.idx))
        raise Exception
      if not d.end_date:
        msgprint("Please Enter End Date for Item No." + cstr(d.item_code) + " at Row No." + cstr(d.idx))
        raise Exception 
      if(getdate(self.doc.transaction_date) > getdate(d.start_date)):
        msgprint("Start Date of Item " + cstr(d.item_code) + " at Row No. " + cstr(d.idx) + " cannot be before transaction Date")
        raise Exception
      if(getdate(self.doc.forecast_due_date) < getdate(d.start_date)):
        msgprint("Start Date of Item " + cstr(d.item_code) + " at Row no. " + cstr(d.idx) + " cannot be after Forecast Due Date")
        raise Exception
      if(getdate(self.doc.transaction_date) > getdate(d.end_date)):
        msgprint("End Date of Item " + cstr(d.item_code) + " at Row No. " + cstr(d.idx) + " cannot be  before transaction Date")
        raise Exception
      if(getdate(self.doc.forecast_due_date) < getdate(d.end_date)):
        msgprint("End Date of Item " + cstr(d.item_code) + " at Row No. " + cstr(d.idx) + " cannot be after Forecast Due Date")
        raise Exception
      if(getdate(d.start_date) > getdate(d.end_date)):
        msgprint("Start Date of Item " + cstr(d.item_code) + " at Row No. " + cstr(d.idx) + " cannot be after End Date")
        raise Exception
      
#------------------------------------next document to be checked if production forecast is to be cancelled---------
  def check_next_doc(self):
    next_doc = sql("select t1.name, t2.item_code from `tabProduction Plan` t1, `tabPP Detail` t2 where t1.name = t2.parent and t2.document_no = '%s' and t2.mrp = 1" %(self.doc.name))
    if next_doc:
      msgprint("MRP has been run already on item" + cstr(next_doc[0][1]) +" in Production Plan :" + cstr(next_doc[0][0]) + ". Hence Production Forecast cannot be cancelled")
      raise Exception
    
  #------------------------------------------------------------------------------------------

  
  
  def validate(self):
    self.validate_mandatory()
      
  def on_submit(self): 
    set(self.doc,'status', 'Released')
    
#-------------------------------------------------on cancel/2009 -------------------------

  def on_cancel(self):
    self.check_next_doc()