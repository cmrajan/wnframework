

from webnotes.model import doc
import webnotes.model.db_schema
from webnotes.utils import cint,cstr
import unittest
import testlib


def get_num_start_pos(string):
	for each in string:
		if each.isdigit():
			return string.index(each)

class test_doc(unittest.TestCase):
	"""
	
	"""
	
	def setUp(self):
		self.test_doc = doc.Document('')
		self.f1 = doc.Document('')
		self.f2 = doc.Document('')
		self.f3 = doc.Document('')
		self.f4 = doc.Document('')
		self.p = doc.Document('')
		
	def test_create_doctype(self):

		
		# create tabAccount
		self.test_doc = doc.Document('DocType')
		self.test_doc.name = testlib.test_doctype
		self.test_doc.autoname = testlib.test_doctype_autoname
		self.test_doc.save(1)
		
		assert (testlib.test_conn.sql("select count(*) from tabDocType where name = '%s'"%self.testlib.test_doctype)[0][0])
	
	def test_create_docfields(self):
	
		self.f1 = self.test_doc.addchild('fields', 'DocField')
		self.f1.label = 'Test Account Name'
		self.f1.fieldname = 'test_ac_name'
		self.f1.fieldtype = 'Data'
		self.f1.save()
	
	
		self.f2 = self.test_doc.addchild('fields', 'DocField')
		self.f2.label = 'Database Name'
		self.f2.fieldname = 'test_db_name'
		self.f2.fieldtype = 'Data'
		self.f2.save()

		self.f3 = self.test_doc.addchild('fields', 'DocField')
		self.f3.label = 'Database Login'
		self.f3.fieldname = 'test_db_login'
		self.f3.fieldtype = 'Data'
		self.f3.save()

		self.f4 = self.test_doc.addchild('fields', 'DocField')
		self.f4.label = 'App Login' 
		self.f4.fieldname = 'test_app_login'
		self.f4.fieldtype = 'Data'
		self.f4.save()
		
		assert (testlib.test_conn.sql("select count(*) from tabDocField where name = '%s'"%self.f1.fieldname)[0][0])
		assert (testlib.test_conn.sql("select count(*) from tabDocField where name = '%s'"%self.f2.fieldname)[0][0])
		assert (testlib.test_conn.sql("select count(*) from tabDocField where name = '%s'"%self.f3.fieldname)[0][0])
		assert (testlib.test_conn.sql("select count(*) from tabDocField where name = '%s'"%self.f4.fieldname)[0][0])
		
		
	def test_create_docperms(self):
		
		self.p = self.test_doc.addchild('permissions', 'DocPerm')
		self.p.role = 'Administrator'
		self.p.read = 1
		self.p.write = 1
		self.p.create = 1
		self.p.save()
	
		assert testlib.test_conn.sql("select count(*) from tabDocPerm where name = '%s'"%self.p.name)
		

		
		
	def test_make_autoname(self):
		new_name = doc.make_autoname(self.test_doc.name,self.test_doc.parenttype)
		last_name = testlib.test_conn.sql("select name from `tabTestAccount` order by name desc limit 1")
		
		assert (cint(new_name[get_num_start_pos(new_name):])) - cint(last_name[get_num_start_pos(last_name):])
		
		
	def test_clear_table(self):
		
		
		
				
		
