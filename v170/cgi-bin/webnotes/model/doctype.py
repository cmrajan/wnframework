import webnotes
import webnotes.model
import webnotes.model.doclist
import webnotes.model.doc

sql = webnotes.conn.sql

class _DocType:
	def __init__(self, name):
		self.name = name
		
	def is_modified(self):
		is_modified = 0
		modified = sql("SELECT modified from tabDocType where name='%s'" % self.name, allow_testing=0)
		cache_modified = sql("SELECT modified from `__DocTypeCache` where name='%s'" % self.name)
		if not (cache_modified and modified[0][0]==cache_modified[0][0]):
			is_modified = 1
		return modified, is_modified, cache_modified	

	def get_parent_dt(self):
		parent_dt = sql('select parent from tabDocField where fieldtype="Table" and options="%s" and (parent not like "old_parent:%%") limit 1' % self.name)
		return parent_dt and parent_dt[0][0] or ''

	def get_client_script(match):
		name = match.group('name')
		csc = webnotes.conn.get_value('DocType',name,'client_script_core')
		cs = webnotes.conn.get_value('DocType',name,'client_script')
		return str(csc or '') + '\n' + str(cs or '')

	def update_cache(self, cache_modified, modified, doclist):
		import zlib

		if not cache_modified:
			sql("INSERT INTO `__DocTypeCache` (`name`) VALUES ('%s')" % self.name)
		sql("UPDATE `__DocTypeCache` SET `modified`=%s, `content`=%s WHERE name=%s", (modified[0][0], zlib.compress(str([d.fields for d in doclist]),2), self.name))

	def load_from_cache(self):
		import zlib
	
		doclist = eval(zlib.decompress(sql("SELECT content from `__DocTypeCache` where name='%s'" % self.name)[0][0]))
		return [webnotes.model.doc.Document(fielddata = d) for d in doclist]

	def build_client_script(self, doclist):
		client_script = str(doclist[0].client_script_core or '') + '\n' + str(doclist[0].client_script or '')
	
		if client_script:
			import re
			p = re.compile('\$import\( (?P<name> [^)]*) \)', re.VERBOSE)
	
			# load it in __client_script as it will not interfere with the doctype
			doclist[0].__client_script = p.sub(self.get_client_script, client_script)

	def load_select_options(self, doclist):
		for d in doclist:
			if d.doctype=='DocField' and d.fieldtype=='Select' and d.options and d.options[:5].lower()=='link:':
				op = d.options.split('\n')
				if len(op)>1 and op[1][:4].lower() == 'sql:':
					ol = sql(op[1][4:].replace('__user', webnotes.session['user']))	
				else:
					t = op[0][5:].strip()
					op = op[1:]
					op = [oc.replace('__user', webnotes.session['user']) for oc in op]
					
					try:
						ol = sql("select name from `tab%s` where %s docstatus!=2 order by name asc" % (t, op and (' AND '.join(op) + ' AND ') or ''))
					except:
						webnotes.msgprint("Error in Select Options for %s" % d.fieldname)
				ol = [''] + [o[0] or '' for o in ol]
				d.options = '\n'.join(ol)


	def clear_code(self, doclist):
		if self.name != 'DocType':
			if doclist[0].server_code: doclist[0].server_code = None
			if doclist[0].server_code_core: doclist[0].server_code_core = None
			if doclist[0].client_script: doclist[0].client_script = None
			if doclist[0].client_script_core: doclist[0].client_script_core = None
		
		
	def make_doclist(self):
		tablefields = webnotes.model.get_table_fields(self.name)
		modified, is_modified, cache_modified = self.is_modified()

		if is_modified:
			# yes
			doclist = webnotes.doclist.make_doclist('DocType', self.name)
			for t in tablefields: 
				doclist += webnotes.doclist.make_doclist('DocType', t[0])

			# don't save compiled server code
			doclist[0].server_code_compiled = None
			
			self.update_cache(cache_modified, modified, doclist)
		else:
			doclist = self.load_from_cache()
	
		self.build_client_script(doclist)
		self.load_select_options(doclist)
		self.clear_code(doclist)

		return doclist

def get(dt):
	return _DocType(dt).make_doclist()

def getdoctype():
	# load parent doctype too
	form = webnotes.form
	
	dt = form.getvalue('doctype')
	with_parent = form.getvalue('with_parent')

	# with parent (called from report builder)
	if with_parent:
		parent_dt = self.get_parent_dt()
		if parent_dt:
			doclist = get(parent_dt)
			webnotes.response['parent_dt'] = parent_dt
	
	if not doclist:
		doclist = get(dt)
	
	# if single, send the record too
	if doclist[0].issingle:
		doclist += webnotes.model.doc.get(dt)

	# load search criteria for reports (all)
	doclist += get_search_criteria(dt)

	webnotes.response['docs'] = webnotes.model.doclist.compress(doclist)
	