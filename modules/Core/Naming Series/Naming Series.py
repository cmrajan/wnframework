class DocType:
  def __init__(self, d, dl):
    self.doc, self.doclist = d, dl
#--------------------------------------------------------------------------------------------------------------------------------------------
#Naming Series
#---------------------------------------------------------------------------------------------------------------------------------------- 
  def get_series(self):
    self.doc.clear_table(self.doclist, 'series_details')
    
    if self.doc.select_doc_for_series:
      sr= sql("Select options from `tabDocField` where fieldname='naming_series' and parent='%s'"%(self.doc.select_doc_for_series))
      if sr:
        sr_list=sr[0][0].split(NEWLINE)
        
        for x in sr_list:
          if cstr(x)!='':
            c = addchild(self.doc, 'series_details', 'Series Detail', 1, self.doclist)
            c.series=cstr(x)
      
      else:
        msgprint("No series is mentioned")
    else :
      msgprint("Please select Doctype")
  
  def remove_series(self):
    if not getlist(self.doclist, 'series_details'):
      msgprint("Please pull already existed series for the selected doctype and check the series that you want to remove")
    else:
      sr= sql("Select options from `tabDocField` where fieldname='naming_series' and parent='%s'"%(self.doc.select_doc_for_series))
      if sr:
        sr_list=sr[0][0].split(NEWLINE)
      
      for d in getlist(self.doclist, 'series_details'):
        if d.remove == 1:
          sr_list.remove(d.series)
      sql("update `tabDocField` set options='%s' where fieldname='naming_series' and parent='%s'"%(NEWLINE.join(sr_list),self.doc.select_doc_for_series))
      sql("update `tabDocType` set modified='%s' where name='%s'"%(now(),self.doc.select_doc_for_series))
      self.get_series()

  def add_series(self):
    if not self.doc.select_doc_for_series or not self.doc.new_series:
      msgprint("Please select Doctype and series name for which series will be added")
      raise Exception
    else:
      sr_list = []
      sr= sql("select options from `tabDocField` where fieldname='naming_series' and parent='%s'"% (self.doc.select_doc_for_series))
      if sr[0][0]:
        sr_list=sr[0][0].split(NEWLINE)
      self.check_duplicate(self.doc.select_doc_for_series)
      if not sr_list:
        sr_list.append('')
        sr_list.append(self.make_series_name())
      else:
        sr_list.append(self.make_series_name())
      sql("update `tabDocField` set options='%s' where fieldname='naming_series' and parent='%s'"%(NEWLINE.join(sr_list),self.doc.select_doc_for_series))
      sql("update `tabDocType` set modified='%s' where name='%s'"%(now(),self.doc.select_doc_for_series))
      self.get_series()
      
  def check_duplicate(self,parent):
    sr_list = sql("Select options from `tabDocField` where fieldname='naming_series' and parent='%s'"%self.doc.select_doc_for_series)
    nw_sr = self.make_series_name()
    #msgprint(sr_list)
    for sr in sr_list:
      if nw_sr in sr[0]:
        idx=sql("Select current from `tabSeries` where name='%s'"% (nw_sr + '/'))
        msgprint("Series name already exist with index '%s'" %(idx[0][0]))
        raise Exception  
        
  def make_series_name(self):
    if 'FY' in cstr((self.doc.new_series).upper()):
      abb=sql("select abbreviation from `tabFiscal Year` where name='%s'"%(self.doc.current_fiscal_year))
      if not abb:
        msgprint("Abbreviation is not mentioned in Fiscal Year")
        raise Exception
      else:
        return cstr((self.doc.new_series).upper()).strip().replace('FY',abb[0][0])
    else:
      return cstr((self.doc.new_series).upper()).strip()