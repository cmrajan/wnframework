class DocType:
    def __init__(self, doc, doclist=[]):
        self.doc = doc
        self.doclist = doclist


#--------creating new rfq if not exist and appending rfq details to it-------
    def add_to_cart(self, arg):
        arg = eval(arg)
        
        if not arg['rfq_id'] or arg['rfq_id'] == '':
            r = Document('RFQ')
            r.transaction_date = nowdate()
            r.rfq_type = 'From Customer'      
            r.save(1)

            self.add_rfq_details(r.name, arg['prod_nm'], arg['item_code'],arg['price'], arg['qty'])
            return r.name
        else:
            self.add_rfq_details(arg['rfq_id'],arg['prod_nm'], arg['item_code'],arg['price'], arg['qty'])

#---------------updating rfq details---------      
    def add_rfq_details(self,rfq_id,prod_nm,item_code,price,qty):
        
        dl = getdoc('RFQ',rfq_id)
        if getlist(dl,'rfq_details'):
            item_lst = []
            for d in getlist(dl,'rfq_details'):
                item_lst.append(d.item_code)
            if self.in_list(item_code,item_lst):
                for g in getlist(dl,'rfq_details'):
                    if item_code == g.item_code:
                        g.qty += qty
                        g.save()
            else:
                self.add_new_child(rfq_id,prod_nm,item_code,price,qty)
        else:
            self.add_new_child(rfq_id,prod_nm,item_code,price,qty)

#--------adding new record to rfq detail-------------
    def add_new_child(self,rfq_id,prod_nm,item_code,price,qty):
        r_det = Document('RFQ Detail')
        r_det.parent = rfq_id
        r_det.parenttype = 'RFQ'
        r_det.parentfield = 'rfq_details'
        r_det.product_name = prod_nm
        r_det.item_code = item_code
        r_det.price = price
        r_det.qty = qty
        r_det.save(1)

#---------get cart details-------------------------------
    def get_cart_details(self,rfq_id):
        ret = {}
        ret['prod_det'] = convert_to_lists(sql("select product_name,price,qty,(price*qty) from `tabRFQ Detail` where parent = %s",rfq_id))
        return ret

        
#-------------update rfq qty----------------
    def update_rfq_qty(self,arg):
        arg = eval(arg)
        main_dict_str = arg['main_dict']
        rfq_id = arg['rfq_id']

        dl = getdoc('RFQ',rfq_id)
        
        dict_lst = main_dict_str.split('@')
        for d in dict_lst:
            prod_nm = d.split('~')[0]
            prod_qty = d.split('~')[1]
            for g in getlist(dl,'rfq_details'):
                if g.product_name == prod_nm:
                    g.qty = prod_qty
                    g.save()
                    
        return cstr(rfq_id)
        
#-----------check if item exist in rfq_details-----------
    def in_list(self,item_code,lst):
        if item_code in lst:
            return 1
        else:
            return 0
            
#----------remove from cart--------------------------
    def remove_from_cart(self,arg):
        arg = eval(arg)
        sql("delete from `tabRFQ Detail` where product_name=%s and parent=%s",(arg['prod_nm'],arg['rfq_id']))
        return cstr(arg['rfq_id'])