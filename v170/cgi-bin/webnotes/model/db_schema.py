import webnotes
import webnotes.defs
import os

type_map = {
	'currency':		('decimal', '14,2')
	,'int':			('int', '11')
	,'float':		('decimal', '14,6')
	,'check':		('int', '1')
	,'small text':	('text', '')
	,'long text':	('text', '')
	,'code':		('text', '')
	,'text editor':	('text', '')
	,'date':		('date', '')
	,'time':		('time', '')
	,'text':		('text', '')
	,'data':		('varchar', '180')
	,'link':		('varchar', '180')
	,'password':	('varchar', '180')
	,'select':		('varchar', '180')
	,'read only':	('varchar', '180')
	,'blob':		('longblob', '')
}

default_shortcuts = ['_Login', '__user', '_Full Name', 'Today', '__today']

def get_schema():
	return DbSchema()

# -------------------------------------------------
# Class database schema
# -------------------------------------------------

class DbSchema:
	def __init__(self):
		self.tables = None
		
	def get_tables(self):
		if not self.tables:
			self.tables = [t[0] for t in webnotes.conn.sql("show tables")]
		return self.tables

# -------------------------------------------------
# Class database table
# -------------------------------------------------

class DbTable:
	def __init__(self, doctype, prefix = 'tab'):
		self.doctype = doctype
		self.name = prefix + doctype
		self.columns = {}
		self.current_columns = {}
		self.foreign_keys = []
		
		# lists for change
		self.add_column = []
		self.change_type = []
		self.add_index = []
		self.drop_index = []
		self.add_foreign_key = []
		self.drop_foreign_key = []
		self.set_default = []
		
		# load
		self.get_columns_from_docfields()

	def create(self):
		add_text = ''
		
		# columns
		t = self.get_column_definitions()
		if t: add_text += ',\n'.join(self.get_column_definitions()) + ',\n'
		
		# index
		t = self.get_index_definitions()
		if t: add_text += ',\n'.join(self.get_index_definitions()) + ',\n'

		# foreign key
		t = self.get_foreign_key_definitions()
		if t: add_text += ',\n'.join(self.get_foreign_key_definitions()) + ',\n'
	
		# create table
		webnotes.conn.sql("set foreign_key_checks=0")
		webnotes.conn.sql("""create table `%s` (
			name varchar(120) not null primary key, 
			creation datetime, 
			modified datetime, 
			modified_by varchar(40), 
			owner varchar(40), 
			docstatus int(1) default 0, 
			parent varchar(120), 
			parentfield varchar(120), 
			parenttype varchar(120), 
			idx int(8),
			%sindex parent(parent)) ENGINE=InnoDB""" % (self.name, add_text))
		webnotes.conn.sql("set foreign_key_checks=1")

	def get_columns_from_docfields(self):
		if webnotes.conn.sql("select name from tabDocField where fieldname = 'length' and parent='DocType'"):
			fl = webnotes.conn.sql("SELECT fieldname, fieldtype, `length`, `default`, search_index, options FROM tabDocField WHERE parent = '%s'" % self.doctype)
		else:
			fl = webnotes.conn.sql("SELECT fieldname, fieldtype, '', `default`, search_index, options FROM tabDocField WHERE parent = '%s'" % self.doctype)
		for f in fl:
			self.columns[f[0]] = DbColumn(self, f[0], f[1], f[2], f[3], f[4], f[5])
	
	def get_columns_from_db(self):
		self.show_columns = webnotes.conn.sql("desc `%s`" % self.name)
		for c in self.show_columns:
			self.current_columns[c[0]] = {'name': c[0], 'type':c[1], 'index':c[3], 'default':c[4]}
	
	def get_column_definitions(self):
		ret = []
		for k in self.columns.keys():
			d = self.columns[k].get_definition()
			if d:
				ret.append(k + ' ' + d)
		return ret
	
	def get_index_definitions(self):
		ret = []
		for k in self.columns.keys():
			if type_map.get(self.columns[k].fieldtype) and type_map.get(self.columns[k].fieldtype.lower())[0] not in ('text', 'blob'):
				ret.append('index `' + k + '`(`' + k + '`)')
		return ret

	def get_foreign_key_definitions(self):
		ret = []
		tab_list = get_schema().get_tables()

		for k in self.columns.keys():
			if self.columns[k].fieldtype=='Link' and self.columns[k].options:
				tab_name = "tab" + self.columns[k].options
				if tab_name in tab_list:
					ret.append('foreign key (%s) references `%s`(name) on update cascade' % (k, tab_name))
		return ret

	# GET foreign keys
	def get_foreign_keys(self):
		if not self.foreign_keys:
			txt = webnotes.conn.sql("show create table `%s`" % self.name)[0][1]
			for line in txt.split('\n'):
				if line.strip().startswith('CONSTRAINT') and line.find('FOREIGN')!=1:
					words = line.split()
					try:
						self.foreign_keys.append((words[4][2:-2], words[1][1:-1]))
					except IndexError, e:
						pass
		
		return self.foreign_keys				

	# SET foreign keys
	def set_foreign_keys(self):
		if self.add_foreign_key:
			tab_list = get_schema().get_tables()
			webnotes.conn.sql("set foreign_key_checks=0")
			for col in self.add_foreign_key:
				if col.options:
					tab_name = "tab" + col.options
					if tab_name in tab_list:
						webnotes.conn.sql("alter table `%s` add foreign key (`%s`) references `%s`(name) on update cascade" % (self.name, col.fieldname, tab_name))
			webnotes.conn.sql("set foreign_key_checks=1")

	# Drop foreign keys
	def drop_foreign_keys(self):
		if not self.drop_foreign_key:
			return
	
		fk_list = self.get_foreign_keys()
		
		# make dictionary of constraint names
		fk_dict = {}
		for f in fk_list:
			fk_dict[f[0]] = f[1]
			
		# drop
		for col in self.drop_foreign_key:
			webnotes.conn.sql("set foreign_key_checks=0")
			webnotes.conn.sql("alter table `%s` drop foreign key `%s`" % (self.name, fk_dict[col.fieldname]))
			webnotes.conn.sql("set foreign_key_checks=1")
		
	def sync(self):
		if not self.name in get_schema().get_tables():
			self.create()
		else:
			self.alter()
	
	def alter(self):
		self.get_columns_from_db()

		for col in self.columns.values():
			col.check(self.current_columns.get(col.fieldname, None))

		for col in self.add_column:
			webnotes.conn.sql("alter table `%s` add column `%s` %s" % (self.name, col.fieldname, col.get_definition()))

		for col in self.change_type:
			webnotes.conn.sql("alter table `%s` change `%s` `%s` %s" % (self.name, col.fieldname, col.fieldname, col.get_definition()))

		for col in self.add_index:
			webnotes.conn.sql("alter table `%s` add index `%s`(`%s`)" % (self.name, col.fieldname, col.fieldname))

		for col in self.drop_index:
			if col.fieldname != 'name': # primary key
				webnotes.conn.sql("alter table `%s` drop index `%s`(`%s`)" % (self.name, col.fieldname, col.fieldname))

		for col in self.set_default:
			webnotes.conn.sql("alter table `%s` alter column `%s` set default %s" % (self.name, col.fieldname, '%s'), col.default)

		self.set_foreign_keys()
		self.drop_foreign_keys()


# -------------------------------------------------
# Class database column
# -------------------------------------------------

class DbColumn:
	def __init__(self, table, fieldname, fieldtype, length, default, set_index, options):
		self.table = table
		self.fieldname = fieldname
		self.fieldtype = fieldtype
		self.length = length
		self.set_index = set_index
		self.default = default
		self.options = options

	def get_definition(self, with_default=1):
		d = type_map.get(self.fieldtype.lower())

		if not d:
			return
			
		ret = d[0]
		if d[1]:
			ret += '(' + d[1] + ')'
		if with_default and self.default and (self.default not in default_shortcuts):
			ret += ' default "' + self.default.replace('"', '\"') + '"'
		return ret
		
	def check(self, current_def):
		column_def = self.get_definition(0)
		# no columns
		if not column_def:
			return
		
		# to add?
		if not current_def:
			self.fieldname = validate_column_name(self.fieldname)
			self.table.add_column.append(self)
			return

		# type
		if current_def['type'] != column_def:
			self.table.change_type.append(self)

		# foreign key
		if self.fieldtype=='Link':
			fk_list = [f[0] for f in self.table.get_foreign_keys()]
			if not self.fieldname in fk_list:
				self.table.add_foreign_key.append(self)

			if not self.options and (self.fieldname in fk_list):
				self.table.drop_foreign_key.append(self)
		
		# index
		else:
			if (current_def['index'] and not self.set_index):
				self.table.drop_index.append(self)
			
			if (not current_def['index'] and self.set_index and not (column_def in ['text','blob'])):
				self.table.add_index.append(self)
		
		# default
		if (self.default and (current_def['default'] != self.default) and (self.default not in default_shortcuts) and not (column_def in ['text','blob'])):
			self.table.set_default.append(self)





class DBManager:
	"""
	Basically, a wrapper for oft-used mysql commands. like show tables,databases, variables etc... 

	#TODO:
		1. Setter and getter for different mysql variables.
		2. 
	"""	
	def __init__(self,conn = None):
 		if conn:
 			self.conn = conn
		else:
			self.conn = webnotes.conn

	def get_tables_list(self,conn,target):	
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
			print "Granting all privileges on %s to %s@localhost" %(target,user)
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
		try:
			db_list = []
			ret_db_list = conn.sql("SHOW DATABASES")
			for db in ret_db_list:
				if db[0] not in ['information_schema', 'mysql', 'test', 'accounts']:
					db_list.append(db[0])
			return db_list
		except Exception,e:
			raise e

	def restore_database(self,target,source):
		try:
			ret = os.system("mysql -u root -p%s %s < %s"%(webnotes.defs.root_password,target,source))
			print "Restore DB Return status:",ret
		except Exception,e:
			raise e

	def drop_table(self,conn,table_name):
		try:
			print "Dropping table %s" %(table_name)
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



# -------------------------------------------------
# validate column name to be code-friendly
# -------------------------------------------------

def validate_column_name(n):
	n = n.replace(' ','_').strip().lower()
	import re
	if not re.match("[a-zA-Z_][a-zA-Z0-9_]*$", n):
		webnotes.msgprint('err:%s is not a valid fieldname.<br>A valid name must contain letters / numbers / spaces.<br><b>Tip: </b>You can change the Label after the fieldname has been set' % n)
		raise Exception
	return n

# -------------------------------------------------
# sync table - called from form.py
# -------------------------------------------------

def updatedb(dt, archive=0):
	if webnotes.conn.sql("select issingle from tabDocType where name=%s", dt)[0][0]:
		return

	webnotes.conn.commit()
	tab = DbTable(dt, archive and 'arc' or 'tab')
	tab.sync()
	webnotes.conn.begin()
	
# -------------------------------------------------
# patch to create foreign keys on tables
# -------------------------------------------------

def setup_foreign_keys():
	webnotes.conn.commit()
	for dt in webnotes.conn.sql("select name from tabDocType where ifnull(issingle,0)!=1"):
		tab = DbTable(dt[0], 'tab')
		tab.get_columns_from_db()
		for col in tab.columns.values():
			col.check(tab.current_columns.get(col.fieldname, None))
		tab.set_foreign_keys()
	webnotes.conn.begin()
