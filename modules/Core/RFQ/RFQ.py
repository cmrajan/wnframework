class DocType:
  def __init__(self,doc,doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.item_tbl = ''
    
  def autoname(self):
    if self.doc.rfq_type == 'From Company':
      self.doc.name = make_autoname('RFQ/Company' + '/.######')
    elif self.doc.rfq_type == 'From Customer':
      self.doc.name = make_autoname('RFQ/Customer' + '/.######')
    
  def get_contact_details(self):
    if self.doc.rfq_type == 'From Company':
      cd = sql("select concat_ws(' ',first_name,last_name),cell_no,email from tabProfile where user_type !='Partner' and name=%s",session['user'])      
      company_nm = get_defaults()['company']
      company_address = get_defaults()['address']

    elif self.doc.rfq_type == 'From Customer':
      cd = sql("select concat_ws(' ',t1.first_name,t1.last_name),t1.cell_no,t1.email,t2.customer_name,t2.customer_address from tabProfile t1, tabContact t2 where t1.email = t2.email_id and t1.name=%s",session['user'])
      company_nm = cd and cd[0][3] or ''
      company_address = cd and cd[0][4] or ''

    ret = {
      'contact_person'  : cd and cd[0][0] or '',
      'contact_no'  : cd and cd[0][1] or '',
      'email' : cd and cd[0][2] or '',
      'from_company' : company_nm or '',
      'company_address' : company_address or ''
    }
    return cstr(ret)
    
#  def on_update(self):
  def on_submit(self):
    if self.doc.rfq_type == 'From Company':
      if self.doc.send_to == 'All Suppliers':
        sup_emails = convert_to_lists(sql("select email_1 from tabSupplier"))
      elif self.doc.send_to == 'Individual Supplier' and self.doc.supplier_name:
        sup_emails = convert_to_lists(sql("select email_1 from tabSupplier where name=%s",self.doc.supplier_name))
      elif self.doc.send_to == 'Supplier Group' and self.doc.supplier_type:
        sup_emails = convert_to_lists(sql("select email_1 from tabSupplier where supplier_type = %s",self.doc.supplier_type))
    elif self.doc.rfq_type == 'From Customer':
      sup_emails = convert_to_lists(sql("select t1.email from tabProfile t1, tabUserRole t2 where t2.role='CRM Manager' and t2.parent = t1.name"))
      
    if sup_emails:
      self.item_tbl = self.quote_table()

      for i in sup_emails:
  #      msgprint(self.doc.email)
   #     msgprint(i[0])
        if i[0]!='' or i[0]!= None:
          self.send_emails(i[0],self.doc.email,subject="RFQ From %s" % (self.doc.from_company),message='')
      msgprint("Sent")
          
  def send_emails(self,email,sender,subject,message):
    if email:
      msgprint(email)
      msgprint(sender)
      sendmail(email,sender,subject=subject or 'RFQ',parts=[['text/plain',message or self.get_rfq_summary()]])

  def quote_table(self):
    if getlist(self.doclist,'rfq_details'):
      header_lbl = ['Item Code','Item Name','Description','Reqd Qty','UOM']
      item_tbl = '''<table style="width:90%%; border:1px solid #AAA; border-collapse:collapse"><tr>'''
      for i in header_lbl:
        item_header = '''<td style="width=20%%; border:1px solid #AAA; border-collapse:collapse;"><b>%s</b></td>''' % i
        item_tbl += item_header
      item_tbl += '''</tr>'''
      
      for d in getlist(self.doclist,'rfq_details'):
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
      
  def get_rfq_summary(self):

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
            <tr><td style="width:40%%">RFQ No:</td> <td style="width:60%%"> %(name)s</td></tr>
            <tr><td style="width:40%%">Opening Date:</td> <td style="width:60%%"> %(rfq_date)s</td></tr>
            <tr><td style="width:40%%">Closing Date:</td> <td style="width:60%%"> %(closing_date)s</td></tr>
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
          """ % (self.item_tbl)
    return t
    
#-------code from indent-------

  # for table
  def get_item_details(self, arg =''):
    arg = eval(arg)
    item = sql("select * from `tabItem` where name = %s", (arg['item_code']), as_dict = 1)
    if arg['warehouse']:
      wh = arg['warehouse']
    else:
      wh = item and item[0]['default_warehouse'] or ''
      
    ret = {
      'item_name'          : item and item[0]['item_name'] or '',
      'brand'              : item and item[0]['brand'] or '',
      'description'        : item and item[0]['description'] or '',
      'min_order_qty'      : item and flt(item[0]['min_order_qty']) or 0,
      'uom'                : item and item[0]['stock_uom'] or '',
      'stock_uom'          : item and item[0]['stock_uom'] or '',
      'conversion_factor'  : '1',
      'warehouse'          : wh
    }
    return str(ret)
  
  def validate_for_items(self):
    check_list=[]
    for d in getlist(self.doclist,'rfq_details'):
      e = [d.schedule_date, d.item_code, d.warehouse]
      if e in check_list:
        msgprint("Item %s has been entered twice." % d.item_code)
        raise Exception
      else:
        check_list.append(e)

  def validate_conversion_factor(self):
    for d in getlist(self.doclist,'rfq_details'):
      uom = sql("select conversion_factor from `tabUOM Conversion Detail` where parent = %s and uom = %s", (d.item_code,d.uom), as_dict = 1)
      if not uom and not(cstr(d.stock_uom) == cstr(d.uom)): 
        msgprint("There is no conversion factor for UOM : " +cstr(d.uom) +" in Item : " + cstr(d.item_code))
        raise Exception

  # Get UOM DetailsNos
  def get_uom_details(self, arg = ''):
    arg = eval(arg)
    uom = sql("select conversion_factor from `tabUOM Conversion Detail` where parent = %s and uom = %s", (arg['item_code'],arg['uom']), as_dict = 1)
    ret = {
      'conversion_factor' : uom and flt(uom[0]['conversion_factor']) or 1
    }
    return str(ret)  

  # validate
  def validate(self):
    self.validate_for_items()
    self.validate_conversion_factor()
    self.validate_doc()
    
#  def on_submit(self):
    
  def check_next_docstatus(self):
    submit_po = sql("select t1.name from `tabPurchase Order` t1,`tabPO Detail` t2 where t1.name = t2.parent and t2.prevdoc_docname = '%s' and t1.docstatus = 1" % (self.doc.name))
    if submit_po:
      msgprint("Purchase Order : " + cstr(submit_po[0][0]) + " has already been submitted !")
      raise Exception , "Validation Error."

  def on_cancel(self):
    self.check_next_docstatus()

  # Pull Indent
  def get_indent_details(self):
    self.validate_prev_docname()
    #self.doc.clear_table(self.doclist, 'po_details')     
    get_obj('DocType Mapper','Indent-RFQ').dt_map('Indent','RFQ',self.doc.indent_no, self.doc, self.doclist, "[['Indent Detail', 'RFQ Detail']]")
    
  def validate_doc(self):
    for d in getlist(self.doclist,'rfq_details'):
      prevdoc = 'Indent'
      prevdoc_docname = d.prevdoc_docname and d.prevdoc_docname or ''
      if prevdoc_docname:
        get_name = sql("select name from `tab%s` where name = '%s'" % (prevdoc, prevdoc_docname))
        name = get_name and get_name[0][0] or ''
        if name:  #check for incorrect docname
          dt = sql("select docstatus from `tab%s` where name = '%s'" % (prevdoc, name))
#          company_name = dt and dt[0][0] or ''
          docstatus = dt and dt[0][0] or 0
          if (docstatus != 1):
            msgprint(cstr(prevdoc) + ": " + cstr(prevdoc_docname) + " is not Submitted Document.")
            raise Exception, "Validation Error."
        else:
          msgprint(cstr(prevdoc) + ": " + cstr(prevdoc_docname) + " is not a valid " + cstr(prevdoc))
          raise Exception, "Validation Error."
          
  def validate_prev_docname(self):
    for d in getlist(self.doclist,'rfq_details'):
      if self.doc.indent_no == d.prevdoc_docname:
        msgprint(cstr(self.doc.indent_no) + " indent details have already been pulled. ")
        raise Exception