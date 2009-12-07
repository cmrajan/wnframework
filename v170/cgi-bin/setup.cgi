#!/usr/bin/python

# Copyright 2005-2008, Rushabh Mehta (RMEHTA _AT_ GMAIL) 
#
#   Web Notes Framework is free software: you can redistribute it and/or modify
#    it under the terms of the GNU General Public License as published by
#    the Free Software Foundation, either version 3 of the License, or
#    (at your option) any later version.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU General Public License for more details.
#
#    For a copy of the GNU General Public License see 
#    <http://www.gnu.org/licenses/>.
#    
#    Web Notes Framework is also available under a commercial license with
#    patches, upgrades and support. For more information see 
#    <http://webnotestech.com>


print "Content-Type: text/html"

####

try:

	import sys, os, cgi
	
	form = cgi.FieldStorage()
	if form.has_key('password'):
	
		sys.path.append(os.getcwd()+'/cgi-bin')
	
		def getTraceback():
			import sys, traceback, string
			type, value, tb = sys.exc_info()
			body = "Traceback (innermost last):\n"
			list = traceback.format_tb(tb, None) \
				+ traceback.format_exception_only(type, value)
			body = body + "%-20s %s" % (string.join(list[:-1], ""), list[-1])
			return body
			
		import server, setup
		print
		
		# account
		ac = server.db_name
		if form.has_key('ac'):
			ac = form.getvalue('ac')
		server.sql("START TRANSACTION")
		out = setup.setup_db(ac, server.db_login)
		server.sql("COMMIT")
		print '<br>'.join(out)
		
	else:
		print
		print "Password not provided"
		
except Exception, e:
	try:
		out = {'message':'', 'exc':getTraceback().replace('\n','<br>')}
	except:
		out = e
	print
	print str(out)