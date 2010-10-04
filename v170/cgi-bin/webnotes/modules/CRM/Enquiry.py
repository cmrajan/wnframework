class DocType:
  def __init__(self,doc,doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.fname = 'enq_details'
    self.tname = 'Enquiry Detail'


#--------Get customer address-------
  def get_cust_address(self,arg):
    add = sql("select address,customer_group,zone,territory from `tabCustomer` where name='%s'"%(arg), as_dict=1)
    add1 = {
      'address'         :    add and add[0]['address'] or '',
      'customer_group'  :    add and add[0]['customer_group'] or '',
      'zone'            :    add and add[0]['zone'] or '',
      'territory'       :    add and add[0]['territory'] or ''
    }
    return cstr(add1) 
    
  def get_contact_details(self, arg):
    arg = eval(arg)
    #msgprint(arg)
    contact = sql("select contact_no, email_id from `tabContact` where contact_name = '%s' and customer_name = '%s'" %(arg['contact_person'],arg['customer']), as_dict = 1)
    #msgprint(contact)
    ret = {
      'contact_no'       :    contact and contact[0]['contact_no'] or '',
      'email_id'         :    contact and contact[0]['email_id'] or ''
    }
    return str(ret)   
    
  #Pull item details
  #----------------------------
  def get_item_details(self, item_code):
    item = sql("select item_name, stock_uom,description from `tabItem` where name = '%s'" %(item_code), as_dict=1)
    ret = {
      'item_name'    : item and item[0]['item_name'] or '',
      'uom'          : item and item[0]['stock_uom'] or '',
      'description'  : item and item[0]['description'] or ''
      }
    return str(ret)

  def on_update(self):
    # Add to calendar
    # ========================================================================
    if self.doc.contact_date and self.doc.last_contact_date != self.doc.contact_date:
      if self.doc.contact_by:
        self.add_calendar_event()
        
  # Add to Calendar
  # ===========================================================================
  def add_calendar_event(self):
    ev = Document('Event')
    ev.description = 'Contact ' + cstr(self.doc.contact_person) + '.To Discuss : ' + cstr(self.doc.to_discuss)
    ev.event_date = self.doc.contact_date
    ev.event_hour = '10:00'
    ev.event_type = 'Public'
    ev.ref_type = 'Enquiry'
    ev.ref_name = self.doc.name
    ev.save(1)
      
    user_list = ['CRM Manager', 'CRM User']
    for d in user_list:
      ch = addchild(ev, 'event_individuals', 'Event User', 0)
      ch.person = d
      ch.save()

#--------------Validation For Last Contact Date-----------------
  def set_last_contact_date(self):
    if not self.doc.contact_date_ref:
      self.doc.contact_date_ref=self.doc.contact_date
      self.doc.last_contact_date=self.doc.contact_date_ref
    if self.doc.contact_date_ref != self.doc.contact_date:
      if getdate(self.doc.contact_date_ref) < getdate(self.doc.contact_date):
        self.doc.last_contact_date=self.doc.contact_date_ref
      else:
        msgprint("Contact Date Cannot be before Last Contact Date")
        raise Exception
      set(self.doc, 'contact_date_ref',self.doc.contact_date)
      
  def validate(self):
    self.set_last_contact_date()
    
  # On Submit Functions
  # --------------------------------------------------------------------------------------

  # On Send Email
  def send_emails(self,email,sender,subject,message):
    if email:
      sendmail(email,sender,subject=subject or 'Enquiry',parts=[['text/plain',message or self.get_enq_summary()]])

  # Prepare HTML Table and Enter Enquiry Details in it, which will be added in enq summary
  def quote_table(self):
    if getlist(self.doclist,'enq_details'):
      header_lbl = ['Item Code','Item Name','Description','Reqd Qty','UOM']
      item_tbl = '''<table style="width:90%%; border:1px solid #AAA; border-collapse:collapse"><tr>'''
      for i in header_lbl:
        item_header = '''<td style="width=20%%; border:1px solid #AAA; border-collapse:collapse;"><b>%s</b></td>''' % i
        item_tbl += item_header
      item_tbl += '''</tr>'''
      
      for d in getlist(self.doclist,'enq_details'):
        item_det = '''
          <tr><td style="width:20%%; border:1px solid #AAA; border-collpase:collapse">%s</td>
          <td style="width:20%%; border:1px solid #AAA; border-collapse:collpase">%s</td>
          <td style="width:20%%; border:1px solid #AAA; border-collapse:collpase">%s</td>
          <td style="width:20%%; border:1px solid #AAA; border-collapse:collpase">%s</td>
          <td style="width:20%%; border:1px solid #AAA; border-collapse:collpase">%s</td></tr>
        ''' % (d.item_code,d.item_name,d.description,d.reqd_qty,d.uom)
        item_tbl += item_det
      item_tbl += '''</table>'''
      return item_tbl
      
  # Prepare HTML Page containing summary of Enquiry, which will be sent as message in E-mail
  def get_enq_summary(self):

    t = """
        <html><head></head>
        <body>
          <div style="border:1px solid #AAA; padding:20px; width:100%%">
            <div style="text-align:center;font-size:14px"><b>Request For Quotation</b><br></div>
            <div style="text-align:center;font-size:12px"> %(from_company)s</div>
            <div style="text-align:center; font-size:10px"> %(company_address)s</div>
            <div style="border-bottom:1px solid #AAA; padding:10px"></div> 
            
            <div style="padding-top:10px"><b>Quotation Details</b></div>
            <div><table style="width:100%%">
            <tr><td style="width:40%%">Enquiry No:</td> <td style="width:60%%"> %(name)s</td></tr>
            <tr><td style="width:40%%">Opening Date:</td> <td style="width:60%%"> %(transaction_date)s</td></tr>
            <tr><td style="width:40%%">Expected By Date:</td> <td style="width:60%%"> %(expected_date)s</td></tr>
            </table>
            </div>
            
            <div style="padding-top:10px"><b>Terms and Conditions</b></div>
            <div> %(terms_and_conditions)s</div>
            
            <div style="padding-top:10px"><b>Contact Details</b></div>
            <div><table style="width:100%%">
            <tr><td style="width=40%%">Contact Person:</td><td style="width:60%%"> %(contact_person)s</td></tr>
            <tr><td style="width=40%%">Contact No:</td><td style="width:60%%"> %(contact_no)s</td></tr>
            <tr><td style="width=40%%">Email:</td><td style="width:60%%"> %(email)s</td></tr>
            </table></div>
            """ % (self.doc.fields)
    
    t += """<br><div><b>Quotation Items</b><br></div><div style="width:100%%">%s</div>
            <br>
To login into the system, use link : <div><a href='http://67.205.111.118/v160/login.html' target='_blank'>http://67.205.111.118/v160/login.html</a></div><br><br>
            </div>
          </body>
          </html>
          """ % (self.quote_table())
    return t
      
#-----------------Email-------------------------------------------- 
  def send_emails(self, email=[], subject='', message=''):
    if email:
      sender_email= sql("Select email from `tabProfile` where name='%s'"%session['user'])
      if sender_email and sender_email[0][0]:
        attach_list=[]
        for at in getlist(self.doclist,'enquiry_attachment_detail'):
          if at.select_file:
            attach_list.append(at.select_file)
        cc_list=[]
        if self.doc.cc_to:
          for cl in (self.doc.cc_to.split(',')):
            cc_list.append(cl) 
            sendmail(cc_list, sender = sender_email[0][0], subject = subject , parts = [['text/html', message]],attach=attach_list)           
        sendmail(email, sender = sender_email[0][0], subject = subject , parts = [['text/html', message]],cc=cc_list,attach=attach_list)
        #sendmail(cc_list, sender = sender_email[0][0], subject = subject , parts = [['text/html', message]],attach=attach_list)
        msgprint("Mail Sent")
        self.add_in_follow_up(message,'Email')
      else:
        msgprint("Please enter your mail id in Profile")
        raise Exception
    else :
      msgprint("Recipient name not specified")
      raise Exception
#-------------------------Checking Sent Mails Details----------------------------------------------
  def sent_mail(self):
    if not self.doc.subject or not self.doc.message:
      msgprint("Please enter subject & message in their respective fields.")
    else:
      self.send_emails(self.doc.email_id1, subject = self.doc.subject ,message = self.doc.message)

#---------------------- Add details in follow up table----------------
  def add_in_follow_up(self,message,type):
    import datetime
    child = addchild( self.doc, 'follow_up', 'Follow up', 1, self.doclist)
    child.date = datetime.datetime.now().date().strftime('%Y-%m-%d')
    child.notes = message
    child.follow_up_type = type
    child.save()

#-------------------SMS----------------------------------------------
  def send_sms(self):
    if not self.doc.sms_message:
      msgprint("Please enter message in SMS Section ")
      raise Exception
    else:
      receiver_list = []
      #if self.doc.mobile_no:
        #receiver_list.append(self.doc.mobile_no)
      for d in getlist(self.doclist,'enquiry_sms_detail'):
        if d.other_mobile_no:
          receiver_list.append(d.other_mobile_no)
    
    if receiver_list:
      msgprint(get_obj('SMS Control', 'SMS Control').send_sms(receiver_list, self.doc.sms_message))
      self.add_in_follow_up(self.doc.sms_message,'SMS')