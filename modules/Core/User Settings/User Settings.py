class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d,dl
  
  
  #--------------------------------------  User Setting-Profile --------------------------------------------------
  
  # ----------------
  # get user list
  # ----------------
  def get_user_list(self):
    self.doc.clear_table(self.doclist, 'profiles')
    
    if self.doc.beginning_with:
      pl = sql("select name, first_name, last_name, email, cell_no, enabled from tabProfile where name like '%s%%'" % self.doc.beginning_with)
      
      m = 0
      for p in pl:
        d = addchild(self.doc, 'profiles', 'User Setting-Profile', 1, self.doclist)
        d.idx, m =m, m+1
        d.profile_id = p[0]
        d.first_name = p[1] or ''
        d.last_name = p[2] or ''
        d.email = p[3] or ''
        d.phone = p[4] or ''
        d.enabled = [5] or 0
    else :
      msgprint("Please enter 'Beginning with'")
  
  # -----------------------
  # if change in value
  # -----------------------
  def update_profiles(self):
    for d in getlist(self.doclist, 'profiles'):
      if d.changed == 1:
        sql("update `tabProfile` set enabled = '%s', first_name = '%s', last_name = '%s', email = '%s', cell_no = '%s' where name = '%s'" % (d.enabled, d.first_name, d.last_name, d.email, d.phone, d.profile_id))
  
  
  #--------------------------------------  User Setting-Role Users --------------------------------------------------
  
  # ---------------------------------------
  # get users for a particular role
  # ---------------------------------------
  def get_role_users(self):
    self.doc.clear_table(self.doclist, 'role_users')
    
    if self.doc.select_role:
      ur = sql("select distinct t1.name from `tabProfile` t1, `tabUserRole` t2 where t2.role = '%s' and t2.parent = t1.name" % self.doc.select_role)
      
      l = 0
      for x in ur:
        c = addchild(self.doc, 'role_users', 'User Setting-Role User', 1, self.doclist)
        c.idx, l = l, l+1
        c.profile_id = x[0]
      
    else :
      msgprint("Please select Role")
  
  # ----------------------
  # update role users
  # ----------------------
  def update_role_users(self):
    if self.doc.select_role:
      for d in getlist(self.doclist, 'role_users'):
        
        if d.changed == 1:  
          sql("delete from `tabUserRole` where role = '%s' and `tabUserRole`.parent = '%s'" % (self.doc.select_role, d.profile_id))
      
      self.get_role_users()
    else:
      msgprint("Please select Role")
  
  # ------------------------
  # add role to profile
  # ------------------------
  def add_role_to_profile(self):
    if self.doc.select_profile and self.doc.select_role:
      is_exist = ''
      
      for d in getlist(self.doclist, 'role_users'):
        if d.profile_id == self.doc.select_profile:
          is_exist = 'true'
      
      if is_exist != 'true':
        c = addchild(self.doc, 'role_users', 'User Setting-Role User', 1, self.doclist)
        c.profile_id = self.doc.select_profile
        
        # add to role
        r1 = Document('UserRole')
        r1.role = self.doc.select_role
        r1.parent = c.profile_id
        r1.parenttype = 'Profile'
        r1.parentfield = 'userroles'
        r1.save(1)
      else :
        msgprint(cstr(self.doc.select_profile) + " already contain role " + cstr(self.doc.select_role))
    else :
      if not self.doc.select_profile:
        msgprint("Please select Profile to which you want to add new role")
      elif not self.doc.select_role:
        msgprint("Please select Role to which you want to assign")
  
  
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
            
            sql("Update `tabDocPerm` set `read` ='%s', `write`='%s', `create`='%s', `submit`='%s', `cancel`='%s', `amend`='%s', `match`='%s' where role = '%s' and `parent` = '%s' and permlevel = '%s'" % (d.read, d.write, d.create, d.submit, d.cancel, d.amend, (d.match or ''), self.doc.select_permission_role, d.doc_type, cint(d.level)))
    
      self.get_doctypes()
      
    else :
      msgprint("Please select role to which following permissions need to be assigned.")
  
  # --------------------------
  # add role permission
  # --------------------------
  def add_role_permission(self):
    if self.doc.select_doctype and (self.doc.for_level) and self.doc.select_permission_role:
      
      # --------check if permission already exist for specified permission level---------
      is_present = ''
      for d in getlist(self.doclist, 'role_permissions'):
        if d.doc_type == self.doc.select_doctype and cint(d.level) == cint(self.doc.for_level) :
          is_present = 'true'
      
      if is_present != 'true':
        c = addchild(self.doc, 'role_permissions', 'User Setting-Role Permission', 1, self.doclist)
        c.doc_type = self.doc.select_doctype
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
        msgprint("This role already has permission at permission level "+ cstr(cint(self.doc.for_level)) + " for doctype " + cstr(self.doc.select_doctype))
    else :
      if not self.doc.select_permission_role:
        msgprint("Please select a role first")
      elif not self.doc.select_doctype:
        msgprint("Please select doctype name level for which you want to add permission")
      elif not(self.doc.for_level) or cint(self.doc.for_level) <=0 :
        msgprint("Please enter permission level for which you want to add permission")