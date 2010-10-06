class DocType:
  def __init__(self, doc, doclist):
    self.doc = doc
    self.doclist = doclist
  
  def validate(self):
    if (self.doc.status == 'Resolved' and not(self.doc.resolved_date)) :
      return "Please enter 'Resolved Date'"
    
    if ((self.doc.status == 'Open' or self.doc.status == 'Work In Progress') and self.doc.resolved_date) :
      return "Resolved Date can be mentioned only after Issue is resolved"
  
  def on_update(self):
    if not self.doc.first_creation_flag:
      rec = []
      
      assigned_to = sql("select email from `tabProfile` where name = '%s'" % self.doc.assigned_to)
      assigned_to = assigned_to and assigned_to[0][0] or ''
      
      assigned_by = sql("select email from `tabProfile` where name = '%s'" % session['user'])
      assigned_by = assigned_by and assigned_by[0][0] or ''
      
      if assigned_to: rec.append(assigned_to) 
      if assigned_by: rec.append(assigned_by) 
      
      sendmail(rec, subject = 'New Customer Issue: %s' % self.doc.name, parts = [['text/plain', self.get_issue_summary()]])
      
      set(self.doc, 'first_creation_flag', 1)
    else :
      if self.doc.status == 'Resolved' or self.doc.status == 'Cancelled':
        set(self.doc, 'docstatus', 1)
  
  def get_issue_summary(self):
    t = """
Customer Issue Details :

Customer Issue No : %(name)s

Customer Name : %(customer_name)s

Issue Status : %(status)s

Issue Date : %(complaint_date)s

Thanks,
""" % (self.doc.fields)

    return t    