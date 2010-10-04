class DocType:
  def __init__(self,doc,doclist=[]):
    self.doc = doc
    self.doclist = doclist

#-------call to validate email id and company name---------    
  def validate(self):
    self.validate_company_name()

    if not self.doc.contact_name:
      if self.doc.last_name:
        self.doc.contact_name = self.doc.first_name + ' ' + self.doc.last_name
      else:
        self.doc.contact_name = self.doc.first_name
        
    self.validate_primary_contact()

#-------validate email -------------------------------------    
  def validate_email(self):
    if not validate_email_add(self.doc.email_id):
      msgprint('Please enter valid email id.')
      raise Exception
      
    #if sql("select name from tabContact where email_id=%s and name !=%s",(self.doc.email_id,self.doc.name)):
      #msgprint("Email id belongs to other contact.")
      #raise Exception
      
 
#--------Get customer, supplier or sales partner address-------
  def get_address(self,arg):
    arg = eval(arg)
    add = sql("select address,`%s` from `tab%s` where name='%s'"%(arg['type'],arg['dt'],arg['dn']))
    add1 = {
      'customer_address'  : add and add[0][0] or '',
      'customer_group' : add and add[0][1] or ''
    }
    return cstr(add1)

#-------Creating profile of contact-----------------------------    
  def create_profile(self):
    if not self.doc.email_id:
      msgprint('Please enter Email Id and save document.')
      raise Exception
            
    self.validate_email()
      
      
    if sql("select name from tabProfile where name=%s",self.doc.email_id):
      msgprint('Profile with same Email Id already exist')
      raise Exception
    else:
      p = Document('Profile')
      p.name = self.doc.email_id
      p.first_name = self.doc.first_name
      p.last_name = self.doc.last_name
      p.email = self.doc.email_id
      p.cell_no = self.doc.contact_no
      p.password = 'password'
      p.enabled = 1
      p.user_type = 'Partner';
      p.save(1)

      get_obj(doc=p).on_update()
      
      self.set_roles()
      
#      sendmail(self.doc.email_id,'automail@webnotestech.com',subject = "Invitation From %s" % (self.doc.owner),parts=[['text/plain',self.send_contact_details()]])
    
      set(self.doc,'has_login','Yes')
      set(self.doc,'disable_login','No')
      set(self.doc,'email_id',self.doc.email_id)
      msgprint('User login is created.')

#--------- html for email (depricated) ---------------------------
  def send_contact_details(self):
    content = ''
    if self.doc.is_supplier:
      content += "You can see the RFQ raised by party and send Quotation directly from system." + NEWLINE
    if self.doc.is_customer:
      content += "You can raise RFQ to the party and recieve quotation against it." + NEWLINE
    if self.doc.is_sales_partner:
      content += "You can see all sale details done by you." + NEWLINE
    
    self.doc.fields['content'] = content
    acc = Document('Control Panel','Control Panel')
    self.doc.fields['acc'] = acc.account_id
    
    
    
    t = """
        <html><head></head>
        <body>
          <div><pre>Dear %(name)s<br>
Mr. %(owner)s has invited you to join ERP System.
%(content)s

To login into the system, use link : <div><a href='http://67.205.111.118/v160/login.html' target='_blank'>http://67.205.111.118/v160/login.html</a></div>

Account   : %(acc)s                    
Login Id  : %(email_id)s
Password  : password
                  
To change your password - goto 'Profile' link and change your password.
                                    
<div style="border-bottom:1px dotted #AAA"></div>
<div style="color:#AAA">Web Notes - ERP & Integrated Web Solutions 
www.webnotestech.com</div>
          </pre>
          </div>
          
        </body>
        </html>
        """ % (self.doc.fields)
    return t

#--------- on update ------------------------------------------    
  def on_update(self):
    if self.doc.email_id:
      self.validate_email()
   
#--------------------------------------------------------------------------------------
    if self.doc.has_login == 'Yes':
      en = sql("select enabled from tabProfile where name=%s",self.doc.email_id)
      en = en and en[0][0] or 0
      if en == 1 and self.doc.disable_login == 'Yes':
        sql("update tabProfile set enabled=0 where name=%s",self.doc.email_id)
      elif en != 1 and self.doc.disable_login == 'No':
        sql("update tabProfile set enabled=1 where name=%s",self.doc.email_id)
      else:
        pass
        
      self.set_roles()

#--------- Validate company name ----------------------------        
  def validate_company_name(self):
    if self.doc.contact_type == 'Company':
      if self.doc.is_customer !=1 and self.doc.is_supplier != 1 and self.doc.is_sales_partner !=1:
        msgprint("Please select if contact belongs to Customer,Supplier or Sales Partner")
        raise Exception

      if self.doc.is_customer ==1 and not self.doc.customer_name:
        msgprint("Please enter Customer Name")
        raise Exception
      if self.doc.is_supplier == 1 and not self.doc.supplier_name:
        msgprint("Please enter Supplier Name")
        raise Exception
      if self.doc.is_sales_partner == 1 and not self.doc.sales_partner:
        msgprint("Please enter Sales Partner Name")
        raise Exception
        
  # Validate that there can only be one primary contact for particular customer, supplier or sales partner
  # --------------------------------------------------------------------------------------------------------
  def validate_primary_contact(self):
    if self.doc.contact_type == 'Company' and self.doc.is_primary_contact == 'Yes':
      if self.doc.customer_name:
        primary_contact = sql("SELECT contact_name from tabContact where customer_name = %s and is_customer = 1 and is_primary_contact = 'Yes' and contact_name != %s",(self.doc.customer_name,self.doc.contact_name))
        primary_contact = primary_contact and primary_contact[0][0] or ''
        if primary_contact:
          msgprint("You have already selected '%s' as primary contact for '%s'"%(primary_contact,self.doc.customer_name))
          raise Exception
      elif self.doc.supplier_name:
        primary_contact = sql("SELECT contact_name from tabContact where supplier_name = %s and is_supplier = 1 and is_primary_contact = 'Yes'  and contact_name != %s",(self.doc.supplier_name,self.doc.contact_name))
        primary_contact = primary_contact and primary_contact[0][0] or ''
        if primary_contact:
          msgprint("You have already selected '%s' as primary contact for '%s'"%(primary_contact,self.doc.supplier_name))
          raise Exception
      elif self.doc.sales_partner:
        primary_contact = sql("SELECT contact_name from tabContact where sales_partner = %s and is_sales_partner = 1 and is_primary_contact = 'Yes' and contact_name != %s",(self.doc.sales_partner,self.doc.contact_name))
        primary_contact = primary_contact and primary_contact[0][0] or ''
        if primary_contact:
          msgprint("You have already selected '%s' as primary contact for '%s'" %(primary_contact,self.doc.sales_partner))
          raise Exception
        
#--------- set profile roles-----------
  def set_roles(self):
      roles = []
      if self.doc.contact_type == 'Individual':
        roles = ['Customer']
          #----default customer----------
      else:
        if self.doc.is_customer == 1:
          roles.append('Customer')
        if self.doc.is_supplier == 1:
          roles.append('Supplier')
        if self.doc.is_sales_partner == 1:
          roles.append('Partner')
        
      sql("delete from tabUserRole where parenttype='Profile' and parent=%s",self.doc.email_id)
      sql("delete from tabDefaultValue where parenttype='Profile' and parent=%s",self.doc.email_id)
      if roles:
        for i in roles:
          match_defaults = []
          
          r = Document('UserRole')
          r.parent = self.doc.email_id
          r.role = i
          r.parenttype = 'Profile'
          r.parentfield = 'userroles'
          r.save(1)
          
          if i == 'Customer':
            def_keys = ['from_company','customer_name','customer']
            def_val = self.doc.customer_name
            self.set_default_val(def_keys,def_val)

          if i == 'Supplier':
            def_keys = ['supplier']
            def_val = self.doc.supplier_name
            self.set_default_val(def_keys,def_val)
            # Following fields are required for RFQ
            self.set_default_val(['send_to'], 'All Suppliers')
            supplier_type = sql("select supplier_type from `tabSupplier` where name = '%s'" % self.doc.supplier_name)
            self.set_default_val(['supplier_type'], supplier_type and supplier_type[0][0] or '')

              
#------set default values---------
  def set_default_val(self,def_keys,def_val):
    msgprint(def_val)
    for d in def_keys:
      msgprint(d)
      kv = Document('DefaultValue')
      kv.defkey = d
      kv.defvalue = def_val
      kv.parent = self.doc.email_id
      kv.parenttype = 'Profile'
      kv.parentfield = 'defaults'
      kv.save(1)