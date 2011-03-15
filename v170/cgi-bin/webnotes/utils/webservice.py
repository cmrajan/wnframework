import webnotes
import webnotes.utils

class FrameworkServer:
	def __init__(self, remote_host, path, user='', password='', account='', cookies=None, opts=None, https = 0):
		# validate
		if not (remote_host and path):
			raise Exception, "Server address and path necessary"

		if not ((user and password) or (cookies)):
			raise Exception, "Either cookies or user/password necessary"
	
		self.remote_host = remote_host
		self.path = path
		self.cookies = cookies or {}
		self.webservice_method='POST'
		self.account = account
		self.account_id = None
		self.https = https
		self.conn = None

		# login
		if not cookies:
			args = { 'usr': user, 'pwd': password, 'acx': account }
			
			if opts:
				for key in opts: # add additional keys
					args[key] = opts[key]
			
			res = self.http_get_response('login', args)
		
			ret = res.read()
			try:
				ret = eval(ret)
			except Exception, e:
				webnotes.msgprint(ret)
				raise Exception, e
				
			if ret.get('message') and ret.get('message')!='Logged In':
				raise Exception, ret.get('message')
				
			if ret.get('exc'):
				raise Exception, ret.get('exc')
				
			self._extract_cookies(res)

			self.account_id = self.cookies.get('account_id')
			self.app_id = self.cookies.get('app_id')
			self.sid = self.cookies.get('sid')
			
			self.login_response = res
			self.login_return = ret

	# -----------------------------------------------------------------------------------------

	def http_get_response(self, method, args):
		# get response from remote server
	
		import urllib, urllib2, os

		args['cmd'] = method
		if self.path=='/': self.path = ''
		
		protocol = self.https and 'https://' or 'http://'
		req = urllib2.Request(protocol + os.path.join(self.remote_host, self.path, 'index.cgi'), urllib.urlencode(args))
		for key in self.cookies:
			req.add_header('Set-Cookie', '%s=%s' % (key, self.cookies[key]))
		return urllib2.urlopen(req)

		"""
		headers = {}
		if self.cookies:
			headers.update(self._build_cookies())
	
		if self.webservice_method == 'POST':
			headers["ENCTYPE"] =  "multipart/form-data"
			headers["Accept"] = "text/plain, text/html, */*"
			headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8"
		
		if not self.conn:
			if self.https:
				self.conn = httplib.HTTPSConnection(self.remote_host)	
			else:
				self.conn = httplib.HTTPConnection(self.remote_host)	
			
		import os
		self.conn.request(self.webservice_method, os.path.join(self.path, "index.cgi"), urllib.urlencode(args), headers=headers)
	
		return self.conn.getresponse()
		"""
		
	# -----------------------------------------------------------------------------------------

	def _build_cookies(self):
		sc = {}
		for key in self.cookies:
			sc['Cookie'] = '%s=%s' % (key, self.cookies[key])
		return sc

	# -----------------------------------------------------------------------------------------
	
	def _extract_cookies(self, res):
		import Cookie
		cookies = Cookie.SimpleCookie()
		cookies.load(res.headers.get('set-cookie'))
		for c in cookies.values():
			self.cookies[c.key] = c.value

	# -----------------------------------------------------------------------------------------

	def runserverobj(self, doctype, docname, method, arg=''):
		res = self.http_get_response('runserverobj', args = {
			'doctype':doctype
			,'docname':docname
			,'method':method
			,'arg':arg
		})
		ret = eval(res.read())
		if ret.get('exc'):
			raise Exception, ret.get('exc')
		return ret
	
	# -----------------------------------------------------------------------------------------
			
	def run_method(self, method, args):
		res = self.http_get_response(method, args)
		ret = eval(res.read())
		if ret.get('exc'):
			raise Exception, ret.get('exc')
		return ret