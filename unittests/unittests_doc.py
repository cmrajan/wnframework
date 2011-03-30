
from webnotes.model import *
from webnotes.model import doc
import webnotes.model.db_schema
from webnotes.utils import cint,cstr
import unittest
import testlib
from webnotes.model.db_schema import updatedb
from webnotes.model.db_schema import DbManager

def get_num_start_pos(string):
	for each in string:
		if each.isdigit():
			return string.index(each)

class test_doc(unittest.TestCase):
	""" 
	Basic test cases for the doc object.
	the numbering 1,2,3..is just to make sure order of execution. the testrunner otherwise sorts by function name.
	
	"""
	
	def setUp(self):
		self.test_doc = doc.Document('')
		self.f1 = doc.Document('')
		self.f2 = doc.Document('')
		self.f3 = doc.Document('')
		self.f4 = doc.Document('')
		self.p = doc.Document('')
		webnotes.session = testlib.test_webnotes_session
		webnotes.conn = testlib.test_conn
		self.dbman = DbManager(webnotes.conn)
	
		
	def test_1_create_new_doctype_record(self):
				
		# create tabAccount
		self.test_doc = doc.Document('DocType')
		self.test_doc.name = testlib.test_doctype
		self.test_doc.autoname = testlib.test_doctype_autoname
		self.test_doc.save(1)
		webnotes.conn.commit()
		assert (testlib.test_conn.sql("select count(*) from tabDocType where name = '%s'"%testlib.test_doctype)[0][0])

	def test_2_create_new_doctype_table(self):
		updatedb((testlib.test_doctype))
		table_list = self.dbman.get_tables_list(testlib.test_db)
		webnotes.conn.commit()
		assert ('tab'+testlib.test_doctype in table_list)
		
		
	def test_3_create_new_docfields(self):
	
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
		

		updatedb((testlib.test_doctype))
		webnotes.conn.commit()
		assert (testlib.test_conn.sql("select count(*) from tabDocField where name = '%s'"%self.f1.fieldname)[0][0])
		assert (testlib.test_conn.sql("select count(*) from tabDocField where name = '%s'"%self.f2.fieldname)[0][0])
		assert (testlib.test_conn.sql("select count(*) from tabDocField where name = '%s'"%self.f3.fieldname)[0][0])
		assert (testlib.test_conn.sql("select count(*) from tabDocField where name = '%s'"%self.f4.fieldname)[0][0])
		
		
	def test_4_create_docperms(self):
		
		self.p = self.test_doc.addchild(testlib.test_docperm, 'DocPerm')
		self.p.role =  'Administrator'
		self.p.read = 1
		self.p.write = 1
		self.p.create = 1
		self.p.save()
		webnotes.conn.commit()
		assert testlib.test_conn.sql("select count(*) from tabDocPerm where name = '%s'"%self.p.name)[0][0]
		

		
		
	def test_5_make_autoname(self):
		new_name = doc.make_autoname(self.test_doc.name,self.test_doc.parenttype)
		last_name = testlib.test_conn.sql("select name from `tab%s` order by name desc limit 1"%testlib.test_doctype)		
		if not last_name:
			last_name = '0'
		webnotes.conn.commit()
		assert (cint(new_name[get_num_start_pos(new_name):])) - cint(last_name[get_num_start_pos(last_name):])
		
		
	def test_6_delete_doctype_record(self):
		
		delete_doc('DocType',testlib.test_doctype)
		webnotes.conn.commit()
		assert (not testlib.test_conn.sql("select count(*) from tabDocType where name = '%s'"%testlib.test_doctype)[0][0])

		
	def test_7_delete_docfield_record(self):
		
		delete_doc('DocField',self.f1.name)
		delete_doc('DocField',self.f2.name)
		delete_doc('DocField',self.f3.name)
		delete_doc('DocField',self.f4.name)
		delete_doc('DocField',self.p.name)
		webnotes.conn.commit()
		assert (not testlib.test_conn.sql("select count(*) from tabDocType where name = '%s'"%self.f1.name)[0][0])
	
		
				
		
