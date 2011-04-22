# Please edit this list and import only required elements
import webnotes

from webnotes.utils import cint, flt
from webnotes.model.doc import Document
from webnotes.model.code import get_obj
from webnotes import session, form, is_testing, msgprint, errprint

sql = webnotes.conn.sql
get_value = webnotes.conn.get_value
	
# -----------------------------------------------------------------------------------------


class DocType:
	def __init__(self, doc, doclist):
		self.doc = doc
		self.doclist = doclist

	def on_update(self):
		# clear cache on save
		sql("delete from __SessionCache")

	def upload_many(self,form):
		form_name = form.getvalue('form_name')
		if form_name == 'File Browser':
			self.ret = get_obj('File Browser Control').upload_many(form)
		elif form_name == 'banner_options' or form_name == 'letter_head_options':
			self.ret = get_obj('Personalize Page Control').upload_many(form)

	def upload_callback(self,form):
		form_name = form.getvalue('form_name')
		if(self.ret) and form_name == 'File Browser':
			if self.ret == 'No file found.':
				return 'window.parent.msgprint("No file found.")'
			elif self.ret == 'File Group is mandatory.':
				return 'window.parent.msgprint("File Group is mandatory.")'
			else:
				ret = eval(self.ret)
				return "window.parent.pscript.load_child_nodes()"
		elif form_name == 'banner_options':
			if(self.ret == 'No file found'):
				return "window.parent.msgprint('Please select file to upload')"
			else:
				return "window.parent.pscript.set_pp_banner(); window.parent.pscript.upload_obj.obj.hide();"
		elif form_name == 'letter_head_options':
			if(self.ret == 'No file found'):
				return "window.parent.msgprint('Please select file to upload')"
			else:
				return "window.parent.pscript.set_pp_lh(); window.parent.pscript.upload_obj.obj.hide();"
