class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
      
  def validate_receiver_no(self,receiver_list):
    error = 0
    validated_receiver_list = []
    for d in receiver_list:
      if d:
        if not d.startswith("91") and len(d) == 10:
          mob_no = "91" + d
        elif d.startswith("+91") and len(d) == 13:
          mob_no = d[1:]
        elif d.startswith("0") and len(d) == 11:
          mob_no = "91" + d[1:]
        elif len(d) == 12:
          mob_no = d
        else:
          mob_no = ''
          msgprint("Invalid mobile no : " + cstr(d))
          error = 1
        validated_receiver_list.append(mob_no)
      
    if error:
      raise Exception
    else:
      return validated_receiver_list

  def request_server(self, msg, mob_no, count):
    import httplib, urllib    
    conn = httplib.HTTPConnection('ip.muicsms.co.in')  # open connection
    
    
    args = {'UserID':'webnotes','UserPassWord':'123webnotes','PhoneNumber':mob_no,'Text':msg,'GSM':'WebNotes','CDMA':'9898251863'}  
    headers = {}
    headers['Accept'] = "text/plain, text/html, */*" 

    conn.request('GET', '/smsserver/sms10n.aspx?'+urllib.urlencode(args), headers = headers)    # send request
    resp = conn.getresponse()     # get response
    resp = resp.read()
    if resp == 'Ok|</br>':
      count += 1
    return count
        
  def send_sms(self, receiver_list, msg, doc_type = '', doc_name = ''):
    validated_receiver_list = self.validate_receiver_no(receiver_list)

    if not validated_receiver_list:
      msgprint("Please enter correct mobile no")
      raise Exception
    count = 0
    for d in validated_receiver_list:
      count = self.request_server(msg, d, count)
      
    if count:
      self.maintain_sms_log(count, msg, receiver_list, doc_type, doc_name)
      return "Message successfully sent"
      
  def maintain_sms_log(self, count, msg, receiver_list, doc_type, doc_name):
    #create sms log
    sl = Document('SMS LOG')
    sl.sent_by = session['user']
    sl.sent_to = ','.join(receiver_list)
    sl.text_sent = msg
    sl.sending_date = getdate(nowdate()).strftime('%Y-%m-%d')
    sl.sending_time = now().split()[1]
    sl.doctype_name = doc_type
    sl.document_no = doc_name
    sl.save(1)

    #update in control panel
    #prev_total = sql("select value from tabSingles where doctype = 'Control Panel' and field = 'total_sms_sent'")
    #prev_total = prev_total and prev_total[0][0] or 0
    sql("update `tabSingles` set value = ifnull(value, 0) + '%s' where doctype = 'Control Panel' and field = 'total_sms_sent'" % cint(count))