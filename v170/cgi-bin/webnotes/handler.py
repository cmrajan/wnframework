import cgi, Cookie, sys, time, os
import webnotes
import webnotes.defs
import webnotes.utils

form = webnotes.form = cgi.FieldStorage()
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
	
	if webnotes.session.get('data') and webnotes.session['data'].get('profile'):
		p = webnotes.session['data']['profile']
		webnotes.response['profile'] = p
		webnotes.user = webnotes.profile.Profile()
		webnotes.user.load_from_session(p)
	else:
		webnotes.response['profile'] = webnotes.user.load_profile()

	doclist = []
	doclist += webnotes.model.doc.get('Control Panel')
	cp = doclist[0]
	
	doclist += webnotes.model.doctype.get('Event')

	webnotes.response['account_id'] = cp.account_id or ''
	webnotes.response['sysdefaults'] = webnotes.utils.get_defaults()
	webnotes.response['n_online'] = int(sql("SELECT COUNT(DISTINCT user) FROM tabSessions")[0][0] or 0)
	webnotes.response['docs'] = doclist
	webnotes.response['home_page'] = webnotes.widgets.page.get(webnotes.user.get_home_page())
	webnotes.response['start_items'] = webnotes.widgets.menus.get_menu_items()
	webnotes.session['data']['profile'] = webnotes.response['profile']

def cleanup_docs():
	if out.get('docs'):
		out['docs'] = webnotes.model.doclist.compress(out['docs'])
	if out.get('home_page'):
		out['home_page'] = webnotes.model.doclist.compress(out['home_page'])
		
def set_timezone():
	import os
	os.environ['TZ'] = hasattr(webnotes.defs, 'user_timezone') and webnotes.defs.user_timezone or 'Asia/Calcutta'
	try:
		time.tzset()
	except:
		pass # for Windows

set_timezone()
	

 # ------------------------------------------------------------------------------------

# Get user image
# --------------
def get_user_img(form,session):
	f = sql("select file_list from tabProfile where name=%s", form.getvalue('username',''))
	if f and f[0][0]:
		out['message'] = f[0][0].split(',')[1]
	else:
		out['message'] = 'no_img'


# Document Load
# -------------


def get_print_format(form, session):
	out['message'] = server.get_print_format(form.getvalue('name'))

def rename(form, session):
	if form.getvalue('dt') and form.getvalue('old') and form.getvalue('new'):
		server.rename(form.getvalue('dt'), form.getvalue('old'), form.getvalue('new'))
		
		getdoc(form, session)


	
# TO DO
# -----

def todo_clear_checked(form, session):
	cl = form.getvalue('cl').split('\1');
	cl = ['name="' + c  + '"' for c in cl]
	sql('delete from `tabToDo Item` where (%s)' % (' OR '.join(cl)))

# Document Save
# -------------

def load_report_list(form, session):
	out['rep_list'] = server.get_search_criteria_list(form.getvalue('dt'))

def get_doclist(clientlist):
	midx = 0
	for i in range(len(clientlist)):
		if clientlist[i]['name'] == form.getvalue('docname'):
			main_doc = server.Document(fielddata = clientlist[i])
			midx = i
		else:
			clientlist[i]=server.Document(fielddata = clientlist[i])

	del clientlist[midx]
	return main_doc, clientlist

def send_docs(doc, doclist):
	# cleanup
	#server.log("Doc Save", doc.name)
		
	out['docname'] = doc.name
	doclist = [doc] + doclist
	out['docs'] = server.compress_doclist(doclist)

def do_action(doc, doclist, so, method_name, docstatus):
	if so and hasattr(so, method_name):
		errmethod = method_name
		server.run_server_obj(so, method_name)
		if hasattr(so, 'custom_'+method_name):
			server.run_server_obj(so, 'custom_'+method_name)
		errmethod = ''

		for d in [doc] + doclist:
			server.set(d, 'docstatus', docstatus)
			
	else:
		for d in [doc] + doclist:
			server.set(d, 'docstatus', docstatus)

def savedocs(form, session):
	global errdoc, errdoctype, errmethod
	# action
	action = form.getvalue('action')
	
	# get docs	
	doc, doclist = get_doclist(server.expand_doclist(form.getvalue('docs')))
	errdoc = doc.name
	errdoctype = doc.doctype
		
	# get server object
	server_obj = server.get_server_obj(doc, doclist)
	
	# check for integrity / transaction safety
	res = sql('SELECT issingle FROM tabDocType WHERE name="%s"' % doc.doctype)
	if res:
		is_single = res[0][0]
	else:
		webnotes.errprint('DocType not found "%s"' % doc.doctype)
		return
		
	if (not is_single) and (not doc.fields.get('__islocal')):
		tmp = sql('SELECT modified FROM `tab%s` WHERE name="%s"' % (doc.doctype, doc.name))
		if tmp and str(tmp[0][0]) != str(doc.modified):
			webnotes.msgprint('Document has been modified after you have opened it. To maintain the integrity of the data, you will not be able to save your changes. Please refresh this document. [%s/%s]' % (tmp[0][0], doc.modified))
			return
	
	# validate links
	ret = server.validate_links_doclist([doc] + doclist)
	if ret:
		webnotes.msgprint("[Link Validation] Could not find the following values: %s. Please correct and resave. Document Not Saved." % ret)
		return

	# saving & post-saving
	try:

		# validate befor saving and submitting
		if action in ('Save', 'Submit') and server_obj:
			if hasattr(server_obj, 'validate'):	
				t = server.run_server_obj(server_obj, 'validate')
			if hasattr(server_obj, 'custom_validate'):
				t = server.run_server_obj(server_obj, 'custom_validate')
				
		# save main doc
		is_new = server.cint(doc.fields.get('__islocal'))
		if is_new and not doc.owner:
			doc.owner = form.getvalue('user')
		
		doc.modified, doc.modified_by = server.now(), session['user']
		
		try:
			t = doc.save(is_new)
		except NameError, e:
			webnotes.msgprint('Name Exists')
			raise e
		
		# save child docs
		for d in doclist:
			deleted, local = d.fields.get('__deleted',0), d.fields.get('__islocal',0)
	
			if server.cint(local) and server.cint(deleted):
				pass
			elif d.fields.has_key('parent'):
				if d.parent and (not d.parent.startswith('old_parent:')):
					d.parent = doc.name # rename if reqd
					d.parenttype = doc.doctype
				d.modified, d.modified_by = server.now(), session['user']
				d.save(new = server.cint(local))
	
		# on_update
		if action in ('Save','Submit') and server_obj:
			if hasattr(server_obj, 'on_update'):
				t = server.run_server_obj(server_obj, 'on_update')
				if t: webnotes.msgprint(t)
			if hasattr(server_obj, 'custom_on_update'):
				t = server.run_server_obj(server_obj, 'custom_on_update')
				if t: webnotes.msgprint(t)
				
		# on_submit
		if action == 'Submit':
			if sql("select docstatus from `tab%s` where name='%s'" % (doc.doctype, doc.name))[0][0] > 0:
				webnotes.msgprint("Cannot submit a record that has already been submitted. Please Refresh")
				raise Exception
			do_action(doc, doclist, server_obj, 'on_submit', 1)
	
		# on_cancel
		if action == 'Cancel':
			if sql("select docstatus from `tab%s` where name='%s'" % (doc.doctype, doc.name))[0][0] > 1:
				webnotes.msgprint("Cannot cancel a record that has already been cancelled. Please Refresh")
				raise Exception
			do_action(doc, doclist, server_obj, 'on_cancel', 2)
	
		webnotes.profile.update_recent(doc.doctype, doc.name)

		out['saved'] = '1'
		out['main_doc_name'] = doc.name
		send_docs(doc, doclist)
		
	except Exception, e:
		webnotes.msgprint('Did not save')
		webnotes.errprint(server.getTraceback())
		raise e

# DocType Mapper
# --------------

def dt_map(form, session):
	dt_list = server.expand_doclist(form.getvalue('docs'))
	from_doctype = form.getvalue('from_doctype')
	to_doctype = form.getvalue('to_doctype')
	from_docname = form.getvalue('from_docname')
	from_to_list = form.getvalue('from_to_list')
	
	dm = server.get_obj('DocType Mapper', from_doctype +'-' + to_doctype)
	doclist = dm.dt_map(from_doctype, to_doctype, from_docname, server.Document(fielddata = dt_list[0]), [], from_to_list)
	
	out['docs'] = server.compress_doclist(doclist)

# Get Fields
# ----------

def get_fields(form, session):
	r = {}
	args = {
		'select':form.getvalue('select')
		,'from':form.getvalue('from')
		,'where':form.getvalue('where')
	}
	ret = sql("select %(select)s from `%(from)s` where %(where)s limit 1" % args)
	if ret:
		fl, i = form.getvalue('fields').split(','), 0
		for f in fl:
			r[f], i = ret[0][i], i+1
	out['message']=r

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
	

def runserverobj(form, session):
	global errdoc, errdoctype, errmethod

	method = form.getvalue('method')
	errmethod = method
	doclist, clientlist = [], []
	arg = form.getvalue('arg')
	dt = form.getvalue('doctype')
	dn = form.getvalue('docname')
		
	if dt: # not called from a doctype (from a page)
		if not dn: dn = dt # single
		errdoc = dn
		errdoctype = dt
		so = server.get_obj(dt, dn)
	else:
		clientlist = server.expand_doclist(form.getvalue('docs'))

		# find main doc
		for d in clientlist:
			if server.cint(d.get('docstatus')) != 2 and not d.get('parent'):
				main_doc = server.Document(fielddata = d)
	
		# find client docs
		for d in clientlist:
			doc = server.Document(fielddata = d)
			if doc.fields.get('parent'):
				doclist.append(doc)	
	
		errdoc = main_doc.name
		errdoctype = main_doc.doctype
	
		so = server.get_server_obj(main_doc, doclist)
				
	if so:
		try:
			r = server.run_server_obj(so, method, arg)
			doclist = so.doclist # reference back [in case of null]
			if r:
				try:
					if r['doclist']:
						clientlist += r['doclist']
				except:
					pass
				out['message'] = r
			if clientlist:
				doclist.append(main_doc)
				out['docs'] = server.compress_doclist(doclist)
		except Exception, e:
			webnotes.errprint(server.getTraceback())
			raise e
				
# Load Month Events
# -----------------

def load_month_events(form, session):
	mm = form.getvalue('month')
	yy = form.getvalue('year')
	m_st = str(yy) + '-' + str(mm) + '-01'
	m_end = str(yy) + '-' + str(mm) + '-31'

	out['docs'] = server.compress_doclist(server.get_cal_events(m_st, m_end))

# Send Email
# ----------
def sendmail(form, session):
	recipients = form.getvalue('sendto')
	subject = form.getvalue('subject')
	sendfrom = form.getvalue('sendfrom')
	
	# get attachments
	al = []
	if server.cint(form.getvalue('with_attachments')):
		al = sql('select file_list from `tab%s` where name="%s"' % (form.getvalue('dt'), form.getvalue('dn')))
		if al:
			al = al[0][0].split('\n')
	if recipients:
		recipients = recipients.replace(';', ',')
		recipients = recipients.split(',')

		if not sendfrom:
			sendfrom = get_value('Control Panel',None,'auto_email_id')
		email = server.EMail(sendfrom, recipients, subject)
		email.cc = [form.getvalue('cc'),]

		email.set_message(form.getvalue('message') or 'No text')
		email.set_message(form.getvalue('body'))
		
		for a in al:
			email.attach(a.split(',')[0])

		email.send()
	webnotes.msgprint('Sent')

def get_contact_list(form, session):
	cond = ['`%s` like "%s%%"' % (f, form.getvalue('txt')) for f in form.getvalue('where').split(',')]
	cl = sql("select `%s` from `tab%s` where %s" % (
  			 form.getvalue('select')
			,form.getvalue('from')
			,' OR '.join(cond)
		)
	)
	out['cl'] = filter(None, [c[0] for c in cl])

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

# Logout
# ------

def logout(form, session):
	server.delete_session()
	cookies['sid150'] = ''
	cookies['remember_me'] = ''

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

	str_out = str(out)

	if acceptsGzip and len(str_out)>512:
		out_buf = compressBuf(str_out)
		print "Content-Encoding: gzip"
		print "Content-Length: %d" % (len(out_buf))
	print "Content-Type: text/html"
	if cookies:
		if webnotes.add_cookies: cookes.update(webnotes.add_cookies)
		print cookies
	print # Headers end
	
if out_buf:
	sys.stdout.write(out_buf)
elif str_out:
	print str_out
