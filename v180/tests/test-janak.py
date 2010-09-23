import webnotes
import webnotes.db
import unittest
from webnotes.utils import archive

webnotes.conn= webnotes.db.Database
# Set database and password
webnotes.conn= webnotes.db.Database(user='s3u001',password='ac_user09')

webnotes.conn.sql("use s3u001")
#By default using tabGL Entry table.
Tot_count_query = 'select count(*) from `tabGL Entry`'
Tot_count_b4_archival = webnotes.conn.sql(Tot_count_query)
Acct_arch = archive.Archiver('GL Entry') #Set the table name here.
#set table field, values and conditions here.
Acct_arch.condition_parse({'fiscal_year':[[2007,2009],['>','=']]})
Acct_arch.archive()

Tot_count_after_archival = webnotes.conn.sql(Tot_count_query)
		
print Tot_count_b4_archival,Tot_count_after_archival
