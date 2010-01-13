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
	
	form = cgi.FieldStorage()
	n = form.getvalue('name')

	# authenticate
	auth_obj = webnotes.auth.Authentication(form, {}, [])
	
	# get file
	res = webnotes.utils.get_file(n)
	
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