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
	out = None

	# execute it
	exec code in globals()
	
	# if doc
	if doc:
		d = DocType(doc, doclist)
		return d
		
	if out:
		return out

#=================================================================================

def _check_if_code_is_latest(dt):
	import webnotes
	m = webnotes.conn.sql("select modified from __DocTypeCache where name=%s", dt)
	if not m: return 0
	
	if webnotes.app_conn:
		m1 = webnotes.conn.sql("select modified from `tabDocType Update Register` where name=%s", dt)
	else:
		m1 = webnotes.conn.sql("select modified from `tabDocType` where name=%s", dt)

	if m1 and m1[0][0] == m[0][0]: 
		return 1
	else: 
		return 0

def get_server_obj(doc, doclist = [], basedoctype = ''):
	import marshal
	import webnotes
	
	dt = basedoctype and basedoctype or doc.doctype

	# load from application or main
	sc_compiled = None
	
	try:
		# get compiled code
		sc_compiled = webnotes.conn.sql("select server_code_compiled from __DocTypeCache where name=%s", dt)[0][0]
		#if not (sc_compiled and _check_if_code_is_latest(dt)):
		#	sc_compiled = None
			
	except:
		# no code yet
		sc_compiled = None

	if not sc_compiled:
		# compile
		import webnotes.model.doctype
		webnotes.model.doctype.get(doc.doctype)
		#webnotes.model.doctype.compile_code(Document('DocType', doc.doctype))

		# load
		sc_compiled = webnotes.conn.sql("select server_code_compiled from __DocTypeCache where name=%s", dt)
		sc_compiled = sc_compiled and sc_compiled[0][0]

	return execute(marshal.loads(sc_compiled), doc, doclist)

		
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