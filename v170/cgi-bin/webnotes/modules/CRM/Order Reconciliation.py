class DocType:
  def __init__(self, d, dl):
    self.doc, self.doclist = d, dl

  def get_open_sales_order(self):
    if not (self.doc.from_date and self.doc.to_date):
      msgprint("From Date and To Date are Mandatory")
      return
    
    cond = ''  
    if self.doc.customer:
      cond += " AND t1.customer_name = '%s' " % self.doc.customer
    if self.doc.sales_order:
      cond += " AND t1.name = '%s' " % self.doc.sales_order
    #if self.doc.state:
    #  cond += " AND t1.state = '%s' " % self.doc.state
    if self.doc.territory:
      cond += " AND t1.territory = '%s' " %self.doc.territory

    dl = sql("select distinct t1.name, t1.customer_name,  t1.delivery_date, t1.territory, t1.rounded_total from `tabSales Order` t1, `tabDelivery Note Packing Detail` t2 where  t1.transaction_date >= '%s' and t1.transaction_date <= '%s' and t1.docstatus=1 and t1.status != 'Completed' and (t2.confirmation_date is null or t2.confirmation_date= '' or t2.confirmation_date='0000-00-00')   %s"% (self.doc.from_date, self.doc.to_date, cond)) 
    self.doc.clear_table(self.doclist, 'entries')
#    msgprint(dl)

    for d in dl:
      nl = addchild(self.doc, 'entries', 'Order Reconciliation Detail', 1, self.doclist)
      nl.sales_order_no = str(d[0])
      nl.customer = str(d[1])
      nl.city = ''
      nl.state = ''
      nl.territory = str(d[3])
      nl.rounded_total = str(d[4])
      nl.delivery_date = str(d[2])

  def update_sales_order(self):
    for d in getlist(self.doclist, 'entries'):
      if d.confirmation_date:
        sql("update `tabSales Order Detail` set confirmation_date = %s where parent = %s ", (d.confirmation_date, d.sales_order_no))
        sql("update `tabDelivery Note Packing Detail` set confirmation_date = %s where parent = %s ", (d.confirmation_date, d.sales_order_no))
    msgprint("Updated")