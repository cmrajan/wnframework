# session_cache.py

def get():
	import webnotes
	# get country
	country = 'Not Defined'
	if webnotes.session['data'].get('ipinfo',{}).get('CountryName'):
		country = webnotes.session['data'].get('ipinfo')['CountryName']

	# check if cache exists
	cache = load(country)
	if cache:
		return cache
	
	# if not create it
	sd = build()
	dump(sd, country)
	
	return sd

# load cache
# ==================================================

def load(country):
	import webnotes
	
	try:
		sd = webnotes.conn.sql("select cache from __SessionCache where user=%s", webnotes.session['user'])
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
	webnotes.conn.sql("create table `__SessionCache` (user VARCHAR(120), country VARCHAR(120), cache TEXT)")

# dump session to cache
# ==================================================

def dump(sd, country):
	import webnotes
	import webnotes.model.doclist

	if sd.get('docs'):
		sd['docs'] = webnotes.model.doclist.compress(sd['docs'])

	webnotes.conn.sql("insert into `__SessionCache` (user, country, cache) VALUES (%s, %s, %s)", (webnotes.session['user'], country, str(sd)))

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
	
	sql = webnotes.conn.sql
	
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
	sd['home_page'] = home_page or ''
	sd['start_items'] = webnotes.widgets.menus.get_menu_items()
	if webnotes.session['data'].get('ipinfo'):
		sd['ipinfo'] = webnotes.session['data']['ipinfo']
		
	webnotes.session['data']['profile'] = sd['profile']
	sd['dt_labels'] = webnotes.model.get_dt_labels()
	
	return sd