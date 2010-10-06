class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d, dl
  
  def autoname(self):
    self.doc.name = make_autoname(self.doc.naming_series+'/.####')

  def get_pan_tan(self):
    comp_det=sql("Select pan_no,tan_no from `tabCompany` where name = '%s'"%(self.doc.company))
    if not comp_det:
      msgprint("No PAN or TAN number is mentioned in comapny")
      ret = {
      'pan_no':  '',
      'tan_no' :  ''
    }
    else:
      ret = {
        'pan_no': cstr(comp_det[0][0]) ,
        'tan_no' : cstr(comp_det[0][1]) 
      }
   
    return cstr(ret)
  
  def get_acc_head(self,args):
    args=eval(args)
    acc_head=sql("Select account_head from `tabTDS Category Account` where parent='%s' and account_type='%s'"%(self.doc.tds_category,args['acc_type']))
    acc_head = acc_head and acc_head[0][0] or ''
    ret = {'acc_head':acc_head, 'tds_value':args['tds_value']}
    return ret
  
  def get_tds_list(self):
    self.doc.clear_table(self.doclist,'tds_payment_details')
    
    self.doc.total_main_tds= 0
    self.doc.total_surcharge= 0
    self.doc.total_edu_cess= 0
    self.doc.total_sh_edu_cess= 0
    self.doc.total_tds= 0
    
    import datetime
    if self.doc.tds_category:
      if not self.doc.from_date or not self.doc.to_date:
        msgprint("Please enter from date and to date")
      else:
        pv_det= sql("Select name,credit_to,grand_total,posting_date from `tabPayable Voucher` where tds_category='%s' And posting_date<= '%s' And posting_date >='%s'  And docstatus=1 Order By posting_date"%(self.doc.tds_category,self.doc.to_date,self.doc.from_date))
        if pv_det:
          self.make_tds_table(pv_det)
        
        jv_det= sql("Select name, supplier_account, total_debit,posting_date from `tabJournal Voucher` where tds_category='%s' And posting_date<= '%s' And posting_date >='%s' And docstatus=1 Order By posting_date"%(self.doc.tds_category,self.doc.to_date,self.doc.from_date))
        if jv_det:
          self.make_tds_table(jv_det)
          
    else:
      msgprint("Please select tds category")

  def make_tds_table(self,det_touple):
   
    idx=1
    for v in det_touple:
      v_no=v and v[0] or ''
      if not sql("select name from `tabTDS Payment Detail` where voucher_no = '%s' and parent != '%s' and docstatus = 1" % (v_no, self.doc.name)):
        child = addchild(self.doc, 'tds_payment_details', 'TDS Payment Detail', 1, self.doclist)
        child.voucher_no = v_no
        child.party_name = v and v[1] or ''
        child.amount_paid = v and flt(v[2]) or ''
        child.date_of_payment =v and v[3].strftime('%Y-%m-%d') or ''
        
        tds_det = sql("Select `tabPV Ded Tax Detail`.tds_type,`tabPV Ded Tax Detail`.ded_amount from `tabPV Ded Tax Detail` where `tabPV Ded Tax Detail`.parent='%s'"%(v_no))
        
        for d in tds_det:
          
          if d[0]=='Main':
            child.tds_main=flt(d[1])
          elif d[0]=='Surcharge':
            child.surcharge=flt(d[1])
          elif d[0]=='Edu Cess':
            child.edu_cess=flt(d[1])
          elif d[0]=='SH Edu Cess':
            child.sh_edu_cess=flt(d[1])
        
        child.tds_main=child.tds_main
        child.surcharge=child.surcharge
        child.edu_cess=child.edu_cess
        child.sh_edu_cess=child.sh_edu_cess      
        child.total_tax_amount=flt(child.tds_main)+flt(child.surcharge)+flt(child.edu_cess)+flt(child.sh_edu_cess)
        child.idx=idx
        idx=idx+1
      
        self.doc.total_main_tds= flt(self.doc.total_main_tds)+flt(child.tds_main)
        self.doc.total_surcharge= flt(self.doc.total_surcharge)+flt(child.surcharge)
        self.doc.total_edu_cess= flt(self.doc.total_edu_cess)+flt(child.edu_cess)
        self.doc.total_sh_edu_cess= flt(self.doc.total_sh_edu_cess)+flt(child.sh_edu_cess)
        self.doc.total_tds= flt(self.doc.total_tds)+flt(child.total_tax_amount)

  def validate(self):
    if self.doc.amended_from and not self.doc.amendment_date:
      msgprint("Please Enter Amendment Date")
      raise Exception
  
  def check_bsr_code(self):
    if not self.doc.bsr_code or not self.doc.date_of_receipt or not self.doc.challan_no:
      msgprint("Voucher can not be submitted without Cheque/DD No and BSR Code and Date of Receipt and Challan ID No")
      raise Exception
  
  def on_submit(self):
    self.check_bsr_code()