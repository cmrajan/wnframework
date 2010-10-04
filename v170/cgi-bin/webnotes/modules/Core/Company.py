class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d,dl
  
  def create_root_accounts(self):
    glc = get_obj('GL Control')
    glc.add_ac(str({'account_name':'Source of Funds','group_or_ledger':'Group','debit_or_credit':'Credit','company':self.doc.name}))
    glc.add_ac(str({'account_name':'Application of Funds','group_or_ledger':'Group','debit_or_credit':'Debit','company' : self.doc.name}))
    glc.add_ac(str({'account_name':'Income','group_or_ledger':'Group','debit_or_credit':'Credit','company':self.doc.name}))
    glc.add_ac(str({'account_name':'Expenses','group_or_ledger':'Group','debit_or_credit':'Debit','company':self.doc.name}))
    rebuild_tree('Account','parent_account')
  
  def set_letter_head(self):
    if not self.doc.letter_head:
      if self.doc.address:
        header = """ 
<div><h3> %(comp)s </h3> %(add)s </div>

      """ % {'comp':self.doc.name,
         'add':self.doc.address.replace(NEWLINE,'<br>')}
       
        self.doc.letter_head = header
      else:
        msgprint("To create letter head enter address and save the document")
    

  def on_update(self):
    self.set_letter_head()
    ac = sql("select name from tabAccount where account_name='Income' and company=%s", self.doc.name)
    if not ac:
      self.create_root_accounts()
    cc = sql("select name from `tabCost Center` where cost_center_name = 'Root' and company_name = '%s'"%(self.doc.name))
    if not cc:
      self.create_root_cost_center()
      
  def create_root_cost_center(self):
    glc = get_obj('GL Control')
    glc.add_cc(str({'cost_center_name':'Root','company_name':self.doc.name,'company_abbr':self.doc.abbr,'group_or_ledger':'Group','is_active':'Yes','parent_cost_center':self.doc.parent_cost_center,'old_parent':''}))
    rebuild_tree('Cost Center','parent_cost_center')