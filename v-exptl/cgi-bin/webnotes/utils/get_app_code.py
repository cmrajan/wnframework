import webnotes
import os
import webnotes.db
import pprint
import webnotes.model.doc


#PP = pprint.PrettyPrinter()
par_dir = '/home/anand/workspace/wnframework/'  # Hardcoding because don't want to create it anywhere else.
webnotes.conn = webnotes.db.Database(use_default = 1)
res = webnotes.conn.sql("select name,module from tabDocType")
module_res = webnotes.conn.sql("select name,doctype_list from `tabModule Def`")


if not os.path.isdir(os.path.join(par_dir,'modules')):
    os.mkdir(os.path.join(par_dir,'modules'))


# Creating the module directories in this loop
for each in module_res:
    if not os.path.join(par_dir,'modules',each[0]):
        os.mkdir(os.path.join(par_dir,'modules',each[0]))

# Creating the individual directory required for each doctype..
for each in res:
    if each[1]:
        os.mkdir(os.path.join(par_dir,'modules',each[1]))
        if each[0]:
            os.mkdir(os.path.join(par_dir,'modules',each[1],each[0]))
    if each[0]:
        os.mkdir(os.path.join(par_dir,'modules',each[0]))
#    if each[1]:
#        if not os.path.isdir(os.path.join(par_dir,'modules',each[1],each[0])):
#            os.mkdir(os.path.join(par_dir,'modules',each[1],each[0]))

#    else:
#        if not os.path.isdir(os.path.join(par_dir,'modules',each[0])):
#            os.mkdir(os.path.join(par_dir,'modules',each[0]))



for each in res:
    server_res = webnotes.conn.sql("select server_code_core from tabDocType where `name` ='%s'" %each[0])
    
    client_res = webnotes.conn.sql("select client_script_core from tabDocType where name = '%s'" %each[0])
    if server_res: 
        if each[1]: 
            py_file = open(os.path.join(par_dir,'modules',each[1],each[0],each[0]+'.py'),'w+')
            schema_file = open(os.path.join(par_dir,'modules',each[1],each[0]+'.schema'),'w+')
        else:
            py_file = open(os.path.join(par_dir,'modules',each[0],str(each[0])+'.py'),'w+')

            schema_file = open(os.path.join(par_dir,'modules',each[0]+'.schema'),'w+')
        
        
        temp_doc = webnotes.model.doc.get("DocType",each[0]) 
        temp_doc.pop('server_code')
        temp_doc.pop('server_code_compiled')
        temp_doc.pop('server_code_core')

        temp_doc.pop('server_code_error')

        PP = pprint.PrettyPrinter(stream = schema_file)
        PP.pprint((temp_doc[0].fields))
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
    
