class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.tname = 'Installed Item Details'
    self.fname = 'installed_item_details'

  def autoname(self):     
    if self.doc.naming_series:
      self.doc.name = make_autoname(self.doc.naming_series + '.#####')
  
  def get_customer_details(self):
    det = sql("select t1.address,t1.territory,t2.contact_name from `tabCustomer` t1, `tabContact` t2 where t1.name = %s and t1.name=t2.customer_name and t2.is_primary_contact = 'Yes'", self.doc.customer_name, as_dict=1)
    
    ret = {
      'address'  :  det and det[0]['address'] or '',
      'territory':  det and det[0]['territory'] or '',
      'contact_person' : det and det[0]['contact_name'] or ''
    }
    return str(ret)

  def pull_delivery_note_details(self):
    self.validate_prev_docname()
    self.doclist = get_obj('DocType Mapper', 'Delivery Note-Installation Note').dt_map('Delivery Note', 'Installation Note', self.doc.delivery_note_no, self.doc, self.doclist, "[['Delivery Note', 'Installation Note'],['Delivery Note Detail', 'Installed Item Details']]")
  
  # ::::: Validates that Delivery Note is not pulled twice :::::::
  def validate_prev_docname(self):
    for d in getlist(self.doclist, 'installed_item_details'): 
      if self.doc.delivery_note_no == d.prevdoc_docname:
        msgprint(cstr(self.doc.delivery_note_no) + " delivery note details have already been pulled. ")
        raise Exception, "Validation Error. "
  
  #************Fiscal Year Validation*****************************
  def validate_fiscal_year(self):
    get_obj('Sales Common').validate_fiscal_year(self.doc.fiscal_year,self.doc.inst_date,'Installation Date')
  
  # ************** Validate Mandatory *************************
  def validate_mandatory(self):
    # :::::::::: Amendment Date ::::::::::::::
    if self.doc.amended_from and not self.doc.amendment_date:
      msgprint("Please Enter Amendment Date")
      raise Exception, "Validation Error. "
  
  # Validate values with reference document
  #----------------------------------------
  def validate_reference_value(self):
    get_obj('DocType Mapper', 'Delivery Note-Installation Note', with_children = 1).validate_reference_value(self, self.doc.name)
  
  def validate_serial_no(self):
    cur_s_no, prevdoc_s_no, valid_serial_no = [], [], []
    
    for d in getlist(self.doclist, 'installed_item_details'):
      if d.serial_no:
        #get current list of serial no
        cur_serial_no = d.serial_no.replace(' ', '')
        cur_s_no = cur_serial_no.split(',')
        
        if not flt(len(cur_s_no)) == flt(d.qty):
          msgprint("Please enter serial nos for all "+ cstr(d.qty) + " quantity of item "+cstr(d.item_code))
          raise Exception
        
        #get previous doc list of serial no
        prevdoc_serial_no = sql("select serial_no from `tabDelivery Note Detail` where name = '%s' and parent ='%s'" % (d.prevdoc_detail_docname, d.prevdoc_docname))
        prevdoc_serial_no = prevdoc_serial_no and prevdoc_serial_no[0][0] or ''
        if prevdoc_serial_no:
          prevdoc_serial_no = prevdoc_serial_no.replace(' ', '')
          prevdoc_s_no = prevdoc_serial_no.split(',')
          
          #check if all serial nos from current record exist in resp delivery note
          for x in cur_s_no:
            if x in prevdoc_s_no:
              valid_serial_no.append(x)
            else:
              msgprint("Serial No. "+x+" not present in respective Delivery Note "+d.prevdoc_docname)
              raise Exception, "Validation Error."
        
        #check if current serial no. is already installed
        for x in cur_s_no:
          status = sql("select status from `tabSerial No` where name = %s", x)
          status = status and status[0][0] or ''
          
          if status == 'Installed':
            msgprint("Item "+d.item_code+" with serial no. "+x+" already installed")
            raise Exception, "Validation Error."
            
    return valid_serial_no
  
  def validate(self):
    self.validate_fiscal_year()
    self.check_item_table()
    sales_com_obj = get_obj(dt = 'Sales Common')
    sales_com_obj.check_active_sales_items(self)
    sales_com_obj.get_prevdoc_date(self)
    self.validate_mandatory()
    self.validate_reference_value()
  
  def check_item_table(self):
    if not(getlist(self.doclist, 'installed_item_details')):
      msgprint("Please fetch items from Delivery Note selected")
      raise Exception
  
  def on_update(self):
    set(self.doc, 'status', 'Draft')
    self.doc.save()
  
  def on_submit(self):
    valid_lst = []
    valid_lst = self.validate_serial_no()
    
    get_obj("Sales Common").update_prevdoc_detail(1,self)
    
    for x in valid_lst:
      sql("update `tabSerial No` set status = 'Installed' where name = '%s'" % x)
    
    set(self.doc, 'status', 'Submitted')
  
  def on_cancel(self):
    cur_s_no = []
    sales_com_obj = get_obj(dt = 'Sales Common')
    sales_com_obj.update_prevdoc_detail(0,self)
    
    for d in getlist(self.doclist, 'installed_item_details'):
      if d.serial_no:
        #get current list of serial no
        cur_serial_no = d.serial_no.replace(' ', '')
        cur_s_no = cur_serial_no.split(',')
    
    for x in cur_s_no:
      sql("update `tabSerial No` set status = 'Delivered' where name = '%s'" % x)
      
    set(self.doc, 'status', 'Cancelled')