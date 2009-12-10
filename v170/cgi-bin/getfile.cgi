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
#


try:

	import sys, os
	
	sys.path.append(os.getcwd()+'/cgi-bin')

	def getTraceback():
		import sys, traceback, string
		type, value, tb = sys.exc_info()
		body = "Traceback (innermost last):\n"
		list = traceback.format_tb(tb, None) \
			+ traceback.format_exception_only(type, value)
		body = body + "%-20s %s" % (string.join(list[:-1], ""), list[-1])
		return body

	import cgi
	from webnotes import server
	
	form = cgi.FieldStorage()
	n = form.getvalue('name')

	if form.getvalue('ac'):
		ac = form.getvalue('ac')
	else:
		ac = 'accounts'
	
	try:
		res = server.sql_accounts("select db_name, db_login from tabAccount where ac_name='%s' or db_name='%s'" % (ac,ac))
		if res:
			server.db_name = res[0][0]
			if res[0][1]:
				server.db_login = res[0][1]
			else:
				server.db_login = res[0][0]
	except:
		pass			
	
	res = server.get_file(n)
	
	fname = res[0][0]
	if hasattr(res[0][1], 'tostring'):
		fcontent = res[0][1].tostring()
	else: 
		fcontent = res[0][1]
	fmodified = res[0][2]

	if form.getvalue('thumbnail'):
		tn = server.cint(form.getvalue('thumbnail'))
		from PIL import Image
		import cStringIO
		
		fobj = cStringIO.StringIO(fcontent)
		image = Image.open(fobj)
		image.thumbnail((tn,tn*2), Image.ANTIALIAS)
		outfile = cStringIO.StringIO()

		if image.mode != "RGB":
			image = image.convert("RGB")

		image.save(outfile, 'JPEG')
		outfile.seek(0)
		fcontent = outfile.read()

	import mimetypes
	print "Content-Type: %s" % (mimetypes.guess_type(n)[0] or 'application/unknown')
	print "Content-Disposition: filename="+n.replace(' ', '_')
	print "Cache-Control: max-age=3600"
	print
	print fcontent
				
except Exception, e:
	print "Content-Type: text/html"
	try:
		out = {'message':'', 'exc':getTraceback().replace('\n','<br>')}
	except:
		out = {'exc': e}
	print
	print str(out)