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
def startup():
	import webnotes.model.doc
	import webnotes.model.doctype
	import webnotes.widgets.page
	import webnotes.widgets.menus
	import webnotes.utils
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
	auth_obj.logout()


# DocType Mapper
# --------------

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

 # ------------------------------------------------------------------------------------


def rename(form, session):
	if form.getvalue('dt') and form.getvalue('old') and form.getvalue('new'):
		server.rename(form.getvalue('dt'), form.getvalue('old'), form.getvalue('new'))
		
		getdoc(form, session)


# File Upload
# -----------

def uploadfile(form, session):
	dt = form.getvalue('doctype')
	dn = form.getvalue('docname')
	at_id = form.getvalue('at_id')
		
	if 'filedata' in form:
		i = form['filedata']
      
		# create File Data record
		f = server.Document('File Data')
		f.blob_content = i.file.read()
		f.file_name = i.filename
		if '\\' in f.file_name:
			f.file_name = f.file_name.split('\\')[-1]
		if '/' in f.file_name:
			f.file_name = f.file_name.split('/')[-1]
		f.save(1)

		out['result'] = """
		<script type='text/javascript'>
			window.parent.file_upload_done('%s', '%s', '%s', '%s', '%s');
			window.parent.frms['%s'].show_doc('%s');
		</script>""" % (dt, dn, f.name, f.file_name.replace("'", "\\'"), at_id, dt, dn)
	else:
		out['result'] = """
		<script type='text/javascript'>window.parent.webnotes.msgprint("No file")</script>"""
	
	out['type'] = 'iframe'

# to be called by custom upload scripts
def upload_many(form, session):
	cp = server.get_obj('Control Panel')
	cp.upload_many(form)
	out['result'] = """
<script type='text/javascript'>
%s
</script>
%s
%s""" % (cp.upload_callback(form), '\n----\n'.join(message_log).replace("'", "\'"), '\n----\n'.join(webnotes.debug_log).replace("'", "\'").replace("\n","<br>"))
	out['type'] = 'iframe'

def remove_attach(form, session):
	fid = form.getvalue('fid')
	sql('delete from `tabFile Data` where name="%s"' % fid)
	
def downloadfile(form, session):
	fid = form.getvalue('file_id')
	res = sql("select file_name, `blob_content` from `tabFile Data` where name = '%s'" % fid)
	if res:
		out['type'] = 'download'
		out['filename'] = res[0][0]
		if hasattr(res[0][1], 'tostring'):
			out['filecontent'] = res[0][1].tostring()
		else: 
			out['filecontent'] = res[0][1]
	else:
		webnotes.msgprint('Unknown file id')

def get_file(form, session):

	res = server.get_file(form.getvalue('fname'))
	if res:
		out['type'] = 'download'
		out['filename'] = res[0][0]
		out['filecontent'] = res[0][1].tostring()
	else:
		webnotes.msgprint('[get_file] Unknown file name')
		
# Get Graph
# ------------------


def get_graph(form, session):
	import StringIO
	f = StringIO.StringIO()

	# call the object
	obj = server.get_obj(form.getvalue('dt'))
	plt = server.run_server_obj(obj, form.getvalue('method'), form.getvalue('arg'))
	plt.savefig(f)

	# stream out
	out['type'] = 'download'
	out['filename'] = server.random_password() + '.png'
	out['filecontent'] = f.getvalue()

# Data import
# -----------

def import_csv(form, session):
	d = server.Document('Control Panel', 'Control Panel')
	d.messages = form.getvalue('csv_file')
	if form.has_key('overwrite'):
		d.over_write = 1
	else:
		d.over_write = 0
	d.import_date_format = form.getvalue('dateformat')

	cp = server.get_obj(doc=d)
	cp.import_csv()
		
	out['type']='iframe'
	rhead = '''<style>body, html {font-family: Arial; font-size: 12px;}</style>'''
	out['result']= rhead + d.response

def get_template(form, session):
	from webnotes.utils import getCSVelement

	dt = form.getvalue('dt')
	pt, pf = '', ''
	
	# is table?
	dtd = sql("select istable, autoname from tabDocType where name='%s'" % dt)
	if dtd and dtd[0][0]:
		res1 = sql("select parent, fieldname from tabDocField where options='%s' and fieldtype='Table' and docstatus!=2" % dt)
		if res1:
			pt, pf = res1[0][0], res1[0][1]

	# line 1
	dset = []
	if pt and pf:
		fl = ['parent']
		line1 = '#,%s,%s,%s' % (getCSVelement(dt), getCSVelement(pt), getCSVelement(pf))
	else:
		if dtd[0][1]=='Prompt':
			fl = ['name']
		else:
			fl = []
		line1 = '#,%s' % getCSVelement(dt)
		
	# fieldnames
	res = sql("select fieldname, fieldtype from tabDocField where parent='%s' and docstatus!=2" % dt)
	for r in res:
		if not r[1] in server.no_value_fields:
			fl.append(getCSVelement(r[0]))
	
	dset.append(line1)
	dset.append(','.join(fl))
	
	txt = '\n'.join(dset)
	out['result'] = txt
	out['type'] = 'csv'
	out['doctype'] = dt
	


				
# Load Month Events
# -----------------

def load_month_events(form, session):
	mm = form.getvalue('month')
	yy = form.getvalue('year')
	m_st = str(yy) + '-' + str(mm) + '-01'
	m_end = str(yy) + '-' + str(mm) + '-31'

	out['docs'] = server.compress_doclist(server.get_cal_events(m_st, m_end))


# Reset Password
# --------------

def reset_password(form, session):
	act = form.getvalue('account', '')
	user = form.getvalue('user', '')
	if act:
		set_db_name(act)
	
	try:
		server.reset_password(user)
		webnotes.msgprint("Password has been reset and sent to your email id.")
	except Exception, e:
		webnotes.msgprint(str(e))

# Check Password
# --------------

def update_password(form, session):
	if sql("SELECT name FROM tabProfile WHERE password='%s' AND name='%s'" % (form.getvalue('newpwd'), form.getvalue('user'))):
		sql("UPDATE tabProfile SET password='%s' WHERE name='%s'" % (form.getvalue('oldpwd'), form.getvalue('user')))
		webnotes.msgprint('Password Reset')
	else:
		webnotes.msgprint('Old Password is not correct. Did not reset!')

# Testing
# -------

def start_test(form,session):
	session['data']['__testing'] = 1

def end_test(form,session):
	session['data']['__testing'] = 0

def setup_test(form, session):
	names = server.get_testing_tables()
	for n in names:
		ntest = 'test'+n[3:]
		if n.startswith('tab'):
			sql("DROP TABLE IF EXISTS `%s`" % ntest)
			sql("CREATE TABLE `%s` LIKE `%s`" % (ntest, n), allow_testing = 0)
			sql("INSERT INTO `%s` SELECT * FROM `%s`" % (ntest, n), allow_testing = 0)

# Export
# ------

def export_data(form, session):
	c = server.getcursor()
	c.execute("select * from `tab%s`" % form.getvalue('dt'))
	dataset = c.fetchall()
	
	l = []
	for r in dataset:			
		l.append(','.join([getCSVelement(i) for i in r]))
	
	txt = '\n'.join(l)
	out['export_data'] = (','.join([i[0] for i in c.description])) + '\n' + ('\n'.join(l))

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

# Error log
# ---------

def client_err_log(form, session):
	save_log(form.getvalue('error', 'Client'))

def save_log(t, errtype = ''):
	l = server.Document('Error Log')
	l.errtype = errtype or 'Server'
	l.user = session['user']
	l.time = server.nowdate()
	l.date = server.now()
	l.error = t
	try:
		l.save(1)
	except: #bc
		pass

# ----------------
# Loading
# ----------------

# login: app
def login_app(form,session):
	app = server.Document('Application',form.getvalue('app_name'))
	
	user = session["user"]
	if form.has_key("sub_id"):
		sub = server.Document('App Subscription',form.getvalue("sub_id"))
		# will be blank for global login
		if sub.remote_login_id and sub.remote_login_id != '__system@webnotestech.com': 
			user = sub.remote_login_id
		if sub.membership_type=='Administrator':
			user = 'Administrator'
	
	if app.server and app.pwd:
		fw = webnotes.utils.webservice.FrameworkServer(app.server, app.path, user, app.pwd, app.account_name)
		out['url'] = app.server + app.path
		out['sid'] = fw.sid
		out['__account'] = fw.account_id
		if fw.cookies.has_key('dbx'): out['dbx'] = fw.cookies['dbx']
	else:
		webnotes.msgprint("Application not defined correctly")

# Execution Starts Here
# ---------------------------------------------------------------------

import webnotes.auth
import webnotes.db

if form.has_key('cmd') and (form.getvalue('cmd')=='reset_password'):
	webnotes.conn = webnotes.db.Database(use_default = 1)
	sql("start transaction")
	reset_password(form, session)
	sql("commit")
	
elif form.has_key('cmd') and (form.getvalue('cmd')=='prelogin'):
	# register
	# ----------------------------------
	webnotes.conn = webnotes.db.Database(use_default = 1)
	sql("START TRANSACTION")
	try:
		out['message'] = server.get_obj('Profile Control').prelogin(form) or ''
		sql("COMMIT")
	except:
		webnotes.errprint(server.getTraceback())
		sql("ROLLBACK")

else:
	auth_obj = webnotes.auth.Authentication(form, cookies, out)

	if webnotes.conn:
		sql = webnotes.conn.sql
	
		# get command cmd
		cmd = form.has_key('cmd') and form.getvalue('cmd') or ''
		read_only = form.has_key('_read_only') and form.getvalue('_read_only') or None

		try:

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
						
				sql("COMMIT")
		except:
			webnotes.errprint(webnotes.utils.getTraceback())
			sql("ROLLBACK")

		# update session
		auth_obj.update()

#### cleanup
#-----------

if webnotes.conn.in_transaction:
	sql("COMMIT")

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
	
	if 0 and acceptsGzip and len(str_out)>512:
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
