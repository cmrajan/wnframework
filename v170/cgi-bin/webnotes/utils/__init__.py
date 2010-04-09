# util __init__.py

import webnotes

month_name = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
no_value_fields = ['Section Break', 'Column Break', 'HTML', 'Table', 'FlexTable', 'Button', 'Image', 'Graph']
default_fields = ['doctype','name','owner','creation','modified','modified_by','parent','parentfield','parenttype','idx','docstatus']

def getCSVelement(v):
	v = cstr(v)
	if not v: return ''
	if (',' in v) or ('\n' in v) or ('"' in v):
		if '"' in v: v = v.replace('"', '""')
		return '"'+v+'"'
	else: return v or ''

def validate_email_add(email_str):
	if email_str: email_str = email_str.strip().lower()
	import re
	#return re.match("^[a-zA-Z0-9._%-]+@[a-zA-Z0-9._%-]+.[a-zA-Z]{2,6}$", email_str)
	return re.match("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?", email_str)

def sendmail(recipients, sender='', msg='', subject='[No Subject]', parts=[], cc=[], attach=[]):
	import webnotes.utils.email_lib
	return email_lib.sendmail(recipients, sender, msg, subject, parts, cc, attach)
	
def generate_hash():
	import sha, time
	return sha.new(str(time.time())).hexdigest()

def db_exists(dt, dn):
	return webnotes.conn.sql('select name from `tab%s` where name="%s"' % (dt, dn))

# Cookies
# ------------------

def get_incoming_cookies():
	import os
	cookies = {}
	if 'HTTP_COOKIE' in os.environ:
		c = os.environ['HTTP_COOKIE']
		c = c.split('; ')
			  
		for cookie in c:
			cookie = cookie.split('=')
			cookies[cookie[0].strip()] = cookie[1].strip()
				
	return cookies

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

# Date and Time
# -------------


def getdate(string_date):
	import datetime
	t = string_date.split('-')
	if len(t)==3:
		return datetime.date(cint(t[0]), cint(t[1]), cint(t[2]))
	else:
		return ''

def add_days(string_date, days):
	import datetime
	d = getdate(string_date)
	return (d + datetime.timedelta(days)).strftime('%Y-%m-%d')

def add_months(string_date, months):
	import datetime
	return webnotes.conn.sql("select DATE_ADD('%s',INTERVAL '%s' MONTH)" % (getdate(string_date),months))[0][0]

def add_years(string_date, years):
	import datetime
	return webnotes.conn.sql("select DATE_ADD('%s',INTERVAL '%s' YEAR)" % (getdate(string_date),years))[0][0]

def date_diff(string_ed_date, string_st_date):
	import datetime
	return webnotes.conn.sql("SELECT DATEDIFF('%s','%s')" %(getdate(string_ed_date), getdate(string_st_date)))[0][0]

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
def formatdate(string_date):
	
	global user_format
	if not user_format:
		user_format = webnotes.conn.get_value('Control Panel', None, 'date_format')
	d = string_date.split('-');
	out = user_format
	return out.replace('dd', ('%.2i' % cint(d[2]))).replace('mm', ('%.2i' % cint(d[1]))).replace('yyyy', d[0])
	
def dict_to_str(args, sep='&'):
	import urllib
	t = []
	for k in args.keys():
		t.append(str(k)+'='+urllib.quote(str(args[k] or '')))
	return sep.join(t)

# Datatype
# ----------

def isNull(v):
	return (v=='' or v==None)
	
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
	
# Get Defaults
# ------------

def get_defaults():
	res = webnotes.conn.sql('select defkey, defvalue from `tabDefaultValue` where parent = "Control Panel"')

	d = {}
	for rec in res: 
		d[rec[0]] = rec[1] or ''
	return d

def set_default(key, val):
	res = webnotes.conn.sql('select defkey from `tabDefaultValue` where defkey="%s" and parent = "Control Panel"' % key)
	if res:
		webnotes.conn.sql('update `tabDefaultValue` set defvalue="%s" where parent = "Control Panel" and defkey="%s"' % (val, key))
	else:
		from webnotes.model.doc import Document
		from webnotes.model.doc import addchild
		cp = Document('Control Panel', 'Control Panel')
		d = addchild(cp, 'system_defaults', 'DefaultValue')
		d.defkey = key
		d.defvalue = val
		d.save()

# Get File
# -------------------

def get_file(fname):
	in_fname = fname
	if webnotes.conn.exists('File',fname):
		fname = webnotes.conn.sql("select file_list from tabFile where name=%s", fname)
		fname = fname and fname[0][0]
		fname = fname.split('\n')[0].split(',')[1]
		try:
			if not in_transaction:
				webnotes.conn.sql("start transaction")
			webnotes.conn.sql('update tabFile set `downloaded`=ifnull(`downloaded`,0)+1 where name=%s', in_fname)
			webnotes.conn.sql("commit")
		except: pass
		
	ret = webnotes.conn.sql("select file_name, `blob_content`, modified from `tabFile Data` where name=%s limit 1", fname)
	if ret: 
		return ret
	else: 
		return webnotes.conn.sql("select file_name, `blob_content`, modified from `tabFile Data` where file_name=%s limit 1", fname)

# Clear recycle bin
# -----------------

def clear_recycle_bin():
	sql = webnotes.conn.sql
	
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

	return "%s records deleted" % str(int(total_deleted))
