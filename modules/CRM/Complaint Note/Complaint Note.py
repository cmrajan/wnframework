class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.prefix = is_testing and 'test' or 'tab'
    
  def autoname(self):
    self.doc.name = make_autoname('CN/' + self.doc.fiscal_year + '/.######')

  def get_customer_details(self):
    customer = Document('Customer', self.doc.customer_name)
    ret = {
      'customer_address' :customer.address or '',
      'customer_group'   :customer.customer_group or '',
      'customer_ref'     :customer.customer_ref or '',
      'zone'             :customer.zone or '',
      'territory'        :customer.territory or '' 
    }
    return str(ret)
    
  def get_company_details(self):
    company = Document('Company', self.doc.company_name)
    ret = {
      'company_abbr'  :company.abbr or ''
    }
    return str(ret)

  def on_submit(self):
    self.set_sms_msg(1)

  def on_cancel(self):
    set(self.doc,'status','Cancelled')
    self.set_sms_msg()

