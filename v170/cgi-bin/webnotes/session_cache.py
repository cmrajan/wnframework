# session_cache.py

# clear cache
# ==================================================

def clear():
	clear_cache()

	import webnotes
	webnotes.response['message'] = "Cache Cleared"

def clear_cache(user=''):
	import webnotes
	try:
		if user:
			webnotes.conn.sql("delete from __SessionCache where user=%s", user)
		else:
			webnotes.conn.sql("delete from __SessionCache")
	except Exception, e:
		if e.args[0]==1146:
			make_cache_table()
		else:
			raise e

# load cache
# ==================================================

def get():
	import webnotes
	import webnotes.defs
	
	# check if system is updated, if yes - clear the cache
	from webnotes.modules import code_sync
	if code_sync.check_modules_update():
		webnotes.conn.sql("delete from __DocTypeCache")
		clear_cache()
	
	# get country
	country = 'Not Defined'
	if webnotes.session['data'].get('ipinfo',{}).get('CountryName'):
		country = webnotes.session['data'].get('ipinfo')['CountryName']

	# check if cache exists
	if not getattr(webnotes.defs,'auto_cache_clear',None):
		cache = load(country)
		if cache:
			return cache
	else:
		# for developers, clear out cache after every refresh
		webnotes.conn.sql("delete from __DocTypeCache")
	
	# run patches
	import webnotes.modules.patch
	try:
		webnotes.modules.patch.run()
	except:
		# write in logs
		pass

	# if not create it
	sd = build()
	dump(sd, country)

	# update profile from cache
	webnotes.session['data']['profile'] = sd['profile']	
		
	return sd

# load cache
# ==================================================

def load(country):
	import webnotes
	
	try:
		sd = webnotes.conn.sql("select cache from __SessionCache where user='%s' %s" % (webnotes.session['user'], (country and (" and country='%s'" % country) or '')))
		if sd:
			return eval(sd[0][0])
		else:
			return None
	except Exception, e:
		if e.args[0]==1146:
			make_cache_table()
		else:
			raise e

# make the cache table
# ==================================================
				
def make_cache_table():
	import webnotes
	webnotes.conn.sql("create table `__SessionCache` (user VARCHAR(120), country VARCHAR(120), cache LONGTEXT)")

# dump session to cache
# ==================================================

def dump(sd, country):
	import webnotes
	import webnotes.model.doclist

	if sd.get('docs'):
		sd['docs'] = webnotes.model.doclist.compress(sd['docs'])

	webnotes.conn.sql("insert into `__SessionCache` (user, country, cache) VALUES (%s, %s, %s)", (webnotes.session['user'], country, str(sd)))

def get_letter_heads():
	import webnotes
	try:
		lh = {}
		ret = webnotes.conn.sql("select name, content from `tabLetter Head` where ifnull(disabled,0)=0")
		for r in ret:
			lh[r[0]] = r[1]
		return lh
	except Exception, e:
		if e.args[0]==1146:
			return {}
		else:
			raise Exception, e
			
# build it
# ==================================================

def build():
	sd = {}

	import webnotes
	import webnotes.model
	import webnotes.model.doc
	import webnotes.model.doctype
	import webnotes.widgets.page
	import webnotes.widgets.menus
	import webnotes.profile
	import webnotes.defs
	
	sql = webnotes.conn.sql
	
	webnotes.conn.begin()
	sd['profile'] = webnotes.user.load_profile()

	doclist = []
	doclist += webnotes.model.doc.get('Control Panel')
	cp = doclist[0]
	
	doclist += webnotes.model.doctype.get('Event')
	doclist += webnotes.model.doctype.get('Search Criteria')
	home_page = webnotes.user.get_home_page()

	if home_page:
		doclist += webnotes.widgets.page.get(home_page)

	sd['account_name'] = cp.account_id or ''
	sd['sysdefaults'] = webnotes.utils.get_defaults()
	sd['n_online'] = int(sql("SELECT COUNT(DISTINCT user) FROM tabSessions")[0][0] or 0)
	sd['docs'] = doclist
	sd['letter_heads'] = get_letter_heads()
	sd['home_page'] = home_page or ''
	sd['start_items'] = webnotes.widgets.menus.get_menu_items()
	if webnotes.session['data'].get('ipinfo'):
		sd['ipinfo'] = webnotes.session['data']['ipinfo']
		
	webnotes.session['data']['profile'] = sd['profile']
	sd['dt_labels'] = webnotes.model.get_dt_labels()
	webnotes.conn.commit()
	
	return sd