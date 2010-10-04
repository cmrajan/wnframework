class DocType:
  def __init__(self, d, dl):
    self.doc, self.doclist = d, dl

#---------------------------------------------------------------------------------------------------------------------------------------------  
  def get_bal(self,arg):
    bal = sql("select `tabAccount Balance`.balance,`tabAccount`.debit_or_credit from `tabAccount`,`tabAccount Balance` where `tabAccount Balance`.parent=%s and `tabAccount Balance`.fiscal_year=%s and `tabAccount Balance`.parent=`tabAccount`.name ",(arg,self.doc.current_fiscal_year))
    if bal:
      return fmt_money(flt(bal[0][0])) + ' ' + bal[0][1]
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
#-------------------------------------------------------------------------------------------------------------------------------------------------
#Transfer Ownership
#-----------------------------------------------------------------------------------------------------------------------------
  def change_ownership(self):
    if not self.doc.current_owner or not self.doc.new_owner:
      msgprint("Please enter current owner and new owner to transfer ownership")
      raise Exception
    elif self.doc.current_owner=='Administrator':
      msgprint("Administrator's ownership is not transferable")
      raise Exception
    else:
      doc_list=sql("""
      Select 
      t1.parent
      From 
      `tabDocPerm` t1,
      `tabProfile` t2,
      `tabUserRole` t3
      Where 
      t1.create=1
      and t2.name='%s'
      and t1.role=t3.role
      and t3.parent=t2.name
      """%(self.doc.current_owner))
      if doc_list:
        dl=[x[0] for x in doc_list]
        for d in dl:
          sql("update `tab%s` set owner='%s' where owner='%s'"%(d,self.doc.new_owner,self.doc.current_owner))
      
      msgprint("Owner of '%s' is transferred to '%s'" %(self.doc.current_owner,self.doc.new_owner))
#-----------------------------------------------------------------------------------------------------------------------------------  
# Update display info in control panel
  def update_control_panel(self):
    if self.doc.bg_color:
      sql("update `tabSingles` set value='%s'  where doctype='Control Panel' and field='background_color'"%self.doc.bg_color)
    else:
      msgprint("No background color is mentioned")
    if self.doc.letter_head:
      sql("update `tabSingles` set value='%s' where doctype='Control Panel' and field='letter_head'"%self.doc.letter_head)
    else:
      msgprint("No Letter Head is mentioned")
#------------------------------------------------------------------------------------------------------------------------------------------------------
#--------------------------------------  User Setting-Role Permissions --------------------------------------------------
  
  # ---------------------------------------------
  # get permission for a particular role
  # ---------------------------------------------
  def get_doctypes(self):
    self.doc.clear_table(self.doclist, 'role_permissions')
    
    if self.doc.select_permission_role:
      perm_l = sql("select t1.name, t2.permlevel, t2.read, t2.write, t2.create, t2.submit, t2.cancel, t2.amend, t2.match from `tabDocType` t1, `tabDocPerm` t2 where t2.role = '%s' and t2.parent = t1.name order by t1.name" % self.doc.select_permission_role)
      
      i=0
      for x in perm_l:
        c = addchild(self.doc, 'role_permissions', 'User Setting-Role Permission', 1, self.doclist)
        c.idx, i = i, i+1
        c.doc_type = x[0] 
        c.level = cint(x[1]) or 0
        c.read = cint(x[2]) or 0
        c.write = cint(x[3]) or 0
        c.create = cint(x[4]) or 0
        c.submit = cint(x[5]) or 0
        c.cancel = cint(x[6]) or 0
        c.amend = cint(x[7]) or 0
        c.match = x[8] or ''
    else :
      msgprint("Please select Role")
  
  # -----------------------
  # update role users
  # -----------------------
  def update_role_permission(self):
    if self.doc.select_permission_role:
      for d in getlist(self.doclist, 'role_permissions'):
        # ----- update existing permission ----
        
        if d.changed == 1:
          if d.remove_permission == 1:
            sql("delete from `tabDocPerm` where role = '%s' and parent = '%s' and permlevel = '%s'" % (self.doc.select_permission_role, d.doc_type, cint(d.level)))
          elif d.remove_permission != 1: 
            
            sql("Update `tabDocPerm` set `read` ='%s', `write`='%s', `create`='%s', `submit`='%s', `cancel`='%s', `amend`='%s', `match`='%s', `modified`='%s' where role = '%s' and `parent` = '%s' and permlevel = '%s'" % (d.read, d.write, d.create, d.submit, d.cancel, d.amend, (d.match or ''), self.doc.modified, self.doc.select_permission_role, d.doc_type, cint(d.level)))
    
      self.get_doctypes()
      
    else :
      msgprint("Please select role to which following permissions need to be assigned.")
  
  # --------------------------
  # add role permission
  # --------------------------
  def add_role_permission(self):
    if self.doc.select_doc_for_perm and (self.doc.for_level) and self.doc.select_permission_role:
      
      # --------check if permission already exist for specified permission level---------
      is_present = ''
      for d in getlist(self.doclist, 'role_permissions'):
        if d.doc_type == self.doc.select_doc_for_perm and cint(d.level) == cint(self.doc.for_level) :
          is_present = 'true'
      
      if is_present != 'true':
        c = addchild(self.doc, 'role_permissions', 'User Setting-Role Permission', 1, self.doclist)
        c.doc_type = self.doc.select_doc_for_perm
        c.level = cint(self.doc.for_level)
        c.read = 1
        
        p1 = Document('DocPerm')
        p1.role = self.doc.select_permission_role
        p1.permlevel = c.level
        p1.read = 1
        p1.parent = c.doc_type
        p1.parenttype = 'DocType'
        p1.parentfield = 'permissions'
        p1.save(1)
      else :
        msgprint("This role already has permission at permission level "+ cstr(cint(self.doc.for_level)) + " for doctype " + cstr(self.doc.select_doc_for_perm))
    else :
      if not self.doc.select_permission_role:
        msgprint("Please select a role first")
      elif not self.doc.select_doc_for_perm:
        msgprint("Please select doctype name level for which you want to add permission")
      elif not(self.doc.for_level) or cint(self.doc.for_level) <=0 :
        msgprint("Please enter permission level for which you want to add permission")

#Update------------------------------------------------------------------------------------------
  def on_update(self):
    # fiscal year
    fy=sql("select defvalue from `tabDefaultValue` where defkey='fiscal_year' and parent not like 'old_parent%'")
    if not fy:
      con_obj = get_obj(dt = 'Control Panel',with_children = 1)
      child = addchild(con_obj.doc,'system_defaults','DefaultValue',0)
      child.defkey = 'fiscal_year'
      child.defvalue = self.doc.current_fiscal_year
      child.save()
    elif fy and fy[0][0] != self.doc.current_fiscal_year:
      set_default('fiscal_year', self.doc.current_fiscal_year)
    
    ysd = sql("select year_start_date from `tabFiscal Year` where name=%s", self.doc.current_fiscal_year, as_dict = 1)
    set_default('year_start_date', ysd[0]['year_start_date'].strftime('%Y-%m-%d'))
    set_default('year_end_date', get_last_day(get_first_day(ysd[0]['year_start_date'],0,11)).strftime('%Y-%m-%d'))

    # company
    comp=sql("select defvalue from `tabDefaultValue` where defkey='company' and parent not like 'old_parent%'")
    if not comp:
      con_obj = get_obj(dt = 'Control Panel',with_children = 1)
      child = addchild(con_obj.doc,'system_defaults','DefaultValue',0)
      child.defkey = 'company'
      child.defvalue = self.doc.default_company
      child.save()
    elif comp and comp[0][0] != self.doc.default_company:
      set_default('company', self.doc.default_company)
  
    # currency
    curr=sql("select defvalue from `tabDefaultValue` where defkey='currency' and parent not like 'old_parent%'")
    if not curr:
      con_obj = get_obj(dt = 'Control Panel',with_children = 1)
      child = addchild(con_obj.doc,'system_defaults','DefaultValue',0)
      child.defkey = 'currency'
      child.defvalue = self.doc.default_currency
      child.save()
    elif curr and curr[0][0] != self.doc.default_currency:
      set_default('currency', self.doc.default_currency)
      
    # price list
    price_list=sql("select defvalue from `tabDefaultValue` where defkey='price_list_name' and parent not like 'old_parent%'")
    if not price_list:
      con_obj = get_obj(dt = 'Control Panel',with_children = 1)
      child = addchild(con_obj.doc,'system_defaults','DefaultValue',0)
      child.defkey = 'price_list_name'
      child.defvalue = self.doc.default_price_list
      child.save()
    elif curr and curr[0][0] != self.doc.default_price_list:
      set_default('price_list_name', self.doc.default_price_list)
  

  # check for person approving the document
  # ------------------------------------------------------------  
  def get_approval_permissions(self,doctype,grand_total,session_user):
    return get_obj('Authorization Rules', 'Authorization Rules', with_children = 1).get_approval_permissions(doctype,grand_total,session_user)
   

  # ================== TOLERANCE =============================================
  # ==========================================================================
  def calculate_already_updated_qty(self, tol_for, update_stock, prev_qty, prev_pending_qty, prev_billed_qty ):
    # Calculate already updated qty for pending_qty 
    if tol_for in ['Purchase Order - Purchase Receipt']:
      # On Submit
      if update_stock == 1: 
        return flt(prev_qty) - flt(prev_pending_qty)
      # On Cancel
      if update_stock == -1:
        return flt(prev_pending_qty)
    
    # Calculate already updated qty for billed_qty
    if tol_for in ['Purchase Order - Payable Voucher', 'Purchase Receipt - Payable Voucher']:
      # On Submit
      if update_stock == 1:
        return flt(prev_billed_qty)
      # On Cancel
      if update_stock == -1:
        return flt(prev_qty) - flt(prev_billed_qty)

  # Check Tolerance
  def check_tolerance(self, tol_for = '', update_stock = 1, prev_qty = 0, prev_pending_qty = 0, prev_billed_qty = 0, curr_qty = 0):
    # for eg:-
    # In case of On_Submit of Purchase Receipt
    # prev_qty = > qty of po_detail
    # prev_pending_qty = > pending_qty of po_detail
    # curr_qty => qty in purchase_receipt_detail
      
    # Step 1:=> Calculate already updated qty
    already_updated_qty = self.calculate_already_updated_qty(tol_for, update_stock, prev_qty, prev_pending_qty, prev_billed_qty)
    
    # Step 2:=> Calculate total allowed qty i.e. prev_qty with tolerance 
    if flt(self.doc.tolerance) and tol_for in ['Purchase Order - Purchase Receipt','Purchase Order - Payable Voucher']:
      total_allowed_qty = flt(prev_qty) * (1 + (flt(self.doc.tolerance)/ 100))
    else:
      total_allowed_qty = flt(prev_qty)
    # Use This Message PRint For TEsting
    #msgprint("prev_qty" + cstr(prev_qty) + "=== prev_pending_qty " + cstr(prev_pending_qty) + "==== prev_billed_qty " + cstr(prev_billed_qty) + "==== curr_Qty" + cstr(curr_qty) + "=== Already updated qty " +cstr(already_updated_qty) + " ==== Total Allowed Qty " + cstr(total_allowed_qty) + " === " + cstr(flt(already_updated_qty)+flt(curr_qty)))
    
    # Step 3:=> Check Tolerance Limit.
    if flt(total_allowed_qty) < (flt(already_updated_qty) + flt(curr_qty)):
      msgprint("Sorry you are exceeding the maximum allowed quantity(including tolerance if any).")
      raise Exception
      
    #  Step 4, 5 is done so that:=
    #  pending qty in prev doc should not go in -ve
    #  eg:- on submit of PO the indent_qty should reduce by pending qty in Indent.
   
    # Step 4:=> Calculate Final Trimmed Qty is the quantity 
    final_trimmed_qty = flt(prev_qty) - flt(already_updated_qty)
    
    # Step 5:=> If current_qty to update is greater than final_trimmed_qty than update by final_trimmed_qty or update by curr_qty.
    if flt(curr_qty) > flt(final_trimmed_qty):
      return flt(final_trimmed_qty)
    else:
      return curr_qty