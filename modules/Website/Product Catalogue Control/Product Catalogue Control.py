class DocType:
	def __init__(self,doc,doclist=[]):
		self.doc = doc
		self.doclist = doclist
    
	def get_product_groups(self):
		ret = {}
		ret['item_grps'] = convert_to_lists(sql("select name from `tabProduct Group`"))
		return ret