import webnotes

from webnotes import *
from webnotes.utils import *
from webnotes.model.doc import *
from webnotes.model.doclist import getlist

set = webnotes.conn.set
sql = webnotes.conn.sql
in_transaction = webnotes.conn.in_transaction
get_value = webnotes.conn.get_value
convert_to_lists = webnotes.conn.convert_to_lists

version = 'v170'
NEWLINE = '\n'
BACKSLASH = '\\'

#=================================================================================

def execute(code, doc=None, doclist=[]):
	# execute it
	exec code in globals()
	
	# if doc
	if doc:
		d = DocType(doc, doclist)
		return d

#=================================================================================

def get_server_obj(doc, doclist = [], basedoctype = ''):
	import marshal
	dt = basedoctype and basedoctype or doc.doctype

	# load from application or main
	sc_compiled = None
	
	try:
		# get compiled code
		sc_compiled = webnotes.conn.sql("select server_code_compiled from __DocTypeCache where name=%s", dt)[0][0]
		return execute(marshal.loads(sc_compiled), doc, doclist)
	except:
		# compile
		import webnotes.model.doctype
		webnotes.model.doctype.compile_code(Document('DocType', doc.doctype))

		# load
		sc_compiled = webnotes.conn.sql("select server_code_compiled from __DocTypeCache where name=%s", dt)
		if sc_compiled:
			return execute(marshal.loads(sc_compiled[0][0]), doc, doclist)
		
#=================================================================================

def get_obj(dt = None, dn = None, doc=None, doclist=[], with_children = 0):
	if dt:
		if not dn:
			dn = dt
		if with_children:
			doclist = get(dt, dn)
		else:
			doclist = get(dt, dn, with_children = 0)
		return get_server_obj(doclist[0], doclist)
	else:
		return get_server_obj(doc, doclist)

#=================================================================================

def run_server_obj(server_obj, method_name, arg=None):
	if server_obj and hasattr(server_obj, method_name):
		if arg:
			return getattr(server_obj, method_name)(arg)
		else:
			return getattr(server_obj, method_name)()
			
# deprecated methods to keep v160 apps happy
#=================================================================================

def updatedb(doctype, userfields = [], args = {}):
	pass

def check_syntax(code):
	return ''