#!/usr/bin/python

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
	import webnotes
	import webnotes.auth
	import webnotes.utils
	import webnotes.db
	
	form = cgi.FieldStorage()
	n = form.getvalue('name')

	# authenticate
	auth_obj = webnotes.auth.Authentication(form, {}, [])
	
	# login to a particular account (if specified)
	if form.getvalue('acx'):
		# resolve database name from account id
		c = webnotes.db.Database(use_default=1)
		res = c.sql("select db_name, db_login from tabAccount where ac_name = '%s'" % form.getvalue('acx'))

		# connect
		webnotes.conn = webnotes.db.Database(user=res[0][1] or res[0][0])
		webnotes.conn.use(res[0][0])
	
	# get file
	res = webnotes.utils.get_file(n)
	
	fname = res[0][0]
	if hasattr(res[0][1], 'tostring'):
		fcontent = res[0][1].tostring()
	else: 
		fcontent = res[0][1]
	fmodified = res[0][2]

	if form.getvalue('thumbnail'):
		tn = webnotes.utils.cint(form.getvalue('thumbnail'))
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
	print "Content-Type: %s" % (mimetypes.guess_type(fname)[0] or 'application/unknown')
	print "Content-Disposition: filename="+fname.replace(' ', '_')
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