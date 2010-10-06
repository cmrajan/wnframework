class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
    self.item_master = {}
    self.detail_table_mapper = {
    'Indent'            : 'Indent Detail',
    'Production Order'  : 'PRO Detail'
    }

    self.detail_table_fname_mapper = {
    'Indent Detail' : 'indent_details',
    'PRO Detail'    : 'pro_details'
    }

  def autoname(self):
    p = self.doc.fiscal_year
    self.doc.name = make_autoname('PP/' + self.doc.fiscal_year[2:5]+self.doc.fiscal_year[7:9] + '/.#####')
  
  def admin_msgprint(self,text):
    if session['user'] == 'Administrator':
      msgprint(text)
    pass

  def admin_errprint(self,text):
    if session['user'] == 'Administrator':
      errprint(text)
    pass

  #Validations
  #--------------------------------------------------------------------------------------------

  def validate_mandatory(self):
    if (getdate(self.doc.start_date) > getdate(self.doc.end_date)):
      msgprint("Start Date cannot be after End Date")
      raise Exception
    for d in getlist(self.doclist, 'pp_details'):
      # COmmented for JAnak@@@
      #bom = sql("select name from `tabBill Of Materials` where item = %s", d.item_code, as_dict = 1)
      #if not bom:
      #  msgprint("There is no BOM for item code " + cstr(d.item_code) + " at row no." + cstr(d.idx))
      #  raise Exception
      #if bom and bom[0]['name'] and not d.bom_no:
      #  msgprint("Please Enter BOM No. for item code " + cstr(d.item_code) + "at row no " + cstr(d.idx))
      #  raise Exception
      item = sql("select is_mrp_item, is_purchase_item from `tabItem` where name = %s", d.item_code,as_dict = 1)
      if not item[0]['is_mrp_item']:
        msgprint("Please Delete Row No " + cstr(d.idx) + " as Item " + cstr(d.item_code) + " is not MRP ITEM ")
        raise Exception
      if not item[0]['is_purchase_item'] and not d.bom_no:
        msgprint("Please Delete Row No. "+ cstr(d.idx)+" as Item " + cstr(d.item_code) + " is not a PURCHASE ITEM ")
        raise Exception
      if not d.planned_qty:
        msgprint("Pleaase Enter Planned Qty for item code " + cstr(d.item_code) + "at row no " + cstr(d.idx))
        raise Exception
      if flt(d.planned_qty) > flt(d.prevdoc_total_qty):
        msgprint(d.planned_qty)
        msgprint(" Planned Qty cannot be greater than total Qty at row no " + cstr(d.idx))
        raise Exception
#--------------------------------maintain history-------------------------------------      
#  def check_existing_records(self):
#    label = {}
#    mrp_history_list =[['name', rowid]
#    for d in getlist(self.doclist, 'pp_details'):
#      if d.mrp:
#        for 
#------------------------------------------------------------------------------      
  def validate_prevdoc(self):
    for d in getlist(self.doclist, 'pp_details'):
      doc = sql("select company, docstatus from `tab%s` where name = '%s'" % (d.against_document, d.document_no))
      if doc:
        if doc[0][0] != self.doc.company: 
          msgprint(cstr(d.against_document) +" No: " + cstr(d.document_no) + " does not belong to the Company: " + cstr(self.doc.company))
          raise Exception, "Validation Error"
        if doc[0][1] != 1:
          msgprint(cstr(d.against_document) + " No: " + cstr(d.document_no) + " is not a Submitted Document")
          raise Exception, "Validation Error"
      else:
        msgprint(cstr(d.against_document) + " No: " + cstr(d.document_no[0]['name']) + " is not a Valid " + cstr(d.against_document))
        raise Exception, "Validation Error"
      if not d.mrp:
        if d.against_document == 'Forecast':
          pf_det = sql("select t1.qty, t2.status from `tabPF Detail` t1, `tabProduction Forecast` t2 where t1.parent = '%s' and docstatus = 1"%(d.document_no))
          if pf_det[0][1] == 'Completed':
            msgprint("Production Forecast"+cstr(d.document_no)+" has been already completed ")
            raise Exception, "Validation Error"
          if planned_qty > flt(pf_det[0][0]):
            msgprint("Planned quantity cannot be greater than Forecast quantity[ "+cstr(qty_pf[0][0])+"]")
            raise Exception, "Validation Error"
        if d.against_document == 'Sales Order':
          so_status = sql("select status from `tabSales Order` where name = '%s'"%(d.documnet_no))
          if so_status == 'Completed':
            msgprint("The Sales Order"+cstr(d.document_no)+" has already been planned ")
            raise Exception, "Validation Error"          


  #------------------------------------------------
  #OnClick Server Functions

  def get_open_docs(self):
    if self.doc.from_date:
      if (getdate(self.doc.from_date) > getdate(self.doc.to_date)):
        msgprint("From Date cannot be after To Date")
        raise Exception
    flag_pp_so = 0
    for d in getlist(self.doclist,'pp_so_detail'):
      if d.include_in_plan == 1:
        flag_pp_so = 1
    if flag_pp_so == 0:
      self.doc.clear_table(self.doclist, 'pp_so_details')
#------include department ='sales' in open_so for jai-janak
    if self.doc.from_date: 
      open_so = sql("select 'Sales Order' as prevdoc, name, transaction_date, delivery_date from `tabSales Order` where delivery_date >= '%s' and delivery_date <= '%s' and docstatus = 1 and status != 'Completed' order by delivery_date" % (self.doc.from_date, self.doc.to_date))
      open_pf = sql("select 'Forecast' as prevdoc, name,transaction_date,forecast_due_date from `tabProduction Forecast` where forecast_due_date >= '%s' and forecast_due_date <= '%s' and docstatus = 1 and not status = 'Completed' order by forecast_due_date " % (self.doc.from_date, self.doc.to_date))
    else:
      open_so = sql("select 'Sales Order' as prevdoc, name, transaction_date, delivery_date from `tabSales Order` where delivery_date <= '%s' and docstatus = 1 and status != 'Completed' order by delivery_date" % (self.doc.to_date))
      open_pf = sql("select 'Forecast' as prevdoc, name,transaction_date,forecast_due_date from `tabProduction Forecast` where forecast_due_date <= '%s' and docstatus = 1 and not status = 'Completed' order by forecast_due_date " % (self.doc.to_date))
    open_doc = open_so + open_pf

    for doc in open_doc:
      pp_so = addchild(self.doc, 'pp_so_details', 'PP SO Detail', 1, self.doclist)
      pp_so.prevdoc = doc[0]
      pp_so.prevdoc_docname = doc[1] 
      pp_so.document_date = cstr(doc[2])
#      if doc[0] == 'Sales Order':
      pp_so.delivery_date = cstr(doc[3])
 
  def has_sales_bom(self, item_code):
    return sql("select name from `tabSales BOM` where name=%s and is_active='Yes'", item_code)
  
  def get_sales_bom_items(self, item_code):
    return sql("select item_code, qty from `tabSales BOM Detail` where parent=%s", item_code)


  def get_sales_item_list(self, sales_order):
    il = []
    so_items = sql("select item_code, pending_qty, confirmation_date from `tabSales Order Detail` where pending_qty > 0 and parent = '%s' order by name" % (sales_order))
    for d in so_items:
      if self.has_sales_bom(d[0]):
        for i in self.get_sales_bom_items(d.item_code):
          il.append([d[0], i[0], flt(flt(i[1])* d[1]),d[2]])
      else:
        il.append([d[0], d[0],d[1],d[2]])
    return il

  def get_final_items(self,il, sales_order):
    for d in il:
      pack_l = sql("select name, item_code, parent_item, transaction_date from `tabDelivery Note Packing Detail` where item_code = '%s' and parent_item = '%s' order by name"% (d[0],d[1]), as_dict =1)
      pi = addchild(self.doc, 'pp_details', 'PP Detail', 0,self.doclist)
      pi.against_document = 'Sales Order'
      pi.document_no = sales_order
      pi.document_detail_no = pack_l[0]['name']
      pi.parent_item = pack_l[0]['parent_item']
      pi.item_code = pack_l[0]['item_code']
      pi.document_date = pack_l[0]['transaction_date']
      pi.confirmation_date = cstr(d[3])
      item_details = sql("select description, stock_uom from tabItem where name=%s", pack_l[0]['item_code'])
      pi.description = item_details and item_details[0][0] or ''
      pi.stock_uom = item_details and item_details[0][1] or ''
      pi.prevdoc_total_qty = flt(d[2])
      pi.planned_qty = flt(d[2])
      pi.save()
 
  def get_items(self):
    self.update_pp_so_details()  

    flag_pp = 0
    for d in getlist(self.doclist, 'pp_details'):
      if d.mrp == 1:
        flag_pp = 1
    if flag_pp == 0:
      self.doc.clear_table(self.doclist, 'pp_details')
    for d in getlist(self.doclist, 'pp_so_details'):
      self.admin_msgprint(d.prevdoc)
      if d.prevdoc == 'Sales Order':
        il = self.get_sales_item_list(d.prevdoc_docname)
        self.get_final_items(il,d.prevdoc_docname)
        #get_obj('DocType Mapper', 'Sales Order-Production Plan').dt_map('Sales Order', 'Production Plan', d.prevdoc_docname, self.doc, self.doclist, "[['Sales Order', 'Production Plan'],['Sales Order Detail', 'PP Detail']]")
      if d.prevdoc == 'Forecast':
        get_obj('DocType Mapper', 'Production Forecast-Production Plan').dt_map('Production Forecast','Production Plan', d.prevdoc_docname, self.doc, self.doclist, "[['Production Forecast','Production Plan'],['PF Detail', 'PP Detail']]")

    for d in getlist(self.doclist,'pp_details'):
      if not d.bom_no:
        bom = sql("select default_bom from `tabItem` where name = %s", d.item_code, as_dict = 1)
        self.admin_msgprint("bom_no: " + cstr(bom[0]['default_bom'])) 
        if bom and bom[0]['default_bom']:
          self.admin_msgprint(bom[0]['default_bom'])
          d.bom_no = bom[0]['default_bom']


  def update_pp_so_details(self):
    for d in getlist(self.doclist, 'pp_so_details'):
      if not d.include_in_plan:
        d.parent = 'old_parent:'

  def update_prev_doc_details(self):
    # update sales order or forecast status and quantity
    # -------------------------------------------------
    for d in getlist(self.doclist, 'pp_details'):
      if d.against_document == 'Forecast':
        if not d.mrp:
          qty = sql("select planned_qty from `tabPF Detail` where parent = '%s' and item_code = '%s'" %(d.document_no,d.item_code))
          planned_qty = flt(qty[0][0] or 0.0) + flt(d.planned_qty)
          sql("update `tabProduction Forecast` set planned_qty = '%s' where item_code = '%s'" % (planned_qty,d.item_code))
          self.admin_msgprint("Updated Production Stock Detail planned qty for item code " + cstr(d.item_code)) 
          sql("update `tabPF Detail` set planned_qty = '%s' where parent = '%s' and item_code ='%s'" %(planned_qty,d.document_no,d.item_code))
          sql("update `tabProduction Forecast` set status = '%s' where name = '%s'" %('In Process',d.document_no))
          self.admin_msgprint("Updated planned_qty in Forecast")



  def run_mrp(self):
    #msgprint('run mrp')
    self.validate()
    pc_obj = get_obj(dt = 'Production Control')
    self.raise_production_order(pc_obj)
	
	
    #self.update_prev_doc_details()
    #if self.doc.status == 'Open':
    #  set(self.doc,'status', 'Released') 


  def raise_production_order(self, pc_obj):
    #msgprint("raise pro")
    pp_detail = self.check_criteria_for_same_items()
    count = 0
    for d in pp_detail:
      count = 1 
      pro = pc_obj.production_order_detail(d = d)
      if count == 1:
        result = "Production Order From "+ pro +" to " 
      count += 1

    if count == 1:
      result = "Only Production Order " + cstr(pro) + " has been generated."
    else :
      result = result + cstr(pro) +  " has been generated."
    msgprint(result)

  def check_criteria_for_same_items(self):
    #msgprint(1)
    pp_detail, appended = [], 0
    for d in getlist(self.doclist, 'pp_details'):
      if not d.mrp:
        d.mrp = 1
        d.save()
        appended = 0
        if pp_detail:
          for i in pp_detail:
            # if same item 
            if d.item_code == i['production_item']:
              # set appended 
              appended = 1
              # add qty 
              i['qty'] = i['qty'] + flt(d.planned_qty)
              i['pending_qty'] = i['pending_qty'] + flt(d.planned_qty)
              # append pro_pp_detail in pp_detail
              i['pro_pp_details'].append({'source_doctype'        : d.against_document,
                                     'source_docname'        : d.document_no,
                                     'prevdoc_detail_docname': d.name,
                                     'confirm_date'          : d.confirmation_date,
                                     'qty_reqd'              : d.planned_qty})
              
        if not appended:
          data = {
             'prev_doc'          : self.doc.name,
             'date'              : now(),
             'origin'            : 'MRP',
             'wip_warehouse'     : 'MB1-Stores',
             'status'            : 'Open',
             'prevdoc_doctype'       : self.doc.doctype,
             'prevdoc_docname'       : self.doc.name,
             'production_item'   : d.item_code,
             'description'       : d.description,
             'bom_no'            : d.bom_no,
             'stock_uom'         : d.stock_uom,
             'qty'               : d.planned_qty,
             'pending_qty'       : d.planned_qty,
             'company'           : self.doc.company,
             'fiscal_year'       : self.doc.fiscal_year,
             'pro_pp_details'     :[{
                                     'source_doctype'        : d.against_document,
                                     'source_docname'        : d.document_no,
                                     'prevdoc_detail_docname': d.name,
                                     'confirm_date'          : d.confirmation_date,
                                     'qty_reqd'              : d.planned_qty }]
             }
          pp_detail.append(data)
    return pp_detail
#########################################################
    
#  def run_mrp(self):
#    self.validate()
#    self.update_prev_doc_details()
#    self.maintain_mrp_status()
#    if self.doc.status == 'Open':
#      set(self.doc,'status', 'Released') 
			
  def get_item_list(self,bom_list,pp = 1):
    #item list contains pp_items (fg items), child items with bom_no, child items without bom_no)
    item_list= []

    count = 0
    for d in bom_list:
      if pp == 1:
        item_list.append({  
        'item_code'    : d.item_code, 
        'description'  : d.description,
        'bom_no'       : d.bom_no, 
        'qty'          : d.planned_qty, 
        'stock_uom'    : d.stock_uom,
        'doc_no'       : d.document_no, 
        'doc_name'     : d.against_document,
        })
      else:
        item_list.append(d)
      while (count < len(item_list)):
        ret = self.get_bom_items(item_list[count]['bom_no'], flt(item_list[count]['qty']))
        for item in ret:
          item_list.append(item)
        count += 1
    return item_list

  def get_bom_items(self,bom_no,qty):
    child_item_list = []
    
    if bom_no:
      #self.admin_msgprint(qty)
      #self.admin_msgprint(bom_no)
      #sql("START TRANSACTION")
      get_obj('Bill Of Materials',bom_no,with_children = 1).update_qty_consumed_per_fg()
      #sql("COMMIT")
    
    child_items = sql("select * from `tabBOM Material` where parent = %s", bom_no, as_dict = 1)
    for child in child_items:
      #self.admin_msgprint(child['qty_consumed_per_fg'])
      #child['qty_consumed_per_fg'] = 2
      child['qty'] =  flt(qty) * flt(child['qty_consumed_per_fg'])
      child['qty'] = '%.2f' % child['qty']
      child['doc_no'] = ''
      child['doc_name'] = ''
      child_item_list.append(child)
    return child_item_list

  def get_FGwise_item_group(self,item_list):
    count = 0
    for item in item_list:
      if not self.item_master.has_key(item['item_code']):
        self.update_item_master(item['item_code'])

  def update_item_master(self,item_code):
    if self.item_master.has_key(item_code):
      add_fields = {'extra_indented' : self.item_master[item_code]['extra_indented'] , 'first_time' : self.item_master[item_code]['first_time']}
    else:
      add_fields = { 'extra_indented' : 0 , 'first_time': 1}
    d = sql("select item_code,description,stock_uom,issue_method,order_method,minimum_inventory_level,minimum_order_qty,multiple_order_qty,is_purchase_item,item_dsw from `tabItem` where name = %s", item_code, as_dict = 1)
    if d:
      dsw  = sql("select value from tabSingles where doctype='Master Setup' and field='default_store_warehouse'")
      d[0]['item_dsw'] = dsw and dsw[0][0] or ''
      d[0]['actual_qty'] = 0
      d[0]['available_qty'] = 0
      if self.doc.con_exist_stock:
        for w in getlist(self.doclist,'ppw_details'):
          bin = sql("select name,actual_qty,reserved_qty,available_qty from `tabBin` where item_code = %s and warehouse = %s", (cstr(d[0]['item_code']),cstr(w.warehouse)), as_dict =1 )
          if bin and bin[0]['reserved_qty']:
            if bin[0]['reserved_qty'] < 0:
              get_obj('Bin',bin[0]['name']).update_stock(0, (-1)* flt(bin[0]['reserved_qty']), 0, 0,now())
              bin = sql("select name,actual_qty,reserved_qty,available_qty from `tabBin` where item_code = %s and warehouse = %s", (cstr(d[0]['item_code']),cstr(w.warehouse)), as_dict =1 )
            d[0]['actual_qty'] = d[0]['actual_qty'] + flt(bin[0]['actual_qty'])
            d[0]['available_qty'] = d[0]['available_qty'] + flt(bin[0]['available_qty'])
      d[0].update(add_fields)
      self.item_master[item_code] = d[0]
    else:      
      msgprint("Please Check.There is no data available in Item Master " + cstr('item_code'))
      raise Exception
 
  def raise_document(self, document, item_list):
    common_dict = {
      'company_name'      : self.doc.company_name,
      'fiscal_year'       : self.doc.fiscal_year,
      'company_abbr'      : self.doc.company_abbr
    }
		
    indent_dict = {
      'is_auto_generated' : 1,
      'transaction_date'  : nowdate(),
      'order_from'        : 'Mumbai'
    }
		
    prod_dict = {
      'prev_doc'          : self.doc.name,
      'date'              : now(),
      'origin'            : 'MRP',
      'warehouse'         : 'MB1-Stores',
      'status'            : 'Open',
      'production_item'   : '',
      'description'       : '',
      'bom_no'            : '',
      'stock_uom'         : '',
      'qty'               : '',
      'pending_qty'       : ''
    }
		 
    indent_dict.update(common_dict)
    prod_dict.update(common_dict)
		
    main_dict = {
      'Indent'           : indent_dict,
      'Production Order' : prod_dict
    }
    
    count = 0
    doc = 0
    document_created = 0
    #sql("START TRANSACTION")
    for item in item_list:
      
      #For Every PP Detail Item
      if item['doc_name']:
        #if document == 'Indent' and doc:
        #  doc.on_submit()
        msgprint(item)
        document_created = 0
        doc = Document(document)
        for key in main_dict[document].keys():
          doc.fields[key] = main_dict[document][key]
        if document == 'Production Order' and not self.item_master[item['item_code']]['is_purchase_item']:
          self.admin_errprint("Create Production Order")
          doc.production_item       = item['item_code']
          doc.description           = item['description']
          doc.bom_no                = item['bom_no']
          doc.stock_uom             = item['stock_uom']
          doc.qty                   = item['qty']
          doc.pending_qty           = item['qty']
          doc.against_document_type = item['doc_name']
          doc.against_document_no   = item['doc_no']
          doc.save(new = 1)
          self.admin_errprint("Production Order " + doc.name + " is Created")
          document_created = 1
      
      # For Every Purchase Item  
      if self.item_master[item['item_code']]['is_purchase_item']:
        if not self.item_master[item['item_code']]['item_dsw']:
          dsw  = sql("select value from tabSingles where doctype='Master Setup' and field='default_store_warehouse'")
          self.item_master[item['item_code']]['item_dsw'] = dsw and dsw[0][0] or ''
        
        # For Indent
        if document == 'Indent' and self.item_master[item['item_code']]['order_method'] == 'MRP':
          if (flt(item['qty']) > flt(self.item_master[item['item_code']]['available_qty'])):
            if document_created == 0:
              doc.docstatus = 1
              doc.save(new = 1)
              self.admin_errprint("Indent" + doc.name + " is Created")
              document_created = 1
            self.update_indent(document,doc,item)
		    
        # For Production Order
        if document == 'Production Order' and document_created == 1 and not item['doc_name']:
          #append Child to PRO Details
          self.update_production_order(document,doc,item)

		
  def update_indent(self,document,doc,item):
    self.admin_errprint("Create Indent Item")
    indented_qty = self.order_multiple(item)
    self.update_item_detail(1,item,indented_qty)
    col_values = {
      'indent_date'       : now(), 
      'schedule'          : 1, 
      'schedule_date'     : now(), 
      'item_code'         : self.item_master[item['item_code']]['item_code'], 
      'warehouse'         : self.item_master[item['item_code']]['item_dsw'], 
      'description'       : self.item_master[item['item_code']]['description'], 
      'qty'               : indented_qty, 
      'pending_qty'       : indented_qty, 
      'uom'               : self.item_master[item['item_code']]['stock_uom'], 
      'conversion_factor' : 1, 
      'stock_uom'         : self.item_master[item['item_code']]['stock_uom']
    }
    self.add_child_to_document(document,doc,col_values)
    self.admin_errprint("Indent Item Saved")
  
  def update_production_order(self,document,doc,item):
    self.admin_errprint("Create Production Item")
    col_values = { 
      'item_code'           : item['item_code'],
      'bom'                 : item['bom_no'],
      'description'         : self.item_master[item['item_code']]['description'],
      'actual_qty'          : self.item_master[item['item_code']]['actual_qty'],
      'stock_uom'                 : self.item_master[item['item_code']]['stock_uom'],
      'qty_reqd'            : item['qty'], 
      'source_warehouse'           : self.item_master[item['item_code']]['item_dsw'], 
      'qty_consumed_per_fg' : item['qty_consumed_per_fg']
    }
    self.add_child_to_document(document,doc,col_values)
    self.admin_errprint("Production Item Saved")

  def order_multiple(self,item_req):
    self.admin_errprint("IN Order Multiple")
    self.admin_errprint("item_req" + cstr(item_req['qty']))
    item_code = item_req['item_code']
    self.admin_errprint("Multiple Order qty" + cstr(self.item_master[item_code]['multiple_order_qty']))

    if not self.item_master[item_code]['first_time']:
      self.update_item_master(item_req['item_code'])
    if self.item_master[item_code]['first_time']:
      self.item_master[item_code]['first_time'] = 0
    if not self.item_master[item_code]['multiple_order_qty']:
      msgprint("Multiple Order Qty of Item " + item_code + "cannot be 0" )
      raise Exception
    if flt(self.item_master[item_code]['available_qty']) < flt(self.item_master[item_code]['minimum_inventory_level']):
      item_req['qty'] = flt(item_req['qty']) + flt(self.item_master[item_code]['minimum_inventory_level']) - flt(self.item_master[item_code]['available_qty'])
    if flt(item_req['qty']) > flt(self.item_master[item_code]['extra_indented']):
      item_req['qty'] = flt(item_req['qty']) - flt(self.item_master[item_code]['extra_indented'])
      indented_qty = (flt(item_req['qty']) / flt(self.item_master[item_code]['multiple_order_qty'])) * flt(self.item_master[item_code]['multiple_order_qty'])
      remainder = flt(item_req['qty']) % flt(self.item_master[item_code]['multiple_order_qty'])
      if remainder:
        indented_qty = indented_qty + flt(self.item_master[item_code]['multiple_order_qty'])
        self.item_master[item_code]['extra_indented'] = flt(self.item_master[item_code]['multiple_order_qty']) - remainder
      else:
        self.item_master[item_code]['extra_indented'] = 0	
    else:
      self.item_master[item_code]['extra_indented'] = flt(self.item_master[item_code]['extra_indented']) - flt(item_req['qty'])
      indented_qty = 0
    return indented_qty


  def update_item_detail(self,update_stock,item,indented_qty): 
    self.admin_errprint("IN Update Item Detail")
    values = []   
    #d.reserved_warehouse and d.reserved_warehouse or 'Reserved Warehouse', # PLEASE CHECK THIS OUT....
    values.append({
          'item_code'          : item['item_code'],
          'warehouse'          : self.item_master[item['item_code']]['item_dsw'] and self.item_master[item['item_code']]['item_dsw'] or 'Reserved Warehouse',
          'transaction_date'   : now(),
          'posting_date'       : now(),
          'voucher_type'       : self.doc.doctype,
          'voucher_no'         : self.doc.name, 
          'voucher_detail_no'  : self.doc.pp_details,
          'actual_qty'         : 0, 
          'reserved_qty'       : flt(update_stock) * flt(item['qty']),
          'ordered_qty'        : 0,
          'indented_qty'       : flt(update_stock) * flt(indented_qty),
          'purchase_valuation' : 0,
          'stock_uom'          : self.item_master[item['item_code']]['stock_uom'],
          'company_name'       : self.doc.company_name,
          'fiscal_year'        : self.doc.fiscal_year,
          'is_cancelled'       : (update_stock==1) and 'No' or 'Yes'
        })
    return get_obj('Stock Ledger', 'Stock Ledger').notify(values)

  def add_child_to_document(self,document,parent,col_values):
    self.admin_errprint("ADD child to " + cstr(document) + " " + cstr(parent.name))
    child_obj = addchild(parent, self.detail_table_fname_mapper[self.detail_table_mapper[document]], self.detail_table_mapper[document], 0)
    for key in col_values.keys():
      child_obj.fields[key] = col_values[key]
    child_obj.save()


#########################################################
#----------------------------- MRP status regarding maintaining integrity of the items whose mrp has been runned already---------
#  def maintain_mrp_status(self):
#    pass
#    if not self.doc.mrp_history:
#      self.doc.mrp_history = []
#    label = {'against_document': 1, 'document_no': 2, 'item_code': 3, 'document_date': 4, 'delivery_date': 5, 'bom_no': 6, 'description': 7, 'stock_uom': 8, 'prevdoc_total_qty': 9, 'prevdoc_pending_qty': 10, 'planned_qty': 11, 'produced_qty': 12 }
#    for d in getlist(self.doclist,'pp_detail'):
#      if not d.mrp:
#        mrp_history = [d.name,d.against_document,d.document_no,d.item_code,d.document_date,d.delivery_date,d.bom_no,d.description,d.stock_uom,d.prevdoc_total_qty,d.prevdoc_pending_qty,d.planned_qty,d.produced_qty
#        self.doc.mrp_history.append(mrp_history)
  #------------------------------------------------------------------------------------------
  #Document on Save functions
      
  def validate(self):
    self.validate_mandatory()
    self.validate_prevdoc()