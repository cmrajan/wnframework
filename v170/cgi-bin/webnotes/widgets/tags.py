"""
Server side functions for tagging
"""

import webnotes
from webnotes.utils import cint, cstr

def check_user_tags(dt):
	"if the user does not have a tags column, then it creates one"
	try:
		webnotes.conn.sql("select `_user_tags` from `tab%s` limit 1" % dt)
	except Exception, e:
		if e.args[0] == 1054:
			setup_user_tags(dt)
			
#
# get tags
#
def get_tags(dt, dn):
	"return list of tags in a record"
	try:
		tl = webnotes.conn.get_value(dt, dn, '_user_tags')
		return tl and tl.split(',') or []
	except Exception, e:
		if e.args[0]==1054:
			setup_user_tags(dt)
			return []
		else: raise e

#
# update tags in table
#
def update_tag_dt(dt, dn, tl):
	"updates the _user_tag column in the table"
	webnotes.conn.sql("update tab%s set _user_tags=%s where name=%s" % (dt,'%s','%s'), (',' + ','.join(tl), dn))

#
# update tags
#
def update_tags(dt, dn, tl):
	"updates tags in the given record"
	if len(','.join(tl)) > 179:
		webnotes.msgprint("Too many tags", raise_exception=1)
	
	tl = filter(lambda x: x, tl)
	
	# update in table
	try:
		update_tag_dt(dt, dn, tl)
	except Exception, e:
		if e.args[0]==1054:
			setup_user_tags(dt)
			update_tag_dt(dt, dn, tl)



#
# insert tag
#
def _add_tag_to_master(tag, color):
	if color:
		t, cond = color, ("on duplicate key update tag_color='%s'" % color)
	else:
		t, cond = 'Default', ''
		
	webnotes.conn.sql("insert ignore into tabTag(name, tag_color) values ('%s', '%s') %s" % (tag, t, cond))

#
# create tag
#
def create_tag(tag, color):
	try:
		_add_tag_to_master(tag, color)
	except Exception, e:
		# add the table
		if e.args[0] in (1146, 1054):
			setup_tags()
			_add_tag_to_master(tag, color)
		else:
			raise e

#
# Add a new tag
#
def add_tag():
	"adds a new tag to a record, and creates the Tag master"
	
	f = webnotes.form_dict
	tag, color = f.get('tag'), f.get('color')
	dt, dn = f.get('dt'), f.get('dn')
	
	# create tag in tag table
	create_tag(tag, color)
	
	# add in _user_tags
	tl = get_tags(dt, dn)
	
	if not tag in tl:
		tl.append(tag)
		update_tags(dt, dn, tl)
		TagCounter(dt).update(tag, 1)
		
	return tag

#
# remove tag
#
def remove_tag():
	"removes tag from the record"
	f = webnotes.form_dict
	tag, dt, dn = f.get('tag'), f.get('dt'), f.get('dn')
	
	tl = get_tags(dt, dn)				
	update_tags(dt, dn, filter(lambda x:x!=tag, tl))
	TagCounter(dt).update(tag, -1)


#
# create / update tags table
#	
def setup_tags():
	"creates / updates tabTag from the DocType"
	webnotes.conn.commit()
	from webnotes.modules.module_manager import reload_doc
	reload_doc('core','doctype','tag')
	webnotes.conn.begin()

# add _user_tag column (not standard)
def setup_user_tags(dt):
	"adds _user_tags column in the database"
	webnotes.conn.commit()
	webnotes.conn.sql("alter table `tab%s` add column `_user_tags` varchar(180)" % dt)
	webnotes.conn.begin()
	



class TagCounter:
	"""
	represents the a tag counter stores tag count per doctype in table _tag_cnt
	"""
	def __init__(self, doctype):
		self.doctype = doctype

	# setup / update tag cnt
	# keeps tags in _tag_cnt (doctype, tag, cnt)
	# if doctype cnt does not exist
	# creates it for the first time
	def update(self, tag, diff):
		"updates tag cnt for a doctype and tag"
		cnt = webnotes.conn.sql("select cnt from `_tag_cnt` where doctype=%s and tag=%s", (self.doctype, tag))

		if not cnt:
			# first time? build a cnt and add
			self.new_tag(tag, 1)
		else:
			webnotes.conn.sql("update `_tag_cnt` set cnt = ifnull(cnt,0) + (%s) where doctype=%s and tag=%s",\
				(diff, self.doctype, tag))

 	
	def new_tag(self, tag, cnt=0, dt=None):
		"Creates a new row for the tag and doctype"
		webnotes.conn.sql("insert into `_tag_cnt`(doctype, tag, cnt) values (%s, %s, %s)", \
			(dt or self.doctype, tag, cnt))

	def build(self, dt):
		"Builds / rebuilds the counting"		
		webnotes.conn.sql("delete from _tag_cnt where doctype=%s", dt)
		
		# count
		tags = {}
		for ut in webnotes.conn.sql("select _user_tags from `tab%s`" % dt):
			if ut[0]:
				tag_list = ut[0].split(',')
				for t in tag_list:
					if t:
						tags[t] = tags.get(t, 0) + 1

		# insert
		for t in tags:
			self.new_tag(t, tags[t], dt)
						
	def get_top(self):
		return webnotes.conn.sql("select tag, cnt from `_tag_cnt` where doctype=%s and cnt>0 order by cnt desc limit 10", self.doctype, as_list = 1)

	def load_top(self):
		try:
			return self.get_top()
		except Exception, e:
			if e.args[0]==1146:
				self.setup()
				return self.get_top()
			else: raise e

	def setup(self):
		"creates the tag cnt table from the DocType"
		webnotes.conn.commit()
		webnotes.conn.sql("""
		create table `_tag_cnt` (
			doctype varchar(180), tag varchar(22), cnt int(10),
			primary key (doctype, tag), index cnt(cnt)) ENGINE=InnoDB
		""")
		webnotes.conn.begin()
		
		# build all
		for dt in webnotes.conn.sql("select name from tabDocType where ifnull(issingle,0)=0 and docstatus<2"):
			try:
				self.build(dt[0])
			except Exception, e:
				if e.args[0]==1054: pass
				else: raise e
		
# returns the top ranked 10 tags for the
# doctype. will only return tags that are
# custom made
def get_top_tags(arg=''):
	"returns the top 10 tags for the doctype"
	dt = webnotes.form_dict.get('dt')
	return TagCounter(dt).load_top()
