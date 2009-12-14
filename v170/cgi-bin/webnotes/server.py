import time, defs, Cookie


## Globals

session = {'user':'Administrator'}
cookies = Cookie.SimpleCookie()

mail_server = defs.mail_server or 'localhost'
mail_login = defs.mail_login or 'test'
mail_password = defs.mail_password or 'test'

server_prefix = hasattr(defs, 'server_prefix') and defs.server_prefix or ''

mysql_path = hasattr(defs, 'mysql_path') and defs.mysql_path or ''
gateway_id = hasattr(defs, 'gateway_id') and defs.gateway_id or 's1u040'
gateway_ip = hasattr(defs, 'gateway_ip') and defs.gateway_ip or '72.55.168.105'

encryption_key = hasattr(defs,'encryption_key') and defs.encryption_key or '1234567890123456' # 16 digit


# Default timezone
# ----------------

user_timezone = 'Asia/Calcutta'
if hasattr(defs, 'user_timezone'):
	user_timezone = defs.user_timezone

# Globals
# --------

no_value_fields = ['Section Break', 'Column Break', 'HTML', 'Table', 'FlexTable', 'Button', 'Image', 'Graph']
default_fields = ['doctype','name','owner','creation','modified','modified_by','parent','parentfield','parenttype','idx','docstatus']

month_name = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

is_testing = 0
testing_tables = []

in_transaction = 0

NEWLINE = '\n'
NULL_CHAR = '^\5*'
BACKSLASH = '\\'

##
## UTILITY FUNCTIONS
##

import webnotes

def sql(query, values=(), allow_testing=1, as_dict = 0, as_list=0):
	if not webnotes.conn: 
		import webnotes.db
		webnotes.conn = webnotes.db.Database()
	return webnotes.conn.sql(query, values, as_dict, as_list, allow_testing)

# Run a query on the accounts server
def sql_accounts(query, values = ()):
	conn_a = webnotes.db.Database(use_default = 1)
	return conn_a.sql(query, values)

# Convert sql response to list
def convert_to_lists(res):
	return conn.convert_to_lists(res)
	
def set_timezone():
	import os
	os.environ['TZ'] = user_timezone
	try:
		time.tzset()
	except:
		pass # for Windows

# -------------------
# WEBSERVICE API
# -------------------

from webnotes.utils import *

#-----------------
# MODEL
#-----------------

def _get_print_format(match):
	name = match.group('name')
	content = sql('select html from `tabPrint Format` where name="%s"' % name)
	return content and content[0][0] or ''

def get_print_format(name):
	import re

	html = sql('select html from `tabPrint Format` where name="%s"' % name)
	html = html and html[0][0] or ''

	p = re.compile('\$import\( (?P<name> [^)]*) \)', re.VERBOSE)
	if html:
		out_html = p.sub(_get_print_format, html)
	return out_html

# Run Script
# ----------

def run_server_obj(server_obj, method_name, arg=None):
	if server_obj and hasattr(server_obj, method_name):
		if arg:
			return getattr(server_obj, method_name)(arg)
		else:
			return getattr(server_obj, method_name)()
		
# Check Script
# ------------

def check_syntax(code):
#	errprint(code)
	try: 
		codeobj = compile(code+'\n', '<string>', 'exec')
		return ''
	except: 
		return getTraceback()

from webnotes.model.doc import *

# Set, exec (Document functions)
# ------------------------------

def exec_report(code, res, colnames=[], colwidths=[], coltypes=[], coloptions=[], filter_values={}, query='', from_export=0):
	col_idx, i, out, style, header_html, footer_html, page_template = {}, 0, None, [], '', '', ''
	for c in colnames:
		col_idx[c] = i
		i+=1

	exec str(code)
	
	if out!=None:
		res = out
		
	return res, style, header_html, footer_html, page_template


# Series
# -------

def db_has_series(name, doctype):
	ttl = get_testing_tables()
	return sql("select name from tabSeries where name='%s'" % name, allow_testing = (doctype in ttl) and 0 or 1)

def db_series_next(name, doctype):
	ttl = get_testing_tables()
	sql("update tabSeries set current = current+1 where name='%s'" % name, allow_testing = (doctype in ttl) and 0 or 1)
	r = sql("select current from tabSeries where name='%s'" % name, allow_testing = (doctype in ttl) and 0 or 1)
	return r[0][0]

def db_make_series(name, doctype):
	ttl = get_testing_tables()
	return sql("insert into tabSeries (name, current) values ('%s', 1)" % name, allow_testing = (doctype in ttl) and 0 or 1)
	
# Model
# ------------

def db_exists(dt, dn):
	try:
		return sql('select name from `tab%s` where name="%s"' % (dt, dn.replace('"',"'")))
	except:
		return None

def db_gettablefields(doctype):
	return sql("select options, fieldname from tabDocField where parent='%s' and fieldtype='Table'" % doctype)

def get_value(doctype, docname, fieldname):
	return conn.get_value(doctype, docname, fieldname)

def db_getchildtype(doctype, fieldname):
	r = sql("select options from tabDocField where parent='%s' and fieldtype='Table' and fieldname = '%s'" % (doctype, fieldname))
	return r and r[0][0] or ''
	
# Encryption
# ----------

def generate_hash():
	import sha, time
	return sha.new(str(time.time())).hexdigest()
	
