import webnotes
import pprint
import os
import parser

par_folder = '/home/anand/workspace/wnframework/modules'

def get_doclist(fd):
    for line in fd:
        if line != "\n": 
            temp_dict_lines.append(line)
        else: 
            doc_dict = dict(temp_dict_lines)
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
    get_doclist(fd)

