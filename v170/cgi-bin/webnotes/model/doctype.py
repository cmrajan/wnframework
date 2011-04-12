"""
 DocType module
 ==============
 
 This module has the DocType class that represents a "DocType" as metadata.
 This is usually called by the form builder or report builder.

 Key functions:
	* manage cache - read / write
	* merge client-side scripts
	* compile server-side code
	* call updation of database schema

 Cache management:
	* Cache is stored in __DocTypeCache
"""

import webnotes
import webnotes.model
import webnotes.model.doclist
import webnotes.model.doc

from webnotes.utils import cstr

class _DocType:
	"""
	   The _DocType object is created internally using the module's `get` method.
	"""
	def __init__(self, name):
		self.name = name
	
	# is cache modified ?
	# =================================================================
	
	def is_modified(self):
		"""
		      returns 3 objects:
		      
		      * last modified date of the `DocType`
		      * whether the doctypes is modified after it was cached
		      * last modified date of the `DocType` from the cache
		"""		
		try:
			# doctype modified
			modified = webnotes.conn.sql("select modified from tabDocType where name=%s", self.name)[0][0]
	
			# cache modified
			cache_modified = webnotes.conn.sql("SELECT modified from `__DocTypeCache` where name='%s'" % self.name)[0][0]
			
		except IndexError, e:
			return 1

		return cache_modified != modified

	# write to cache
	# =================================================================

	def _update_cache(self, doclist):
		import zlib

		if webnotes.conn.sql("SELECT name FROM __DocTypeCache WHERE name=%s", self.name):
			webnotes.conn.sql("UPDATE `__DocTypeCache` SET `modified`=%s, `content`=%s WHERE name=%s", (doclist[0].modified, zlib.compress(str([d.fields for d in doclist]),2), self.name))
		else:
			webnotes.conn.sql("INSERT INTO `__DocTypeCache` (`name`, `modified`, `content`) VALUES (%s, %s, %s)" , (self.name, doclist[0].modified, zlib.compress(str([d.fields for d in doclist]))))

	# read from cache
	# =================================================================

	def _load_from_cache(self):
		import zlib
	
		doclist = eval(zlib.decompress(webnotes.conn.sql("SELECT content from `__DocTypeCache` where name=%s", self.name)[0][0]))
		return [webnotes.model.doc.Document(fielddata = d) for d in doclist]


	# load options for "link:" type 'Select' fields
	# =================================================================
			
	def _load_select_options(self, doclist):
		for d in doclist:
			if d.doctype=='DocField' and d.fieldtype=='Select' and d.options and d.options[:5].lower()=='link:':
				op = d.options.split('\n')
				if len(op)>1 and op[1][:4].lower() == 'sql:':
					ol = webnotes.conn.sql(op[1][4:].replace('__user', webnotes.session['user']))	
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

	# clear un-necessary code from going to the client side
	# =================================================================

	def _clear_code(self, doclist):
		if self.name != 'DocType':
			if doclist[0].server_code: doclist[0].server_code = None
			if doclist[0].server_code_core: doclist[0].server_code_core = None
			if doclist[0].client_script: doclist[0].client_script = None
			if doclist[0].client_script_core: doclist[0].client_script_core = None
			doclist[0].server_code_compiled = None

	# write code to cache
	#=================================================================================
	
	def _add_compiled_code_to_cache(self, code, dt, modified):
		import marshal
		if webnotes.conn.sql("SELECT name FROM __DocTypeCache WHERE name=%s", dt):
			webnotes.conn.sql("UPDATE __DocTypeCache set server_code_compiled = %s, modified=%s WHERE name=%s", (marshal.dumps(code), modified, dt))
		else:
			webnotes.conn.sql("INSERT INTO __DocTypeCache (name, modified, server_code_compiled) VALUES (%s, %s, %s)", (dt, modified, marshal.dumps(code)))

		
	# build a list of all the records required for the DocType
	# =================================================================

	def make_doclist(self):
		"""
		      returns the :term:`doclist` for consumption by the client
		      
		      * it cleans up the server code
		      * executes all `$import` tags in client code
		      * replaces `link:` in the `Select` fields
		      * loads all related `Search Criteria`
		      * updates the cache
		"""
		from webnotes.modules import compress
		
		tablefields = webnotes.model.meta.get_table_fields(self.name)

		if self.is_modified():
			# yes
			doclist = webnotes.model.doc.get('DocType', self.name, 1)
			for t in tablefields: 
				doclist += webnotes.model.doc.get('DocType', t[0], 1)

			# don't save compiled server code

		else:
			doclist = self._load_from_cache()
			
		doclist[0].fields['__client_script'] = compress.get_doctype_js(self.name)
		self._load_select_options(doclist)
		self._clear_code(doclist)

		return doclist

def clear_cache():
	webnotes.conn.sql("delete from __DocTypeCache")
	
# Load "DocType" - called by form builder, report buider and from code.py (when there is no cache)
#=================================================================================================

def get(dt):
	"""
	Load "DocType" - called by form builder, report buider and from code.py (when there is no cache)
	"""
	doclist = _DocType(dt).make_doclist()
		
	return doclist
	 
