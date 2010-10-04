class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
  
  def send_feed(self, arg):
    import datetime
    
    # ---- dictionary to be passed ----
    # updated_by (person nm who is updating record), 
    # doctype_nm, 
    # record_no (record no which is getting updated),
    # for_role (role to which feed should be visible),
    # feed_event (Creation, Submittal, Amendment, Cancelled, Alert)
    # for_party (respective customer / supplier name)
    # grand_total (total mentioned in record) (if required)
    
    
    # ---- delete old feed entry for same record ----
    feed_no = sql("select name from `tabFeed List` where doctype_name = '%s' and record_no = '%s'" % (arg['doctype_nm'], arg['record_no']))
    feed_no = feed_no and feed_no[0][0] or ''
    
    if feed_no :
      sql("delete from `tabFeed List` where name = '%s'" % feed_no)
    
    # ---- delete one week old feeds ----
    d1 = nowdate()
    d2 = getdate(d1) + datetime.timedelta(-7)
    old_feed = sql("select name from `tabFeed List` where update_date < '%s'" % d2)
    if old_feed :
      old_feed_lst = [x[0] for x in old_feed]
    
      for i in old_feed_lst:
        sql("delete from `tabFeed List` where name = '%s'" % i)
    
    # ---- add to feed list ----
    f1 = Document('Feed List')
    f1.updated_by = arg['updated_by']
    f1.doctype_name = arg['doctype_nm']
    f1.record_no = arg['record_no']
    f1.for_role = arg['for_role']
    f1.feed_event = arg['feed_event']
    f1.update_date = nowdate()
    if (arg['for_party']):
      f1.for_party = arg['for_party']
    if (arg['grand_total']):
      f1.grand_total = arg['grand_total']
    if(arg['currency']):
      f1.currency_type = arg['currency']
    if(arg['due_date']):
      f1.due_date = arg['due_date']
    f1.save(1)