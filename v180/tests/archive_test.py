import webnotes
import webnotes.db
import unittest
webnotes.conn= webnotes.db.Database
webnotes.conn= webnotes.db.Database(user='s3u001',password='ac_user09')

from webnotes.utils import archive
class test_archive(unittest.TestCase):
	def setUp(self):
	
		webnotes.conn.sql("use s3u001")	
		self.Acct_arch = archive.Archiver('GL Entry')

		
	def test_main_table_count(self):
		
		Tot_count_query = 'select count(*) from `tabGL Entry`'
		Tot_count_b4_archival = webnotes.conn.sql(Tot_count_query)
		self.Acct_arch.condition_parse({'fiscal_year':[0,2009]})	
		self.Acct_arch.archive()
		Tot_count_after_archival = webnotes.conn.sql(Tot_count_query)
		
		print Tot_count_b4_archival,Tot_count_after_archival
		assert Tot_count_b4_archival > Tot_count_after_archival
		pass
		
	def test_archive_table_count(self):

		Tot_count_query = 'select count(*) from arcAccount'
		Tot_count_b4_archival = webnotes.conn.sql(Tot_count_query)		
		self.Acct_arch.condition_parse({'fiscal_year':[0,2009]})
		self.Acct_arch.archive()
		Tot_count_after_archival = webnotes.conn.sql(Tot_count_query)
		pass
	
#	def test_child_tables(self):
#		Tot_child_query = 'select   * from tabDoctype where name = 'Account''
#		Tot_count = []
#		child_records = webnotes.conn.sql(Tot_child_query)
#		for each in child_records:
#			Tot_count.append(webnotes.conn.sql("select count(*) from `tab%s` where name = 
			
		
	
class test_restore(unittest.TestCase):
	def setUp(self):
		webnotes.conn.sql("use s3u001")	
		self.Acct_arch = archive.Archiver('GL Entry')
		
	def test_main_table_count(self):

		Tot_count_query = 'select count(*) from tabAccount'
		Tot_count_b4_restore = webnotes.conn.sql(Tot_count_query)
		self.Acct_arch.condition_parse({'fiscal_year':[0,2009]})
		self.Acct_arch.restore()
		Tot_count_after_restore = webnotes.conn.sql(Tot_count_query)
		
		print Tot_count_b4_restore,Tot_count_after_restore
		assert Tot_count_b4_restore < Tot_count_after_restore
		
	def test_archive_table_count(self):
		pass
	
if __name__ == "__main__":
	unittest.main()
