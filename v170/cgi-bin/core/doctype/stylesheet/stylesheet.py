class DocType:
  def __init__(self, d, dl):
    self.doc, self.doclist = d,dl

  # export
  def on_update(self):
  	import webnotes.defs
  	
  	if hasattr(webnotes.defs, 'developer_mode') and webnotes.defs.developer_mode:
	    from webnotes.modules.export_module import export_to_files	
    	export_to_files(record_list=[['Stylesheet', self.doc.name]])
	