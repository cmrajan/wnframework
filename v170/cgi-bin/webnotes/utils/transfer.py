import webnotes
from webnotes.model.doc import Document

def set_doc(doclist, ovr=0, ignore=1, onupdate=1):
	dt = doclist[0]['doctype']
	if dt=='DocType':
		ud = UpdateDocType(doclist)
	elif dt == 'Module Def':
		ud = UpdateModuleDef(doclist)
	elif dt == 'DocType Mapper':
		ud = UpdateDocTypeMapper(doclist)
	else:
		ud = UpdateDocument(doclist)

	ud.sync()
	return '\n'.join(ud.log)




#
# Class to sync incoming document
#
class UpdateDocument:
	def __init__(self, in_doclist=[]):
		self.in_doclist = in_doclist
		self.doc = Document(fielddata = in_doclist[0])
		self.modified = self.doc.modified # make a copy
		self.doclist = []
		
		self.log = []
		self.exists = 0

	# sync
	def sync(self):
		is_mod = self.is_modified()
		
		if (not self.exists) or (is_mod):
			webnotes.conn.begin()
			if self.exists:
				self.delete_existing()
			self.save()
			self.update_modified()
			self.run_on_update()
			webnotes.conn.commit()
	
	# check modified	
	def is_modified(self):
		timestamp = webnotes.conn.sql("select modified from `tab%s` where name=%s" % (self.doc.doctype, '%s'), self.doc.name)

		if timestamp:
			self.exists = 1
			if str(timestamp[0][0]) == self.doc.modified: 
				self.log.append('%s %s, No change' % (self.doc.doctype, self.doc.name))
			else: return 1
	
	# delete existing
	def delete_existing(self):
		from webnotes.model import delete_doc
		delete_doc(self.doc.doctype, self.doc.name)

	# update modified timestamp
	def update_modified(self):
		webnotes.conn.set(self.doc, 'modified', self.modified)
		
	def save(self):
		# parent
		self.doc.save(new = 1, ignore_fields = 1, check_links=0)
		self.doclist = [self.doc]
		self.save_children()
			
	def save_children(self):
		for df in self.in_doclist[1:]:
			self.save_one_doc(self, df)
			
	def save_one_doc(self, df, as_new=1):
		d = Document(fielddata = df)
		d.save(new = as_new, ignore_fields = 1, check_links=0)
		self.doclist.append(d)

	def run_on_update(self):
		from webnotes.model.code import get_server_obj
		so = get_server_obj(self.doc, self.doclist)
		if hasattr(so, 'on_update'):
			so.on_update()



#
# "Merge incoming doctype"
#
class UpdateDocumentMerge(UpdateDocument):
	def __init__(self, in_doclist):
		self.to_update_doctype = []
		UpdateDocument.__init__(self, in_doclist)

	def delete_existing(self):
		pass
		
	def get_id(self, d):
		pass
		
	def to_update(self, d):
		return 1
	
	def child_exists(self, d):
		return self.get_id(d)
		
	def on_save(self):
		pass
	
	def save(self):
		if self.exists:
			# save main doc
			self.keep_values(self.doc)
			self.doc.save(ignore_fields = 1, check_links=0)
			self.doclist.append(self.doc)
			self.save_children()
			self.on_save()
			self.log.append('Updated %s' % self.doc.name)
		else:
			UpdateDocument.save(self)
		
	def save_children(self):
		for df in self.in_doclist[1:]: 
			d = Document(fielddata = df)
			# update doctype?
			if d.doctype in self.to_update_doctype:
				# update this record?
				if self.to_update(d):
				
					# is it new?
					if self.child_exists(d):
						self.keep_values(d)
						d.save(ignore_fields = 1, check_links=0)
						self.log.append('updated %s, %s' % (d.doctype, d.name))
					else:
						d.save(1, ignore_fields = 1, check_links=0)
						self.log.append('new %s' % d.doctype)
			self.doclist.append(d)

	def keep_values(self, d):
		if hasattr(self, 'get_orignal_values'):
			ov = self.get_orignal_values(d)
			if ov:
				d.fields.update(ov)



#
# Class to sync incoming doctype
#
class UpdateDocType(UpdateDocumentMerge):
	def __init__(self, in_doclist):
		UpdateDocumentMerge.__init__(self, in_doclist)
		self.to_update_doctype = ['DocType', 'DocField']
		
	def to_udpate(self, d):
		if (d.fieldtype not in ['Section Break', 'Column Break', 'HTML']) and (d.fieldname or d.label):
			return 1
	
	def get_id(self, d):
		if d.fieldname:
			return webnotes.conn.sql("select name from tabDocField where fieldname=%s and parent=%s", (d.fieldname, d.parent))
		elif d.label:
			return webnotes.conn.sql("select name from tabDocField where label=%s and parent=%s", (d.label, d.parent))
				
	def on_save(self):
		self.renum()

	def child_exists(self, d):
		if d.doctype=='DocField':
			return self.get_id(d)
	
	def get_orignal_values(self, d):
		if d.doctype=='DocField':
			return {'name': self.get_id(d)[0][0]}

	# renumber the indexes	
	def renum(self):
		extra = self.get_extra_fields()
		self.clear_section_breaks()
		self.add_section_breaks_and_renum()
		self.fix_extra_fields(extra)

	# get fields not in the incoming list (to preserve order)
	def get_extra_fields(self):
		prev_field, prev_field_key, extra = '', '', []
		
		# get new fields and labels
		fieldnames = [d.get('fieldname') for d in self.in_doclist]
		labels = [d.get('label') for d in self.in_doclist]
		
		# check if all existing are present
		for f in webnotes.conn.sql("select fieldname, label, idx from tabDocField where parent=%s and fieldtype not in ('Section Break', 'Column Break', 'HTML') order by idx asc", self.doc.name):
			if f[0] and not f[0] in fieldnames:
				extra.append([f[0], f[1], prev_field, prev_field_key])
			elif f[1] and not f[1] in labels:
				extra.append([f[0], f[1], prev_field, prev_field_key])
				
			prev_field, prev_field_key = f[0] or f[1], f[0] and 'fieldname' or 'label'
		
		return extra

	# clear section breaks
	def clear_section_breaks(self):
		webnotes.conn.sql("delete from tabDocField where fieldtype in ('Section Break', 'Column Break', 'HTML') and parent=%s", self.doc.name)

	# add section breaks
	def add_section_breaks_and_renum(self):
		for d in self.in_doclist:
			if d.get('parentfield')=='fields':
				if d.get('fieldtype') in ('Section Break', 'Column Break', 'HTML'):
					tmp = Document(fielddata = d)
					tmp.fieldname = ''
					tmp.name = None
					tmp.save(1)
				else:
					webnotes.conn.sql("update tabDocField set idx=%s where %s=%s and parent=%s" % \
						('%s', d.get('fieldname') and 'fieldname' or 'label', '%s', '%s'), (d.get('idx'), d.get('fieldname') or d.get('label'), self.doc.name))


	# adjust the extra fields
	def fix_extra_fields(self, extra):	
		# push fields down at new idx
		for e in extra:
			# get idx of the prev to extra field
			idx = 0
			if e[2]:
				idx = webnotes.conn.sql("select idx from tabDocField where %s=%s and parent=%s" % (e[3], '%s', '%s'), (e[2], self.doc.name))
				idx = idx and idx[0][0] or 0
			
			if idx:
				webnotes.conn.sql("update tabDocField set idx=idx+1 where idx>%s and parent=%s", (idx, self.doc.name))	
				webnotes.conn.sql("update tabDocField set idx=%s where %s=%s and parent=%s" % \
					('%s', e[0] and 'fieldname' or 'label', '%s', '%s'), (idx+1, e[0] or e[1], self.doc.name))




#
# update module def
#
class UpdateModuleDef(UpdateDocumentMerge):
	def __init__(self, in_doclist):
		UpdateDocumentMerge.__init__(self, in_doclist)
		self.to_update_doctype = ['Module Def', 'Module Def Item']
			
	def get_id(self, d):
		webnotes.msgprint(d.doc_name)
		return webnotes.conn.sql("select name from `tabModule Def Item` where doc_type=%s and doc_name=%s and display_name=%s and parent=%s", (d.doc_type, d.doc_name, d.display_name, d.parent))
	
	def to_update(self, d):
		if d.doctype=='Module Def Item': return 1
	
	def get_orignal_values(self, d):
		if d.doctype=='Module Def Item':
			return {'name': self.get_id(d)[0][0]}
		if d.doctype=='Module Def':
			return sql("select module_seq, disabled, is_hidden from `tabModule Def` where name=%s", d.name, as_dict = 1)



#
# update module def
#
class UpdateDocTypeMapper(UpdateDocumentMerge):
	def __init__(self, in_doclist):
		UpdateDocumentMerge.__init__(self, in_doclist)
		self.to_update_doctype = ['Field Mapper Detail', 'Table Mapper Detail']
			
	def get_id(self, d):
		if d.doctype=='Field Mapper Detail':
			return webnotes.conn.sql("select name from `tabField Mapper Detail` where from_field=%s and to_field=%s and parent=%s", (d.from_field, d.to_field, d.parent))
		elif d.doctype=='Table Mapper Detail':
			return webnotes.conn.sql("select name from `tabTable Mapper Detail` where from_table=%s and to_table = %s and parent=%s", (d.from_table, d.to_table, d.parent))
		
	def get_orignal_values(self, d):
		if d.doctype in ['Field Mapper Detail', 'Table Mapper Detail']: 
			return {'name': self.get_id(d)[0][0]}


