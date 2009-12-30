#!/usr/bin/python

try:

	import sys, os, cgi
	
	sys.path.append(os.getcwd()+'/cgi-bin')

	def getTraceback():
		import sys, traceback, string
		type, value, tb = sys.exc_info()
		body = "Traceback (innermost last):\n"
		list = traceback.format_tb(tb, None) \
			+ traceback.format_exception_only(type, value)
		body = body + "%-20s %s" % (string.join(list[:-1], ""), list[-1])
		return body

	import webnotes
	
	webnotes.form = cgi.FieldStorage()

	if webnotes.form.getvalue('cmd'):
		# AJAX Call
		import webnotes.handler
	else:
		# Page Call
		import webnotes.auth
		import webnotes.widgets.page_body

		auth_obj = webnotes.auth.Authentication(webnotes.form, {}, {})
		import os
		content_html = webnotes.widgets.page_body.get_static_content()
	
		print "Content-Type: text/html"
		print
		print webnotes.widgets.page_body.out % {'content':content_html}
			
except Exception, e:
	print "Content-Type: text/html"
	print
	print getTraceback().replace('\n','<br>')
	