import webnotes
import webnotes.model
import webnotes.model.doclist
import webnotes.model.doc

from webnotes.utils import cstr

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
		# really required??? --- check
		parent_dt = sql('select parent from tabDocField where fieldtype="Table" and options="%s" and (parent not like "old_parent:%%") limit 1' % self.name)
		return parent_dt and parent_dt[0][0] or ''

	def _get_client_script(self, match):
		name = match.group('name')
		csc = webnotes.conn.get_value('DocType',name,'client_script_core')
		cs = webnotes.conn.get_value('DocType',name,'client_script')
		return str(csc or '') + '\n' + str(cs or '')

	def _update_cache(self, cache_modified, modified, doclist):
		import zlib

		if not cache_modified:
			sql("INSERT INTO `__DocTypeCache` (`name`) VALUES ('%s')" % self.name)
		sql("UPDATE `__DocTypeCache` SET `modified`=%s, `content`=%s WHERE name=%s", (modified[0][0], zlib.compress(str([d.fields for d in doclist]),2), self.name))

	def _load_from_cache(self):
		import zlib
	
		doclist = eval(zlib.decompress(sql("SELECT content from `__DocTypeCache` where name='%s'" % self.name)[0][0]))
		return [webnotes.model.doc.Document(fielddata = d) for d in doclist]

	def _build_client_script(self, doclist):
		client_script = str(doclist[0].client_script_core or '') + '\n' + str(doclist[0].client_script or '')
		
		if client_script:
			import re
			p = re.compile('\$import\( (?P<name> [^)]*) \)', re.VERBOSE)
	
			# load it in __client_script as it will not interfere with the doctype
			doclist[0]._client_script = p.sub(self._get_client_script, client_script)
			
	def _load_select_options(self, doclist):
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


	def _clear_code(self, doclist):
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
			doclist = webnotes.model.doc.get('DocType', self.name)
			for t in tablefields: 
				doclist += webnotes.model.doc.get('DocType', t[0])

			# don't save compiled server code
			doclist[0].server_code_compiled = None
			
			self._update_cache(cache_modified, modified, doclist)
		else:
			doclist = self._load_from_cache()
	
		self._build_client_script(doclist)
		self._load_select_options(doclist)
		self._clear_code(doclist)

		return doclist

#=================================================================================

def scrub_field_names(doclist):
	restricted = ('name','parent','idx','owner','creation','modified','modified_by','parentfield','parenttype')
	for d in doclist:
		if d.parent and d.fieldtype:
			if (not d.fieldname) and (d.fieldtype.lower() in ('data', 'select', 'int', 'float', 'currency', 'table', 'text', 'link', 'date', 'code', 'check', 'read only', 'small text', 'time', 'text editor')):
				d.fieldname = d.label.strip().lower().replace(' ','_')
				if d.fieldname in restricted:
					d.fieldname = d.fieldname + '1'
				webnotes.conn.set(d, 'fieldname', d.fieldname)

def compile_code(doc):
	if doc.server_code or doc.server_code_core:
		import marshal
		try:
			code = compile(cstr(doc.server_code_core) + '\n' + cstr(doc.server_code), '<string>', 'exec')
			webnotes.conn.set(doc, 'server_code_compiled', marshal.dumps(code))
			webnotes.conn.set(doc, 'server_code_error', ' ')
		except:
			webnotes.conn.set(doc, 'server_code_error', '<pre>'+webnotes.utils.getTraceback()+'</pre>')

def change_modified_of_parent(doc):
	parent_list = webnotes.conn.sql('SELECT parent from tabDocField where fieldtype="Table" and options="%s"' % doc.name)
	for p in parent_list:
		webnotes.conn.sql('UPDATE tabDocType SET modified="%s" WHERE `name`="%s"' % (webnoes.utils.now(), p[0]))

def update_doctype(doclist):
	doc = doclist[0]
	
	# make field name from label
	scrub_field_names(doclist)
	
	# make schma changes
	import db_schema
	db_schema.updatedb(doc)
	
	# reload record
	for d in doclist:
		d.loadfromdb()
	
	# compile server code
	compile_code(doc)
		
	# change modifed of parent doctype (to clear the cache)
	change_modified_of_parent(doc)
	
#=================================================================================


def get(dt):
	doclist = _DocType(dt).make_doclist()
		
	return doclist
	
