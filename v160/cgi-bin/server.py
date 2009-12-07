# Copyright 2005-2008, Rushabh Mehta (RMEHTA _AT_ GMAIL) 
#
#   Web Notes Framework is free software: you can redistribute it and/or modify
#	it under the terms of the GNU General Public License as published by
#	the Free Software Foundation, either version 3 of the License, or
#	(at your option) any later version.
#
#	This program is distributed in the hope that it will be useful,
#	but WITHOUT ANY WARRANTY; without even the implied warranty of
#	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#	GNU General Public License for more details.
#
#	For a copy of the GNU General Public License see 
#	<http://www.gnu.org/licenses/>.
#	
#	Web Notes Framework is also available under a commercial license with
#	patches, upgrades and support. For more information see 
#	<http://webnotestech.com>


import MySQLdb, time, defs, Cookie
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

# Default database
# ----------------

db_name = defs.db_name or 'test'
db_login = defs.db_login or 'root'
db_password = defs.db_password or 'test'
db_host = 'localhost'

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
sql_cursor = None

NEWLINE = '\n'
NULL_CHAR = '^\5*'
BACKSLASH = '\\'

##
## UTILITY FUNCTIONS
##

conn = None

def getcursor():
	global conn
	if not conn:
		make_conn()
	return conn.cursor()

def make_conn(my_db_name=None, my_db_login=None, my_db_pwd=None):
	global conn
	conn = None
	if not my_db_name: 
		my_db_name = db_name
	if not my_db_login: 
		my_db_login = db_login
	if not my_db_pwd: 
		my_db_pwd = db_password

	conn = MySQLdb.connect(user=my_db_login, host=db_host, passwd=my_db_pwd)
	conn.select_db(my_db_name)
	
def use_account(ac_name = None, my_db_name = None):
	my_db_login = None
	conn.close()
	if ac_name:
		res = sql_accounts('select db_name, db_login from tabAccount where ac_name = "%s"' % ac_name)
		if res: 
			my_db_name = res[0][0]
			my_db_login = res[0][1]
	if not my_db_login:
		my_db_login = my_db_name
	
	make_conn(my_db_name, my_db_login)

def get_testing_tables():
	global testing_tables
	if not testing_tables:
		testing_tables = ['tab'+r[0] for r in sql('SELECT name from tabDocType where docstatus<2 and (issingle=0 or issingle is null)', allow_testing = 0)]
		testing_tables+=['tabSeries','tabSingles'] # tabSessions is not included here
	return testing_tables

def scrub_query_for_testing(query):
	if is_testing:
		tl = get_testing_tables()
		for t in tl:
			query = query.replace(t, 'test' + t[3:])
	return query

def sql(query, values=(), allow_testing=1, as_dict = 0):
	global sql_cursor, in_transaction
	if is_testing and allow_testing:
		query = scrub_query_for_testing(query)
	sql_cursor = getcursor()

	# in transaction validations
	if in_transaction and query and query.strip().lower()=='start transaction':
		msgprint("[Implicit Commit Error] START TRANSACTION in transaction without commit or rollback")
		raise Exception, 'Implicit Commit Error'

	if query and query.strip().lower()=='start transaction':
		in_transaction = 1

	if query and query.strip().lower() in ['commit', 'rollback']:
		in_transaction = 0

	# execute
	if values != ():
		sql_cursor.execute(query, values)
	else:
		sql_cursor.execute(query)

	if is_testing:
		errprint(query)
	if as_dict:
		result = sql_cursor.fetchall()
		ret = []
		for r in result:
			dict = {}
			for i in range(len(r)):
				dict[sql_cursor.description[i][0]] = r[i]
			ret.append(dict)
		return ret
	else:
		return sql_cursor.fetchall()

# Run a query on the accounts server
def sql_accounts(query):
	conn_a = MySQLdb.connect(user=defs.db_login, host=db_host, passwd=db_password)
	conn_a.select_db(defs.db_name)

	cur = conn_a.cursor()
	cur.execute(query)

	return cur.fetchall()

# Convert sql response to list
def convert_to_lists(res):
	try: import decimal # for decimal Python 2.5 (?)
	except: pass
	nres = []
	for r in res:
		nr = []
		for c in r:
			try:
				if type(c)==decimal.Decimal: c=float(c)
			except: pass

			if c == None: c=''
			elif hasattr(c, 'seconds'): c = ':'.join(str(c).split(':')[:2])
			elif hasattr(c, 'strftime'): 
				try:
					c = c.strftime('%Y-%m-%d')
				except ValueError, e:
					c = 'ERR'
			elif type(c) == long: c = int(c)
			nr.append(c)
		nres.append(nr)
	return nres
	
def fetchoneDict(cursor):
	row = cursor.fetchone()
	if row is None:
		return None
	cols = [ d[0] for d in cursor.description ]
	return dict(zip(cols, row))
	
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

def dict_to_str(args, sep='&'):
	import urllib
	t = []
	for k in args.keys():
		t.append(str(k)+'='+urllib.quote(str(args[k] or '')))
	return sep.join(t)

class FrameworkServer:
	def __init__(self, wserver, path, user='', password='', account='', cookies={}, opts={}, https = 0):
		# validate
		if not (wserver and path):
			raise Exception, "Server address and path necessary"

		if not ((user and password) or (cookies)):
			raise Exception, "Either cookies or user/password necessary"
	
		self.wserver = wserver
		self.path = path
		self.cookies = cookies
		self.webservice_method='POST'
		self.account = account
		self.account_id = None
		self.https = https

		# login
		if not cookies:
			args = { 'usr': user, 'pwd': password, 'acx': account }
			
			for key in opts: # add additional keys
				args[key] = opts[key]
			
			res = self.http_get_response('login', args)
		
		
			ret = res.read()
			try:
				ret = eval(ret)
			except Exception, e:
				msgprint(ret)
				raise Exception, e
				
			if ret.get('message') and ret.get('message')!='Logged In':
				raise Exception, ret.get('message')
				
			self.account_id = ret.get('__account')
			self.sid = ret.get('sid150')

			self.set_sid(res)
			
	def http_get_response(self, method, args):
		# get response from remote server
	
		import httplib, urllib		

		args['cmd'] = method
		if self.account_id:
			args['__account'] = self.account_id

		headers = {}
		if self.cookies:
			headers['Cookie'] = dict_to_str(self.cookies, '; ')
	
		if self.webservice_method == 'POST':
			headers["ENCTYPE"] =  "multipart/form-data"
			headers["Accept"] = "text/plain, text/html, */*"
			headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8"
		
		if self.https:
			conn = httplib.HTTPSConnection(self.wserver)	
		else:
			conn = httplib.HTTPConnection(self.wserver)	
		conn.request(self.webservice_method, "%s/cgi-bin/run.cgi" % self.path, urllib.urlencode(args), headers=headers)
	
		return conn.getresponse()
	
	def set_sid(self, res):
		sid, dbx = '', ''
		h = res.getheader('set-cookie')
		if h:
			h=h.replace(',',';')
			cl = h.split(';')
			for c in cl:
				if c:
					t = c.split('=')
					self.cookies[t[0].strip(', ')] = t[1].strip()

	def runserverobj(self, doctype, docname, method, arg=''):
		res = self.http_get_response('runserverobj', args = {
			'doctype':doctype
			,'docname':docname
			,'method':method
			,'arg':arg
		})
		return eval(res.read())

# ----------
# EMAIL 
# ----------

# EMail Object

class EMail:
	def __init__(self, sender='', recipients=[], subject=''):
		from email.mime.multipart import MIMEMultipart
		if type(recipients)==str:
			recipients.replace(';', ',')
			recipients = recipients.split(',')
			
		self.sender = sender
		self.reply_to = sender
		self.recipients = recipients
		self.subject = subject
		self.msg = MIMEMultipart()
		self.cc = []
		
	def set_message(self, message, mime_type='text/html'):
		from email.mime.text import MIMEText
		
		maintype, subtype = mime_type.split('/')
		msg = MIMEText(message, _subtype = subtype)
		self.msg.attach(msg)
		
	def attach(self, n):
		res = get_file(n)

		from email.mime.audio import MIMEAudio
		from email.mime.base import MIMEBase
		from email.mime.image import MIMEImage
		from email.mime.text import MIMEText
			
		fname = res[0][0]
		fcontent = res[0][1]
		fmodified = res[0][2]
		
		import mimetypes

		ctype, encoding = mimetypes.guess_type(fname)
		if ctype is None or encoding is not None:
			# No guess could be made, or the file is encoded (compressed), so
			# use a generic bag-of-bits type.
			ctype = 'application/octet-stream'
		
		maintype, subtype = ctype.split('/', 1)
		if maintype == 'text':
			# Note: we should handle calculating the charset
			msg = MIMEText(fcontent, _subtype=subtype)
		elif maintype == 'image':
			msg = MIMEImage(fcontent, _subtype=subtype)
		elif maintype == 'audio':
			msg = MIMEAudio(fcontent, _subtype=subtype)
		else:
			msg = MIMEBase(maintype, subtype)
			msg.set_payload(fcontent)
			# Encode the payload using Base64
			encoders.encode_base64(msg)
		# Set the filename parameter
		msg.add_header('Content-Disposition', 'attachment', filename=fname)
		self.msg.attach(msg)
	
	def validate(self):
		# validate ids
		if self.sender and (not validate_email_add(self.sender)):
			raise Exception, "%s is not a valid email id" % self.sender

		if self.reply_to and (not validate_email_add(self.reply_to)):
			raise Exception, "%s is not a valid email id" % reply_to

		for e in self.recipients:
			if not validate_email_add(e):
				raise Exception, "%s is not a valid email id" % e	
	
	def setup(self):
		# get defaults from control panel
		cp = Document('Control Panel','Control Panel')
		self.server = cp.outgoing_mail_server and cp.outgoing_mail_server or mail_server
		self.login = cp.mail_login and cp.mail_login or mail_login
		self.port = cp.mail_port and cp.mail_port or None
		self.password = cp.mail_password and cp.mail_password or mail_password
		self.use_ssl = cint(cp.use_ssl)
	
	def send(self):
		self.setup()
		self.validate()
		
		import smtplib
		sess = smtplib.SMTP(self.server, cint(self.port))
		
		if self.use_ssl: 
			sess.ehlo()
			sess.starttls()
			sess.ehlo()
			
		ret = sess.login(self.login, self.password)

		# check if logged correctly
		if ret[0]!=235:
			msgprint(ret[1])
			raise Exception
		
		self.msg['Subject'] = self.subject
		self.msg['From'] = self.sender
		self.msg['To'] = ', '.join([r.strip() for r in self.recipients])
		self.msg['Reply-To'] = self.reply_to
		if self.cc:
			self.msg['CC'] = ', '.join([r.strip() for r in self.cc])
		
		sess.sendmail(self.sender, self.recipients, self.msg.as_string())
		
		try:
			sess.quit()
		except:
			pass
		
# validate
def validate_email_add(email_str):
	if email_str: email_str = email_str.strip()
	import re
	return re.match("^[a-zA-Z0-9._%-]+@[a-zA-Z0-9._%-]+.[a-zA-Z]{2,6}$", email_str)


# parts = [['content-type', 'body']]

def sendmail(recipients, sender='', msg='', subject='[No Subject]', parts=[], cc=[], attach=[]):
	if not sender:
		sender = get_value('Control Panel',None,'auto_mail_id')
	email = EMail(sender, recipients, subject)
	email.cc = cc
	if msg: email.set_message(msg)
	for p in parts:
		email.set_message(p[1])
	for a in attach:
		email.attach(a)

	email.set_message(get_value('Control Panel',None,'mail_footer') or '<div style="font-family: Arial; border-top: 1px solid #888; padding-top: 8px">Powered by <a href="http://www.webnotestech.com">Web Notes</a></div>')
	email.send()

#-----------------
# MODEL
#-----------------

def getdoc(doctype, name=''):
	if not name: 
		name=doctype
	doc = Document(doctype, name)
	tablefields = db_gettablefields(doctype)
	doclist = [doc,]
	for t in tablefields:
		doclist += getchildren(doc.name, t[0], t[1], doctype)

	return doclist

def delete_doc(doctype, name):
	tablefields = db_gettablefields(doctype)
	sql("delete from `tab%s` where name='%s' limit 1" % (doctype, name))
	for t in tablefields:
		sql("delete from `tab%s` where parent = '%s' and parentfield='%s'" % (t[0], name, t[1]))

def clear_recycle_bin():
	tl = sql('show tables')
	total_deleted = 0
	for t in tl:
		fl = [i[0] for i in sql('desc `%s`' % t[0])]
		
		if 'name' in fl:
			total_deleted += sql("select count(*) from `%s` where name like '__overwritten:%%'" % t[0])[0][0]
			sql("delete from `%s` where name like '__overwritten:%%'" % t[0])

		if 'parent' in fl:	
			total_deleted += sql("select count(*) from `%s` where parent like '__oldparent:%%'" % t[0])[0][0]
			sql("delete from `%s` where parent like '__oldparent:%%'" % t[0])
	
			total_deleted += sql("select count(*) from `%s` where parent like 'oldparent:%%'" % t[0])[0][0]
			sql("delete from `%s` where parent like 'oldparent:%%'" % t[0])

			total_deleted += sql("select count(*) from `%s` where parent like 'old_parent:%%'" % t[0])[0][0]
			sql("delete from `%s` where parent like 'old_parent:%%'" % t[0])

	msgprint("%s records deleted" % str(int(total_deleted)))

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

# $import for page
# ----------------

def _page_import(match):
	name = match.group('name')
	content = sql('select script from `tabPage` where name=%s', name)
	return content and content[0][0] or ''

def page_import(script):
	import re
	if not script:
		return ''

	p = re.compile('\$import\( (?P<name> [^)]*) \)', re.VERBOSE)
	return p.sub(_page_import, script)

def get_client_script(match):
	name = match.group('name')
	csc = get_value('DocType',name,'client_script_core')
	cs = get_value('DocType',name,'client_script')
	return cstr(csc) + '\n' + cstr(cs)

def xzip(a,b):
	d = {}
	for i in range(len(a)):
		d[a[i]] = b[i]
	return d
	
def expand_doclist(docs):
	import string
	
	N1 = "'" + NULL_CHAR + "'"
	N2 = '"' + NULL_CHAR + '"'
	docs = eval(docs.replace(chr(0),'').replace(N1, 'None').replace(N2, 'None'))
	clist = []
	for d in docs['_vl']:
		doc = xzip(docs['_kl'][d[0]], d);
		clist.append(doc)
	return clist

def compress_doclist(doclist):
	if doclist and hasattr(doclist[0],'fields'):
		docs = [d.fields for d in doclist]
	else:
		docs = doclist
		
	kl, vl = {}, []
	for d in docs:
		dt = d['doctype']
		if not (dt in kl.keys()):
			fl = d.keys()
			nl = ['doctype','localname','__oldparent','__unsaved']
			for f in fl:
				if not (f in nl): nl.append(f)
			kl[dt] = nl
		## values
		fl = kl[dt]
		nl = []
		for f in fl:
			v = d.get(f)
			if v==None:
				v=NULL_CHAR
			if type(v)==long:
				v=int(v)
			nl.append(v)
		vl.append(nl)
	#errprint(str({'_vl':vl,'_kl':kl}))
	return {'_vl':vl,'_kl':kl}

def is_doctype_modified(dt):
	is_modified = 0
	modified = sql("SELECT modified from tabDocType where name='%s'" % dt, allow_testing=0)
	cache_modified = sql("SELECT modified from `__DocTypeCache` where name='%s'" % dt)
	if not (cache_modified and modified[0][0]==cache_modified[0][0]):
		is_modified = 1
	return modified, is_modified, cache_modified

def getdoctype(name):
	import zlib

	tablefields = db_gettablefields(name)
	modified, is_modified, cache_modified = is_doctype_modified(name)

	if is_modified:
		# yes
		doclist = getdoc('DocType', name)
		for t in tablefields: 
			doclist += getdoc('DocType', t[0])

		# don't save compiled server code
		if doclist[0].server_code_compiled:
			doclist[0].server_code_compiled = None

		if not cache_modified:
			sql("INSERT INTO `__DocTypeCache` (`name`) VALUES ('%s')" % name)
		sql("UPDATE `__DocTypeCache` SET `modified`=%s, `content`=%s WHERE name=%s", (modified[0][0], zlib.compress(str([d.fields for d in doclist]),2), name))
	else:
		# no
		doclist = eval(zlib.decompress(sql("SELECT content from `__DocTypeCache` where name='%s'" % name)[0][0]))
		doclist = [Document(fielddata = d) for d in doclist]
	
	# client script import
	# --------------------

	client_script = cstr(doclist[0].client_script_core) + '\n' + cstr(doclist[0].client_script)

	if client_script:
		import re
		p = re.compile('\$import\( (?P<name> [^)]*) \)', re.VERBOSE)

		# load it in __client_script as it will not interfere with the doctype
		doclist[0].__client_script = p.sub(get_client_script, client_script)		
		
	# load options
	# ------------
	
	for d in doclist:
		if d.doctype=='DocField' and d.fieldtype=='Select' and d.options and d.options[:5].lower()=='link:':
			op = d.options.split('\n')
			if len(op)>1 and op[1][:4].lower() == 'sql:':
				ol = sql(op[1][4:].replace('__user', session['user']))	
			else:
				t = op[0][5:].strip()
				op = op[1:]
				op = [oc.replace('__user', session['user']) for oc in op]
				
				try:
					ol = sql("select name from `tab%s` where %s docstatus!=2 order by name asc" % (t, op and (' AND '.join(op) + ' AND ') or ''))
				except:
					msgprint("Error in Select Options for %s" % d.fieldname)
			ol = [''] + [o[0] or '' for o in ol]
			d.options = '\n'.join(ol)

	# clear scripts for faster loading
	# --------------------------------
	
	if name != 'DocType':
		if doclist[0].server_code: doclist[0].server_code = None
		if doclist[0].server_code_core: doclist[0].server_code_core = None
		if doclist[0].client_script: doclist[0].client_script = None
		if doclist[0].client_script_core: doclist[0].client_script_core = None

	return doclist

# Get Children
# ------------

def getchildren(name, childtype, field='', parenttype=''):
	global sql_cursor

	tmp = ''
	if field: 
		tmp = ' and parentfield="%s" ' % field
	if parenttype: 
		tmp = ' and parenttype="%s" ' % parenttype

	dataset = sql("select * from `tab%s` where parent='%s' %s order by idx" % (childtype, name, tmp))

	l = []
	for i in range(len(dataset)):
		d = Document()
		d.doctype = childtype
		d.loadfields(dataset, i, sql_cursor.description)
		l.append(d)
	return l

# Set Column Types
# ----------------

def getcoldef(ftype):
	t=ftype.lower()
	if t in ('date','int','text','time'):
		dt = t
	elif t in ('currency'): 
		dt = 'decimal(14,2)' 
	elif t in ('float'): 
		dt = 'decimal(14,6)' 
	elif t == 'small text':
		dt = 'text';
	elif t == 'check':
		dt = 'int(3)';
	elif t in ('long text', 'code', 'text editor'): 
		dt = 'text';
	elif t in ('data', 'link', 'password', 'select', 'read only'):
		dt = 'varchar(180)';
	elif t == 'blob':
		dt = 'longblob'
	else: dt = ''
	return dt

# Add Columns In Database
# -----------------------

def db_get_newfields(doctype):
	out = []
	flist = sql("SELECT DISTINCT fieldname, fieldtype, label FROM tabDocField WHERE parent='%s'" % doctype)

	exlist = [e[0] for e in sql("DESC `tab%s`" % (doctype))]
	
	for f in flist:
		if not (f[0] in exlist):
			out.append(f)
	return out
	
def addcolumns(doctype, userfields=[]):
	
	if userfields: 
		addlist = userfields
	else: 
		addlist = db_get_newfields(doctype)
		
	for f in addlist:
		ftype =  getcoldef(f[1])
		if ftype: 
			fn = f[0] # name or label
			if not fn:
				fn = f[2].strip().lower().replace(' ','_').replace('.','')
				fn = fn.replace('-','_').replace('&','and').replace('(', '').replace(')','')

			sql("alter table `tab%s` add `%s` %s" % (doctype, fn, ftype))

	if not userfields:
		# update flags
		sql(" UPDATE tabDocField SET oldfieldname = fieldname, oldfieldtype = fieldtype WHERE parent='%s' AND ((oldfieldname IS NULL) or (oldfieldname='')) " % (doctype))

# Add Indices
# -----------

def addindex(doctype):
	addlist = sql("SELECT DISTINCT fieldname FROM tabDocField WHERE search_index=1 and parent='%s'" % doctype)
	for f in addlist:
		try:
			sql("alter table `tab%s` add index %s(%s)" % (doctype, f[0], f[0]))
		except:
			pass

	# remove
	addlist = sql("SELECT DISTINCT fieldname FROM tabDocField WHERE IFNULL(search_index,0)=0 and parent='%s'" % doctype)
	for f in addlist:
		try:
			sql("alter table `tab%s` drop index %s" % (doctype, f[0]))
		except:
			pass

# update engine
# -------------

def update_engine(doctype=None, engine='InnoDB'):
	if doctype:
		sql("ALTER TABLE `tab%s` ENGINE = '%s'" % (doctype, engine))
	else:
		for t in sql("show tables"):
			sql("ALTER TABLE `%s` ENGINE = '%s'" % (t[0], engine))
		
# Update Columns In Database
# -----------------------

def change_column(dt, old_fn, new_fn, new_type, old_type, new_type_orig):
	if ((old_type.lower() in ['text','small text','code','text editor']) and (new_type_orig.lower() not in ['text', 'small text', 'code', 'text editor'])) or ((old_type.lower() in ['data','select','link']) and (new_type_orig.lower() in ['date','int','currency','float','time','table'])):
		msgprint('%s: Coversion from %s to %s is not allowed' % (new_fn, old_type, new_type_orig))
		raise Exception
	try:
		sql("alter table `tab%s` change `%s` `%s` %s" % (dt, old_fn, new_fn, new_type))
		msgprint("%s: Changed %s to %s" % (new_fn, old_type, new_type_orig))
	except:
		pass

			
def updatecolumns(doctype):
	# modify columns
	modifylist = sql(" SELECT oldfieldname, fieldname, fieldtype, oldfieldtype FROM tabDocField WHERE parent = '%s' AND (fieldname!=oldfieldname OR fieldtype!=oldfieldtype) AND !(fieldname IS NULL OR fieldname='') AND !(fieldtype IS NULL or fieldtype='')" % doctype)
	for f in modifylist:
		change_column(doctype, f[0], f[1], getcoldef(f[2]), f[3], f[2])
		sql("UPDATE tabDocField SET oldfieldname = fieldname, oldfieldtype = fieldtype WHERE parent= '%s'" % doctype)

# Get Checkbox Value
# -----------------------

def getcheckval(d, t):
	if d.fields.has_key(t):
		if d.fields[t]=='0' or (not d.fields[t]): return 0
		return 1
	else: return 0

# Make Database Changes
# -----------------------

def create_table(dt):
	sql("""
		create table `tab%s` (
			name varchar(120) not null primary key, 
			creation datetime, 
			modified datetime, 
			modified_by varchar(40), 
			owner varchar(40), 
			docstatus int(1) default 0, 
			parent varchar(120), 
			parentfield varchar(120), 
			parenttype varchar(120), 
			idx int(8),
			index parent(parent))""" % (dt))

def update_table(dt, userfields):
	# create table
	names = [rec[0].lower() for rec in sql('SHOW TABLES')]
	if not (('tab'+dt).lower() in names):  create_table(dt)

	# add columns
	addcolumns(dt, userfields)

	# update columns
	updatecolumns(dt)

	# update index
	addindex(dt)

	# update engine - always InnoDB
	update_engine(dt, 'InnoDB')

def updatedb(doctype, userfields = [], args = {}):
	istable = getcheckval(doctype, 'istable')
	issingle = getcheckval(doctype, 'issingle')

	if not issingle:
		update_table(doctype.name, userfields)
		
# Get Server Object
# -----------------

def get_server_obj(doc, doclist = [], superdoctype = ''):
	import marshal
	dt = superdoctype and superdoctype or doc.doctype

	sc_compiled = get_value('DocType', dt, 'server_code_compiled')
	if sc_compiled:
		ex_code = marshal.loads(sc_compiled)
	if not sc_compiled:
		sc_core = cstr(get_value('DocType', dt, 'server_code_core'))
		sc = cstr(get_value('DocType', dt, 'server_code'))
		ex_code = sc_core + sc

	if ex_code:
		exec ex_code in globals()
		d = DocType(doc, doclist)
		return d

def get_obj(dt = None, dn = None, doc=None, doclist=[], with_children = 0):
	if dt:
		if not dn:
			dn = dt
		if with_children:
			doclist = getdoc(dt, dn)
		else:
			doclist = [Document(dt, dn),]
		return get_server_obj(doclist[0], doclist)
	else:
		return get_server_obj(doc, doclist)

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

# Validate Multiple Links
# -----------------------

def validate_links_doclist(doclist):
	ref, err_list = {}, []
	for d in doclist:
		if not ref.get(d.doctype):
			ref[d.doctype] = d.make_link_list()
			
	err_list += d.validate_links(ref[d.doctype])
	return ', '.join(err_list)

# Get list of field values
# ------------------------

def getvaluelist(doclist, fieldname):
	l = []
	for d in doclist:
		l.append(d.fields[fieldname])
	return l 

class SuperDocType:
	def __init__(self):
		pass
		
	def __getattr__(self, name):
		if self.__dict__.has_key(name):
			return self.__dict__[name]
		elif self.super and hasattr(self.super, name):
			return getattr(self.super, name)
		else:
			raise AttributeError, 'SuperDocType Attribute Error'

class Document:
	def __init__(self, doctype = '', name = '', fielddata = {}):
		if fielddata: 
			self.fields = fielddata
		else: 
			self.fields = {}
		
		if not self.fields.has_key('name'):
			self.fields['name']='' # required on save
		if not self.fields.has_key('doctype'):
			self.fields['doctype']='' # required on save			
		if not self.fields.has_key('owner'):
			self.fields['owner']='' # required on save			

		if doctype:
			self.fields['doctype'] = doctype
		if name:
			self.fields['name'] = name
		self.__initialized = 1
			
		if (doctype and name):
			self.loadfromdb(doctype, name)

	# Load Document
	# -------------

	def loadfromdb(self, doctype = None, name = None):
		global sql_cursor
		
		if name: self.name = name
		if doctype: self.doctype = doctype
		
		r = sql("select issingle from tabDocType where name='%s'" % self.doctype)
		issingle = r and r[0][0] or 0
				
		if issingle:
			self.loadsingle()
		else:
			dataset = sql('select * from `tab%s` where name="%s"' % (self.doctype, self.name.replace('"', '\"')))
			if not dataset:
				msgprint('%s %s does not exist' % (self.doctype, self.name))
				raise Exception
			self.loadfields(dataset, 0, sql_cursor.description)

	# Load Fields from dataset
	# ------------------------

	def loadfields(self, dataset, rid, description):
		try: import decimal # for decimal Python 2.5 (?)
		except: pass
		import datetime
		for i in range(len(description)):
			v = dataset[rid][i]
			if type(v)==datetime.date:
				v = str(v)
			elif type(v)==datetime.timedelta:
				v = ':'.join(str(v).split(':')[:2])
			elif type(v)==datetime.datetime:
				v = str(v)
			elif type(v)==long: v=int(v)
			try:
				if type(v)==decimal.Decimal: v=float(v)
			except: pass
			
			self.fields[description[i][0]] = v

	# Load Single Type
	# ----------------

	def loadsingle(self):
		self.name = self.doctype
		dataset = sql("select field, value from tabSingles where doctype='%s'" % self.doctype)
		for d in dataset: self.fields[d[0]] = d[1]

	# Setter
	# ------
			
	def __setattr__(self, name, value):
		# normal attribute
		if not self.__dict__.has_key('_Document__initialized'): 
			self.__dict__[name] = value
		elif self.__dict__.has_key(name):
			self.__dict__[name] = value
		else:
			# field attribute
			f = self.__dict__['fields']
			f[name] = value

	# Getter
	# ------

	def __getattr__(self, name):
		if self.__dict__.has_key(name):
			return self.__dict__[name]
		elif self.fields.has_key(name):
			return self.fields[name]	
		else:
			return ''
	
	# Make New
	# --------
	
	def makenew(self, autoname, istable, case=''):
		global in_transaction
		so = get_server_obj(self, [])
		started_transaction = 0
		
		self.localname = self.name

		if self.amended_from:
			am_id = 1
			am_prefix = self.amended_from
			if sql('select amended_from from `tab%s` where name = "%s"' % (self.doctype, self.amended_from))[0][0] or '':
				am_id = cint(self.amended_from.split('-')[-1]) + 1
				am_prefix = '-'.join(self.amended_from.split('-')[:-1]) # except the last hyphen
			
			self.name = am_prefix + '-' + str(am_id)
		
		elif so and hasattr(so, 'autoname'):
			r = run_server_obj(so, 'autoname')
			if r:
				return r

		elif autoname and autoname.startswith('field:'):
			n = self.fields[autoname[6:]]
			if not n:
				raise Exception, 'Name is required'
			self.name = n.strip()
			
		elif self.fields.get('__newname',''): # new from client
			self.name = self.fields['__newname']

		elif autoname and autoname!='Prompt': # autoname
			self.name = make_autoname(autoname, self.doctype)

		elif istable:
			self.name = make_autoname('#########', self.doctype)

		if not self.owner:
			self.owner = session['user']

		if db_exists(self.doctype, self.name):
			raise NameError, 'Name %s already exists' % self.name
		
		if not self.name:
			return 'No Name Specified for %s' % self.doctype
		
		if case=='Title Case': self.name = self.name.title()
		if case=='UPPER CASE': self.name = self.name.upper()
		
		self.name = self.name.strip() # no leading and trailing blanks

		forbidden = ['%',"'",'"']
		for f in forbidden:
			if f in self.name:
				raise NameError, '%s not allowed in ID (name)' % f
		
		sql("""insert into 
			`tab%s` (name, owner, creation, modified, modified_by) 
			 values ('%s', '%s', '%s', '%s', '%s')""" % (self.doctype, self.name, session['user'], now(), now(), session['user']))


	# Update Values
	# ------------
	
	def update_single(self, link_list):
		update_str = ["(%s, 'modified', %s)",]
		values = [self.doctype, now()]
		
		sql("delete from tabSingles where doctype='%s'" % self.doctype)
		for f in self.fields.keys():
			if not (f in ('modified', 'doctype', 'name', 'perm', 'localname', 'creation'))\
				and (not f.startswith('__')): # fields not saved

				# validate links
				if link_list and link_list.get(f):
					self.fields[f] = self.validate_link(link_list[f], self.fields[f])

				if self.fields[f]==None:
					update_str.append("(%s,%s,NULL)")
					values.append(self.doctype)
					values.append(f)
				else:
					update_str.append("(%s,%s,%s)")
					values.append(self.doctype)
					values.append(f)
					values.append(self.fields[f])
		sql("insert into tabSingles(doctype, field, value) values %s" % (', '.join(update_str)), values)

	# Validate Links
	# --------------

	def validate_links(self, link_list):
		err_list = []
		for f in self.fields.keys():
			# validate links
			old_val = self.fields[f]
			if link_list and link_list.get(f):
				self.fields[f] = self.validate_link(link_list[f], self.fields[f])

			if old_val and not self.fields[f]:
				err_list.append(old_val)
				
		return err_list

	def make_link_list(self):
		res = sql("""
			SELECT fieldname, options
			FROM tabDocField
			WHERE parent='%s' and (fieldtype='Link' or (fieldtype='Select' and `options` like 'link:%%'))""" % (self.doctype))
			
		link_list = {}
		for i in res: link_list[i[0]] = i[1]
		return link_list
	
	def validate_link(self, dt, dn):
		if not dt: return dn
		if dt.lower().startswith('link:'):
			dt = dt[5:]
		if '\n' in dt:
			dt = dt.split('\n')[0]
		tmp = sql("""SELECT name FROM `tab%s` WHERE name = '%s' """ % (dt, dn))
		return tmp and tmp[0][0] or ''# match case
	
	def update_values(self, issingle, link_list, ignore_fields=0):
		if issingle:
			self.update_single(link_list)
		else:
			update_str, values = [], []
			# set modified timestamp
			self.modified = now()
			self.modified_by = session['user']
			for f in self.fields.keys():
				if (not (f in ('doctype', 'name', 'perm', 'localname', 'creation'))) \
					and (not f.startswith('__')): # fields not saved
					
					# validate links
					if link_list and link_list.get(f):
						self.fields[f] = self.validate_link(link_list[f], self.fields[f])

					if self.fields[f]==None:
						update_str.append("`%s`=NULL" % f)
						if ignore_fields:
							try: r = sql("update `tab%s` set `%s`=NULL where name=%s" % (self.doctype, f, '%s'), self.name)
							except: pass
					else:
						values.append(self.fields[f])
						update_str.append("`%s`=%s" % (f, '%s'))
						if ignore_fields:
							try: r = sql("update `tab%s` set `%s`=%s where name=%s" % (self.doctype, f, '%s', '%s'), (self.fields[f], self.name))
							except: pass
			if values:
				if not ignore_fields:
					# update all in one query
					r = sql("update `tab%s` set %s where name='%s'" % (self.doctype, ', '.join(update_str), self.name), values)
	
	# Save values
	# -----------
	
	def save(self, new=0, check_links=1, ignore_fields=0):

		autoname, issingle, istable, name_case = '', '', '', ''
		res = sql('select autoname, issingle, istable, name_case from tabDocType where name="%s"' % self.doctype)
		if res: 
			autoname, issingle, istable, name_case = res[0][0], res[0][1], res[0][2], res[0][3]
		
		# make new
		# ---------
		
		if not new and self.fields.get('__islocal'):
			new = 1
		if new and not issingle:
			r = self.makenew(autoname, istable, name_case)
			if r: 
				return r

		self.update_values(issingle, check_links and self.make_link_list() or {}, ignore_fields)
		
		# clear temp stuff
		keys = self.fields.keys()
		for f in keys:
			if f.startswith('__'): 
				del self.fields[f]

	def clear_table(self, doclist, tablefield, save=0):
		for d in getlist(doclist, tablefield):
			d.fields['__oldparent'] = d.parent
			d.parent = 'old_parent:' + d.parent # for client to send it back while saving
			d.docstatus = 2
			if save and not d.fields.get('__islocal'):
				d.save()
		self.fields['__unsaved'] = 1

# Add Child To Parent
# -------------------

def addchild(parent, fieldname, childtype = '', local=0, doclist=None):
	if not childtype:
		childtype = db_getchildtype(parent.doctype, fieldname)

	d = Document()
	d.parent = parent.name
	d.parenttype = parent.doctype
	d.parentfield = fieldname
	d.doctype = childtype
	d.docstatus = 0;
	d.name = ''
	d.owner = session['user']
	
	if local:
		d.fields['__islocal'] = '1' # for Client to identify unsaved doc
	else: 
		d.save(new=1)

	if doclist != None:
		doclist.append(d)

	return d

debug_log, message_log = [], []
def errprint(msg):
	debug_log.append(cstr(msg))
def msgprint(msg):
	message_log.append(cstr(msg))


# Set, exec (Document functions)
# ------------------------------

def set(doc, field, val):
	sql("update `tab"+doc.doctype+"` set `"+field+"`=%s where name=%s", (val, doc.name))
	doc.fields[field] = val

def exec_page(content, form = {}):
	out = ''
	exec content
	return out

def get_home_page():
	try:
		hpl = sql("select role, home_page from `tabDefault Home Page` where parent='Control Panel' order by idx asc")
		for h in hpl:
			if h[0] in session['data']['roles']:
				return h[1]
	except:
		pass
	return get_value('Control Panel',None,'home_page')


def exec_report(code, res, colnames=[], colwidths=[], coltypes=[], coloptions=[], filter_values={}, query='', from_export=0):
	col_idx, i, out, style, header_html, footer_html, page_template = {}, 0, None, [], '', '', ''
	for c in colnames:
		col_idx[c] = i
		i+=1

	exec str(code)
	
	if out!=None:
		res = out
		
	return res, style, header_html, footer_html, page_template

# Remove Child
# ------------

def removechild(d, is_local = 0):
	if not is_local:
		set(d, 'docstatus', 2)
		set(d, 'parent', 'old_parent:' + d.parent)
	else:
		d.parent = 'old_parent:' + d.parent
		d.docstatus = 2


# Make Autoname
# -------------

def make_autoname(key, doctype=''):
	n = ''
	l = key.split('.')
	for e in l:
		en = ''
		if e.startswith('#'):
			digits = len(e)
			en = getseries(n, digits, doctype)
		elif e=='YY': 
			import time
			en = time.strftime('%y')
		elif e=='MM': 
			import time
			en = time.strftime('%m')		
		elif e=='YYYY': 
			import time
			en = time.strftime('%Y')		
		else: en = e
		n+=en
	return n

# Get Series for Autoname
# -----------------------

def getseries(key, digits, doctype=''):
	if db_has_series(key, doctype):
		n = db_series_next(key, doctype)
	else:
		db_make_series(key, doctype)
		n = 1
	return ('%0'+str(digits)+'d') % n 

# Make Table Copy
# ---------------

def copytables(srctype, src, srcfield, tartype, tar, tarfield, srcfields, tarfields=[]):
	if not tarfields: 
		tarfields = srcfields
	l = []
	data = getchildren(src.name, srctype, srcfield)
	for d in data:
		newrow = addchild(tar, tarfield, tartype, local = 1)
		newrow.idx = d.idx
	
		for i in range(len(srcfields)):
			newrow.fields[tarfields[i]] = d.fields[srcfields[i]]
			
		l.append(newrow)
	return l

# Rename Doc
# ----------

def rename(dt, old, new, is_doctype = 0):
	# rename doc
	sql("update `tab%s` set name='%s' where name='%s'" % (dt, new, old))

	# get child docs
	ct = sql("select options from tabDocField where parent = '%s' and fieldtype='Table'" % dt)
	for c in ct:
		sql("update `tab%s` set parent='%s' where parent='%s'" % (c[0], new, old))

	# get links (link / select)
	ll = sql("select parent, fieldname from tabDocField where parent not like 'old%%' and ((options = '%s' and fieldtype='Link') or (options = 'link:%s' and fieldtype='Select'))" % (dt, dt))
	for l in ll:
		is_single = sql("select issingle from tabDocType where name = '%s'" % l[0])
		is_single = is_single and cint(is_single[0][0]) or 0
		if is_single:
			sql("update `tabSingles` set value='%s' where field='%s' and value = '%s' and doctype = '%s' " % (new, l[1], old, l[0]))
		else:
			sql("update `tab%s` set `%s`='%s' where `%s`='%s'" % (l[0], l[1], new, l[1], old))

	# doctype
	if is_doctype:
		sql("RENAME TABLE `tab%s` TO `tab%s`" % (old, new))

		# get child docs (update parenttype)
		ct = sql("select options from tabDocField where parent = '%s' and fieldtype='Table'" % new)
		for c in ct:
			sql("update `tab%s` set parenttype='%s' where parenttype='%s'" % (c[0], new, old))

# Doctype Loading
# ---------------

def get_roles():
	res = sql('select role from tabUserRole where parent = "%s"' % session['user'])
	roles = []
	for t in res:
		if t[0]: roles.append(t[0])
	if session['user'] == 'Guest':
		roles.append('Guest')
	else:
		roles.append('All')
	return roles

def get_create_list(roles):
	cl = []
	role_options = ["role = '"+r+"'" for r in roles]

	no_create_list =sql('select name from tabDocType where in_create = 1 or istable=1')
	no_create_list = [r[0] for r in no_create_list]

	if not roles: return []

	tmp = sql('select distinct parent from `tabDocPerm` where `create`=1 AND (%s) order by parent' % (' OR '.join(role_options)))
	for f in tmp:
		if f[0] and (not f[0].lower().startswith('old_parent:')) and (not f[0] in cl) and (not f[0] in no_create_list):
			cl.append(f[0])
	return cl
	
# Get Children List (for scripts utility)
# ---------------------------------------

def getlist(doclist, field):
	l = []
	for d in doclist:
		if d.parent and (not d.parent.lower().startswith('old_parent:')) and d.parentfield == field:
			l.append(d)
	return l

# Numeric
# -------
	
def has_common(l1, l2):
	for l in l1:
		if l in l2: 
			return 1
	return 0
	
def flt(s):
	if type(s)==str: # if string
		s = s.replace(',','')
	try: tmp = float(s)
	except: tmp = 0
	return tmp

def cint(s):
	try: tmp = int(float(s))
	except: tmp = 0
	return tmp

def cstr(s):
	if s==None: return ''
	else: return str(s)
		
def str_esc_quote(s):
	if s==None:return ''
	return s.replace("'","\'")

def replace_newlines(s):
	if s==None:return ''
	return s.replace("\n","<br>")

def parse_val(v):
	try: import decimal # for decimal Python 2.5 (?)
	except: pass

	if type(v)==datetime.date:
		v = str(v)
	elif type(v)==datetime.timedelta:
		v = ':'.join(str(v).split(':')[:2])
	elif type(v)==datetime.datetime:
		v = str(v)
	elif type(v)==long: v=int(v)

	try:
		if type(v)==decimal.Decimal: v=float(v)
	except: pass

	return v

def fmt_money(amount, fmt = '%.2f'):
	import re
	temp = fmt % amount
	if temp.find('.')==-1:
		temp += '.'
	profile=re.compile(r"(\d)(\d\d\d[.,])")
	while 1: 
		temp, count = re.subn(profile,r"\1,\2",temp) 
		if not count: 
			break
	if temp[-1]=='.':
		temp = temp[:-1]
	return temp

def get_search_criteria_list(dt):
	sc_list = sql("select criteria_name, doc_type from `tabSearch Criteria` where doc_type = '%s' or parent_doc_type = '%s'" % (dt, dt))
	return [list(s) for s in sc_list]

# Tree (Hierarchical) Node Set Model (nsm)
# ----------------------------------------

def update_nsm(doc_obj):
	# get fields, data from the DocType
	d = doc_obj.doc
	pf, opf = 'parent_node', 'old_parent'
	if hasattr(doc_obj,'nsm_parent_field'):
		pf = doc_obj.nsm_parent_field
	if hasattr(doc_obj,'nsm_oldparent_field'):
		opf = doc_obj.nsm_oldparent_field
	p, op = d.fields[pf], d.fields[opf]

	# has parent changed (?) or parent is None (root)
	if (op != p) or op==None:
		rebuild_tree(doc_obj.doc.doctype, pf)
		
		# set old parent
		set(d, opf, p or '')

def rebuild_tree(doctype, parent_field):
	# get all roots
	right = 1
	result = sql("SELECT name FROM `tab%s` WHERE `%s`='' or `%s` IS NULL" % (doctype, parent_field, parent_field))
	for r in result:
		right = rebuild_node(doctype, r[0], right, parent_field)
		
def rebuild_node(doctype, parent, left, parent_field):
	# the right value of this node is the left value + 1
	right = left+1

	# get all children of this node
	result = sql("SELECT name FROM `tab%s` WHERE `%s`='%s'" % (doctype, parent_field, parent))
	for r in result:
		right = rebuild_node(doctype, r[0], right, parent_field)

	# we've got the left value, and now that we've processed
	# the children of this node we also know the right value
	sql('UPDATE `tab%s` SET lft=%s, rgt=%s WHERE name="%s"' % (doctype,left,right,parent))

	#return the right value of this node + 1
	return right+1
	
def update_add_node(doctype, name, parent, parent_field):
	# get the last sibling of the parent
	if parent:
		right = sql("select rgt from `tab%s` where name='%s'" % (doctype, parent))[0][0] - 1
	else: # root
		right = sql("select max(rgt) from `tab%s` where `%s` is null or `%s`=''" % (doctype, parent_field, parent_field))[0][0]
	right = right or 1
	
	# update all on the right
	sql("update `tab%s` set rgt = rgt+2 where rgt > %s" %(doctype,right))
	sql("update `tab%s` set lft = lft+2 where lft > %s" %(doctype,right))
	
	#$ update index of new node
	sql("update `tab%s` set lft=%s, rgt=%s where name='%s'" % (doctype,right+1,(right+2),name))
	return right+1

def update_remove_node(doctype, name):
	left = sql("select lft from `tab%s` where name='%s'" % (doctype,name))
	if left[0][0]:
		# reset this node
		sql("update `tab%s` set lft=0, rgt=0 where name='%s'" % (doctype,name))

		# update all on the right
		sql("update `tab%s` set rgt = rgt-2 where rgt > %s" %(doctype,left[0][0]))
		sql("update `tab%s` set lft = lft-2 where lft > %s" %(doctype,left[0][0]))


# Password Generator
# ------------------

def random_password():
	import string
	from random import choice
	
	size = 9
	pwd = ''.join([choice(string.letters + string.digits) for i in range(size)])
	return pwd

def reset_password(profile_id):

	pwd = random_password()
	
	# get profile
	profile = sql("SELECT name, email FROM tabProfile WHERE name=%s OR email=%s",(profile_id, profile_id))
	
	if not profile:
		raise Exception, "Profile %s not found" % profile_id
	
	# update tab Profile
	sql("UPDATE tabProfile SET password=password(%s) WHERE name=%s", (pwd, profile[0][0]))
	
	msg = """
<div style="padding: 16px; background-color: #EEE;">
<div style="margin-bottom: 8px; text-align: right; font-size: 14px; font-weight: bold;">Web Notes</div>
<div style="padding: 16px; background-color: #FFF; border: 1px solid #AAA;">
Dear %s,<br><br>
Thank you for contacting us. Your password has been reset.
<br><br><b>Your new password is:</b> %s
<br><br>You can also contact us during office hours (M-F: 10-6) at 22-6526-5364
<br><br>Regards,
<br>Web Notes
</div>
</div>""" % (profile_id, pwd)
	
	# send email
	sendmail([profile[0][1]], msg=msg, subject='Change in Password')

# Cookies
# -------

def get_cookies():
	import os
	cookies = {}
	if 'HTTP_COOKIE' in os.environ:
		c = os.environ['HTTP_COOKIE']
		c = c.split('; ')
		  
		for cookie in c:
			cookie = cookie.split('=')
			cookies[cookie[0].strip()] = cookie[1].strip()
	return cookies

# Get Date
# --------

def getdate(docdate):
	import datetime
	t = docdate.split('-')
	if len(t)==3:
		return datetime.date(cint(t[0]), cint(t[1]), cint(t[2]))
	else:
		return ''

def add_days(docdate, days):
	import datetime
	d = getdate(docdate)
	return (d + datetime.timedelta(days)).strftime('%Y-%m-%d')

def now():
	import time
	return time.strftime('%Y-%m-%d %H:%M:%S')
	
def nowdate():
	import time
	return time.strftime('%Y-%m-%d')

def get_first_day(dt, d_years=0, d_months=0):
	import datetime
	# d_years, d_months are "deltas" to apply to dt
	y, m = dt.year + d_years, dt.month + d_months
	a, m = divmod(m-1, 12)
	return datetime.date(y+a, m+1, 1)

def get_last_day(dt):
	import datetime
	return get_first_day(dt, 0, 1) + datetime.timedelta(-1)

user_format = None
def formatdate(dt):
	global user_format
	if not user_format:
		user_format = Document('Control Panel', 'Control Panel').date_format
	d = dt.split('-')
	out = user_format
	return out.replace('dd', ('%.2i' % cint(d[2]))).replace('mm', ('%.2i' % cint(d[1]))).replace('yyyy', d[0])

# Pull Same Fields
# ----------------

def pull_fields(src, tar):
	for key in src.fields.keys():
		if not (key in ('name', 'parent', 'doctype', 'parentfield', 'parenttype', 'owner', 'modified_by', 'modified', 'creation', 'idx')) and tar.fields.has_key(key):
			tar.fields[key] = src.fields[key]

# Get Defaults
# ------------

def get_defaults():
	res = sql('select defkey, defvalue from `tabDefaultValue` where parent = "Control Panel"')

	d = {}
	for rec in res: 
		d[rec[0]] = rec[1] or ''
	return d

def set_default(key, val):
	res = sql('select defkey from `tabDefaultValue` where defkey="%s" and parent = "Control Panel"' % key)
	if res:
		sql('update `tabDefaultValue` set defvalue="%s" where parent = "Control Panel" and defkey="%s"' % (val, key))
	else:
		cp = Document('Control Panel', 'Control Panel')
		d = addchild(cp, 'system_defaults', 'DefaultValue')
		d.defkey = key
		d.defvalue = val
		d.save()

def isNull(v):
	return (v=='' or v==None)

def get_file(fname):
	in_fname = fname
	if db_exists('File',fname):
		fname = sql("select file_list from tabFile where name=%s", fname)
		fname = fname and fname[0][0]
		fname = fname.split(NEWLINE)[0].split(',')[1]
		try:
			if not in_transaction:
				sql("start transaction")
			sql('update tabFile set `downloaded`=ifnull(`downloaded`,0)+1 where name=%s', in_fname)
			sql("commit")
		except: pass
		
	ret = sql("select file_name, `blob_content`, modified from `tabFile Data` where name=%s limit 1", fname)
	if ret: 
		return ret
	else: 
		return sql("select file_name, `blob_content`, modified from `tabFile Data` where file_name=%s limit 1", fname)

# ToDO and Reminder
# -----------------

def add_todo(user, date, priority, desc, ref_type, ref_name):
	nlist = []
	if type(user)==list:
		for i in user:
			nlist.append(add_todo_item(i, date, priority, desc, ref_type, ref_name))
		return nlist
	else:
		return add_todo_item(user, date, priority, desc, ref_type, ref_name)	
	
def add_todo_item(user, date, priority, desc, ref_type, ref_name):
	if not date:
		date = nowdate()

	d = Document('ToDo Item')
	d.owner = user
	d.date = date
	d.priority = priority
	d.description = desc
	d.reference_type = ref_type
	d.reference_name = ref_name
	d.save(1)
	return d.name
	
def remove_todo(name):
	if type(name)==list:
		for i in name:
			sql("delete from `tabToDo Item` where name='%s'" % i)
	else:
		sql("delete from `tabToDo Item` where name='%s'" % name)

def get_todo_list():
	c = getcursor()
	try:
		role_options = ["role = '"+r+"'" for r in roles]
		role_options = role_options and ' OR ' + ' OR '.join(role_options) or ''
		c.execute("select * from `tabToDo Item` where owner='%s' %s" % (session['user'], role_options))
	except: # deprecated
		c.execute("select * from `tabToDo Item` where owner='%s'" % session['user'])
	dataset = c.fetchall()
	l = []
	for i in range(len(dataset)):
		d = Document('ToDo Item')
		d.loadfields(dataset, i, c.description)
		l.append(d)
		
	return l

# Event
# -------------

def get_cal_events(m_st, m_end):
	# load owned events
	res1 = sql("select name from `tabEvent` WHERE event_date >= '%s' and event_date <= '%s' and owner = '%s' and event_type != 'Public' and event_type != 'Cancel'" % (m_st, m_end, session['user']))

	# load individual events
	res2 = sql("select t1.name from `tabEvent` t1, `tabEvent User` t2 where t1.event_date >= '%s' and t1.event_date <= '%s' and t2.person = '%s' and t1.name = t2.parent and t1.event_type != 'Cancel'" % (m_st, m_end, session['user']))

	# load role events
	roles = get_roles()
	myroles = ['t2.role = "%s"' % r for r in roles]
	myroles = '(' + (' OR '.join(myroles)) + ')'
	res3 = sql("select t1.name from `tabEvent` t1, `tabEvent Role` t2  where t1.event_date >= '%s' and t1.event_date <= '%s' and t1.name = t2.parent and t1.event_type != 'Cancel' and %s" % (m_st, m_end, myroles))
	
	# load public events
	res4 = sql("select name from `tabEvent` where event_date >= '%s' and event_date <= '%s' and event_type='Public'" % (m_st, m_end))
	
	doclist, rl = [], []
	for r in res1 + res2 + res3 + res4:
		if not r in rl:
			doclist += getdoc('Event', r[0])
			rl.append(r)
	
	return doclist
	
# Get Traceback
# -------------

def getTraceback():
	import sys, traceback, string
	type, value, tb = sys.exc_info()
	body = "Traceback (innermost last):\n"
	list = traceback.format_tb(tb, None) + traceback.format_exception_only(type, value)
	body = body + "%-20s %s" % (string.join(list[:-1], ""), list[-1])
	log("Server Error", body)
	return body

# Log
# ---

def log(event, details):
	return
	import time
	d = Document(doctype = "Error Log")
	d.event =  event
	d.time = time.strftime('%H:%M')
	d.date = time.strftime('%d-%m-%Y')
	d.user = session['user']
	d.detail = details
	try:
		d.save(1)
	except:
		pass # bc

def set_message(details):
	d = Document(doctype='Message')
	d.message = details
	d.user = session['user']
	d.save(1)

# GET MATCH CONDITION
# -------------------

def getmatchcondition(dt, ud, ur):
	res = sql("SELECT `role`, `match` FROM tabDocPerm WHERE parent = '%s' AND (`read`=1) AND permlevel = 0" % dt)
	cond = []
	for r in res:
		if r[0] in ur: # role applicable to user
			if r[1]:
				defvalues = ud.get(r[1],['_NA'])
				for d in defvalues:
					cond.append('`tab%s`.`%s`="%s"' % (dt, r[1], d))
			else: # nomatch i.e. full read rights
				return ''

	return ' OR '.join(cond)

# Modules
# -----------

def get_module_items(mod, only_dt=0):
	dl = []
	if only_dt:
		transfer_types = ['DocType']
	else:
		transfer_types = ['Role', 'Page', 'DocType', 'DocType Mapper', 'Search Criteria']
		dl = ['Module Def,'+mod]
	
	for dt in transfer_types:
		try:
			dl2 = sql('select name from `tab%s` where module="%s"' % (dt,mod))
			dl += [(dt+','+e[0]) for e in dl2]
		except:
			pass

	if not only_dt:
		dl1 = sql('select doctype_list from `tabModule Def` where name=%s', mod)
		dl += dl1[0][0].split('\n')
	
	# build finally
	dl = [e.split(',') for e in dl]
	dl = [[e[0].strip(), e[1].strip()] for e in dl] # remove blanks
	return dl

# IMPORT DOCS
# -----------

def import_docs(docs = []):

	doc_list = {}
	created_docs = []
	already_exists = []

	out, tmp ="", ""

	for d in docs:
		cur_doc = Document(fielddata = d)
		if not cur_doc.parent in already_exists: # parent should not exist
			try:
				cur_doc.save(1)
				out += "Created: " + cur_doc.name + "\n"
				created_docs.append(cur_doc)
	
				# make in groups
				if cur_doc.parent:
					if not doc_list.has_key(cur_doc.parent):
						doc_list[cur_doc.parent] = []
					doc_list[cur_doc.parent].append(cur_doc)

			except Exception, e:
				out += "Creation Warning/Error: " + cur_doc.name + " :"+ str(e) + "\n"
				already_exists.append(cur_doc.name)

	# Run scripts for main docs
	for m in created_docs:
		if doc_list.has_key(m.name):
			tmp = run_server_obj(get_server_obj(m, doc_list.get(m.name, [])),'on_update')
			out += 'Executed: '+ str(m.name) + ', Err:' + str(tmp) + "\n"

	return out

def ovr_doctype(doclist, ovr, ignore, onupdate):
	doclist = [Document(fielddata = d) for d in doclist]
	doc = doclist[0]
	cur_doc = Document('DocType',doc.name)
	added = 0
	
	# fields
	# ------
	for d in getlist(doclist, 'fields'):
		# if exists
		if d.fieldname:
			fld = sql("select name from tabDocField where fieldname=%s and parent=%s", (d.fieldname, d.parent))
		else:
			fld = sql("select name from tabDocField where label=%s and parent=%s", (d.label, d.parent))

		if (not fld) and d.label: # must have label
			# re number - following fields
			
			sql("update tabDocField set idx = idx + 1 where parent=%s and idx > %s", (d.parent, d.idx))
			
			# add field
			nd = Document(fielddata = d.fields)
			nd.oldfieldname, nd.oldfieldtype = '', ''
			nd.save(new = 1, ignore_fields = ignore)
			added += 1

	# code
	# ----
	
	cur_doc.server_code_core = cstr(doc.server_code_core)
	cur_doc.client_script_core = cstr(doc.client_script_core)
	
	cur_doc.save(ignore_fields = ignore)
	
	if onupdate:
		so = get_obj('DocType', doc.name, with_children = 1)
		if hasattr(so, 'on_update'):
			so.on_update()

	if in_transaction: sql("COMMIT")

	return doc.name + (' Upgraded: %s fields added' % added)

def set_doc(doclist, ovr=0, ignore=1, onupdate=1):
	global in_transaction
	override = 0
	
	if not doclist:
		return 'No Doclist'
	doc = Document(fielddata = doclist[0])
	orig_modified = doc.modified

	exists = db_exists(doc.doctype, doc.name)

	if not in_transaction: sql("START TRANSACTION")
	
	if exists: 
		if ovr:
			# Special Treatement
			# ------------------
			if db_exists('DocType', 'Transfer Control'):
				tc = get_obj('Transfer Control')
				if tc.override_transfer.has_key(doc.doctype):
					return getattr(tc, tc.override_transfer.get(doc.doctype))(doclist, ovr, ignore, onupdate) # done
			
			if doc.doctype == 'DocType':
				return ovr_doctype(doclist, ovr, ignore, onupdate) # done

			# Replace the record
			# ------------------

			# remove main doc
			newname = '__overwritten:'+doc.name
			n_records = sql("SELECT COUNT(*) from `tab%s` WHERE name like '%s%%'" % (doc.doctype, newname))
			if n_records[0][0]:
				newname = newname + '-' + str(n_records[0][0])
				
			sql("UPDATE `tab%s` SET name='%s', docstatus=2 WHERE name = '%s' limit 1" % (doc.doctype, newname, doc.name))
			
			# remove child elements
			tf_list = db_gettablefields(doc.doctype)
			for t in tf_list:
				sql("UPDATE `tab%s` SET parent='%s', docstatus=2 WHERE parent='%s' AND parentfield='%s'" % (t[0], 'oldparent:'+doc.name, doc.name, t[1]))
				
		else:
			if in_transaction: sql("ROLLBACK")
			return doc.name + " Exists / No change"

	# save main
	doc.save(new = 1, ignore_fields = ignore, check_links=0)
	
	# save others
	dl = [doc]
	for df in doclist[1:]:
		try:
			d = Document(fielddata = df)
			d.save(new = 1, ignore_fields = ignore)
			dl.append(d)
		except:
			pass # ignore tables
	
	if onupdate:
		so = get_server_obj(doc, dl)
		if hasattr(so, 'on_update'):
			so.on_update()

	# reset modified
	set(doc, 'modified', orig_modified)

	if in_transaction: sql("COMMIT")

	return doc.name + ' Completed'	

# MYSQL ADMIN
# -----------

def backup_all():
	# backups folder
	import os
	dblist = sql_accounts('select db_name from tabAccount')

	# backup -all in /backups folder
	for d in dblist:
		backup_db(d[0], 1)
	
	# dump all in /daily folder
	import time, datetime
	fname = 'daily-' + time.strftime('%Y-%m-%d') + '.tar.gz'
	
	# daily dump
	os.system('tar czf ../backups/daily/%s ../backups/dumps' % fname) 

	# keep only three files
	if len(os.listdir('../backups/daily')) > 3:
		delete_oldest_file('../backups/daily')

	# if sunday, then copy to weekly
	if datetime.datetime.now().weekday()==6:
		os.system('cp ../backups/daily/'+fname+' ../backups/weekly/'+fname)
	
		# keep only three files
		if len(os.listdir('../backups/weekly')) > 3:
			delete_oldest_file('../backups/weekly')
	
def delete_oldest_file(folder):
	import os
	a = sorted(os.listdir(folder), key=lambda fn: os.stat(folder+'/'+fn).st_mtime, reverse=False)
	if a:
		os.system('rm %s/%s' % (folder, a[0]))

def mysqldump(db, folder=''):
	global mysql_path
	import os
	os.system('%(path)smysqldump %(db)s > %(folder)s%(db)s.sql -u %(db)s -p%(pwd)s --ignore-table=%(db)s.__DocTypeCache' % {'path':mysql_path, 'db':db, 'pwd':db_password, 'folder':folder})

def backup_db(db, from_all=0):
	import os

	if defs.root_login:
		global conn
		conn = MySQLdb.connect(user=defs.root_login, host=db_host, passwd=defs.root_password)
		
	sql('use %s' % db)

	#sql('FLUSH TABLES WITH READ LOCK')

	try:
		p = '../backups'
		if from_all: p = '../backups/dumps'	
		
		os.system('rm %s/%s.tar.gz' % (p,db))
	
		# dump
		mysqldump(db, p+'/')
		
		# zip
		os.system('tar czf %s/%s.tar.gz %s/%s.sql' % (p, db, p, db))
		os.system('rm %s/%s.sql' % (p, db))
		#sql('unlock tables')
	except Exception, e:
		#sql('unlock tables')
		raise e

def copy_db(source, target=''):
	if not server_prefix:
		msgprint("Server Prefix must be set in defs.py")
		raise Exception

	import os
	os.chdir(os.path.normpath('../data'))
	
	# dump
	mysqldump(source)

	# import
	target = import_db(source, target)
	
	# delete dump
	os.system('rm %s.sql' % source)
	
	return target

def import_db(source, target='', is_accounts=0):
	# dump source
	global mysql_path
	import os

	if defs.root_login:
		global conn
		conn = MySQLdb.connect(user=defs.root_login, host=db_host, passwd=defs.root_password)

	if not target:
		if is_accounts:
			target = 'accounts'
		else:
			res = sql('SHOW DATABASES')
			db_list = []
			for r in res:
				if r[0] and r[0].startswith(server_prefix):
					db_list.append(r[0])
			db_list.sort()
			
			if db_list:
				dbn = server_prefix + ('%.3i' % (int(db_list[-1][-3:]) + 1))
			else:
				dbn = server_prefix + '001'
			target = dbn
	
	os.chdir('../data')

	# create user and db
	sql("CREATE USER '%s'@'localhost' IDENTIFIED BY '%s'" % (target, db_password))
	sql("CREATE DATABASE IF NOT EXISTS `%s` ;" % target)
	sql("GRANT ALL PRIVILEGES ON `%s` . * TO '%s'@'localhost';" % (target, target))
	sql("FLUSH PRIVILEGES")
	sql("SET GLOBAL TRANSACTION ISOLATION LEVEL READ COMMITTED;")

	# import in target
	os.system('%smysql -u %s -p%s %s < %s.sql' % (mysql_path, target, db_password, target, source))

	sql("use %s;" % target)
	sql("create table `__DocTypeCache` (name VARCHAR(120), modified DATETIME, content TEXT)")
	sql("update tabProfile set password = password('admin') where name='Administrator'")

	# temp
 	sql("alter table tabSessions change sessiondata sessiondata longtext") 
	
	return target
	
def create_account(ac_name, ac_type='Framework'):

	if ac_name=='accounts':
		# first account
		newdb = import_db(ac_type, is_accounts = 1)
	else:
		newdb = import_db(ac_type)
		# update accounts
		use_account(my_db_name = 'accounts')
		ac = Document('Account')
		ac.ac_name = ac_name
		ac.db_name = newdb
		ac.name = newdb
		if not in_transaction:
			sql("start transaction")
		ac.save(1)
		sql("commit")

	# set account id
	use_account(my_db_name = newdb)
	if not in_transaction:
		sql("start transaction")
	sql("update tabSingles set value=%s where doctype='Control Panel' and field='account_id'", ac_name)

	if ac_name=='accounts':
		# create tabAccount
		ac = Document('DocType')
		ac.name = 'Account'
		ac.autoname = 'AC.#####'
		ac.save(1)
		
		f = addchild(ac, 'fields', 'DocField')
		f.label = 'Account Name'
		f.fieldname = 'ac_name'
		f.fieldtype = 'Data'
		f.save()

		f = addchild(ac, 'fields', 'DocField')
		f.label = 'Database Name'
		f.fieldname = 'db_name'
		f.fieldtype = 'Data'
		f.save()

		f = addchild(ac, 'fields', 'DocField')
		f.label = 'Database Login'
		f.fieldname = 'db_login'
		f.fieldtype = 'Data'
		f.save()
		
		f = addchild(ac, 'permissions', 'DocPerm')
		f.role = 'Administrator'
		f.read = 1
		f.write = 1
		f.create = 1
		f.save()
		
		get_obj('DocType', 'Account', with_children = 1).on_update()
		
	sql("commit")

	return "Created %s (%s)" % (ac_name, newdb)

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
	
# Session
# --------

def authenticate(user, pwd, remote_ip):
	if not (user and pwd):
		return None
	if user=='Administrator':
		ret = sql("select name from tabProfile where name=%s and (`password`=%s OR `password`=PASSWORD(%s))", (user, pwd, pwd))
	else:
		ret = sql("select name from tabProfile where name=%s and (password=%s  OR `password`=PASSWORD(%s)) and IFNULL(enabled,0)=1", (user, pwd, pwd))

	# login from gateway
	if not ret and remote_ip==gateway_ip:
		ret = sql("select name from tabProfile where name=%s and `password`=PASSWORD(%s)", ('Guest', pwd))
		if ret: ret = ((user,),) # but allowed to keep name
		
		# if disabled, then don't allow
		prof = sql("select ifnull(enabled,0) from tabProfile where name=%s", user)
		if prof and not prof[0][0]:
			ret = None
			raise Exception, 'User Disabled'

	try:
		ip = sql("select ip_address from tabProfile where name = '%s'" % user)
		ip = ip and ip[0][0] or ''
		ip = ip.replace(",", "\n").split('\n')
		ip = [i.strip() for i in ip]
		
		if ret and ip:
			if remote_ip.startswith(ip[0]) or remote_ip in ip:
				return ret
			else:
				msgprint('Not allowed from this IP Address')
				return None
	except Exception, e:
		if ret:
			return ret
		else:
			return None

def start_session(session):
	# in control panel?
	exp_sec = get_value('Control Panel', None, 'session_expiry') or '24:00'
	
	# clear out old sessions
	sql("delete from tabSessions where TIMEDIFF(NOW(), lastupdate) > %s OR TIMEDIFF(NOW(), lastupdate) > '72:00'", exp_sec)
	
	# clear other open sessions of the current user
	data = str(session['data']).replace("'", "\\'")
	return sql("insert into tabSessions (sessiondata, user, lastupdate, sid) values ('%s' , '%s', NOW(), '%s')" % (data, session['user'], session['sid']))

def delete_session():
	sql('delete from tabSessions where sid="%s"' % session['sid'])

def load_session(sid):
	r = sql("select user, sessiondata from tabSessions where sid='%s'" % sid)
	if r:
		return {'data':eval(r[0][1]), 'user':r[0][0], 'sid':sid}
	return None

def update_session(session):
	return sql("update tabSessions set sessiondata=%s, user=%s, lastupdate=NOW() where sid=%s" , (str(session['data']), session['user'], session['sid']))

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
	if docname:
		try:
			r = sql("select `%s` from `tab%s` where name='%s'" % (fieldname, doctype, docname))
			return r and r[0][0] or ''
		except:
			return None
	else:
		r = sql("select value from tabSingles where field=%s and doctype=%s", (fieldname, doctype))
		return r and r[0][0] or None
		
def db_getchildtype(doctype, fieldname):
	r = sql("select options from tabDocField where parent='%s' and fieldtype='Table' and fieldname = '%s'" % (doctype, fieldname))
	return r and r[0][0] or ''
	
# Encryption
# ----------

def generate_hash():
	import sha, time
	return sha.new(str(time.time())).hexdigest()
	
""" 
XTEA Block Encryption Algorithm
Author: Paul Chakravarti (paul_dot_chakravarti_at_gmail_dot_com)
License: Public Domain
""" 

def encrypt(data):
	return crypt(encryption_key, data).encode('hex')

def decrypt(data):
	return crypt(encryption_key, data.decode('hex'))

def crypt(key,data,iv='\00\00\00\00\00\00\00\00',n=32):
	def keygen(key,iv,n):
		while True:
			iv = xtea_encrypt(key,iv,n)
			for k in iv:
				yield ord(k)
	xor = [ chr(x^y) for (x,y) in zip(map(ord,data),keygen(key,iv,n)) ]
	return "".join(xor)

def xtea_encrypt(key,block,n=32,endian="!"):
	import struct
	v0,v1 = struct.unpack(endian+"2L",block)
	k = struct.unpack(endian+"4L",key)
	sum,delta,mask = 0L,0x9e3779b9L,0xffffffffL
	for round in range(n):
		v0 = (v0 + (((v1<<4 ^ v1>>5) + v1) ^ (sum + k[sum & 3]))) & mask
		sum = (sum + delta) & mask
		v1 = (v1 + (((v0<<4 ^ v0>>5) + v0) ^ (sum + k[sum>>11 & 3]))) & mask
	return struct.pack(endian+"2L",v0,v1)
	
def xtea_decrypt(key,block,n=32,endian="!"):
	import struct

	v0,v1 = struct.unpack(endian+"2L",block)
	k = struct.unpack(endian+"4L",key)
	delta,mask = 0x9e3779b9L,0xffffffffL
	sum = (delta * n) & mask
	for round in range(n):
		v1 = (v1 - (((v0<<4 ^ v0>>5) + v0) ^ (sum + k[sum>>11 & 3]))) & mask
		sum = (sum - delta) & mask
		v0 = (v0 - (((v1<<4 ^ v1>>5) + v1) ^ (sum + k[sum & 3]))) & mask
	return struct.pack(endian+"2L",v0,v1)

