email_header = '''
<html>
  <body style="background-color: #EEE; padding: 10px; font-family: Arial">
  <style>table.border_tab td { background-color: #FFF; border: 1px solid #CCC; padding: 10px }</style>
  <div>
    <h3>Ticket %s : %s</h3>
  <table style="width:90%%; border-collapse: collapse;" class="border_tab">
'''

email_footer = '''
</table>
</div><br>
To login in the system, use link : <div><a href='http://67.205.111.118/v160/login.html' target='_blank'>http://http://67.205.111.118/v160/login.html</a></div><br><br>

<div style='padding:16px;'>
<hr><br>
<span>Web Notes - ERP & Integrated Web Solutions</span><br>
<span><a href='http://www.webnotestech.com' target='_blank'>www.webnotestech.com</a></span>
</div>
</body>
</html>
'''
class DocType:
  def __init__(self,doc,doclist=[]):
    self.doc = doc
    self.doclist = doclist
    
  def sender_details(self):
    sd = sql("select concat_ws(' ', t1.first_name, ifnull(t1.last_name,'')) ,t1.email,t1.cell_no,t2.company_name from `tabProfile` t1, `tabContact` t2 where t1.email=t2.email_id and t1.email=%s",session['user'])
        
    ret = {
      'senders_name'  : sd and sd[0][0] or '',
      'senders_email' : sd and sd[0][1] or '',
      'senders_contact_no' : sd and sd[0][2] or '',
      'senders_company' : sd and sd[0][3] or ''
    }
    return cstr(ret)
      
  def get_close_ticket_summary(self):
    t = """
<tr><td>Sender's Name:</td><td> %(senders_name)s</td></tr>
<tr><td>Sender's Company:</td><td> %(senders_company)s</td></tr>
<tr><td>Allocated To:</td><td> %(allocated_to)s</td></tr>
<tr><td>Priority:</td><td> %(priority)s</td></tr>
<tr><td>Subject:</td><td> %(subject)s</td></tr>
<tr><td>Description:</td><td> %(description)s</td></tr>
<tr><td>Status:</td><td> %(status)s</td></tr>
<tr><td>Scheduled Date:</td><td> %(scheduled_date)s</td></tr>
<tr><td>Resolution Date:</td><td> %(resolution_date)s</td></tr>
""" % (self.doc.fields)
    
    email = email_header % (self.doc.name,self.doc.subject) + t + email_footer
    return email
    
  def get_open_ticket_summary(self):
    t = """
<tr><td>Sender's Name:</td><td> %(senders_name)s</td></tr>
<tr><td>Sender's Company:</td><td> %(senders_company)s</td></tr>
<tr><td>Sender's Contact No:</td><td> %(senders_contact_no)s</td></tr>
<tr><td>Subject:</td><td> %(subject)s</td></tr>
<tr><td>Description:</td><td> %(description)s</td></tr>
""" % (self.doc.fields)

    email = email_header % (self.doc.name,self.doc.subject) + t + email_footer
    return email
    
  def get_allocated_ticket_summary(self):
    t = """
<tr><td>Sender's Name:</td><td> %(senders_name)s</td></tr>
<tr><td>Sender's Company:</td><td> %(senders_company)s</td></tr>
<tr><td>Priority:</td><td> %(priority)s</td></tr>
<tr><td>Subject:</td><td> %(subject)s</td></tr>
<tr><td>Description:</td><td> %(description)s</td></tr>
<tr><td>Status:</td><td> %(status)s</td></tr>
<tr><td>Scheduled Date:</td><td> %(scheduled_date)s</td></tr>
""" % (self.doc.fields)

    email = email_header % (self.doc.name,self.doc.subject) + t + email_footer
    return email
    
  def get_response_summary(self,response_by,response):
  
    t = """
<tr><td>Subject:</td><td> %s</td></tr>
<tr><td>Description:</td><td> %s</td></tr>
<tr><td>Response:</td><td> %s</td></tr>
<tr><td>Response By:</td><td> %s</td></tr>
""" % (self.doc.subject,self.doc.description,response,response_by)

    email = email_header % (self.doc.name,self.doc.subject) + t + email_footer
    return email

  def validate(self):
    if not self.doc.senders_email:
      msgprint('Please enter valid Senders Email')
      raise Exception
      
    if self.doc.resolution_date and self.doc.status != 'Closed':
      msgprint("You can enter Resolution Date only if Status is Closed")
      self.doc.resolution_date = ''
      raise Exception
    
  def on_update(self):
#    self.send_emails('yogesh@webnotestech.com',subject="test")

    if not self.doc.first_creation_flag or self.doc.first_creation_flag == 0:
      email = []
      email.append(get_defaults()['default_email'])
      email.append(self.doc.senders_email)
       
      sendmail(email,'automail@webnotestech.com',subject = 'New Ticket: %s, %s' % (self.doc.name,self.doc.subject) or '', parts = [['text/html',self.get_open_ticket_summary() or '']])
      set(self.doc, 'first_creation_flag', 1)
      
    if not self.doc.second_creation_flag:
      if self.doc.assignee_email:
        email = []
        email.append(self.doc.assignee_email)
        email.append(get_defaults()['default_email'])
        
        sendmail(email,'automail@webnotestech.com',subject = 'Ticket:%s,%s' % (self.doc.name,self.doc.subject) or '',parts = [['text/html',self.get_allocated_ticket_summary() or '']])
        self.doc.second_creation_flag = 1

    if self.doc.status=='Closed':
      email = []
      email.append(get_defaults()['default_email'])
      email.append(self.doc.assignee_email)
      
      sendmail(email,'automail@webnotestech.com',subject = 'Ticket Closed: %s, %s'%(self.doc.name,self.doc.subject) or '', parts = [['text/html',self.get_close_ticket_summary() or '']])
        
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
    
    if self.doc.senders_email and self.doc.assignee_email:
      email = []
      email.append(self.doc.senders_email)
      email.append(self.doc.assignee_email)
      
      sendmail(email,'automail@webnotestech.com',subject = 'Response to Ticket:%s, %s' % (self.doc.name,self.doc.subject) or '',parts = [['text/html',self.get_response_summary(arg['response_by'],arg['response']) or '']])
        
    if not self.doc.assignee_email:
      msgprint('Please enter valid assignee_email')
      raise Exception

  def get_assignee_email(self):
    as_em = sql("select email from `tabProfile` where name=%s",self.doc.allocated_to)
    ret = { 'assignee_email' : as_em and as_em[0][0] or ''}
    return cstr(ret)