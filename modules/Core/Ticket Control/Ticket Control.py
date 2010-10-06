class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d, dl
    
#posting response in table
  def post_response(self,arg):
    arg = eval(arg)
    res = Document('Ticket Response Detail')
    res.response =  arg['response']
    res.response_by = arg['response_by']
    res.response_date = nowdate();
    res.parent = arg['parent']
    res.parenttype = 'Ticket'
    res.parentfield = 'ticket_response_details'
    res.save(1)