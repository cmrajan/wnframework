import webnotes
import os
import webnotes.db
import pprint
import webnotes.model.doc
DEBUG = False


par_dir = '/home/anand/workspace/wnframework/'  # Hardcoding because don't want to create it anywhere else.
webnotes.conn = webnotes.db.Database(use_default = 1)
res = webnotes.conn.sql("select name,module from tabDocType")
module_res = webnotes.conn.sql("select name,doctype_list from `tabModule Def`")


if not os.path.isdir(os.path.join(par_dir,'modules')):
    os.mkdir(os.path.join(par_dir,'modules'))


# Creating the module directories in this loop
for eachm in module_res:
    if not os.path.join(par_dir,'modules',eachm[0]):
        os.mkdir(os.path.join(par_dir,'modules',eachm[0]))

# Creating the individual directory required for each doctype..
for eachr in res:
    try:
        if eachr[1]:
            if not os.path.isdir(os.path.join(par_dir,'modules',eachr[1])):
                os.mkdir(os.path.join(par_dir,'modules',eachr[1]))
            else:
                os.mkdir(os.path.join(par_dir,'modules',eachr[1],eachr[0]))
        else:
            os.mkdir(os.path.join(par_dir,'modules',eachr[0]))
    except:
        continue


for each in res:
    server_res = webnotes.conn.sql("select server_code_core from tabDocType where `name` ='%s'" %each[0])
    
    client_res = webnotes.conn.sql("select client_script_core from tabDocType where name = '%s'" %each[0])
    if server_res: 
        if each[1]: 
            py_file = open(os.path.join(par_dir,'modules',each[1],each[0],each[0]+'.py'),'w+')
            schema_file = open(os.path.join(par_dir,'modules',each[1],each[0],each[0]+'.schema'),'w+')
        else:
            py_file = open(os.path.join(par_dir,'modules',each[0],str(each[0])+'.py'),'w+')

            schema_file = open(os.path.join(par_dir,'modules',each[0],each[0]+'.schema'),'w+')
        
         
        PP = pprint.PrettyPrinter(stream = schema_file)
        temp_doc = webnotes.model.doc.get("DocType",each[0]) 
        doc_count = 0
        for each_doc in temp_doc:
            temp_fields = each_doc.fields 
            try:
                temp_fields.pop('server_code')
                temp_fields.pop('server_code_compiled')
                temp_fields.pop('server_code_core')
                temp_fields.pop('server_code_error')
            except:
                continue
            finally:
				if DEBUG:
	                PP.pprint('No of Documents:%d'%len(temp_doc))
    	            PP.pprint('Document No:%d'%doc_count)
                PP.pprint(temp_fields)
                PP.pprint('\n')
                PP.pprint('_______________________________________________________')
                doc_count += 1 
        
        
        py_file.write(str(server_res[0][0]))
        py_file.close()
        schema_file.close()

    if client_res:
        if each[1] and each[0]:
            js_file = open(os.path.join(par_dir,'modules',each[1],each[0],each[0]+'.js'),'w+')
        else:
            js_file = open(os.path.join(par_dir,'modules',each[0],str(each[0])+'.js'),'w+')
        js_file.write(str(client_res[0][0]))
        js_file.close()
    
