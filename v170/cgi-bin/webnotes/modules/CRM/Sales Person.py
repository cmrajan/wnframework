class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    
  def check_state(self):
    return NEWLINE.join([i[0] for i in sql("select state_name from `tabState` where `tabState`.country='%s' " % self.doc.country)])