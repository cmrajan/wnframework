class DocType:
  def __init__(self, d, dl):
    self.doc, self.doclist = d,dl

  def onload(self):
    pass
    #sql("update tabPage set viewed = ifnull(viewed,0) + 1 where name=%s", self.doc.name)
    
    #for creating page visit record
    #self.create_visitor_record()

#==========function for sending server request to find out ip information========
  def request_server(self):
    import os,httplib,urllib
    conn=httplib.HTTPConnection("ipinfodb.com")  #open connention
    args={'ip':os.environ.get('REMOTE_ADDR'),'output':'json'}
    conn.request("GET", "/ip_query.php?"+urllib.urlencode(args))
    r1 = conn.getresponse()
    data=r1.read()
    info=eval(data)
    
    return info
  
#===============creating page visitor record =============================
  def create_visitor_record(self):
    import datetime
    info=self.request_server()
    #search for Page Visit record for the same page with same date,country,city
    today = datetime.datetime.now().date().strftime('%Y-%m-%d')
    pv_exsit=sql("select name from `tabPage Visit` where page_name='%s' and date_of_visit ='%s' and country_name='%s' and city='%s'"%(self.doc.name,today, info['CountryName'], info['City']))
    if pv_exsit and pv_exsit[0][0]:
      self.check_web_visitor(pv_exsit[0][0],info)
    else:
      rec = Document('Page Visit')  #create new record for new page visit
      rec.page_name=self.doc.name
      rec.date_of_visit=today
      rec.country_name=info['CountryName']
      rec.city=info['City']
      rec.save(1)
      self.check_web_visitor(rec.name,info)
  
#========check if its new ip address visiting the page,then create a web visitor record or any one that is already exist in database====================
  def check_web_visitor(self,page_visit,info):
    check_ip=sql("select name from `tabWeb Visitor` where ip_address='%s'"%info['Ip'])
    if check_ip and check_ip[0][0]:
      sql("update `tabPage Visit` set returning_visit = ifnull(returning_visit,0) + 1 where name=%s", page_visit)
    else:
      sql("update `tabPage Visit` set new_visit = ifnull(new_visit,0) + 1 where name=%s", page_visit)
      rec = Document('Web Visitor')  #create new record for new ip address
      rec.ip_address=info['Ip']
      rec.country_name=info['CountryName']
      rec.city=info['City']
      rec.save(1)

  # replace $image
  # ------------------
  def validate(self):
    import re
    p = re.compile('\$image\( (?P<name> [^)]*) \)', re.VERBOSE)
    if self.doc.content:
      self.doc.content = p.sub(self.replace_by_img, self.doc.content)
  
  def replace_by_img(self, match):
    name = match.group('name')
    return '<img src="cgi-bin/getfile.cgi?ac=%s&name=%s">' % (session['data']['control_panel']['account_id'], name)