import os
import webnotes.defs
#DB admin functions..Ideally should be a new module called DB manager...for the time being here..

class DBManager:
	
	
	def __init__(self,conn = None):
		if conn:
			self.conn = conn

	def get_tables_list(self,conn,target):	
		#Returns a list of tables in the given database
		try:
			conn.use(target)
			res = conn.sql("SHOW TABLES")
			table_list = []
			for table in res:
				table_list.append(table[0])
			return table_list

		except Exception,e:
			raise e

	def create_user(self,conn,user):
		#Create user if it doesn't exist.
		try:
			print "Creating user %s" %user
			conn.sql("CREATE USER '%s'@'localhost' IDENTIFIED BY '%s'" % (user, webnotes.defs.db_password))
		except Exception, e:
			raise e


	def delete_user(self,conn,target):
	# delete user if exists
		try:
			print "Dropping user " ,target
			conn.sql("DROP USER '%s'@'localhost'" % target)
		except Exception, e:
			if e.args[0]==1396:
				pass
			else:
				raise e

	def create_database(self,conn,target):
		
		try:
			print "Creating Database", target
			conn.sql("CREATE DATABASE IF NOT EXISTS `%s` ;" % target)
		except Exception,e:
			raise e


	def drop_database(self,conn,target):
		try:
			print "Dropping Database:",target
			conn.sql("DROP DATABASE IF EXISTS `%s`;"%target)
		except Exception,e:
			raise e

	def grant_all_privileges(self,conn,target,user):
		try:
			conn.sql("GRANT ALL PRIVILEGES ON `%s` . * TO '%s'@'localhost';" % (target, user))
		except Exception,e:
			raise e

	def flush_privileges(self,conn):
		try:
			print "Flushing privileges"
			conn.sql("FLUSH PRIVILEGES")
		except Exception,e:
			raise e


	def get_database_list(self,conn):
	# Returns a list of databases present
		try:
			db_list = []
			ret_db_list = conn.sql("SHOW DATABASES")
			for db in ret_db_list:
				db_list.append(db[0])
			return db_list
		except Exception,e:
			raise e

	
	def restore_database(self,target,source):
	#Restore the given database.
	# source = full path to the db dump file(.sql)
	# target = database name to which to restore to.(must already exist)
	# Picks up root password from defs.py
		try:
			ret = os.system("mysql -u root -p%s %s < %s"%(webnotes.defs.root_password,target,source))
			print "Restore DB Return status:",ret
		except Exception,e:
			raise e

	def drop_table(self,conn,table_name):
		#Drop table if exists
		try:
			conn.sql("DROP TABLE IF EXISTS %s "%(table_name))
		except Exception,e:
			raise e
			
	
	def set_transaction_isolation_level(self,conn,scope='SESSION',level='READ COMMITTED'):
		#Sets the transaction isolation level. scope = global/session
		try:
			conn.sql("SET %s TRANSACTION ISOLATION LEVEL %s"%(scope,level))
			print "Set transaction level ",scope, level

		except Exception,e:
			raise e


