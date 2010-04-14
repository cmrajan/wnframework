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
		self.user_id = None
		self.cp = None
		
		self.app_login = None
		self.app_password = None
		
		self.get_env()
		self.set_db()
		self.set_app_db()
		
		# make the connections global
		webnotes.conn, webnotes.app_conn = self.conn, self.app_conn
		
		# called from login
		if form.getvalue('cmd')=='login':
			if form.getvalue('acx'):
				self.set_db(form.getvalue('acx'))
				self.set_app_db()
				webnotes.conn = self.conn
			
			self.login()
			self.login_flag = 1
		
		else:
			# authenticated user
			if not self.load_session(self.form.getvalue('sid') or self.cookies.get('sid')):
			
				# no ? login as guest
				self.login(as_guest = True)
		
		if not self.session: 
			self.out['message'] = '"Authentication Failed"'
			raise Exception, "Authentication Failed"

		# if just logged in
		if self.login_flag or self.form.getvalue('sid'):
			self.set_cookies()
			self.set_remember_me()
		
		webnotes.session = self.session
		webnotes.user = webnotes.profile.Profile()
		webnotes.incoming_cookies = self.cookies

		if webnotes.session['data'].get('profile'):
			webnotes.user.load_from_session(webnotes.session['data']['profile'])
		else:
			webnotes.user.load_profile()
		
		# clear defs password - for security
		#defs.db_password = ''
	
	# Load Domain and IP
	# =================================================================================

	def get_env(self):
		import os
		self.domain = os.environ.get('HTTP_HOST')
		if self.domain.startswith('www.'):
			self.domain = self.domain[4:]
			
		self.remote_ip = os.environ.get('REMOTE_ADDR')
	
	# Make the database connection - either from cookies or from domain info
	# =================================================================================

	def set_db(self, ac_name = None):
		res = None

		# Case 1 - Single Account
		# -----------------------
		if hasattr(defs, 'single_account'):
			self.conn = webnotes.db.Database(use_default=1)
			return
		
		# database_id (account_id) is given --- not for login
		# ---------------------------------------------------
		if not (ac_name or self.form.getvalue('ac_name')) and self.cookies.get('account_id'):
			self.account_id = self.cookies.get('account_id')
			self.conn = webnotes.db.Database(user = self.account_id)
			self.conn.use(self.account_id)
			return

		# account id is given
		# -------------------
		if not ac_name:
			ac_name = self.cookies.get('ac_name') or self.form.getvalue('ac_name')
		
		c = webnotes.db.Database(use_default=1)
		if ac_name:
			try:
				res = c.sql("select db_name, db_login from tabAccount where ac_name = '%s'" % ac_name)
			except: 
				pass
			if res:
				self.account = ac_name
			else:
				# default account may not have entry
				if ac_name == defs.db_name:
					res = [[defs.db_name, defs.db_login],]

		# select database from domain mapping table "Account Domain"
		# ----------------------------------------------------------
		else:
			if c.sql("select name from tabDocType where name='Account Domain'"):
				res = c.sql("select tabAccount.db_name, tabAccount.db_login, tabAccount.ac_name from tabAccount, `tabAccount Domain` where tabAccount.name = `tabAccount Domain`.parent and `tabAccount Domain`.domain = '%s'" % self.domain)
			if res:
				self.account = res[0][2]
				
		# get details of app login - not required everytime, use the cookies
		# ------------------------------------------------------------------
		
		try:
			res_app = c.sql("select app_login from tabAccount where ac_name = %s", self.account)
			if res_app: 
				self.app_login = res_app[0][0]
		except Exception, e:
			pass
		
		# connect
		# -------
		if res:
			self.account_id = res[0][0]
			c = webnotes.db.Database(user = res[0][1] or res[0][0])
			c.use(self.account_id)
		else:
			self.account_id = defs.db_name
			c =  webnotes.db.Database(use_default = 1)
			
		self.conn = c
		

	# setup Application Database
	# Appication Database is from where Application DocTypes are accesssed
	# =================================================================================
	
	def set_app_db(self):
		self.app_conn = None
		
		# find app_login from defs.py
		if not self.app_login:
			if hasattr(defs, 'app_login'):
				self.app_login = defs.app_login
	
			if hasattr(defs, 'app_password'):
				self.app_password = defs.app_password
				
			if self.cookies.get('app_id'):
				self.app_login = self.cookies.get('app_id')

		if not self.app_login:
			return

		if self.app_login == self.conn.user:
			# i am the app_db, do nothing
			return
		
		self.app_conn = webnotes.db.Database(user = self.app_login, password = self.app_password)
		self.app_conn.use(self.app_login)
		self.app_conn.is_app_conn = 1
		
		# setup list of application doctypes
		webnotes.adt_list = self.app_conn.get_value("Control Panel", None, 'adt_list')
		webnotes.adt_list = webnotes.adt_list and webnotes.adt_list.split('\n') or ['DocType', 'DocField', 'DocPerm', 'Role', 'Page', 'Page Role', 'Module Def', 'Print Format', 'Search Criteria']
	
	def check_ip(self):
		if self.session:
			if self.session['data']['session_ip'] != self.remote_ip:
				raise Exception, "Your IP address has changed mid-session. For security reasons, please login again"

	# Load Session
	# =================================================================================

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
	
	# Login
	# =================================================================================

	def login(self, as_guest = 0):
		if as_guest:
			res = self.conn.sql("select name from tabProfile where name='Guest' and ifnull(enabled,0)=1")
			if not res:
				raise Exception, "No Guest Access"
			self.user_id = res[0][0]
		else:
			self.user_id = self.check_password(self.form.getvalue('usr'), self.form.getvalue('pwd'))
		
		# yes allowed to create session
		if self.user_id:
		
			# if not guest, then do login
			if not as_guest:
				self.out['message'] = 'Logged In'
				self.call_on_login_pre_session()

			# validate blocked IP
			self.validate_ip(self.user_id)

			# start session
			self.start_session(self.user_id)
			
			# second on_login method - post session
			if not as_guest:
				self.call_on_login_post_session()
				
			return True
	
	def call_on_login_pre_session(self):
		import webnotes.model.code
		try:
			self.cp = webnotes.model.code.get_obj('Control Panel', 'Control Panel')
			if hasattr(self.cp, 'on_login'):
				self.cp.on_login(self)
		except:
			pass

	def call_on_login_post_session(self):
		if not self.cp:
			return
		if hasattr(self.cp, 'on_login_post_session'):
			self.cp.on_login_post_session(self)
	
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

	# Start Session
	# =================================================================================
	
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

	# Update session, at the end of the request
	# =================================================================================
	
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

	# Set cookies, on login
	# =================================================================================
	
	def set_cookies(self):
		if self.account_id:
			self.out_cookies['account_id'] = self.account_id
			
		elif self.account:
			self.out_cookies['ac_name'] = self.account
			
		if self.app_login:
			self.out_cookies['app_id'] = self.app_login
		else:
			self.out_cookies['app_id'] = ''
			
		self.out_cookies['sid'] = self.session['sid']

	# Set the remember me cookie, give expiry to cookies
	# =================================================================================

	def set_remember_me(self):
		if webnotes.utils.cint(self.form.getvalue('remember_me')):
			remember_days = self.conn.get_value('Control Panel',None,'remember_for_days') or 7
			import datetime
			self.out_cookies['remember_me'] = 1
			expires = datetime.datetime.now() + datetime.timedelta(days=remember_days)
			for k in self.out_cookies.keys():
				self.out_cookies[k]['expires'] = expires.strftime('%a, %d %b %Y %H:%M:%S')	
	
	def set_in_cookies(self):
		return webnotes.utils.get_incoming_cookies()

	# Logout
	# =================================================================================

	def call_on_logout_event(self):
		import webnotes.model.code
		cp = webnotes.model.code.get_obj('Control Panel', 'Control Panel')
		if hasattr(cp, 'on_logout'):
			cp.on_logout(self)

	def logout(self, call_on_logout = 1):
		if call_on_logout:
			self.call_on_logout_event()

		webnotes.conn.sql('delete from tabSessions where sid="%s"' % webnotes.session['sid'])
		self.out_cookies['sid'] = ''
		self.out_cookies['remember_me'] = ''
		