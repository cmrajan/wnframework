class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist


  def autoname(self):     
    if self.doc.naming_series:
      self.doc.name = make_autoname(self.doc.naming_series + '.#####')