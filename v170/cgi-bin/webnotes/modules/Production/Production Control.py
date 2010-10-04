class DocType:
  def __init__( self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    # pur_items = {'item_code':req_qty}
    self.pur_items = {}
    # bom_list = [[]]
    self.bom_list = []
    # list for sub assembly item
    self.sub_assembly_items = []
    # Item Master 
    self.item_master = {}

  def traverse_bom_tree( self, bom_no, qty, ext_pur_items = 0, ext_sub_assembly_items = 0, calculate_cost = 0, maintain_item_master = 0 ):
    count, bom_list, qty_list = 0, [bom_no], [qty]
    while (count < len(bom_list)):
      # get child items from BOM MAterial Table.
      child_items = sql("select item_code, bom_no, pro_applicable, qty, qty_consumed_per_fg from `tabBOM Material` where parent = %s", bom_list[count], as_dict = 1)
      child_items = child_items and child_items or []
      #msgprint(bom_list[count])
      #msgprint(qty_list)
      for item in child_items:
        # Calculate qty required for FG's qty.
        item['reqd_qty'] = flt(qty) * ((count == 0) and 1 or flt(qty_list[count]) )* flt(item['qty_consumed_per_fg'])
        #gprint("Item Reqd : " + cstr(item['reqd_qty']))

        # extracting Purchase Items
        if ext_pur_items and not item['bom_no']:
          # item exist in pur_items dict then just add qty with previous qty
          if self.pur_items.has_key(item['item_code']):
            self.pur_items[item['item_code']] = flt(self.pur_items[item['item_code']]) + flt(item['reqd_qty'])
            # maintain item master
            #if maintain_item_master:
              
          # else add item in pur_item dict with reqd qty.
          else:
            self.pur_items[item['item_code']] = flt(item['reqd_qty'])
            # maintain item master
            #if maintain_item_master:
              
        # For calculate cost extracting BOM Items check for duplicate boms, this optmizes the time complexity for while loop.
        if calculate_cost and item['bom_no'] and (item['bom_no'] not in bom_list):
          bom_list.append(item['bom_no'])
          qty_list.append(item['reqd_qty'])

        # Here repeated bom are considered to calculate total qty of raw material required
        if not calculate_cost and item['bom_no']:
          # append bom to bom_list
          bom_list.append(item['bom_no'])
          qty_list.append(item['reqd_qty'])
          # extracting Sub Assembly Items . Make Sure Sub Assembly Items have BOM No. in BOM MATERIAL
          if ext_sub_assembly_items:
            # If Production Order Applicable is 'Yes'
            if item['pro_applicable'] == "Yes":
              # append item in sub_assembly_items
              self.sub_assembly_items.append([item['item_code']])
              # Remove current bom from bom_list
              bom_list.pop()

      count += 1
    return bom_list

  #  Raise Production Order
  def create_production_order(self,company, fy, pp_detail = '', pro_detail = ''):
    pro_lbl = {'production_item': 0, 'description': 1, 'qty' : 2, 'stock_uom' : 3, 'bom_no': 4, 'consider_sa_items': 5}
           
    default_values = { 'date'            : now(),
                       'origin'          : pp_detail and 'MRP' or 'Direct',
                       'wip_warehouse'   : 'MB1-Stores',
                       'status'          : 'Draft',
                       'company'         : company,
                       'fiscal_year'     : fy }
     
    pro_list, count = pp_detail and pp_detail or pro_detail, 0

    while (count < len(pro_list)):
      pro_doc = Document('Production Order')

      for key in pro_lbl.keys():
        pro_doc.fields[key] = pro_list[count][pro_lbl[key]]
      
      for key in default_values:
        pro_doc.fields[key] = default_values[key]
      
      pro_doc.save(new = 1)
      pro_list[count] = pro_doc.name
      
      # This was for adding raw materials in pro detail and get sa items
      #sa_list = get_obj('Porduction Order', pro_doc.name, with_children = 1).get_purchase_item( get_sa_items = 1, add_child= 1)
      #for sa_item in sa_list:
      #  pro_list.append(sa_item)

      count = count + 1
    return pro_list


  # MRP CODE
#  def run_mrp_process( self, obj):
#    for d in getlist( obj.doclist, obj.fname):
#      if not d.mrp:
#        self.traverse_bom_tree( d.bom_no, d.planned_qty, ext_pur_items = 1, ext_sub_assembly_items = 1)
#        self.raise_indent()
#        self.raise_production_order(d.against_document,d.document_no)

#  Rais Production Order
  def production_order_detail(self,curr_pro_no = '', d ='' ):
    # Step 1: Check for current pro no
    
    if not curr_pro_no:
      # Step 1. a: create new production order
      pro_obj = Document('Production Order')
      
      # Step 1.b: assign values to fields of new Production Order
      for key in d.keys():
        if key != 'pro_pp_details':
          pro_obj.fields[key] = d[key]
      
      # Step 1.c: save new production order
      pro_obj.save(new = 1)
      
      # Step 1.d: assign values to fields of  pro_pp_details
      pro_pp_obj = addchild(pro_obj, 'pro_pp_details', 'PRO PP Detail', 0)
      for i in d['pro_pp_details']:
        for key in i.keys():
          pro_pp_obj.fields[key] = i[key]
        pro_pp_obj.save()
       
      # Step 1.e: set curr_pro_no as pro_obj.name
      curr_pro_no = pro_obj.name

    # Step2:  traverse tree and get purchase items and their reqd qty.
    #self.traverse_bom_tree (d['bom_no'], d['qty'], ext_pur_items = 1, ext_sub_assembly_items = 1, calculate_cost = 0, maintain_item_master = 1 )
    # Return Name of Production Order generated.
    return cstr(pro_obj.name)
    
#===========================================================================================
# Run only from SSH terminal
#===========================================================================================



  def update_bom(self, bom_no):
    main_bom_list = self.traverse_bom_tree(bom_no, 1)
    main_bom_list.reverse()
    print('--------------')
    print(main_bom_list)
    print('--------------')
    # run calculate cost and get
    for bom in main_bom_list:
      if bom and bom not in self.check_bom_list:
        print(bom)
        bom_obj = get_obj('Bill Of Materials', bom, with_children = 1)
        #print(bom_obj.doc.fields)
        bom_obj.doc.save()
        bom_obj.check_recursion()
        bom_obj.update_flat_bom_engine()
        #bom_obj.doc.docstatus = 1
        bom_obj.doc.save()
        self.check_bom_list.append(bom)
        #errprint(" " + cstr(bom) + " has been submitted successfully.")
        
        
        
        
  def update_all_fg(self):
    self.check_bom_list = []
    #cn_bom = sql("select name from `tabBill Of Materials` where item not like 'CN%' and item not like 'LDR%' and item not like 'HD%' limit 0,1")
    cn_bom = (('BOM/A012629/001',),)
    i=1
    for d in cn_bom:
      if not d[0] in self.check_bom_list:
        print(d[0])
        print(i)
        self.update_bom(d[0])
        i += 1
    print('Completed')