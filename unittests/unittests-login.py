import unittest
import testlib


import webnotes
from webnotes import auth


class test_auth(unittest.TestCase):
#==============================================================================
# Login via python shell
#==============================================================================
	def test_login(self,login_info = {}):
		webnotes.conn = testlib.test_conn
		webnotes.form_dict = login_info
		auth.HTTPRequest()
		assert (webnotes.cookies['sid']!=None)
		assert (webnotes.session.has_key('sid'))


