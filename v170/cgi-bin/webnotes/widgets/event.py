# Event
# -------------

def get_cal_events(m_st, m_end):
	# load owned events
	res1 = sql("select name from `tabEvent` WHERE event_date >= '%s' and event_date <= '%s' and owner = '%s' and event_type != 'Public' and event_type != 'Cancel'" % (m_st, m_end, session['user']))

	# load individual events
	res2 = sql("select t1.name from `tabEvent` t1, `tabEvent User` t2 where t1.event_date >= '%s' and t1.event_date <= '%s' and t2.person = '%s' and t1.name = t2.parent and t1.event_type != 'Cancel'" % (m_st, m_end, session['user']))

	# load role events
	roles = get_roles()
	myroles = ['t2.role = "%s"' % r for r in roles]
	myroles = '(' + (' OR '.join(myroles)) + ')'
	res3 = sql("select t1.name from `tabEvent` t1, `tabEvent Role` t2  where t1.event_date >= '%s' and t1.event_date <= '%s' and t1.name = t2.parent and t1.event_type != 'Cancel' and %s" % (m_st, m_end, myroles))
	
	# load public events
	res4 = sql("select name from `tabEvent` where event_date >= '%s' and event_date <= '%s' and event_type='Public'" % (m_st, m_end))
	
	doclist, rl = [], []
	for r in res1 + res2 + res3 + res4:
		if not r in rl:
			doclist += getdoc('Event', r[0])
			rl.append(r)
	
	return doclist
	