# Authentication
#
# The authentication will be called at the beginning of every request.
#   1. It will authenticate a session
#   2. It will authenticate the user
#   3. It will create the database cursor
#   4. It will setup the session object
#   5. It will clean-up old sessions and update the current one
#
# Case A: "account" is specified in defs -> defs.single_account = True
#
#   The system will try and authenticate the user by 3 ways
#     1. Check self.cookies for valid session id (sid)
#     2. Check formdata for valid sid (coming from a re-direct)
#     3. Login using "user" and "password" in the form data & start a new session
#     4. Login as "Guest" & start a new session
#   If all 3 fail, then throw exception
#
# Case B: "account" is not specified
#
#   1. Find the database using "account_id" key in the self.cookies
#   2. Find the database using "account_id" key in the formdata
#   Set the database. and revert to Case A:
#
# Post authentication
#   1. Update the session
#   2. Update the profile
#   3. Update self.cookies
#
#-----------------------------------------------------

import webnotes
import webnotes.db
import webnotes.utils
import webnotes.profile

import defs

class Authentication:
	def __init__(self, form, out_cookies, out):

		self.form = form
		self.cookies = self.set_in_cookies()
		self.account = None
		self.account_id = None
		self.session = None
		self.out_cookies = out_cookies
		self.out = out
		self.login_flag = 0
		
		self.set_env()
		self.conn = hasattr(defs, 'single_account') and webnotes.db.Database(use_default=1) or self.set_db()
		webnotes.conn = self.conn
		
		if form.getvalue('cmd')=='login':
			if form.getvalue('acx'):
				self.conn = self.set_db(form.getvalue('acx'))
				webnotes.conn = self.conn
			
			self.login()
			self.login_flag = 1
		
		else:
			# authenticated user
			if not self.load_session(self.cookies.get('sid') or self.form.getvalue('sid')):
			
				# no ? login as guest
				self.login(as_guest = True)			
		
		if not self.session: 
			self.out['message'] = '"Authentication Failed"'
			raise Exception, "Authentication Failed"

		# if just logged in
		if self.login_flag:
			self.set_cookies()
			self.set_remember_me()
		
		webnotes.session = self.session
		webnotes.user = webnotes.profile.Profile()

		if webnotes.session['data'].get('profile'):
			webnotes.user.load_from_session(webnotes.session['data']['profile'])
		
		# clear defs password - for security
		defs.db_password = ''
		
	def set_env(self):
		import os
		self.domain = os.environ.get('HTTP_HOST')
		self.remote_ip = os.environ.get('REMOTE_ADDR')
	
	def set_db(self, acc_id = None):
		res = None
		
		# database (account_id) is given
		if self.cookies.get('account_id'):
			self.account_id = self.cookies.get('account_id')
			return webnotes.db.connect(self.account_id)
			
		# account id is given
		if not acc_id:
			acc_id = self.cookies.get('__account') or self.form.getvalue('__account')
		
		c = webnotes.db.Database(use_default=1)
		if acc_id:
			try:
				res = c.sql("select db_name, db_login from tabAccount where ac_name = '%s'" % acc_id)
			except: pass
			if res:
				self.account = acc_id

		# select database from domain mapping table "Account Domain"
		else:
			if c.sql("select name from tabDocType where name='Account Domain'"):
				res = c.sql("select tabAccount.db_name, tabAccount.db_login, tabAccount.ac_name from tabAccount, `tabAccount Domain` where tabAccount.name = `tabAccount Domain`.parent and `tabAccount Domain`.domain = '%s'" % self.domain)
			if res:
				self.account = res[0][2]
		
		if res:
			c =  webnotes.db.Database(user = res[0][1] or res[0][0])
			c.use(res[0][0])
		else:
			c =  webnotes.db.Database(use_default = 1)
		return c
	
	def check_ip(self):
		if self.session:
			if self.session['data']['session_ip'] != self.remote_ip:
				raise Exception, "Your IP address has changed mid-session. For security reasons, please login again"
			
	def load_session(self, sid):
		if not sid: 
			return False

		if not self.conn:
			self.conn = self.set_db()

		r = self.conn.sql("select user, sessiondata from tabSessions where sid='%s'" % sid)
		if r:
			self.session = {'data':eval(r[0][1]), 'user':r[0][0], 'sid':sid}
			return True
		return False
	
	# login
	def login(self, as_guest = 0):
		if as_guest:
			user = self.conn.sql("select name from tabProfile where name='Guest' and ifnull(enabled,0)=1")[0][0]
		else:
			user = self.check_password(self.form.getvalue('usr'), self.form.getvalue('pwd'))
				
		if user:
			self.validate_ip(user)
			self.start_session(user)
			self.out['message'] = 'Logged In'
			self.call_on_login_event()
			return True
	
	def call_on_login_event(self):
		import webnotes.model.code
		cp = webnotes.model.code.get_obj('Control Panel', 'Control Panel')
		if hasattr(cp, 'on_login'):
			cp.on_login()
	
	def check_password(self, user, pwd):
		if not (user and pwd):
			return None
		if user=='Administrator':
			p = self.conn.sql("select name from tabProfile where name=%s and (`password`=%s OR `password`=PASSWORD(%s))", (user, pwd, pwd))
		else:
			p = self.conn.sql("select name from tabProfile where name=%s and (password=%s  OR `password`=PASSWORD(%s)) and IFNULL(enabled,0)=1", (user, pwd, pwd))
	
		return p and p[0][0] or ''
	
	def validate_ip(self, user):
		try:
			ip = self.conn.sql("select ip_address from tabProfile where name = '%s'" % user)[0][0] or ''
		except: return
			
		ip = ip.replace(",", "\n").split('\n')
		ip = [i.strip() for i in ip]
			
		if ret and ip:
			if not (self.remote_ip.startswith(ip[0]) or (remote_ip in ip)):
				raise Exception, 'Not allowed from this IP Address'
	
	def start_session(self, user):
		self.session = {}
		self.session['user'] = user
		self.session['sid'] = webnotes.utils.generate_hash()
		self.session['data'] = {}
		self.session['data']['session_ip'] = self.remote_ip;
		
		# insert session
		self.conn.sql("insert into tabSessions (sessiondata, user, lastupdate, sid) values (%s , %s, NOW(), %s)", (str(self.session['data']), self.session['user'], self.session['sid']))

		# update profile
		try: self.conn.sql("UPDATE tabProfile SET last_login = '%s', last_ip = '%s' where name='%s'" % (server.now(), self.remote_ip, session['user']))
		except: pass
	
	def update(self):
		# update session
		self.conn.sql("update tabSessions set sessiondata=%s, user=%s, lastupdate=NOW() where sid=%s" , (str(self.session['data']), self.session['user'], self.session['sid']))
				
		# clear expired sessions
		self.clear_expired()
		
	def clear_expired(self):
		# in control panel?
		exp_sec = self.conn.get_value('Control Panel', None, 'session_expiry') or '24:00'
		
		# clear out old sessions
		self.conn.sql("delete from tabSessions where TIMEDIFF(NOW(), lastupdate) > %s OR TIMEDIFF(NOW(), lastupdate) > '72:00'", exp_sec)
	
	def set_cookies(self):
		if self.account_id:
			self.out_cookies['account_id'] = self.account_id
			
		elif self.account:
			self.out_cookies['__account'] = self.account
			
		self.out_cookies['sid'] = self.session['sid']
		
	def set_remember_me(self):
		if webnotes.utils.cint(self.form.getvalue('remember_me')):
			remember_days = self.conn.get_value('Control Panel',None,'remember_for_days') or 7
			import datetime
			self.out_cookies['remember_me'] = 1
			expires = datetime.datetime.now() + datetime.timedelta(days=remember_days)
			for k in self.out_cookies.keys():
				self.out_cookies[k]['expires'] = expires.strftime('%a, %d %b %Y %H:%M:%S')	
	
	def set_in_cookies(self):
		import os
		cookies = {}
		if 'HTTP_COOKIE' in os.environ:
			c = os.environ['HTTP_COOKIE']
			c = c.split('; ')
			  
			for cookie in c:
				cookie = cookie.split('=')
				cookies[cookie[0].strip()] = cookie[1].strip()
				
		return cookies

	def logout(self):
		webnotes.conn.sql('delete from tabSessions where sid="%s"' % webnotes.session['sid'])
		self.out_cookies['sid'] = ''
		self.out_cookies['remember_me'] = ''