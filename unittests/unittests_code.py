import unittest
import testlib
import webnotes
from webnotes.model import code
import sys
from webnotes.model.doc import Document

webnotes.conn = testlib.test_conn
from core.doctype.doctype.doctype import DocType


class test_code(unittest.TestCase):
	def setUp(self):
		class test_old_class():
			"""
			Dummy Hack to test for get_server_obj
			"""
			pass
			
		self.dummy_class = test_old_class
		doc_obj = Document('DocType','file')
		self.server_obj = code.get_server_obj(doc_obj)
	
	def test_execute(self):
		code.execute("import sys;sys.path.append('/home/')")
		assert ('/home/' in sys.path)

	def test_get_server_obj(self):

		assert (isinstance(self.server_obj.__class__,type(self.dummy_class)))
	
	def test_get_obj(self):
		pass
	def test_run_server_obj(self):
		func_list = dir(self.server_obj)
		print self.server_obj.doc.module
		assert(code.run_server_obj(self.server_obj,'onload'))

	def test_get_code(self):
		pass
