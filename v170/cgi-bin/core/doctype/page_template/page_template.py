class DocType:
  def __init__(self, d, dl):
    self.doc, self.doclist = d,dl

  # export
  def on_update(self):
    from webnotes.modules.export_module import export_to_files	
    export_to_files(record_list=[['Page Template', self.doc.name]])