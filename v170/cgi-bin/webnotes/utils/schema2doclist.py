import webnotes
import pprint
import os
import re
from webnotes.model.doc import Document
import pdb


par_folder = '/home/anand/workspace/wnframework/modules'

def get_doclist(fd):
    lines = fd.readlines()
    a = b = []
    doc_dict = [{}]
    count = 0
    temp = ''
    temp_key = []

    for each in lines:
        a.append(re.match("{.*}",each))
    #a = a[1:]
    for each in a:
        b.append(each.group()[1:])
    #    print each,type(each)
        
       # b.append(each.rsplit(','))
        #print each
    print b[0]
        
#    c = b[0].rsplit(':')
    print c
   # b = dict(a[0])
    return a    

    par_doc = Document('DocType',doc_dict.pop('name'),doc_dict)

    r2 = addchild(par_doc,'permissions', 'DocPerm', 1)
    r2.permlevel = 0
    r2.role = 'Guest'
    r2.read =1
    r2.write=1
    r2.create =1
    r2.save()

    r4 = Document('DocType', 'Customer Issue')
    r3 = addchild(r4, 'permissions', 'DocPerm', 1)
    r3.permlevel = 0
    r3.role = 'Guest'
    r3.read =1
    r3.write=1
    r3.create =1
    r3.save()

def main():
    fd = open(os.path.join(par_folder,'Accounts/Account/Account.schema')) 
#    print fd.fileno
    p = get_doclist(fd)
#    print len(p),p[0]
    


if  __name__ == "__main__":
    main()
