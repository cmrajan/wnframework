import webnotes
import webnotes.db
import webnotes.utils
import webnotes.profile
import webnotes.defs

# =================================================================================
# HTTPRequest
# =================================================================================

class HTTPRequest:
	def __init__(self):

		# Get Environment variables
		self.domain = webnotes.get_env_vars('HTTP_HOST')
		if self.domain and self.domain.startswith('www.'):
			self.domain = self.domain[4:]

		webnotes.remote_ip = webnotes.get_env_vars('REMOTE_ADDR')					

		# load cookies
		webnotes.cookie_manager = CookieManager()

		# set db
		self.set_db()

		# check status
		if webnotes.conn.get_global("__session_status")=='stop':
			webnotes.msgprint(webnotes.conn.get_global("__session_status_message"))
			raise Exception

		# login
		webnotes.login_manager = LoginManager()

		# start session
		webnotes.session_obj = Session()
		webnotes.session = webnotes.session_obj.data
		webnotes.tenant_id = webnotes.session.get('tenant_id', 0)

		# write out cookies if sid is supplied (this is a pre-logged in redirect)
		if webnotes.form_dict.get('sid'):
			webnotes.cookie_manager.set_cookies()

		# run login triggers
		if webnotes.form_dict.get('cmd')=='login':
			webnotes.login_manager.run_trigger('on_login_post_session')
			
		# load profile
		self.setup_profile()

	# setup profile
	# -------------

	def setup_profile(self):
		webnotes.user = webnotes.profile.Profile()
		# load the profile data
		if webnotes.session['data'].get('profile'):
			webnotes.user.load_from_session(webnotes.session['data']['profile'])
		else:
			webnotes.user.load_profile()	


	# get account name
	# ------------------

	def get_ac_name(self):
		# login
		if webnotes.form_dict.get('acx'):
			return webnotes.form_dict.get('acx')
		
		# in form
		elif webnotes.form_dict.get('ac_name'):
			return webnotes.form_dict.get('ac_name')
			
		# in cookie
		elif webnotes.incoming_cookies.get('ac_name'):
			return webnotes.incoming_cookies.get('ac_name')
			
			
	# set database login
	# ------------------

	def set_db(self, ac_name = None):
		from webnotes.settings import account_map

		ac_name = None
		
		# select based on subdomain
		if account_map.domain_name_map.get(self.domain):
			db_name = account_map.domain_name_map.get(self.domain)

		# select based on ac_name
		else:
			ac_name = self.get_ac_name()
			if ac_name:
				db_name = account_map.db_name_map.get(ac_name, account_map.default_db_name)
			else:
				db_name = account_map.default_db_name
	
		webnotes.conn = webnotes.db.Database(user = db_name,password = getattr(webnotes.defs,'db_password'))
		webnotes.ac_name = ac_name

# =================================================================================
# Login Manager
# =================================================================================

class LoginManager:
	def __init__(self):
		self.cp = None
		if webnotes.form_dict.get('cmd')=='login':
			# clear cache
			from webnotes.session_cache import clear_cache
			clear_cache(webnotes.form_dict.get('usr'))				

			self.authenticate()
			self.post_login()
			webnotes.response['message'] = 'Logged In'

	# run triggers, write cookies
	# ---------------------------
	
	def post_login(self):
		self.validate_ip_address()
		self.run_trigger()
	
	# check password
	# --------------
	
	def authenticate(self, user=None, pwd=None):
		if not (user and pwd):	
			user, pwd = webnotes.form_dict.get('usr'), webnotes.form_dict.get('pwd')

		if not (user and pwd):
			raise Exception, 'Incomplete Login Details'
			webnotes.msgprint('Incomplete Login Details')
		
		# custom authentication (for single-sign on)
		self.load_control_panel()
		if hasattr(self.cp, 'authenticate'):
			self.user = self.cp.authenticate()
		
		# check the password
		if user=='Administrator':
			p = webnotes.conn.sql("select name from tabProfile where name=%s and (`password`=%s OR `password`=PASSWORD(%s))", (user, pwd, pwd))
		else:
			p = webnotes.conn.sql("select name from tabProfile where name=%s and (`password`=%s  OR `password`=PASSWORD(%s)) and IFNULL(enabled,0)=1", (user, pwd, pwd))
			
		if not p:
			webnotes.response['message'] = 'Authentication Failed'
			raise Exception, 'Authentication Failed'
			
		self.user = p[0][0]
	
	# triggers
	# --------
	
	def load_control_panel(self):
		import webnotes.model.code
		try:
			if not self.cp:
				self.cp = webnotes.model.code.get_obj('Control Panel')
		except Exception, e:
			webnotes.response['Control Panel Exception'] = webnotes.utils.getTraceback()
	
	# --------
	def run_trigger(self, method='on_login'):
		self.load_control_panel()
		if self.cp and hasattr(self.cp, method):
			self.cp.on_login(self)

	# ip validation
	# -------------
	
	def validate_ip_address(self):
		try:
			ip = webnotes.conn.sql("select ip_address from tabProfile where name = '%s'" % self.user)[0][0] or ''
		except: return
			
		ip = ip.replace(",", "\n").split('\n')
		ip = [i.strip() for i in ip]
			
		if ret and ip:
			if not (webnotes.remote_ip.startswith(ip[0]) or (webnotes.remote_ip in ip)):
				raise Exception, 'Not allowed from this IP Address'	

	# login as guest
	# --------------
	
	def login_as_guest(self):
		res = webnotes.conn.sql("select name from tabProfile where name='Guest' and ifnull(enabled,0)=1")
		if not res:
			raise Exception, "No Guest Access"
		self.user = 'Guest'
		self.post_login()

	# Logout
	# ------
	
	def call_on_logout_event(self):
		import webnotes.model.code
		cp = webnotes.model.code.get_obj('Control Panel', 'Control Panel')
		if hasattr(cp, 'on_logout'):
			cp.on_logout(self)

	def logout(self, call_on_logout = 1):
		if call_on_logout:
			self.call_on_logout_event()

		webnotes.conn.sql('update tabSessions set status="Logged Out" where sid="%s"' % webnotes.session['sid'])
		
# =================================================================================
# Cookie Manager
# =================================================================================

class CookieManager:
	def __init__(self):
		import Cookie
		self.get_incoming_cookies()
		webnotes.cookies = Cookie.SimpleCookie()

	# get incoming cookies
	# --------------------
	def get_incoming_cookies(self):
		import os
		cookies = {}
		if 'HTTP_COOKIE' in os.environ:
			c = os.environ['HTTP_COOKIE']
			c = c.split('; ')
				  
			for cookie in c:
				cookie = cookie.split('=')
				cookies[cookie[0].strip()] = cookie[1].strip()
					
		webnotes.incoming_cookies = cookies
		
	# Set cookies
	# -----------
	
	def set_cookies(self):
		if webnotes.conn.cur_db_name:
			webnotes.cookies['account_id'] = webnotes.conn.cur_db_name
		
		# ac_name	
		webnotes.cookies['ac_name'] = webnotes.ac_name or ''
		
		if webnotes.session.get('sid'):
			webnotes.cookies['sid'] = webnotes.session['sid']

			# sid expires in 3 days
			import datetime
			expires = datetime.datetime.now() + datetime.timedelta(days=3)

			webnotes.cookies['sid']['expires'] = expires.strftime('%a, %d %b %Y %H:%M:%S')		

	# Set Remember Me
	# ---------------

	def set_remember_me(self):
		if webnotes.utils.cint(webnotes.form_dict.get('remember_me')):
			remember_days = webnotes.conn.get_value('Control Panel',None,'remember_for_days') or 7
			webnotes.cookies['remember_me'] = 1

			import datetime
			expires = datetime.datetime.now() + datetime.timedelta(days=remember_days)

			for k in webnotes.cookies.keys():
				webnotes.cookies[k]['expires'] = expires.strftime('%a, %d %b %Y %H:%M:%S')	

# =================================================================================
# Session 
# =================================================================================

class Session:
	def __init__(self, user=None):
		self.user = user
		self.sid = webnotes.form_dict.get('sid') or webnotes.incoming_cookies.get('sid')
		self.data = {'user':user,'data':{}}

		if webnotes.form_dict.get('cmd')=='login':
			self.start()
			return
			
		self.load()
	
	# start a session
	# ---------------
	def load(self):
		import webnotes
		
		r=None
		try:
			r = webnotes.conn.sql("select user, sessiondata, status from tabSessions where sid='%s'" % self.sid)
		except Exception, e:
			if e.args[0]==1054:
				self.add_status_column()
			else:
				raise e
	
		if r:
			r=r[0]
			
			# ExipredSession
			if r[2]=='Expired' and (webnotes.form_dict.get('cmd')!='resume_session'):
				if r[0]=='Guest' or (not webnotes.form_dict.get('cmd')) or webnotes.form_dict.get('cmd')=='logout':
					webnotes.login_manager.login_as_guest()
					self.start()
				else:
					webnotes.response['session_status'] = 'Session Expired'
					raise Exception, 'Session Expired'
			elif r[2]=='Logged Out':
				webnotes.login_manager.login_as_guest()
				self.start()
				# allow refresh or logout
				if webnotes.form_dict.get('cmd') and webnotes.form_dict.get('cmd')!='logout':
					webnotes.response['session_status'] = 'Logged Out'
					raise Exception, 'Logged Out'
			else:
				self.data = {'data':eval(r[1]), 'user':r[0], 'sid': self.sid}
		else:				
			webnotes.login_manager.login_as_guest()
			self.start()
			

	# start a session
	# ---------------
	def start(self):
		import os
		import webnotes
		import webnotes.utils
		
		# generate sid
		self.data['user'] = webnotes.login_manager.user
		self.data['sid'] = webnotes.utils.generate_hash()
		self.data['data']['session_ip'] = os.environ.get('REMOTE_ADDR');
		self.data['data']['tenant_id'] = webnotes.form_dict.get('tenant_id', 0)

		# get ipinfo
		if webnotes.conn.get_value('Control Panel',None,'get_ip_info'):
			self.get_ipinfo()
		
		# insert session
		try:
			self.insert_session_record()
		except Exception, e:
			if e.args[0]==1054:
				self.add_status_column()
				self.insert_session_record()
			else:
				raise e

		# update profile
		webnotes.conn.sql("UPDATE tabProfile SET last_login = '%s', last_ip = '%s' where name='%s'" % (webnotes.utils.now(), webnotes.remote_ip, self.data['user']))

		# set cookies to write
		webnotes.session = self.data
		webnotes.cookie_manager.set_cookies()


	# resume session
	# --------------
	def resume(self):
		pwd = webnotes.form_dict.get('pwd')
		webnotes.login_manager.authenticate(self.data['user'], pwd)
		webnotes.conn.sql("update tabSessions set status='Active' where sid=%s", self.data['sid'])
		return 'Logged In'
	
	# update session
	# --------------
	def update(self):
		# update session
		webnotes.conn.sql("update tabSessions set sessiondata=%s, user=%s, lastupdate=NOW() where sid=%s" , (str(self.data['data']), self.data['user'], self.data['sid']))	

		self.check_expired()

	# check expired
	# -------------
	def check_expired(self):
		# in control panel?
		exp_sec = webnotes.conn.get_value('Control Panel', None, 'session_expiry') or '6:00:00'
		
		# set sessions as expired
		try:
			webnotes.conn.sql("update from tabSessions where TIMEDIFF(NOW(), lastupdate) > %s SET `status`='Expired'", exp_sec)
		except Exception, e:
			if e.args[0]==1054:
				self.add_status_column()
		
		# clear out old sessions
		webnotes.conn.sql("delete from tabSessions where TIMEDIFF(NOW(), lastupdate) > '72:00:00'")

	# -----------------------------
	def add_status_column(self):
		webnotes.conn.commit()
		webnotes.conn.sql("alter table tabSessions add column `status` varchar(20)")
		webnotes.conn.begin()


	# Get IP Info from ipinfodb.com
	# -----------------------------
	def get_ipinfo(self):
		from threading import Thread
		t = Thread(target=self._get_ipinfo)
		t.start()
		
		# timout in 2 seconds
		t.join(2)
		
		return

	def _get_ipinfo(self):
		import os,httplib,urllib
		conn=httplib.HTTPConnection("api.ipinfodb.com")  #open connention
		args={'ip':os.environ.get('REMOTE_ADDR'),'output':'json','key':'fbde5e1bc0cc79a17bf33f25e2fdb158218ec4177a7d0acd1853ea8d7fff0693'}
		try:
			conn.request("GET", "/v2/ip_query_country.php?"+urllib.urlencode(args))
			ret = conn.getresponse().read()
			self.data['data']['ipinfo'] = eval(ret)
			conn.close()
		except:
			pass
			
	# -----------------------------
	def insert_session_record(self):
		webnotes.conn.sql("insert into tabSessions (sessiondata, user, lastupdate, sid, status) values (%s , %s, NOW(), %s, 'Active')", (str(self.data['data']), self.data['user'], self.data['sid']))
		
