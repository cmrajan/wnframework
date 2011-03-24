import webnotes
from webnotes.utils import cint, cstr

sql = webnotes.conn.sql

def get_menu_items():
	import webnotes.utils

	rl = webnotes.user.get_roles() + [webnotes.session['user']]
	role_options = ["role = '"+r+"'" for r in rl]
	
	sql = webnotes.conn.sql
	menuitems = []
	
	# pages
	pages = sql("select distinct parent from `tabPage Role` where docstatus!=2 and (%s)" % (' OR '.join(role_options)))

	for p in pages:
		tmp = sql("select icon, parent_node, menu_index, show_in_menu from tabPage where name = '%s'" % p[0])
		if tmp and tmp[0][3]:
			menuitems.append(['Page', p[0] or '', tmp[0][1] or '', tmp[0][0] or '', webnotes.utils.cint(tmp[0][2])])
			
	# singles
	tmp = sql("select smallicon, parent_node, menu_index, name from tabDocType where (show_in_menu = 1 and show_in_menu is not null)")
	singles = {}
	for t in tmp: singles[t[3]] = t
		
	for p in webnotes.user.can_read:
		tmp = singles.get(p, None)
		if tmp: menuitems.append([p, p, tmp[1] or '', tmp[0] or '', int(tmp[2] or 0)])
		
	return menuitems
	
# --------------------------------------------------------------
def has_result():
	return sql("select name from `tab%s` limit 1" % webnotes.form_dict.get('dt')) and 'Yes' or 'No'

# --------------------------------------------------------------

def is_submittable(dt):
	return sql("select name from tabDocPerm where parent=%s and ifnull(submit,0)=1 and docstatus<1 limit 1", dt)

# --------------------------------------------------------------

def can_cancel(dt):
	return sql('select name from tabDocPerm where parent="%s" and ifnull(cancel,0)=1 and docstatus<1 and role in ("%s") limit 1' % (dt, '", "'.join(webnotes.user.get_roles())))

# --------------------------------------------------------------
def get_dt_trend(dt):
	ret = {}
	for r in sql("select datediff(now(),modified), count(*) from `tab%s` where datediff(now(),modified) between 0 and 30 group by date(modified)" % dt):
		ret[cint(r[0])] = cint(r[1])
	return ret

# --------------------------------------------------------------

def get_columns(out, sf, fl, dt):
	if not fl:
		fl = sf

	res = []
	for f in fl:
		if f:
			res += [[c or '' for c in r] for r in sql("select fieldname, label, fieldtype, options from tabDocField where parent='%s' and fieldname='%s'" % (dt, f))]
			
	return res

# --------------------------------------------------------------

def check_user_tags(dt):
	try:
		sql("select `_user_tags` from `tab%s` limit 1" % dt)
	except Exception, e:
		if e.args[0] == 1054:
			webnotes.conn.commit()
			sql("alter table `tab%s` add column `_user_tags` varchar(180)" % dt)
			webnotes.conn.begin()

# --------------------------------------------------------------
# NOTE: THIS SHOULD BE CACHED IN DOCTYPE CACHE
# --------------------------------------------------------------

def get_dt_details():
	fl = eval(webnotes.form_dict.get('fl'))
	dt = webnotes.form_dict.get('dt')

	submittable = is_submittable(dt) and 1 or 0
 
	out = {
		'submittable':(is_submittable(dt) and 1 or 0), 
		'can_cancel':(can_cancel(dt) and 1 or 0)
	}

	# filters
	# -------

	sf = sql("select search_fields from tabDocType where name=%s", dt)[0][0] or ''

	# get fields from in_filter (if not in search_fields)
	if not sf.strip():
		res = sql("select fieldname, label, fieldtype, options from tabDocField where parent=%s and `in_filter` = 1 and ifnull(fieldname,'') != ''", dt)
		sf = [s[0] for s in res]
	else:
		sf = [s.strip() for s in sf.split(',')]
		res = sql("select fieldname, label, fieldtype, options from tabDocField where parent='%s' and fieldname in (%s)" % (dt, '"'+'","'.join(sf)+'"'))

	# select "link" options
	res = [[c or '' for c in r] for r in res]
	for r in res:
		if r[2]=='Select' and r[3] and r[3].startswith('link:'):
			tdt = r[3][5:]
			ol = sql("select name from `tab%s` where docstatus!=2 order by name asc" % tdt)
			r[3] = "\n".join([''] + [o[0] for o in ol])

	if not res:
		out['filters'] = [['name', 'ID', 'Data', '']]
	else:
		out['filters'] = [['name', 'ID', 'Data', '']] + res
	
	# columns
	# -------
	res = get_columns(out, sf, fl, dt)
	
	check_user_tags(dt)
	
	out['columns'] = [['name', 'ID', 'Link', dt], ['modified', 'Modified', 'Data', ''], ['_user_tags', 'Tags', 'Data', '']] + res
		
	return out

# --------------------------------------------------------------

def get_color_map():
	d={}
	try:
		for tag in sql("select name, tag_color from tabTag"):
			d[tag[0]] = tag[1]
	except Exception, e:
		if e.args[0] in (1146, 1054):
			return {}
		else:
			raise e
	return d

# --------------------------------------------------------------

def get_trend():
	return {'trend': get_dt_trend(webnotes.form_dict.get('dt'))}

# --------------------------------------------------------------

def get_tags(dt, dn):
	tl = sql("select ifnull(_user_tags,'') from tab%s where name=%s" % (dt,'%s'), dn)[0][0]
	return tl and tl.split(',') or []

# --------------------------------------------------------------

def update_tags(dt, dn, tl):
	if len(','.join(tl)) > 179:
		msgprint("Too many tags")
		raise Exception
	
	tl = filter(lambda x: x, tl)
	
	# update in table
	sql("update tab%s set _user_tags=%s where name=%s" % (dt,'%s','%s'), (',' + ','.join(tl), dn))
	
	# update in feed (if present)
	sql("update tabFeed set _user_tags=%s where doc_label=%s and doc_name=%s", (',' + ','.join(tl), dt, dn))

# --------------------------------------------------------------

def _add_tag_to_master(tag, color):
	if color:
		t, cond = color, ("on duplicate key update tag_color='%s'" % color)
	else:
		t, cond = 'Default', ''
		
	sql("insert ignore into tabTag(name, tag_color) values ('%s', '%s') %s" % (tag, t, cond))
	
def create_tag(tag, color):
	try:
		_add_tag_to_master(tag, color)
	except Exception, e:
		# add the table
		if e.args[0]==1146:
			webnotes.conn.commit()
			sql("create table `tabTag`(`name` varchar(180), tag_color varchar(180), primary key (`name`))")
			webnotes.conn.begin()
			_add_tag_to_master(tag, color)

		# udpate the color column
		if e.args[0]==1054:
			webnotes.conn.commit()
			sql("alter table tabTag add column tag_color varchar(180)")
			webnotes.conn.begin()
			_add_tag_to_master(tag, color)
			
		else:
			raise e

# --------------------------------------------------------------

def add_tag():
	globals().update(webnotes.form_dict)
	
	# create tag in tag table
	create_tag(tag, color)
	
	# add in _user_tags
	tl = get_tags(dt, dn)
	
	if not tag in tl:
		tl.append(tag)
		update_tags(dt, dn, tl)
		
	return tag

	# --------------------------------------------------------------

def remove_tag():
	globals().update(webnotes.form_dict)

	tl = get_tags(dt, dn)				
	update_tags(dt, dn, filter(lambda x:x!=tag, tl))
	
# --------------------------------------------------------------

def delete_items():
	il = eval(webnotes.form_dict.get('items'))
	from webnotes.model import delete_doc
	for d in il:
		dt_obj = get_obj(d[0], d[1])
		if hasattr(dt_obj, 'on_trash'):
			dt_obj.on_trash()
		delete_doc(d[0], d[1])

# --------------------------------------------------------------

def archive_items():
	il = eval(webnotes.form_dict.get('items'))
	
	from webnotes.utils.archive import archive_doc
	for d in il:
		archive_doc(d[0], d[1], webnotes.form_dict.get('action')=='Restore' and 1 or 0)

