"""
Server side methods for the follower model (Follow button used in forms)
"""

import webnotes
form = webnotes.form_dict

#
# Follow
#
def follow(dt=None, dn=None, user=None):
	"Add as follower to a particular record. If no parameteres, then take from the http request (form)"
	
	if not dt:
		dt, dn, user = form.get('dt'), form.get('dn'), form.get('user')

	if not webnotes.conn.sql("select name from tabFollower where ifnull(doc_type,'')=%s and ifnull(doc_name,'')=%s and owner=%s", (dt, dn, user)):
		from webnotes.model.doc import Document
		d = Document('Follower')
		d.doc_type = dt
		d.doc_name = dn
		d.owner = user
		d.save(1)
	else:
		webnotes.msgprint("%s is already a follower!" % user)

	return load_followers(dt, dn)


#
# Unfollow
#
def unfollow(dt=None, dn=None, user=None):
	"Unfollow a particular record. If no parameteres, then take from the http request (form)"

	if not dt:
		dt, dn, user = form.get('dt'), form.get('dn'), form.get('user')

	webnotes.conn.sql("delete from tabFollower where doc_name=%s and doc_type=%s and owner=%s", (dn, dt, user))

	return load_followers(dt, dn)

#
# Load followers
#
def load_followers(dt=None, dn=None):
	"Get list of followers (Full Names) for a particular object"

	if not dt:
		dt, dn = form.get('dt'), form.get('dn')
		
	try:
		return [t[0] for t in webnotes.conn.sql("""
			SELECT IFNULL(CONCAT(t1.first_name, if(t1.first_name IS NULL, '', ' '), t1.last_name), t1.name)
			FROM tabProfile t1, tabFollower t2 
			WHERE t2.doc_type=%s 
			AND t2.doc_name=%s 
			AND t1.name = t2.owner""", (dt, dn))]
			
	except Exception, e:
		if e.args[0]==1146:
			make_table()
			return []
		else:
			raise e

#
# Email followers
#
def email_followers(dt, dn, msg_html=None, msg_text=None):
	"Send an email to all followers of this object"

#
# Update feed
#
def update_feed(dt, dn, feed_text):
	"Add a feed to all followers"
	

#
# make followers table
#
def make_table():
	"Make table for followers - if missing"
	webnotes.conn.commit()
	from webnotes.modules.module_manager import reload_doc
	reload_doc('core', 'doctype', 'follower')
	webnotes.conn.begin()	
