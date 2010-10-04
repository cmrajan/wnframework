class DocType:
  def __init__(self, doc, doclist=[]):
    self.doc = doc
    self.doclist = doclist
  
  def get_master_status(self, arg) :
    ret = {}
    
    #finance
    is_comp = sql("select count(name) from `tabCompany`")
    is_comp = is_comp and cint(is_comp[0][0]) or 'false'
    
    is_curr = sql("select count(name) from `tabCurrency`")
    is_curr = is_curr and cint(is_curr[0][0]) or 'false'
    
    is_fiscal_yr = sql("select count(name) from `tabFiscal Year`")
    is_fiscal_yr = is_fiscal_yr and cint(is_fiscal_yr[0][0]) or 'false'
    
    is_cost_center = sql("select count(name) from `tabCost Center`")
    is_cost_center = is_cost_center and cint(is_cost_center[0][0]) or 'false'
    
    is_tds_catg = sql("select count(name) from `tabTDS Category`")
    is_tds_catg = is_tds_catg and cint(is_tds_catg[0][0]) or 'false'
    
    is_tds_rate = sql("select count(name) from `tabTDS Rate Chart`")
    is_tds_rate = is_tds_rate and cint(is_tds_rate[0][0]) or 'false'
    
    #crm
    is_cust = sql("select count(name) from `tabCustomer`")
    is_cust = is_cust and cint(is_cust[0][0]) or 'false'
    
    is_cust_grp = sql("select count(name) from `tabCustomer Group`")
    is_cust_grp = is_cust_grp and cint(is_cust_grp[0][0]) or 'false'
    
    is_price_lst = sql("select count(name) from `tabPrice List` where is_active = 'Yes'")
    is_price_lst = is_price_lst and cint(is_price_lst[0][0]) or 'false'
    
    is_zone = sql("select count(name) from `tabZone`")
    is_zone = is_zone and cint(is_zone[0][0]) or 'false'
    
    is_territory = sql("select count(name) from `tabTerritory`")
    is_territory = is_territory and cint(is_territory[0][0]) or 'false'
    
    is_state = sql("select count(name) from `tabState`")
    is_state = is_state and cint(is_state[0][0]) or 'false'
    
    is_country = sql("select count(name) from `tabCountry`")
    is_country = is_country and cint(is_country[0][0]) or 'false'
    
    is_sales_partner = sql("select count(name) from `tabSales Partner`")
    is_sales_partner = is_sales_partner and cint(is_sales_partner[0][0]) or 'false'
    
    is_sales_person = sql("select count(name) from `tabSales Person`")
    is_sales_person = is_sales_person and cint(is_sales_person[0][0]) or 'false'
    
    is_terms = sql("select count(name) from `tabTerms And Conditions`")
    is_terms = is_terms and cint(is_terms[0][0]) or 'false'
    
    #scm
    is_supplier = sql("select count(name) from `tabSupplier`")
    is_supplier = is_supplier and cint(is_supplier[0][0]) or 'false'
    
    is_supplier_type = sql("select count(name) from `tabSupplier Type`")
    is_supplier_type = is_supplier_type and cint(is_supplier_type[0][0]) or 'false'
    
    #material
    is_item = sql("select count(name) from `tabItem`")
    is_item = is_item and cint(is_item[0][0]) or 'false'
    
    is_item_grp = sql("select count(name) from `tabItem Group`")
    is_item_grp = is_item_grp and cint(is_item_grp[0][0]) or 'false'
    
    is_brand = sql("select count(name) from `tabBrand`")
    is_brand = is_brand and cint(is_brand[0][0]) or 'false'
    
    is_uom = sql("select count(name) from `tabUOM`")
    is_uom = is_uom and cint(is_uom[0][0]) or 'false'
    
    is_warehouse = sql("select count(name) from `tabWarehouse`")
    is_warehouse = is_warehouse and cint(is_warehouse[0][0]) or 'false'
    
    is_warehouse_type = sql("select count(name) from `tabWarehouse Type`")
    is_warehouse_type = is_warehouse_type and cint(is_warehouse_type[0][0]) or 'false'
    
    ret = {'is_comp': is_comp, 'is_curr': is_curr, 'is_fiscal_yr':is_fiscal_yr, 'is_cost_center':is_cost_center, 'is_tds_catg':is_tds_catg, 'is_tds_rate':is_tds_rate, 'is_cust': is_cust, 'is_cust_grp':is_cust_grp, 'is_price_lst':is_price_lst, 'is_zone':is_zone, 'is_territory':is_territory, 'is_state': is_state, 'is_country':is_country, 'is_sales_partner':is_sales_partner, 'is_sales_person':is_sales_person, 'is_terms':is_terms, 'is_supplier':is_supplier, 'is_supplier_type':is_supplier_type, 'is_item':is_item, 'is_item_grp':is_item_grp, 'is_brand':is_brand, 'is_uom':is_uom, 'is_warehouse':is_warehouse, 'is_warehouse_type':is_warehouse_type}
    return ret