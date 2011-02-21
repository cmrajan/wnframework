# Please edit this list and import only required elements
import webnotes

from webnotes.utils import cint, flt
from webnotes.model.doc import Document
from webnotes.model.code import get_obj
from webnotes import session, form, is_testing, msgprint, errprint

sql = webnotes.conn.sql
get_value = webnotes.conn.get_value
	
# -----------------------------------------------------------------------------------------


class DocType:
	def __init__(self, doc, doclist):
		self.doc = doc
		self.doclist = doclist

	def execute_test(self, arg=''):
		out = ''
		exec(arg and arg or self.doc.test_code)
		webnotes.msgrint('that worked!')
		return out

	def on_update(self):
		# clear cache on save
		sql("delete from __SessionCache")

	def upload_many(self,form):
		form_name = form.getvalue('form_name')
		if form_name == 'File Browser':
			self.ret = get_obj('File Browser Control').upload_many(form)
		elif form_name == 'banner_options' or form_name == 'letter_head_options':
			self.ret = get_obj('Personalize Page Control').upload_many(form)

	def upload_callback(self,form):
		form_name = form.getvalue('form_name')
		if(self.ret) and form_name == 'File Browser':
			if self.ret == 'No file found.':
				return 'window.parent.msgprint("No file found.")'
			elif self.ret == 'File Group is mandatory.':
				return 'window.parent.msgprint("File Group is mandatory.")'
			else:
				ret = eval(self.ret)
				return "window.parent.pscript.load_child_nodes()"
		elif form_name == 'banner_options':
			if(self.ret == 'No file found'):
				return "window.parent.msgprint('Please select file to upload')"
			else:
				return "window.parent.pscript.set_pp_banner(); window.parent.pscript.upload_obj.obj.hide();"
		elif form_name == 'letter_head_options':
			if(self.ret == 'No file found'):
				return "window.parent.msgprint('Please select file to upload')"
			else:
				return "window.parent.pscript.set_pp_lh(); window.parent.pscript.upload_obj.obj.hide();"

	# Login 
	# ===========================================================

	def on_login(self, login_manager):
		import webnotes

		# login as
		user = webnotes.form.getvalue('login_as')
    
		if user:
			# alisaing here... so check if the user is disabled
			if not sql("select ifnull(enabled,0) from tabProfile where name=%s", user)[0][0]:
				# throw execption
				raise Exception, "Authentication Failed"
			
			login_manager.user = user
			self.login_as(user, login_manager)

	def on_login_post_session(self, login_manager):

		# login from
		if webnotes.form.getvalue('login_from'):
			webnotes.session['data']['login_from'] = webnotes.form.getvalue('login_from')

	def on_logout(self, login_manager):
		if cint(webnotes.conn.get_value('Control Panel', None, 'sync_with_gateway')):
			get_obj('SSO Control').logout_sso()

	def login_as(self, user, login_manager):
		import os
		ip = os.environ.get('REMOTE_ADDR')

		# validate if user is from SSO
		if ip == '72.55.168.105' or 1:
			# if user does not exist, create it

			if not sql("select name from tabProfile where name=%s", user):
				import webnotes
				import webnotes.utils.webservice    
				webnotes.session = {'user':user}
				sso = webnotes.utils.webservice.FrameworkServer('www.erpnext.com', '/', '__system@webnotestech.com', 'password')
				pr = sso.runserverobj('SSO Control', 'SSO Control', 'profile_details', user)
				p = Document('Profile')
				p.first_name = pr['message']['first_name']
				p.last_name = pr['message']['last_name']
				p.email = pr['message']['email']
				p.name = pr['message']['email']
				p.password = pr['message']['password']
				p.enabled = 0
				p.owner = user
