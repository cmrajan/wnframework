class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d, dl
  
  def autoname(self):
   
    self.doc.name = make_autoname('Form 16A' + '/.#####') 
  
  def get_pan_tan(self):
    comp_det=sql("Select address,pan_no,tan_no from `tabCompany` where name = '%s'"%(self.doc.company))
    if not comp_det:
      msgprint("No PAN or TAN number is mentioned in comapny")
      ret = {
      'company_address':'',
      'pan_no':  '',
      'tan_no' :  ''
    }
    else:
      ret = {
        'company_address': cstr(comp_det[0][0]),
        'pan_no': cstr(comp_det[0][1]) ,
        'tan_no' : cstr(comp_det[0][2]) 
      }
   
    return cstr(ret)
  
  def get_party_det(self):
    party_det=sql("Select pan_number,address from `tabAccount` where name='%s'"%self.doc.party_name)
    ret = {
      'party_pan': cstr(party_det[0][0]) ,
      'party_address': cstr(party_det[0][1]),
    }
    
    return cstr(ret)
  
  def get_tds(self):
    self.doc.clear_table(self.doclist,'form_16A_tax_details')
    import datetime
    if self.doc.from_date and self.doc.to_date and self.doc.tds_category:
      
      party_tds_list=sql("select t2.amount_paid,t2.date_of_payment,t2.tds_main,t2.surcharge,t2.edu_cess, t2.sh_edu_cess,t2.total_tax_amount,t1.cheque_no,t1.bsr_code,t1.date_of_receipt,t1.challan_no from `tabTDS Payment` t1, `tabTDS Payment Detail` t2 where t1.tds_category='%s' and t2.party_name='%s' and t1.from_date>='%s' and t1.to_date<='%s' and t2.total_tax_amount>0 and t2.parent=t1.name and t1.docstatus = 1"%(self.doc.tds_category,self.doc.party_name,self.doc.from_date,self.doc.to_date))
      #msgprint(party_tds_list)
      for s in party_tds_list:
        child = addchild(self.doc, 'form_16A_tax_details', 'Form 16A Tax Detail', 1, self.doclist)
        
        child.amount_paid = s and flt(s[0]) or ''
        child.date_of_payment =s and s[1].strftime('%Y-%m-%d') or ''
        child.tds_main = s and flt(s[2]) or ''
        child.surcharge = s and flt(s[3]) or ''
        child.edu_cess = s and flt(s[4]) or ''
        child.sh_edu_cess = s and flt(s[5]) or ''
        child.total_tax_deposited = s and flt(s[6]) or ''
        child.cheque_no = s and s[7] or ''
        child.bsr_code = s and s[8] or ''
        child.tax_deposited_date = s and s[9].strftime('%Y-%m-%d') or ''
        child.challan_no = s and s[10] or ''
    else:
      msgprint("Plaese enter from date, to date and TDS category")
  
  def validate(self):
    tot=0.0
    for d in getlist(self.doclist,'form_16A_tax_details'):
      tot=flt(tot)+flt(d.total_tax_deposited)
    
    self.doc.total_amount = flt(tot)