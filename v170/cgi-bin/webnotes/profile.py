import webnotes

class Profile:
	def __init__(self, name=''):
		self.name = name or webnotes.session['user']
		self.roles = []

		self.can_create = []
		self.can_read = []
		self.can_write = []
		
	def load_roles(self):
		res = webnotes.conn.sql('select role from tabUserRole where parent = "%s"' % self.name)
		self.roles = []
		for t in res:
			if t[0]: self.roles.append(t[0])
		if webnotes.session['user'] == 'Guest':
			self.roles.append('Guest')
		else:
			self.roles.append('All')
			
		return self.roles

	def get_roles(self):
		if self.roles:
			return self.roles
		
		return self.load_roles()
	
	def get_allow_list(self, key):
		role_options = ["role = '"+r+"'" for r in self.get_roles()]
		return [r[0] for r in webnotes.conn.sql('SELECT DISTINCT parent FROM `tabDocPerm` WHERE `%s`=1 AND parent not like "old_parent:%%" AND (%s) order by parent' % (key, ' OR '.join(role_options)))]
	
	def get_create_list(self):
		cl = self.get_allow_list('create')
		no_create_list = [r[0] for r in webnotes.conn.sql('select name from tabDocType where in_create = 1 or istable=1')]
		self.can_create = filter(lambda x: x not in no_create_list, cl)
		return self.can_create
		
	def get_read_list(self):
		self.can_read = list(set(self.get_allow_list('read') + self.get_allow_list('write')))
		return self.can_read
	
	def get_write_list(self):
		self.can_write = self.get_allow_list('write')
		return self.can_write

	def get_home_page(self):
		try:
			hpl = webnotes.conn.sql("select role, home_page from `tabDefault Home Page` where parent='Control Panel' order by idx asc")
			for h in hpl:
				if h[0] in webnotes.session['data']['roles']:
					return h[1]
		except:
			pass
		return webnotes.conn.get_value('Control Panel',None,'home_page')

		roles.append(session['user'])

	def get_defaults(self):
		
		rl = self.get_roles() + [self.name]
		role_options = ["parent = '"+r+"'" for r in rl]
		res = webnotes.conn.sql('select defkey, defvalue from `tabDefaultValue` where %s' % ' OR '.join(role_options))
	
		self.defaults = {'owner': [self.name,]}

		for rec in res: 
			if not self.defaults.has_key(rec[0]): 
				self.defaults[rec[0]] = []
			self.defaults[rec[0]].append(rec[1] or '')

		return self.defaults
		
	def get_random_password(self):
		import string
		from random import choice
		
		size = 9
		pwd = ''.join([choice(string.letters + string.digits) for i in range(size)])
		return pwd

	def reset_password(self):
	
		pwd = random_password()
		
		# get profile
		profile = webnotes.conn.sql("SELECT name, email FROM tabProfile WHERE name=%s OR email=%s",(self.name, self.name))
		
		if not profile:
			raise Exception, "Profile %s not found" % self.name
		
		# update tab Profile
		webnotes.conn.sql("UPDATE tabProfile SET password=password(%s) WHERE name=%s", (pwd, profile[0][0]))
		
		# send email

	# update recent documents
	def update_recent(self, dt, dn):
		if not (dt in ['Print Format', 'Start Page', 'Event', 'ToDo Item', 'Search Criteria']) and not webnotes.is_testing:
			r = sql("select recent_documents from tabProfile where name=%s", self.name)[0][0]
			self.recent = [dt+'~~~'+dn] + r
			
			if len(self.recent) > 50:
				self.recent[:49]
			
			webnotes.conn.sql("update tabProfile set recent_documents=%s where name=%s", ('\n'.join(self.recent), self.name))
			
	def load_profile(self):
		t = webnotes.conn.sql('select email, first_name, last_name, recent_documents from tabProfile where name = %s', self.name)[0]

		d = {}
		d['email'] = t[0]
		d['first_name'] = t[1]
		d['last_name'] = t[2]
		d['recent'] = t[3]
		
		d['roles'] = self.get_roles()
		d['defaults'] = self.get_defaults()
		
		d['can_create'] = self.get_create_list()
		d['can_read'] = self.get_read_list()
		d['can_write'] = self.get_write_list()
		
		return d
		
	def load_from_session(self):

		d = session['data']['profile']
		self.can_create = d['can_create']
		self.can_read = d['can_read']
		self.can_write = d['can_write']

		self.roles = d['roles']
		self.defaults = d['defaults']
