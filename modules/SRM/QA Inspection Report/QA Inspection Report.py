class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist

  def get_purchase_receipt_details(self):
    pr = sql("select transaction_date from `tabPurchase Receipt` where name = '%s'" % ( self.doc.purchase_receipt_no))
    ret = {
      'purchase_receipt_date' : pr and cstr(pr[0][0]) or '',
    }
    return cstr(ret)

  def get_purchase_receipt_item_details(self):
    pr_detail = sql("select name, sum(received_qty), sum(qty), sum(rejected_qty), description from `tabPurchase Receipt Detail` where item_code = '%s' and parent = '%s' group by item_code" % (self.doc.item_code, self.doc.purchase_receipt_no))
    ret = {
      'purchase_receipt_detail_no': pr_detail and pr_detail[0][0] or '',
      'description'  : pr_detail and pr_detail[0][4] or '',
      'receipt_qty'  : pr_detail and flt(pr_detail[0][1]) or 0,
      'checked_qty'  : pr_detail and flt(pr_detail[0][1]) or 0,
      'accepted_qty' : pr_detail and flt(pr_detail[0][2]) or 0,
      'rejected_qty' : pr_detail and flt(pr_detail[0][3]) or 0
    }
    return cstr(ret)

  def get_item_specification_details(self):
    self.doc.clear_table(self.doclist, 'qa_specification_details')
    specification = sql("select specification, value from `tabItem Specification Detail` where parent = '%s' order by idx" % (self.doc.item_code))
    for d in specification:
      child = addchild(self.doc, 'qa_specification_details', 'QA Specification Detail', 1, self.doclist)
      child.specification = d[0]
      child.value = d[1]
      child.status = 'Accepted'
        
  def on_submit(self):
    sql("update `tabPurchase Receipt Detail` set qa_reported = 'Yes' where name = '%s'" % (self.doc.purchase_receipt_detail_no))

  def on_cancel(self):
    sql("update `tabPurchase Receipt Detail` set qa_reported = 'No' where name = '%s'" % (self.doc.purchase_receipt_detail_no))