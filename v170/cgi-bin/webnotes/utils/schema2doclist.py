import webnotes.utils.transfer
import pprint
import os
import re
from webnotes.model.doc import * 
import webnotes.db
import pdb
import fnmatch
import json
import webnotes.utils
webnotes.session = {'user':'Administrator'}
webnotes.conn = webnotes.db.Database(use_default = 1)
#webnotes.session = 
par_folder = '/home/anand/workspace/wnframework/modules'
fd_schema_list = []

JSD = json.JSONDecoder()

def get_doclist(fd):
    lines = fd.readlines()
#    a = b =  []
    a = []
    b = []
    count = 0
    temp = ''
    par_doc = child_doc = []
    for line in lines:
        a.append(re.match("{.*}",line))
    count = 0
    for each in a:
        count = count + 1
        if not isinstance(each,dict):
            temp = JSD.decode(each.group())
            b.append(temp)
    for eachb in b:
        if eachb['doctype'] == 'DocType':
            par_doc.append(Document('DocType',eachb.pop('name'),eachb))
#            par_doc[0].save(1) # feels very hacky
        else:
            temp = addchild(par_doc[0],eachb.pop('parentfield'),eachb.pop('doctype'),1)
            for eachk in eachb.keys():
                setattr(temp,eachk,eachb.pop(eachk))
#            temp.save(1)
            child_doc.append(temp)
    webnotes.conn.sql("commit ")
    return par_doc + child_doc


def get_schema_files(path):
    global fd_schema_list 
    for each in os.listdir(path):
        if os.path.isdir(os.path.join(path,each)):
            get_schema_files(os.path.join(path,each))
        elif fnmatch.fnmatch(os.path.join(path,each),'*.schema'):
            fd_schema_list.append(open(os.path.join(path,each)))
def main():
    global fd_schema_list
    get_schema_files(par_folder)
    #print webnotes.conn.cur_db_name
    fd = open(os.path.join(par_folder,'Accounts/Account Balance/Account Balance.schema')) 
    for each in fd_schema_list:
        p = get_doclist(each)
    docl = get_doclist(fd)
    print docl 
    `#print type(docl[0])
    #transfer.set_doc(docl,0,1,1,1) 
    print fd_schema_list,len(fd_schema_list)


if  __name__ == "__main__":
    main()
