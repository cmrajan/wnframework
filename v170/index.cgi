#!/usr/bin/python
def getTraceback():
	from webnotes import utils
	utils.getTraceback()
try:

	import sys, os, cgi
	
	sys.path.append(os.getcwd()+'/cgi-bin')
	import webnotes


	webnotes.form = cgi.FieldStorage()
	for each in webnotes.form.keys():
		webnotes.form_dict[each] = webnotes.form.getvalue(each)
	if webnotes.form.getvalue('cmd'):
		# AJAX Call
		import webnotes.handler
	else:
		# Page Call
		import webnotes.auth
		import webnotes.widgets.page_body
		import webnotes.profile
		import Cookie

		webnotes.cookies = Cookie.SimpleCookie()
		auth_obj = webnotes.auth.Authentication(webnotes.form_dict, webnotes.cookies, {})
	
		print "Content-Type: text/html"

		# print cookies, if there ar additional cookies defined during the request, add them here
		if webnotes.cookies or webnotes.add_cookies:
			for c in webnotes.add_cookies.keys():
				webnotes.cookies[c] = webnotes.add_cookies[c]
			
			print webnotes.cookies

		print
		print webnotes.widgets.page_body.get()

except Exception, e:
	print "Content-Type: text/html"
	print
	print getTraceback().replace('\n','<br>')
   	print e	
