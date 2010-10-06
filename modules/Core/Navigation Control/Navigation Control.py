class DocType:
  def __init__(self,doc,doclist=[]):
    self.doc = doc
    self.doclist = doclist

#fetching all data    
  def get_modules(self):
    main_lst = []
    mod = convert_to_lists(sql("select name from `tabModule Def`"))
    for i in range(0,len(mod)):
      mod_lst = []
      
      mod_lst.append(mod[i])
      
      pg = convert_to_lists(sql("select name from tabPage where module=%s",mod[i]))
      mod_lst.append(pg)
      
      single_dt = convert_to_lists(sql("select t1.doctype_name from `tabHomePage Settings` t1, `tabDocType` t2 where t1.doctype_name = t2.name and t1.is_master = 'Single' and module=%s",mod[i]))
      mod_lst.append(single_dt)
      
      mas_dt = convert_to_lists(sql("select t1.doctype_name from `tabHomePage Settings` t1, `tabDocType` t2 where t1.doctype_name = t2.name and t1.is_master = 'Master' and module=%s",mod[i]))
      mod_lst.append(mas_dt)
      
      trans_dt = convert_to_lists(sql("select t1.doctype_name from `tabHomePage Settings` t1, `tabDocType` t2 where t1.doctype_name = t2.name and t1.is_master = 'Transaction' and module=%s",mod[i]))
      mod_lst.append(trans_dt)
            
      rep = convert_to_lists(sql("select criteria_name,doc_type from `tabSearch Criteria` where ifnull(disabled,0)=0 and module=%s",mod[i]))
      mod_lst.append(rep)
      
      main_lst.append(mod_lst)
      
#    msgprint(main_lst)
    return main_lst

#data for the page settings    
  def get_settings_data(self,arg):
    set_lst = []
    fr_lst = []
    fd_lst = []
    
    fr= convert_to_lists(sql("select ifnull(field_label_fr,''), ifnull(field_type_fr,''), ifnull(options_fr,''), ifnull(table_name_fr,''), ifnull(field_name_fr,'') from `tabReport Filter Detail` where parent=%s",arg))
    for i in range(0,len(fr)):
#      flts = []
#      flts.append(fr[i])
      fr_lst.append(fr[i])

    fd = convert_to_lists(sql("select ifnull(field_label_fd,''), ifnull(field_type_fd,''), ifnull(options_fd,''), ifnull(table_name_fd,''), ifnull(field_name_fd,''), ifnull(field_width_fd,'') from `tabReport Field Detail` where parent=%s",arg))
    for i in range(0,len(fd)):
#      flds = []
 #     flds.append(fd[i])
      fd_lst.append(fd[i])

    set_lst.append(fr_lst)
    set_lst.append(fd_lst)
    return set_lst