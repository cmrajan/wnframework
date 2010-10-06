class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d,dl

  def autoname(self):
    account_id = sql("select UPPER(value) from tabSingles where doctype='Control Panel' and field='account_id'")[0][0]
    if account_id == 'BROWNIE':
      self.doc.name = make_autoname('MI/.####')
    elif account_id != 'BROWNIE' and self.doc.standard == 'No' and (self.doc.__isLocal==1 or self.doc.__isLocal==''):
      self.doc.name = make_autoname('MI/C/.####')

  def validate(self):
    account_id = sql("select UPPER(value) from tabSingles where doctype='Control Panel' and field='account_id'")[0][0]
    if account_id != 'BROWNIE' and (self.doc.__isLocal==1 or self.doc.__isLocal=='') and self.doc.standard == 'Yes':
      msgprint("Standard should be 'No' since it is customized Menu Item")
      raise Exception

    res = sql("select menu_item_label from `tabMenu Item` where name='%s'" % self.doc.parent_menu_item)
    self.doc.parent_menu_item_label = res and res[0][0] or ''
    sql("update `tabMenu Item` set parent_menu_item_label='%s' where parent_menu_item='%s'" % (self.doc.menu_item_label, self.doc.name))