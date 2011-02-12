class DocType:
  def __init__(self, d, dl):
    self.doc, self.doclist = d,dl

  # replace $image
  # ------------------
  def validate(self):
    import re
    p = re.compile('\$image\( (?P<name> [^)]*) \)', re.VERBOSE)
    if self.doc.content:
      self.doc.content = p.sub(self.replace_by_img, self.doc.content)
  
  def replace_by_img(self, match):
    import webnotes
    name = match.group('name')
    return '<img src="cgi-bin/getfile.cgi?ac=%s&name=%s">' % (webnotes.conn.get('Control Panel', None, 'account_id'), name)
    
  # export
  def on_update(self):
	from webnotes.modules.export_module import export_to_files
	webnotes.msgprint(export_to_files(record_list=[['Page', self.doc.name]]))