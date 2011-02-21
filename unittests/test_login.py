import unittest
import testlib


#=============================================================================
# Just Dumb app create
#=============================================================================
def api_app_create():
	import webnotes
	from webnotes.utils import webservice
	FWServer = webservice.FrameworkServer()
	FWServer.runserverobj('App Control','allocate_account')


class test_auth(unittest.TestCase):
	#==============================================================================
	# Login via python shell
	#==============================================================================
	def test_login(login_info):
		import webnotes
		from webnotes import auth
		import webnotes.db

		webnotes.conn = webnotes.db.Database(use_default=1)
		webnotes.form_dict = login_info

		webnotes.set_as_admin()
		auth.HTTPRequest()
		assert (webnotes.cookies['sid']!=None)
		assert (webnotes.session.has_key('sid'))


