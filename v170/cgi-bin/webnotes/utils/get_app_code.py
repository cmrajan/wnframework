import webnotes
import os
import webnotes.db
import pprint
import webnotes.model.doc
import json
DEBUG = False

JSE = json.JSONEncoder()
JSD = json.JSONDecoder()

par_dir = '/home/anand/workspace/wnframework/'  # Hardcoding because don't want to create it anywhere else.
webnotes.conn = webnotes.db.Database(use_default = 1)
webnotes.conn.use('s3u001')
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
    print each
    if server_res: 
        if each[1]: 
            py_file = open(os.path.join(par_dir,'modules',each[1],each[0],each[0]+'.py'),'w+')
            schema_file = open(os.path.join(par_dir,'modules',each[1],each[0],each[0]+'.schema'),'w+')
        else:
            py_file = open(os.path.join(par_dir,'modules',each[0],str(each[0])+'.py'),'w+')

            schema_file = open(os.path.join(par_dir,'modules',each[0],each[0]+'.csv'),'w+')
#        schema_file.write("[")        
        temp_doc = webnotes.model.doc.get("DocType",each[0]) 
        doc_count = 0
        pop_keys = ['server_code','server_code_compiled','server_code_core','server_code_error','client_script','client_script_core']
        for each_doc in temp_doc:
            temp_fields = each_doc.fields 
            try:
                for each in pop_keys:
                    if temp_fields.has_key(each):
                        temp_fields.pop(each)
            except:
                continue
            finally:
                print "writing schema file"
                schema_file.write(JSE.encode(temp_fields))
                schema_file.write("\n")
#                schema_file.write("]")
        
        py_file.write(str(server_res[0][0]))
        py_file.close()
        schema_file.close()

    if client_res[0][0]:
        print each,len(each)
        if each[1] and each[0] and len(each) == 2:
            js_file = open(os.path.join(par_dir,'modules',each[1],each[0],each[0]+'.js'),'w+')
            js_file.write(str(client_res[0][0]))
            js_file.close()
        elif len(each) == 2:
            js_file = open(os.path.join(par_dir,'modules',each[0],str(each[0])+'.js'),'w+')
            js_file.write(str(client_res[0][0]))
            js_file.close()
    
