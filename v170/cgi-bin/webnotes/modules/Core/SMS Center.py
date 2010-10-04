class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
      
  def create_receiver_table(self):
    if self.doc.send_to:
      self.doc.clear_table(self.doclist, 'receiver_details')
      if self.doc.send_to == 'All Customer':
        rec = sql("select name, mobile_1 from tabCustomer")
      elif self.doc.send_to == 'Customer Group' and self.doc.customer_group_name:
        rec = sql("select name, mobile_1 from tabCustomer where customer_group = '%s'" % self.doc.customer_group_name)
        
      for d in rec:
        ch = addchild(self.doc, 'receiver_details', 'Receiver Detail', 1, self.doclist)
        ch.receiver_name = d[0]
        ch.mobile_no = d[1]
    else:
      msgprint("Please select 'Send To' field")
        
        
  def send_sms(self):
    if not self.doc.message:
      msgprint("Please type the message before sending")
    elif not getlist(self.doclist, 'receiver_details'):
      msgprint("Receiver Table is blank.")
    else:
      receiver_list = []
      for d in getlist(self.doclist, 'receiver_details'):
        if d.mobile_no:
          receiver_list.append(d.mobile_no)
      if receiver_list:
        msgprint(get_obj('SMS Control', 'SMS Control').send_sms(receiver_list, self.doc.message))