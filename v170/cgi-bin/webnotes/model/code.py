custom_class = '''
# Please edit this list and import only required elements
import webnotes

from webnotes.utils import add_days, add_months, add_years, cint, cstr, date_diff, default_fields, flt, fmt_money, formatdate, generate_hash, getTraceback, get_defaults, get_first_day, get_last_day, getdate, has_common, month_name, now, nowdate, replace_newlines, sendmail, set_default, str_esc_quote, user_format, validate_email_add
from webnotes.model import db_exists
from webnotes.model.doc import Document, addchild, removechild, getchildren, make_autoname, SuperDocType
from webnotes.model.doclist import getlist, copy_doclist
from webnotes.model.code import get_obj, get_server_obj, run_server_obj, updatedb, check_syntax
from webnotes import session, form, is_testing, msgprint, errprint

set = webnotes.conn.set
sql = webnotes.conn.sql
get_value = webnotes.conn.get_value
in_transaction = webnotes.conn.in_transaction
convert_to_lists = webnotes.conn.convert_to_lists

# -----------------------------------------------------------------------------------------

class CustomDocType(DocType):
  def __init__(self, doc, doclist):
    DocType.__init__(self, doc, doclist)
'''


#=================================================================================
# execute a script with a lot of globals - deprecated
#=================================================================================

def execute(code, doc=None, doclist=[]):

	# functions used in server script of DocTypes
	# --------------------------------------------------	
	from webnotes.utils import add_days, add_months, add_years, cint, cstr, date_diff, default_fields, flt, fmt_money, formatdate, generate_hash, getTraceback, get_defaults, get_first_day, get_last_day, getdate, has_common, month_name, now, nowdate, replace_newlines, sendmail, set_default, str_esc_quote, user_format, validate_email_add
	from webnotes.model import db_exists
	from webnotes.model.doc import Document, addchild, removechild, getchildren, make_autoname, SuperDocType
	from webnotes.model.doclist import getlist, copy_doclist
	from webnotes import session, form, is_testing, msgprint, errprint

	import webnotes

	set = webnotes.conn.set
	sql = webnotes.conn.sql
	get_value = webnotes.conn.get_value
	in_transaction = webnotes.conn.in_transaction
	convert_to_lists = webnotes.conn.convert_to_lists
	if webnotes.user:
		get_roles = webnotes.user.get_roles
	locals().update({'get_obj':get_obj, 'get_server_obj':get_server_obj, 'run_server_obj':run_server_obj, 'updatedb':updatedb, 'check_syntax':check_syntax})
		
	version = 'v170'
	NEWLINE = '\n'
	BACKSLASH = '\\'

	# execute it
	# -----------------
	exec code in locals()
	
	# if doc
	# -----------------
	if doc:
		d = DocType(doc, doclist)
		return d
		
	if locals().get('page_html'):
		return page_html

	if locals().get('out'):
		return out

#=================================================================================
# load the DocType class from module & return an instance
#=================================================================================

def get_server_obj(doc, doclist = [], basedoctype = ''):

	# for test
	import webnotes
	

	# get doctype details
	dt_details = webnotes.conn.sql("select module, server_code from tabDocType where name=%s", doc.doctype)

	# no module specified (must be really old), can't get code so quit
	if not dt_details[0][0]:
		return
		
	module = dt_details[0][0].replace(' ','_').lower()
	dt = doc.doctype.replace(' ','_').lower()

	# import
	try:
		exec 'from %s.doctype.%s.%s import DocType' % (module, dt, dt)
	except ImportError, e:
		# declare it here
		class DocType:
			def __init__(self, d, dl):
				self.doc, self.doclist = d, dl

	# custom?
	if dt_details[0][1]:
		global custom_class		
		
		exec custom_class + dt_details[0][1].replace('\t','  ') in locals()
			
		return CustomDocType(doc, doclist)
	else:
		return DocType(doc, doclist)

#=================================================================================
# run a page method
#=================================================================================

def execute_page_method(module, page, method, arg=''):
	import webnotes

	# import module
	exec 'from %s.page.%s import %s' % (module, page, page)

	# run the method		
	if getattr(locals()[page], method):
		webnotes.response['message']  = getattr(locals()[page], method)(arg)

#=================================================================================
# get object (from dt and/or dn or doclist)
#=================================================================================



def get_obj(dt = None, dn = None, doc=None, doclist=[], with_children = 0):
	if dt:
		import webnotes.model.doc
	
		if not dn:
			dn = dt
		if with_children:
			doclist = webnotes.model.doc.get(dt, dn, from_get_obj=1)
		else:
			doclist = webnotes.model.doc.get(dt, dn, with_children = 0, from_get_obj=1)
		return get_server_obj(doclist[0], doclist)
	else:
		return get_server_obj(doc, doclist)
		
#=================================================================================
# get object and run method
#=================================================================================

def run_server_obj(server_obj, method_name, arg=None):
	if server_obj and hasattr(server_obj, method_name):
		if arg:
			return getattr(server_obj, method_name)(arg)
		else:
			return getattr(server_obj, method_name)()

#=================================================================================
# deprecated methods to keep v160 apps happy
#=================================================================================

def updatedb(doctype, userfields = [], args = {}):
	pass

def check_syntax(code):
	return ''

#===================================================================================
def get_code(module, dt, dn, extn, is_static=None):
	from webnotes.defs import modules_path
	from webnotes.modules import scrub
	import os, webnotes
	
	# get module (if required)
	if not module:
		module = webnotes.conn.sql("select module from `tab%s` where name=%s" % (dt,'%s'),dn)[0][0]
		
	# file names
	if dt != 'Control Panel':
		dt, dn = scrub(dt), scrub(dn)

	# get file name
	fname = dn + '.' + extn
	if is_static:
		fname = dn + '_static.' + extn

	# code
	try:
		file = open(os.path.join(modules_path, scrub(module), dt, dn, fname), 'r')
	except IOError, e:
		return ''
		
	code = file.read()
	file.close()
	return code
