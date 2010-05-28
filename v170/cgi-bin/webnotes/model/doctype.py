import webnotes
import webnotes.model
import webnotes.model.doclist
import webnotes.model.doc

from webnotes.utils import cstr

# prefer Application Database for the schema (if exists)
sql = webnotes.app_conn and webnotes.app_conn.sql or webnotes.conn.sql

class _DocType:
	def __init__(self, name):
		self.name = name
		
	def is_modified(self):
		is_modified = 0
		modified = sql("SELECT modified from tabDocType where name='%s'" % self.name, allow_testing=0)
		cache_modified = webnotes.conn.sql("SELECT modified from `__DocTypeCache` where name='%s'" % self.name)
		if not (cache_modified and modified[0][0]==cache_modified[0][0]):
			is_modified = 1
		return modified, is_modified, cache_modified

	def get_parent_dt(self):
		# really required??? --- check
		parent_dt = sql('select parent from tabDocField where fieldtype="Table" and options="%s" and (parent not like "old_parent:%%") limit 1' % self.name)
		return parent_dt and parent_dt[0][0] or ''

	def _get_client_script(self, match):
		conn = webnotes.app_conn or webnotes.conn
		
		name = match.group('name')
		csc = conn.get_value('DocType',name,'client_script_core')
		cs = conn.get_value('DocType',name,'client_script')
		return str(csc or '') + '\n' + str(cs or '')

	def _update_cache(self, is_cache_modified, modified, doclist):
		import zlib

		if not is_cache_modified:
			webnotes.conn.sql("INSERT INTO `__DocTypeCache` (`name`) VALUES ('%s')" % self.name)
		webnotes.conn.sql("UPDATE `__DocTypeCache` SET `modified`=%s, `content`=%s WHERE name=%s", (modified[0][0], zlib.compress(str([d.fields for d in doclist]),2), self.name))

		# cache the code
		compile_code(doclist[0])

	def _load_from_cache(self):
		import zlib
	
		doclist = eval(zlib.decompress(webnotes.conn.sql("SELECT content from `__DocTypeCache` where name=%s", self.name)[0][0]))
		return [webnotes.model.doc.Document(fielddata = d) for d in doclist]

	def _build_client_script(self, doclist):
		# get custom (if present)
		custom = get_custom_script(self.name, 'Client')

		client_script = [str(doclist[0].client_script_core or ''), str(doclist[0].client_script or ''), (custom or '')]

		# make into a single script
		client_script = '\n'.join(client_script)
		
		# compile for import
		if client_script.strip():
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
						# select options will always come from the user db
						ol = webnotes.conn.sql("select name from `tab%s` where %s docstatus!=2 order by name asc" % (t, op and (' AND '.join(op) + ' AND ') or ''))
					except:
						ol = []
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
		modified, is_modified, is_cache_modified = self.is_modified()

		if is_modified:
			# yes
			doclist = webnotes.model.doc.get('DocType', self.name)
			for t in tablefields: 
				doclist += webnotes.model.doc.get('DocType', t[0])

			# don't save compiled server code
			doclist[0].server_code_compiled = None
			
			self._update_cache(is_cache_modified, modified, doclist)
		else:
			doclist = self._load_from_cache()
	
		self._build_client_script(doclist)
		self._load_select_options(doclist)
		self._clear_code(doclist)

		return doclist

#=================================================================================

def get_custom_script(dt, script_type):
	if 'tabCustom Script' in  [t[0] for t in webnotes.conn.sql("show tables")]:
		script = sql("select script from `tabCustom Script` where dt=%s and script_type=%s and ifnull(docstatus,0)<2", (dt, script_type))
		return script and script[0][0] or ''
	return ''

#=================================================================================
		
def scrub_field_names(doclist):
	restricted = ('name','parent','idx','owner','creation','modified','modified_by','parentfield','parenttype')
	conn = webnotes.app_conn or webnotes.conn
	
	for d in doclist:
		if d.parent and d.fieldtype:
			if (not d.fieldname) and (d.fieldtype.lower() in ('data', 'select', 'int', 'float', 'currency', 'table', 'text', 'link', 'date', 'code', 'check', 'read only', 'small text', 'time', 'text editor')):
				d.fieldname = d.label.strip().lower().replace(' ','_')
				if d.fieldname in restricted:
					d.fieldname = d.fieldname + '1'
				conn.set(d, 'fieldname', d.fieldname)

#=================================================================================

def _add_compiled_code_to_cache(code, dt, modified):
	import marshal
	if webnotes.conn.sql("select name from __DocTypeCache where name=%s", dt):
		webnotes.conn.sql("UPDATE __DocTypeCache set server_code_compiled = %s, modified=%s WHERE name=%s", (marshal.dumps(code), modified, dt))
	else:
		webnotes.conn.sql("INSERT INTO __DocTypeCache (name, modified, server_code_compiled) VALUES (%s, %s, %s)", (dt, modified, marshal.dumps(code)))

#=================================================================================

def compile_code(doc):
	conn = webnotes.app_conn or webnotes.conn
	std_code = '''class DocType:
	def __init__(self, d, dl):
		self.doc, self.doclist = d, dl'''

	custom = get_custom_script(doc.name, 'Server') or ''
	c = [doc.server_code_core or '', doc.server_code or '', custom or '']

	# add default code if no code
	# ---------------------------
	if not (c[0].strip() or c[1].strip() or c[2].strip()):
		c[0] = std_code

	code = None
		
	# compile code
	# ------------
	try:
		code = compile('\n'.join(c), '<string>', 'exec')
		conn.set(doc, 'server_code_error', ' ')
	except:
		conn.set(doc, 'server_code_error', '<pre>'+webnotes.utils.getTraceback()+'</pre>')
		code = compile(std_code, '<string>', 'exec')
				
	# add to cache
	# ------------
	if code:
		try:
			_add_compiled_code_to_cache(code, doc.name, doc.modified)
		except Exception, e:
			if e.args[0]==1054:
				# column not yet made - remove after some time
				sql("commit")
				webnotes.conn.sql("alter table __DocTypeCache add `server_code_compiled` text")
				sql("start transaction")
				
				# retry
				_add_compiled_code_to_cache(code, doc.name, doc.modified)
			else:
				raise e

#=================================================================================

def clear_cache():
	webnotes.conn.sql("update __DocTypeCache set modified=NULL")

def update_doctype(doclist):
	doc = doclist[0]
	
	# make field name from label
	scrub_field_names(doclist)
	
	# make schma changes
	import db_schema
	db_schema.updatedb(doc.name)
	
	# reload record
	for d in doclist:
		try:
			d.loadfromdb()
		except:
			pass
	
	# compile server code
	compile_code(doc)

	# change modifed of parent doctype (to clear the cache)
	clear_cache()
	
#=================================================================================

def get(dt):
	doclist = _DocType(dt).make_doclist()
		
	return doclist
	
