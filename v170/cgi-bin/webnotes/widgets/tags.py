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
		update_tag_cnt(dt, tag, 1)
		
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
	update_tag_cnt(dt, tag, -1)


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
	


# setup / update tag cnt
# keeps tags in _tag_cnt (doctype, tag, cnt)
# if doctype cnt does not exist
# creates it for the first time 
def update_tag_cnt(dt, tag, n):
	"updates tag cnt for a doctype and tag"
	try:
		cnt = webnotes.conn.sql("select cnt from `_tag_cnt` where doctype=%s and tag=%s", (dt, tag))
	except Exception, e:
		if e.args[0]==1146:
			setup_tag_cnt()
			cnt = 0
		else: raise e
			
	if not cnt:
		# first time? build a cnt and add
		build_cnt(dt, tag)
	else:
		webnotes.conn.sql("update `_tag_cnt` set cnt = ifnull(cnt,0) + (%s) where doctype=%s and tag=%s",\
			(n, dt, tag))



# insert a new row in _tag_cnt
def build_cnt(dt, tag):
	"adds a new row of doctype, tag to the table"
	cnt = webnotes.conn.sql("select count(*) from `tab%s` where _user_tags like '%s'" \
		% (dt, '%,'+tag+'%'))[0][0]	
	webnotes.conn.sql("insert into `_tag_cnt`(doctype, tag, cnt) values (%s, %s, %s)", \
		(dt, tag, cnt))
	
	


# create the tag cnt table
def setup_tag_cnt():
	"creates the tag cnt table from the DocType"
	webnotes.conn.commit()
	webnotes.conn.sql("""
	create table `_tag_cnt` (
		doctype varchar(180), tag varchar(22), cnt int(10),
		primary key (doctype, tag), index cnt(cnt)) ENGINE=InnoDB
	""")
	webnotes.conn.begin()	
		
# returns the top ranked 10 tags for the
# doctype. will only return tags that are
# custom made
def get_top_tags(dt):
	"returns the top 10 tags for the doctype"
	try:
		webnotes.conn.sql("select tag, cnt from `_tag_cnt` where doctype=%s order by cnt desc limit 10")
	except Exception, e:
		if e.args[0]==1146:
			setup_tag_cnt()
		else: raise e