import Cookie, sys, time, os
import webnotes
import webnotes.defs
import webnotes.utils

form = webnotes.form
cookies = Cookie.SimpleCookie()

out = webnotes.response

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
	import webnotes.model.doc
	import webnotes.model.doctype
	import webnotes.widgets.page
	import webnotes.widgets.menus
	import webnotes.profile
	
	webnotes.response['profile'] = webnotes.user.load_profile()

	doclist = []
	doclist += webnotes.model.doc.get('Control Panel')
	cp = doclist[0]
	
	doclist += webnotes.model.doctype.get('Event')
	home_page = webnotes.user.get_home_page()

	if home_page:
		doclist += webnotes.widgets.page.get(home_page)

	webnotes.response['account_name'] = cp.account_id or ''
	webnotes.response['sysdefaults'] = webnotes.utils.get_defaults()
	webnotes.response['n_online'] = int(sql("SELECT COUNT(DISTINCT user) FROM tabSessions")[0][0] or 0)
	webnotes.response['docs'] = doclist
	webnotes.response['home_page'] = home_page or ''
	webnotes.response['start_items'] = webnotes.widgets.menus.get_menu_items()
	webnotes.session['data']['profile'] = webnotes.response['profile']

def cleanup_docs():
	if out.get('docs'):
		out['docs'] = webnotes.model.doclist.compress(out['docs'])
		
def set_timezone():
	import os
	os.environ['TZ'] = hasattr(webnotes.defs, 'user_timezone') and webnotes.defs.user_timezone or 'Asia/Calcutta'
	try:
		time.tzset()
	except:
		pass # for Windows

set_timezone()

def runserverobj():
	import webnotes.widgets.form
	webnotes.widgets.form.runserverobj()

def logout():
	webnotes.auth_obj.logout()


# DocType Mapper
# ------------------------------------------------------------------------------------

def dt_map(form, session):
	import webnotes
	import webnotes.model.doclist
	from webnotes.model.code import get_obj
	from webnotes.model.doc import Document
	
	form = webnotes.form
	
	dt_list = webnotes.model.doclist.expand_doclist(form.getvalue('docs'))
	from_doctype = form.getvalue('from_doctype')
	to_doctype = form.getvalue('to_doctype')
	from_docname = form.getvalue('from_docname')
	from_to_list = form.getvalue('from_to_list')
	
	dm = get_obj('DocType Mapper', from_doctype +'-' + to_doctype)
	doclist = dm.dt_map(from_doctype, to_doctype, from_docname, Document(fielddata = dt_list[0]), [], from_to_list)
	
	out['docs'] = doclist

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
	from webnotes.utils import cint

	i = webnotes.model.import_docs.CSVImport()
	r = i.import_csv(form.getvalue('csv_file'), form.getvalue('dateformat'), cint(form.has_key('overwrite')))
		
	webnotes.response['type']='iframe'
	rhead = '''<style>body, html {font-family: Arial; font-size: 12px;}</style>'''
	webnotes.response['result']= rhead + r

def get_template():
	import webnotes.model.import_docs
	webnotes.model.import_docs.get_template()
	

# File Upload
# ------------------------------------------------------------------------------------

def uploadfile():
	form = webnotes.form
	from webnotes.model.doc import Document

	dt = form.getvalue('doctype')
	dn = form.getvalue('docname')
	at_id = form.getvalue('at_id')
		
	if 'filedata' in form:
		i = form['filedata']
      
		# create File Data record
		f = Document('File Data')
		f.blob_content = i.file.read()
		f.file_name = i.filename
		if '\\' in f.file_name:
			f.file_name = f.file_name.split('\\')[-1]
		if '/' in f.file_name:
			f.file_name = f.file_name.split('/')[-1]
		f.save(1)

		webnotes.response['result'] = """
		<script type='text/javascript'>
			window.parent._f.file_upload_done('%s', '%s', '%s', '%s', '%s');
			window.parent.frms['%s'].show_doc('%s');
		</script>""" % (dt, dn, f.name, f.file_name.replace("'", "\\'"), at_id, dt, dn)
	else:
		webnotes.response['result'] = """
		<script type='text/javascript'>msgprint("No file")</script>"""
	
	webnotes.response['type'] = 'iframe'

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

	res = webnotes.utils.get_file(form.getvalue('fname'))
	if res:
		webnotes.response['type'] = 'download'
		webnotes.response['filename'] = res[0][0]
		if hasattr(res[0][1], 'tostring'):
			webnotes.response['filecontent'] = res[0][1].tostring()
		else: 
			webnotes.response['filecontent'] = res[0][1]
	else:
		webnotes.msgprint('[get_file] Unknown file name')
		
# Get Graph
# ------------------------------------------------------------------------------------
def get_graph():
	form = webnotes.form

	import StringIO
	f = StringIO.StringIO()

	# call the object
	obj = server.get_obj(form.getvalue('dt'))
	plt = server.run_server_obj(obj, form.getvalue('method'), form.getvalue('arg'))
	plt.savefig(f)

	# stream out
	webnotes.response['type'] = 'download'
	webnotes.response['filename'] = webnotes.user.get_random_password() + '.png'
	webnotes.response['filecontent'] = f.getvalue()

# Reset Password
# ------------------------------------------------------------------------------------

def reset_password():
	form = webnotes.form
	
	act = form.getvalue('account', '')
	user = form.getvalue('user', '')
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

def start_test(form,session):
	webnotes.session['data']['__testing'] = 1

def end_test(form,session):
	webnotes.session['data']['__testing'] = 0

def setup_test(form, session):
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

def init_acc_mgmt(form,session):

	res = sql('SELECT name from tabDocType')	
	res = [r[0] for r in res]
	out['dt_list'] = res	
	out['acc_list'] = []

	db_name = incookies.get('dbx', server.db_name)
	if not db_name:
		db_name = server.db_name
		
	tab_list = server.sql_accounts("show tables")
	tab_list = [r[0] for r in tab_list]
		
	if 'tabAccount' in tab_list:
		try:
			res = server.sql_accounts('select ac_name from tabAccount')
			out['acc_list'] = [i[0] for i in res]
	
			ac_name = server.sql_accounts('select ac_name from tabAccount where db_name="%s"' % db_name)
			ac_name = ac_name and ac_name[0][0] or db_name
		except:
			ac_name = 'accounts'
	else:
		ac_name = 'accounts'

	out['account_id'] = db_name
	out['acc'] = ac_name
	out['user'] = session['user']

def get_modules(form, session):
	if form.has_key('ac_name') and form.getvalue('ac_name'):
		server.use_account(ac_name = form.getvalue('ac_name'))

	res = sql("select name from `tabModule Def`")
	out['mod_list'] = [i[0] for i in res]

def get_dt_version(form, session):
	if form.has_key('dn'):
		try:
			out['message'] = sql("select version from tabDocType where name=%s", form.getvalue('dn'))[0][0]
		except:
			out['message'] = 0

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

def export_module(form,session):
	dt_list = get_module_doctypes(form.getvalue('src'), form.getvalue('mod'))
	
	l = '['
	for d in dt_list:
		l += str(d.fields) + ",\n"
	
	out['export_data'] = l + ']'

def import_docs(form, session):
	if form.getvalue('tar'):
		server.use_account(ac_name = form.getvalue('tar'))
	webnotes.msgprint(server.import_docs(eval(form.getvalue('data'))))

# -------------
# Create Backup
# -------------

def backupdb(form, session):
	db_name = server.decrypt(form.getvalue('db_name'))

	server.backup_db(db_name)

	out['type'] = 'download'
	out['filename'] = db_name+'.tar.gz'
	out['filecontent'] = open('../backups/' + db_name+'.tar.gz','rb').read()

# Execution Starts Here
# ---------------------------------------------------------------------

import webnotes.auth
import webnotes.db

if form.has_key('cmd') and (form.getvalue('cmd')=='reset_password'):
	webnotes.conn = webnotes.db.Database(use_default = 1)
	sql = webnotes.conn.sql
	sql("START TRANSACTION")
	try:
		reset_password()
		sql("COMMIT")
	except Exception, e:
		webnotes.errprint(str(e))
		sql("ROLLBACK")
	
	
elif form.has_key('cmd') and (form.getvalue('cmd')=='prelogin'):
	# register
	# ----------------------------------
	import webnotes.model.code
	
	webnotes.conn = webnotes.db.Database(use_default = 1)
	sql("START TRANSACTION")
	try:
		out['message'] = webnotes.model.code.get_obj('Profile Control').prelogin(form) or ''
		sql("COMMIT")
	except:
		webnotes.errprint(webnotes.utils.getTraceback())
		sql("ROLLBACK")

else:

	try:
		webnotes.auth_obj = webnotes.auth.Authentication(form, cookies, out)
	
		if webnotes.conn:
			sql = webnotes.conn.sql
		
			# get command cmd
			cmd = form.has_key('cmd') and form.getvalue('cmd') or ''
			read_only = form.has_key('_read_only') and form.getvalue('_read_only') or None


			# load module
			module = ''
			if '.' in cmd:
				module = '.'.join(cmd.split('.')[:-1])
				cmd = cmd.split('.')[-1]
				
				exec 'from %s import %s' % (module, cmd) in locals()
	
			# execute
			if locals().has_key(cmd):
				if (not webnotes.conn.in_transaction): 
					sql("START TRANSACTION")
				
				locals()[cmd]()
						
				# update session
				webnotes.auth_obj.update()

				sql("COMMIT")
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

if out.get('type')=='csv':
	print "Content-Type: text/csv"
	print "Content-Disposition: filename="+out['doctype'].replace(' ', '_')+".csv"
	print
	print out['result']
elif out.get('type')=='iframe':
	print "Content-Type: text/html"
	print
	print out['result']
elif out.get('type')=='download':
	import mimetypes
	print "Content-Type: %s" % (mimetypes.guess_type(out['filename'])[0] or 'application/unknown')
	print "Content-Disposition: filename="+out['filename'].replace(' ', '_')
	print
	print out['filecontent']
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
		out['exc'] = '<pre>'+t.replace('\n','<br>')+'</pre>'

		if save_log: # don't save validation errors
			try:  save_log(t, 'Server')
			except: pass

	if webnotes.message_log:
		out['server_messages'] = '\n----------------\n'.join(webnotes.message_log)

	cleanup_docs()
	
	# Convert to JSON
	# ---------------
	try:
		import json
	except: # python 2.4
		import simplejson as json
		
	str_out = json.dumps(out)
	
	if acceptsGzip and len(str_out)>512:
		out_buf = compressBuf(str_out)
		print "Content-Encoding: gzip"
		print "Content-Length: %d" % (len(out_buf))
		
	print "Content-Type: text/html; Charset: ISO-8859-1"
	
	if cookies:
		if webnotes.add_cookies: cookes.update(webnotes.add_cookies)
		print cookies
	print # Headers end
	
if out_buf:
	sys.stdout.write(out_buf)
elif str_out:
	print str_out
