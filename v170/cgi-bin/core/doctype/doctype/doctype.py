# Please edit this list and import only required elements
import webnotes

from webnotes.utils import now, cint
sql = webnotes.conn.sql
	
# -----------------------------------------------------------------------------------------


class DocType:
	def __init__(self, doc, doclist):
		self.doc = doc
		self.doclist = doclist

	def change_modified_of_parent(self):
		parent_list = sql('SELECT parent from tabDocField where fieldtype="Table" and options="%s"' % self.doc.name)
		for p in parent_list:
			sql('UPDATE tabDocType SET modified="%s" WHERE `name`="%s"' % (now(), p[0]))

	def scrub_field_names(self):
		restricted = ('name','parent','idx','owner','creation','modified','modified_by','parentfield','parenttype')
		for d in self.doclist:
			if d.parent and d.fieldtype:
				if (not d.fieldname) and (d.fieldtype.lower() in ('data', 'select', 'int', 'float', 'currency', 'table', 'text', 'link', 'date', 'code', 'check', 'read only', 'small_text', 'time')):
					d.fieldname = d.label.strip().lower().replace(' ','_')
					if d.fieldname in restricted:
						d.fieldname = d.fieldname + '1'
	
	def set_version(self):
		self.doc.version = cint(self.doc.version) + 1

	def validate(self):
		self.scrub_field_names()
		self.set_version()

	def on_update(self):
		# make schma changes
		from webnotes.model.db_schema import updatedb
		updatedb(self.doc.name)

		self.change_modified_of_parent()
		
		import webnotes.defs
		if hasattr(webnotes.defs, 'developer_mode') and webnotes.defs.developer_mode:
			self.export_doc()
		sql("delete from __DocTypeCache")
		
	def export_doc(self):
		from webnotes.modules.export_module import export_to_files
		export_to_files(record_list=[['DocType', self.doc.name]])
		
	def import_doc(self):
		from webnotes.modules.import_module import import_from_files
		import_from_files(record_list=[[self.doc.module, 'doctype', self.doc.name]])		
