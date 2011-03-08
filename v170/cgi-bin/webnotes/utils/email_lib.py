# ===========================================
# Email class:
# Sends email via outgoing server specified in "Control Panel"
# Allows easy adding of Attachments of "File" objects
# ===========================================

import webnotes	
import webnotes.defs
from webnotes import msgprint

class EMail:
	def __init__(self, sender='', recipients=[], subject='', from_defs=0, alternative=0):
		from email.mime.multipart import MIMEMultipart
		if type(recipients)==str:
			recipients.replace(';', ',')
			recipients = recipients.split(',')
			
		self.from_defs = from_defs
		self.sender = sender
		self.reply_to = sender
		self.recipients = recipients
		self.subject = subject
		self.msg = MIMEMultipart(alternative and 'alternative' or None)
		self.cc = []
		
	def set_message(self, message, mime_type='text/html'):
		from email.mime.text import MIMEText
		
		maintype, subtype = mime_type.split('/')
		msg = MIMEText(message, _subtype = subtype)
		self.msg.attach(msg)
		
	def attach(self, n):
		from webnotes.utils.file_manager import get_file		
		res = get_file(n)
		if not res:
			self.msg.attach('Sender tried to attach an unknown file id: ' + n)
	
		from email.mime.audio import MIMEAudio
		from email.mime.base import MIMEBase
		from email.mime.image import MIMEImage
		from email.mime.text import MIMEText
			
		fname = res[0][0]
		fcontent = res[0][1]
		
		import mimetypes

		ctype, encoding = mimetypes.guess_type(fname)
		if ctype is None or encoding is not None:
			# No guess could be made, or the file is encoded (compressed), so
			# use a generic bag-of-bits type.
			ctype = 'application/octet-stream'
		
		maintype, subtype = ctype.split('/', 1)
		if maintype == 'text':
			# Note: we should handle calculating the charset
			msg = MIMEText(fcontent, _subtype=subtype)
		elif maintype == 'image':
			msg = MIMEImage(fcontent, _subtype=subtype)
		elif maintype == 'audio':
			msg = MIMEAudio(fcontent, _subtype=subtype)
		else:
			msg = MIMEBase(maintype, subtype)
			msg.set_payload(fcontent)
			# Encode the payload using Base64
			from email import encoders
			encoders.encode_base64(msg)
		# Set the filename parameter
		msg.add_header('Content-Disposition', 'attachment', filename=fname)
		self.msg.attach(msg)
	
	def validate(self):
		if not self.sender:
			self.sender = webnotes.conn.get_value('Control Panel',None,'auto_email_id')

		from webnotes.utils import validate_email_add
		# validate ids
		if self.sender and (not validate_email_add(self.sender)):
			raise Exception, "%s is not a valid email id" % self.sender

		if self.reply_to and (not validate_email_add(self.reply_to)):
			raise Exception, "%s is not a valid email id" % reply_to

		for e in self.recipients:
			if not validate_email_add(e):
				raise Exception, "%s is not a valid email id" % e	
	
	def setup(self):
		if self.from_defs:
			self.server = getattr(webnotes.defs,'mail_server','')
			self.login = getattr(webnotes.defs,'mail_login','')
			self.port = getattr(webnotes.defs,'mail_port',None)
			self.password = getattr(webnotes.defs,'mail_password','')
			self.use_ssl = getattr(webnotes.defs,'use_ssl',0)

		else:	
			import webnotes.model.doc
			from webnotes.utils import cint

			# get defaults from control panel
			cp = webnotes.model.doc.Document('Control Panel','Control Panel')
			self.server = cp.outgoing_mail_server and cp.outgoing_mail_server or getattr(webnotes.defs,'mail_server','')
			self.login = cp.mail_login and cp.mail_login or getattr(webnotes.defs,'mail_login','')
			self.port = cp.mail_port and cp.mail_port or getattr(webnotes.defs,'mail_port',None)
			self.password = cp.mail_password and cp.mail_password or getattr(webnotes.defs,'mail_password','')
			self.use_ssl = cint(cp.use_ssl)

	def make_msg(self):
		self.msg['Subject'] = self.subject
		self.msg['From'] = self.sender
		self.msg['To'] = ', '.join([r.strip() for r in self.recipients])
		self.msg['Reply-To'] = self.reply_to
		if self.cc:
			self.msg['CC'] = ', '.join([r.strip() for r in self.cc])
	
	def add_to_queue(self):
		# write to a file called "email_queue" or as specified in email
		q = EmailQueue()
		q.push({
			'server': self.server, 
			'port': self.port, 
			'use_ssl': self.use_ssl,
			'login': self.login,
			'password': self.password,
			'sender': self.sender,
			'recipients': self.recipients, 
			'msg': self.msg.as_string()
		})
		q.close()

	def send(self, send_now = 0):
		from webnotes.utils import cint
		
		self.setup()
		self.validate()
		self.make_msg()
		
		if (not send_now) and getattr(webnotes.defs, 'batch_emails'):
			self.add_to_queue()
			return
			
		import smtplib
		sess = smtplib.SMTP(self.server, self.port or None)
		
		if self.use_ssl: 
			sess.ehlo()
			sess.starttls()
			sess.ehlo()
		
		ret = sess.login(self.login, self.password)

		# check if logged correctly
		if ret[0]!=235:
			msgprint(ret[1])
			raise Exception
				
		sess.sendmail(self.sender, self.recipients, self.msg.as_string())
		
		try:
			sess.quit()
		except:
			pass
# ===========================================
# Email Queue
# Maintains a list of emails in a file
# Flushes them when called from cron
# Defs settings:
# 	email_queue: (filename) [default: email_queue.py]
#
# From the scheduler, call: flush(qty)
# ===========================================

class EmailQueue():
	def __init__(self):
		self.server = self.login = self.sess = None
		self.filename = getattr(webnotes.defs, 'email_queue', 'email_queue.py')
	
		try:
			f = open(self.filename, 'r')
			self.queue = eval(f.read() or '[]')
			f.close()
		except IOError, e:
			if e.args[0]==2:
				self.queue = []
			else:
				raise e
		
	def push(self, email):
		self.queue.append(email)
		
	def close(self):
		f = open(self.filename, 'w')
		f.write(str(self.queue))
		f.close()

	def get_smtp_session(self, e):
		if self.server==e['server'] and self.login==e['login'] and self.sess:
			return self.sess

		webnotes.msgprint('getting server')

		import smtplib
	
		sess = smtplib.SMTP(e['server'], e['port'] or None)
		
		if self.use_ssl: 
			sess.ehlo()
			sess.starttls()
			sess.ehlo()
			
		ret = sess.login(e['login'], e['password'])

		# check if logged correctly
		if ret[0]!=235:
			webnotes.msgprint(ret[1])
			raise Exception
						
		self.sess = sess
		self.server, self.login = e['server'], e['login']
		
		return sess
		
	def flush(self, qty = 100):
		f = open(self.filename, 'r')
		
		self.queue = eval(f.read() or '[]')
		
		if len(self.queue) < 100:
			qty = len(self.queue)

		for i in range(qty):
			e = self.queue[i]
			sess = self.get_smtp_session(e)
			sess.sendmail(e['sender'], e['recipients'], e['msg'])			
		
		self.queue = self.queue[:(len(self.queue) - qty)]
		self.close()

# text + html type of email
# ===========================================

def sendmail_html(sender, recipients, subject, html, text, template='', send_now=0):
	from email.mime.multipart import MIMEMultipart

	email = EMail(sender, recipients, subject, alternative = 1)
	
	email.set_message(text, 'text/plain')
	email.set_message(make_html_body(html, template), 'text/html')

	email.send(send_now)

# build html content
# ===========================================

def make_html_body(content, template = ''):
	from webnotes.model.code import get_code

	template_html = '%(content)s'
	
	if template:
		template_html = get_code(webnotes.conn.get_value('Page Template', template, 'module'), 'Page Template', template, 'html', fieldname='template')
	
	footer = get_footer()
	if footer: content += footer
	
	return template_html % {'content': content}

# standard email
# ===========================================

def sendmail(recipients, sender='', msg='', subject='[No Subject]', parts=[], cc=[], attach=[], send_now=0):
	
	email = EMail(sender, recipients, subject)
	email.cc = cc
		
	if msg: 
		email.set_message(msg)
	for p in parts:
		email.set_message(p[1])
	for a in attach:
		email.attach(a)

	footer = get_footer()
	if footer: email.set_message(footer)

	email.send()

# footer
# ===========================================

def get_footer():

	footer = webnotes.conn.get_value('Control Panel',None,'mail_footer') or ''
	footer += (webnotes.conn.get_global('global_mail_footer') or '')
	return footer

def get_form_link(dt, dn):
	public_domain = webnotes.conn.get_value('Control Panel', None, 'public_domain')
	from webnotes.utils.encrypt import encrypt

	if not public_domain:
		return ''

	args = {
		'dt': dt, 
		'dn':dn, 
		'acx': webnotes.conn.get_value('Control Panel', None, 'account_id'),
		'server': public_domain,
		'akey': encrypt(dn)
	}
	return '<div>If you are unable to view the form below <a href="http://%(server)s/index.cgi?page=Form/%(dt)s/%(dn)s&acx=%(acx)s&akey=%(akey)s">click here to see it in your browser</div>' % args
	
# Send Form
# ===========================================

def send_form():
	import webnotes
	from webnotes.utils import cint

	form = webnotes.form

	recipients = form.getvalue('sendto')
	subject = form.getvalue('subject')
	sendfrom = form.getvalue('sendfrom')
	
	# get attachments
	al = []
	if cint(form.getvalue('with_attachments')):
		try:
			al = webnotes.conn.sql('select file_list from `tab%s` where name="%s"' % (form.getvalue('dt'), form.getvalue('dn')))
			if al:
				al = (al[0][0] or '').split('\n')
		except Exception, e:
			if e.args[0]==1146:
				pass # no attachments in single types!
			else:
				raise Exception, e
				
	# make the email
	if recipients:
		recipients = recipients.replace(';', ',')
		recipients = recipients.split(',')
		update_contacts(recipients)

		email = EMail(sendfrom, recipients, subject)
		email.cc = [form.getvalue('cc'),]

		if form.getvalue('message'):
			email.set_message(form.getvalue('message'))
		
		# link
		form_link = get_form_link(form.getvalue('dt'), form.getvalue('dn'))
		if form_link:
			email.set_message(form_link)
		
		# attach the print format
		email.set_message(form.getvalue('body'))
	
		# footer
		footer = get_footer()
		if footer: email.set_message(footer)
				
		for a in al:
			if a:
				email.attach(a.split(',')[0])

		email.send(send_now=1)
	webnotes.msgprint('Sent')

# get list of contacts for autosuggest
# --------------------------------------------

def get_contact_list():
	import webnotes

	cond = ['`%s` like "%s%%"' % (f, webnotes.form.getvalue('txt')) for f in webnotes.form.getvalue('where').split(',')]
	cl = webnotes.conn.sql("select `%s` from `tab%s` where %s" % (
  			 webnotes.form.getvalue('select')
			,webnotes.form.getvalue('from')
			,' OR '.join(cond)
		)
	)
	webnotes.response['cl'] = filter(None, [c[0] for c in cl])
	
# Add to Contacts
# --------------------------------------------

def update_contacts(recipients):
	import webnotes
	from webnotes.model.doc import Document
	
	for r in recipients:
		r = r.strip()
		try:
			if not webnotes.conn.sql("select email_id from tabContact where email_id=%s", r):
				d = Document('Contact')
				d.email_id = r
				d.save(1)
		except Exception, e:
			if e.args[0]==1146: pass # no table
			else: raise e
