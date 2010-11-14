import Cookie, sys, os
import webnotes
import webnotes.defs
import webnotes.utils

form = webnotes.form
form_dict = webnotes.form_dict
cookies = Cookie.SimpleCookie()

sql = None
session = None
errdoc = ''
errdoctype = ''
errmethod = ''
fw_folder = '/Users/rushabh/workbench/www/'


# Logs

# refresh / start page
# ------------------------------------------------------------------------------------

def startup():
	import webnotes
	import webnotes.session_cache

	webnotes.response.update(webnotes.session_cache.get())

def cleanup_docs():
	import webnotes.model.doclist
	if webnotes.response.get('docs') and type(webnotes.response['docs'])!=dict:
		webnotes.response['docs'] = webnotes.model.doclist.compress(webnotes.response['docs'])

def runserverobj():
	import webnotes.widgets.form
	webnotes.widgets.form.runserverobj()

def logout():
	webnotes.auth_obj.logout()

# DocType Mapper
# ------------------------------------------------------------------------------------

def dt_map():
	import webnotes
	import webnotes.model.doclist
	from webnotes.model.code import get_obj
	from webnotes.model.doc import Document
	
	form_dict = webnotes.form_dict
	
	dt_list = webnotes.model.doclist.expand(form_dict.get('docs'))
	from_doctype = form_dict.get('from_doctype')
	to_doctype = form_dict.get('to_doctype')
	from_docname = form_dict.get('from_docname')
	from_to_list = form_dict.get('from_to_list')
	
	dm = get_obj('DocType Mapper', from_doctype +'-' + to_doctype)
	doclist = dm.dt_map(from_doctype, to_doctype, from_docname, Document(fielddata = dt_list[0]), [], from_to_list)
	
	webnotes.response['docs'] = doclist

# Load Month Events
# ------------------------------------------------------------------------------------

def load_month_events():
	import webnotes
	form = webnotes.form

	mm = form.getvalue('month')
	yy = form.getvalue('year')
	m_st = str(yy) + '-' + str(mm) + '-01'
	m_end = str(yy) + '-' + str(mm) + '-31'

	import webnotes.widgets.event
	webnotes.response['docs'] = webnotes.widgets.event.get_cal_events(m_st, m_end)

# Data import
# ------------------------------------------------------------------------------------

def import_csv():
	import webnotes.model.import_docs
	form = webnotes.form
	
	i = webnotes.model.import_docs.CSVImport()
	r = i.import_csv(form.getvalue('csv_file'), form.getvalue('dateformat'), form.getvalue('overwrite'))
		
	webnotes.response['type']='iframe'
	rhead = '''<style>body, html {font-family: Arial; font-size: 12px;}</style>'''
	webnotes.response['result']= rhead + r

def get_template():
	import webnotes.model.import_docs
	webnotes.model.import_docs.get_template()
	

# File Upload
# ------------------------------------------------------------------------------------

def uploadfile():
	import webnotes.utils.file_manager
	webnotes.utils.file_manager.upload()	
	
# File upload (from scripts)
# ------------------------------------------------------------------------------------

def upload_many():
	from webnotes.model.code import get_obj

	# pass it on to upload_many method in Control Panel
	cp = get_obj('Control Panel')
	cp.upload_many(webnotes.form)
	
	webnotes.response['result'] = """
<script type='text/javascript'>
%s
</script>
%s
%s""" % (cp.upload_callback(webnotes.form), '\n----\n'.join(webnotes.message_log).replace("'", "\'"), '\n----\n'.join(webnotes.debug_log).replace("'", "\'").replace("\n","<br>"))
	webnotes.response['type'] = 'iframe'


# File download
# ------------------------------------------------------------------------------------
def get_file():
	import webnotes.utils.file_manager

	res = webnotes.utils.file_manager.get_file(form.getvalue('fname'))
	if res:
		webnotes.response['type'] = 'download'
		webnotes.response['filename'] = res[0]
		
		if hasattr(res[1], 'tostring'):
			webnotes.response['filecontent'] = res[1].tostring()
		else: 
			webnotes.response['filecontent'] = res[1]
	else:
		webnotes.msgprint('[get_file] Unknown file name')
		
# Get Graph
# ------------------------------------------------------------------------------------
def get_graph():
	form = webnotes.form

	import StringIO
	f = StringIO.StringIO()

	# call the object
	obj = server.get_obj(form_dict.get('dt'))
	plt = server.run_server_obj(obj, form_dict.get('method'), form_dict.get('arg'))
	plt.savefig(f)

	# stream out
	webnotes.response['type'] = 'download'
	webnotes.response['filename'] = webnotes.user.get_random_password() + '.png'
	webnotes.response['filecontent'] = f.getvalue()

# Reset Password
# ------------------------------------------------------------------------------------

def reset_password():
	form_dict = webnotes.form_dict
	
	act = form_dict.get('account', '')
	user = form_dict.get('user', '')
	if act:
		webnotes.conn.set_db(act)

	try:
		p = webnotes.profile.Profile(user)
		p.reset_password()
		webnotes.msgprint("Password has been reset and sent to your email id.")
	except Exception, e:
		webnotes.msgprint(str(e))

# Testing
# ------------------------------------------------------------------------------------

def start_test(form_dict,session):
	webnotes.session['data']['__testing'] = 1

def end_test(form_dict,session):
	webnotes.session['data']['__testing'] = 0

def setup_test(form_dict, session):
	sql = webnotes.conn.sql
	names = webnotes.conn.get_testing_tables()
	for n in names:
		ntest = 'test'+n[3:]
		if n.startswith('tab'):
			sql("DROP TABLE IF EXISTS `%s`" % ntest)
			sql("CREATE TABLE `%s` LIKE `%s`" % (ntest, n), allow_testing = 0)
			sql("INSERT INTO `%s` SELECT * FROM `%s`" % (ntest, n), allow_testing = 0)

# Module Exchange
# ---------------

def init_acc_mgmt(form_dict,session):

	res = sql('SELECT name from tabDocType')	
	res = [r[0] for r in res]
	webnotes.response['dt_list'] = res	
	webnotes.response['acc_list'] = []

	db_name = incookies.get('dbx', server.db_name)
	if not db_name:
		db_name = server.db_name
		
	tab_list = server.sql_accounts("show tables")
	tab_list = [r[0] for r in tab_list]
		
	if 'tabAccount' in tab_list:
		try:
			res = server.sql_accounts('select ac_name from tabAccount')
			webnotes.response['acc_list'] = [i[0] for i in res]
	
			ac_name = server.sql_accounts('select ac_name from tabAccount where db_name="%s"' % db_name)
			ac_name = ac_name and ac_name[0][0] or db_name
		except:
			ac_name = 'accounts'
	else:
		ac_name = 'accounts'

	webnotes.response['account_id'] = db_name
	webnotes.response['acc'] = ac_name
	webnotes.response['user'] = session['user']

def get_modules(form_dict, session):
	if form_dict.has_key('ac_name') and form_dict.get('ac_name'):
		server.use_account(ac_name = form_dict.get('ac_name'))

	res = sql("select name from `tabModule Def`")
	webnotes.response['mod_list'] = [i[0] for i in res]

def get_dt_version(form_dict, session):
	if form_dict.has_key('dn'):
		try:
			webnotes.response['message'] = sql("select version from tabDocType where name=%s", form_dict.get('dn'))[0][0]
		except:
			webnotes.response['message'] = 0

def get_module_doctypes(src, mod):
	if src:
		server.use_account(ac_name = src)

	exp_list = server.get_module_items(mod)

	doc_list = []
	
	no_export_fields = ('creation','modified_by','owner','server_code_compiled','recent_documents','oldfieldtype','oldfieldname','superclass','ss_colourkey','has_monitors','onupdate','permtype','no_copy', 'print_hide','transaction_safe','setup_test')

	for e in exp_list:
		doc_list += server.getdoc(e[0], e[1])

		for d in doc_list:
			for f in no_export_fields:
				if d.fields.has_key(f): del d.fields[f]

	return doc_list

def export_module(form_dict,session):
	dt_list = get_module_doctypes(form_dict.get('src'), form_dict.get('mod'))
	
	l = '['
	for d in dt_list:
		l += str(d.fields) + ",\n"
	
	webnotes.response['export_data'] = l + ']'

def import_docs(form_dict, session):
	if form_dict.get('tar'):
		server.use_account(ac_name = form_dict.get('tar'))
	webnotes.msgprint(server.import_docs(eval(form_dict.get('data'))))

# -------------
# Create Backup
# -------------

def backupdb(form_dict, session):
	db_name = server.decrypt(form_dict.get('db_name'))

	server.backup_db(db_name)

	webnotes.response['type'] = 'download'
	webnotes.response['filename'] = db_name+'.tar.gz'
	webnotes.response['filecontent'] = open('../backups/' + db_name+'.tar.gz','rb').read()

# Execution Starts Here
# ---------------------------------------------------------------------

import webnotes.auth
import webnotes.db

# reset password
# ---------------------------------------------------------------------

if form_dict.has_key('cmd') and (form_dict.get('cmd')=='reset_password'):
	webnotes.conn = webnotes.db.Database(use_default = 1)
	sql = webnotes.conn.sql
	sql("START TRANSACTION")
	try:
		reset_password()
		sql("COMMIT")
	except Exception, e:
		webnotes.errprint(str(e))
		sql("ROLLBACK")
	
# pre-login access - for registration etc.
# ---------------------------------------------------------------------

elif form_dict.has_key('cmd') and (form_dict.get('cmd')=='prelogin'):
	webnotes.conn = webnotes.db.Database(use_default = 1)
	sql = webnotes.conn.sql
	webnotes.session = {'user':'Administrator'}

	import webnotes.model.code
	
	sql("START TRANSACTION")
	try:
		webnotes.response['message'] = webnotes.model.code.get_obj('Profile Control').prelogin(form_dict) or ''
		sql("COMMIT")
	except:
		webnotes.errprint(webnotes.utils.getTraceback())
		sql("ROLLBACK")

# main stuff
# ---------------------------------------------------------------------

else:

	try:
		webnotes.auth_obj = webnotes.auth.Authentication(form_dict, cookies, webnotes.response)
	
		if webnotes.conn:
			sql = webnotes.conn.sql
		
			# NOTE:
			# guest should only be allowed: 
			# getdoc (if Guest access)
			# runserverobj (if Guest access)
		
			# get command cmd
			cmd = form_dict.has_key('cmd') and form_dict.get('cmd') or ''
			read_only = form_dict.has_key('_read_only') and form_dict.get('_read_only') or None

			# load module
			if webnotes.session['user'] == 'Guest':
				if cmd not in ['runserverobj', 'webnotes.widgets.form_dict.getdoc','webnotes.widgets.form_dict.getdoctype','logout','webnotes.widgets.page.getpage','get_file','webnotes.widgets.query_builder.runquery','webnotes.widgets.form_dict.savedocs']:
					webnotes.msgprint('Guest not allowed to perform_dict this action')
					raise Exception

			module = ''
			if '.' in cmd:
				module = '.'.join(cmd.split('.')[:-1])
				cmd = cmd.split('.')[-1]

				
				exec 'from %s import %s' % (module, cmd) in locals()
	
			# execute
			if locals().has_key(cmd):
				if (not webnotes.conn.in_transaction) and (not read_only):
					sql("START TRANSACTION")
				
				locals()[cmd]()
						
				# update session
				webnotes.auth_obj.update()
				
				if webnotes.conn.in_transaction:
					sql("COMMIT")
			else:
				if cmd!='login':
					webnotes.msgprint('No Method: %s' % cmd)
	except:
		webnotes.errprint(webnotes.utils.getTraceback())

		if webnotes.conn and webnotes.conn.in_transaction and sql:
			sql("ROLLBACK")
			

#### cleanup
#-----------

if webnotes.conn:
	webnotes.conn.close()

#### go

import string
import os

acceptsGzip, out_buf, str_out = 0, None, None
try:
	if string.find(os.environ["HTTP_ACCEPT_ENCODING"], "gzip") != -1:
		acceptsGzip = 1 # problem in win ?
except:
	pass

def compressBuf(buf):
	import gzip, cStringIO
	zbuf = cStringIO.StringIO()
	zfile = gzip.GzipFile(mode = 'wb',  fileobj = zbuf, compresslevel = 5)
	zfile.write(buf)
	zfile.close()
	return zbuf.getvalue()

# CSV
# -------------------------------------------------------------------

if webnotes.response.get('type')=='csv':
	print "Content-Type: text/csv"
	print "Content-Disposition: attachment; filename="+webnotes.response['doctype'].replace(' ', '_')+".csv"
	print
	print webnotes.response['result']

# IFRAME
# -------------------------------------------------------------------

elif webnotes.response.get('type')=='iframe':
	print "Content-Type: text/html"
	print
	if webnotes.response.get('result'):
		print webnotes.response['result']
	if webnotes.debug_log:
		print '''<script type='text/javascript'>alert("%s");</script>''' % ('-------'.join(webnotes.debug_log).replace('"', '').replace('\n',''))

# file
# -------------------------------------------------------------------

elif webnotes.response.get('type')=='download':
	import mimetypes
	print "Content-Type: %s" % (mimetypes.guess_type(webnotes.response['filename'])[0] or 'application/unknown')
	print "Content-Disposition: filename="+webnotes.response['filename'].replace(' ', '_')
	print
	print webnotes.response['filecontent']

# JSON
# -------------------------------------------------------------------

else:
	if webnotes.debug_log:
		save_log = 1
		if webnotes.debug_log[0].startswith('[Validation Error]'):
			save_log = 0

		t = '\n----------------\n'.join(webnotes.debug_log)
		if errdoctype: 
			t = t + '\nDocType: ' + errdoctype
		if errdoc: 
			t = t + '\nName: ' + errdoc
		if errmethod: 
			t = t + '\nMethod: ' + errmethod
		webnotes.response['exc'] = '<pre>'+t.replace('\n','<br>')+'</pre>'

		if save_log: # don't save validation errors
			try:  save_log(t, 'Server')
			except: pass

	if webnotes.message_log:
		webnotes.response['server_messages'] = '\n----------------\n'.join(webnotes.message_log)

	cleanup_docs()
	
	# Convert to JSON
	# ---------------
	try:
		import json
	except: # python 2.4
		import simplejson as json
	
	try:
		str_out = json.dumps(webnotes.response)
	except:
		str_out = str(webnotes.response).replace(', None', ', ""')
	
	if acceptsGzip and len(str_out)>512:
		out_buf = compressBuf(str_out)
		print "Content-Encoding: gzip"
		print "Content-Length: %d" % (len(out_buf))
		
	print "Content-Type: text/html; Charset: ISO-8859-1"
	
	# if there ar additional cookies defined during the request, add them here
	if cookies or webnotes.add_cookies: 
		for c in webnotes.add_cookies.keys():
			cookies[c] = webnotes.add_cookies[c]
			
		print cookies
		
	print # Headers end
	
if out_buf:
	sys.stdout.write(out_buf)
elif str_out:
	print str_out
