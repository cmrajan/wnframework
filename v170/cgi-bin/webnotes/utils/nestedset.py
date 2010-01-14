# Tree (Hierarchical) Nested Set Model (nsm)
# ----------------------------------------

import webnotes

def update_nsm(doc_obj):
	# get fields, data from the DocType
	d = doc_obj.doc
	pf, opf = 'parent_node', 'old_parent'
	if hasattr(doc_obj,'nsm_parent_field'):
		pf = doc_obj.nsm_parent_field
	if hasattr(doc_obj,'nsm_oldparent_field'):
		opf = doc_obj.nsm_oldparent_field
	p, op = d.fields[pf], d.fields[opf]

	# has parent changed (?) or parent is None (root)
	if (op != p) or op==None:
		rebuild_tree(doc_obj.doc.doctype, pf)
		
		# set old parent
		webnotes.conn.set(d, opf, p or '')

def rebuild_tree(doctype, parent_field):
	# get all roots
	right = 1
	result = webnotes.conn.sql("SELECT name FROM `tab%s` WHERE `%s`='' or `%s` IS NULL" % (doctype, parent_field, parent_field))
	for r in result:
		right = rebuild_node(doctype, r[0], right, parent_field)
		
def rebuild_node(doctype, parent, left, parent_field):
	# the right value of this node is the left value + 1
	right = left+1

	# get all children of this node
	result = webnotes.conn.sql("SELECT name FROM `tab%s` WHERE `%s`='%s'" % (doctype, parent_field, parent))
	for r in result:
		right = rebuild_node(doctype, r[0], right, parent_field)

	# we've got the left value, and now that we've processed
	# the children of this node we also know the right value
	webnotes.conn.sql('UPDATE `tab%s` SET lft=%s, rgt=%s WHERE name="%s"' % (doctype,left,right,parent))

	#return the right value of this node + 1
	return right+1
	
def update_add_node(doctype, name, parent, parent_field):
	# get the last sibling of the parent
	if parent:
		right = webnotes.conn.sql("select rgt from `tab%s` where name='%s'" % (doctype, parent))[0][0] - 1
	else: # root
		right = webnotes.conn.sql("select max(rgt) from `tab%s` where `%s` is null or `%s`=''" % (doctype, parent_field, parent_field))[0][0]
	right = right or 1
	
	# update all on the right
	webnotes.conn.sql("update `tab%s` set rgt = rgt+2 where rgt > %s" %(doctype,right))
	webnotes.conn.sql("update `tab%s` set lft = lft+2 where lft > %s" %(doctype,right))
	
	#$ update index of new node
	webnotes.conn.sql("update `tab%s` set lft=%s, rgt=%s where name='%s'" % (doctype,right+1,(right+2),name))
	return right+1

def update_remove_node(doctype, name):
	left = webnotes.conn.sql("select lft from `tab%s` where name='%s'" % (doctype,name))
	if left[0][0]:
		# reset this node
		webnotes.conn.sql("update `tab%s` set lft=0, rgt=0 where name='%s'" % (doctype,name))

		# update all on the right
		webnotes.conn.sql("update `tab%s` set rgt = rgt-2 where rgt > %s" %(doctype,left[0][0]))
		webnotes.conn.sql("update `tab%s` set lft = lft-2 where lft > %s" %(doctype,left[0][0]))
