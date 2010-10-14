import webnotes
import webnotes.db
import pylint


# Application Manager
# =====================================================================================

class ModuleManager:
	def __init__(self, master = ''):
	        self.master = master
	        self.account_conn = None
	        self.
	 




	
# ==============================================================================

	def get_module_folders(module):
		import os
		import webnotes

		doc_folder_list = []

		# get all the types
		type_dir_list = os.listdir(os.path.join(webnotes.get_index_path(), 'modules', module))
	
		for type_dir in type_dir_list:
			if os.path.isdir(os.path.join(webnotes.get_index_path(), 'modules', module, type_dir)):
			
				# get all items of this type
				item_dir_list = os.listdir(os.path.join(webnotes.get_index_path(), 'modules', module, type_dir))
			
				for item_dir in item_dir_list:
					if os.path.isdir(os.path.join(webnotes.get_index_path(), 'modules', module, type_dir, item_dir)):
						doc_folder_list.append(os.path.join(webnotes.get_index_path(), 'modules', module, type_dir, item_dir))
					
		return doc_folder_list






	def create_folder(path):
		import os
		
		try:
			os.makedirs(path)
		except Exception, e:
			if e.args[0]==17: 
				pass
			else: 
				raise e
