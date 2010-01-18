import webnotes

from webnotes import *
from webnotes.utils import *
from webnotes.model.doc import *
from webnotes.model.doclist import getlist

set = webnotes.conn.set
sql = webnotes.conn.sql
get_value = webnotes.conn.get_value
convert_to_lists = webnotes.conn.convert_to_lists

version = 'v170'
NEWLINE = '\n'
	
def execute(code, doc=None, doclist=[]):
	# execute it
	exec code in globals()
	
	# if doc
	if doc:
		d = DocType(doc, doclist)
		return d
	
def get_server_obj(doc, doclist = [], basedoctype = ''):
	import marshal
	dt = basedoctype and basedoctype or doc.doctype

	# default code (if none is present
	ex_code = '''
class DocType:
	def __init__(self, d, dl):
		self.doc, self.doclist = d, dl'''

	sc_compiled = webnotes.conn.get_value('DocType', dt, 'server_code_compiled')
	if sc_compiled:
		ex_code = marshal.loads(sc_compiled)
	if not sc_compiled:
		sc_core = cstr(webnotes.conn.get_value('DocType', dt, 'server_code_core'))
		sc = cstr(webnotes.conn.get_value('DocType', dt, 'server_code'))
		
		if sc_core or sc:
			ex_code = sc_core + sc
	
	return execute(ex_code, doc, doclist)

def get_obj(dt = None, dn = None, doc=None, doclist=[], with_children = 0):
	if dt:
		if not dn:
			dn = dt
		if with_children:
			doclist = get(dt, dn)
		else:
			doclist = [Document(dt, dn),]
		return get_server_obj(doclist[0], doclist)
	else:
		return get_server_obj(doc, doclist)
		
def run_server_obj(server_obj, method_name, arg=None):
	if server_obj and hasattr(server_obj, method_name):
		if arg:
			return getattr(server_obj, method_name)(arg)
		else:
			return getattr(server_obj, method_name)()
