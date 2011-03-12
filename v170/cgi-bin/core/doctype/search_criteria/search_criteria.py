# Please edit this list and import only required elements
import webnotes

sql = webnotes.conn.sql

	
# -----------------------------------------------------------------------------------------

class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d,dl

  def autoname(self):
    from webnotes.utils import cint
    
    if webnotes.session['user'].lower() == 'administrator' and self.doc.name.startswith('New Search'):
      self.doc.standard = 'Yes'
      series = sql("select name from `tabSearch Criteria` where name like 'STDSRCH/%' order by name desc limit 1")
      self.doc.name = 'STDSRCH/' + ('%.5i' % (series and cint(series[0][0][-5:])+1 or 1))
    elif webnotes.session['user'].lower() != 'administrator' and (not self.doc.standard or self.doc.standard == 'No'):
      self.doc.standard = 'No'
      series = sql("select name from `tabSearch Criteria` where name like 'CUSTOMSRCH/%' order by name desc limit 1")
      self.doc.name = 'CUSTOMSRCH/' + ('%.5i' % (series and cint(series[0][0][-5:])+1 or 1))

  def set_module(self):
    if not self.doc.module:
      doctype_module = sql("select module from tabDocType where name = '%s'" % (self.doc.doc_type))
      webnotes.conn.set(self.doc,'module',doctype_module and doctype_module[0][0] or 'NULL')

  def on_update(self):
    self.set_module()
    
    # export
    if self.doc.standard == 'Yes' and getattr(webnotes.defs, 'developer_mode', 0) == 1:
      from webnotes.modules.export_module import export_to_files
      export_to_files(record_list=[['Search Criteria', self.doc.name]])
