import  unittest

import webnotes.db

class test_doc_ORM(unittest.TestCase):
    def SetUp(self):
        from webnotes.doc import Document
        d1 = Document("DocType",'Test Doc',{test_field1:value1,test_field2:value2})
    def test_create_Document(self):
        d1.save()
        count = webnotes.conn.sql("select count(*) from tabDocType where name = 'Test Doc'")
        assert (count == 1) 


    def test_loadfromdb(self):
        pass
    
    def test_loadsingle(self):
        pass
