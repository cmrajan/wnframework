class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.prefix = is_testing and 'test' or 'tab'

  def validate(self):
    import string
  
    if not (self.doc.address_line1)  and not (self.doc.address_line2) and not (self.doc.city) and not (self.doc.state) and not (self.doc.country) and not (self.doc.pincode):
      return "Please enter address"
      
    else:
      address =["address_line1", "address_line2", "city", "state", "country", "pincode"]
      comp_address=''
      for d in address:
        if self.doc.fields[d]:
          comp_address += self.doc.fields[d] + NEWLINE
      self.doc.address = comp_address

  def check_state(self):
    state_list = sql("select state_name from `tabState` where `tabState`.country='%s' " % self.doc.country)
    state = ''
    for d in state_list:
      state += NEWLINE + d[0]
    return str(state)