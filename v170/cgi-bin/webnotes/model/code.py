import webnotes
import webnotes.model.doc

def execute(self, code, doc=None, doclist=[]):
	from webnotes import *
	from webnotes.utils import *
	from webnotes.model.doc import *
	from webnotes.model.doclist import getlist
	
	# execute it
	exec code in globals()
	
	# if doc
	if doc:
		d = DocType(doc, doclist)
		return d
	
def get_server_obj(doc, doclist = [], basedoctype = ''):
	import marshal
	dt = basedoctype and basedoctype or doc.doctype

	sc_compiled = webnotes.conn.get_value('DocType', dt, 'server_code_compiled')
	if sc_compiled:
		ex_code = marshal.loads(sc_compiled)
	if not sc_compiled:
		sc_core = cstr(webnotes.conn.get_value('DocType', dt, 'server_code_core'))
		sc = cstr(webnotes.conn.get_value('DocType', dt, 'server_code'))
		ex_code = sc_core + sc

	execute(ex_code, doc, doclist)

def get_obj(dt = None, dn = None, doc=None, doclist=[], with_children = 0):
	if dt:
		if not dn:
			dn = dt
		if with_children:
			doclist = webnotes.model.doc.get(dt, dn)
		else:
			doclist = [webnotes.model.doc.Document(dt, dn),]
		return get_server_obj(doclist[0], doclist)
	else:
		return get_server_obj(doc, doclist)
