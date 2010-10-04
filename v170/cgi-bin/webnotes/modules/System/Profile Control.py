class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d,dl
    self.last_profile = None
  
  # Sync Profile with Gateway
  # -------------------------
  def sync_with_gateway(self,pid):
    p = Document('Profile',pid)

    # login to gateway
    fw = FrameworkServer('old.iwebnotes.com','/','__system@webnotestech.com','password','', https=1)

    account_id = sql("select value from tabSingles where doctype='Control Panel' and field='account_id'")[0][0]
    
    # call add profile
    ret = fw.runserverobj('Profile Control','Profile Control','add_profile_gateway',str([p.first_name, p.middle_name, p.last_name, p.email, p.name, account_id]))
    
    if ret.get('exc'):
      msgprint(ret['exc'])
      raise Exception
  
  # Check if password is expired
  # --------------------------------
  def has_pwd_expired(self):
    if session['user'] != 'Administrator' and session['user'].lower() != 'demo':
      last_pwd_date = None
      try:
        last_pwd_date = sql("select password_last_updated from tabProfile where name=%s",session['user'])[0][0] or ''
      except:
        return 'No'
      if cstr(last_pwd_date) == '':
        sql("update tabProfile set password_last_updated = '%s' where name='%s'"% (nowdate(),session['user']))
        return 'No'
      else:
        date_diff = (getdate(nowdate()) - last_pwd_date).days
        expiry_period = sql("select value from tabSingles where doctype='Control Panel' and field='password_expiry_days'")
        if expiry_period and cint(expiry_period[0][0]) and cint(expiry_period[0][0]) < date_diff:
          return 'Yes'
        return 'No'
              
  def reset_password(self,pwd):
    if sql("select name from tabProfile where password=PASSWORD(%s) and name=%s", (pwd,session['user'])):
      return 'Password cannot be same as old password'
    sql("update tabProfile set password=PASSWORD(%s),password_last_updated=%s where name = %s", (pwd,nowdate(),session['user']))
    return 'ok'
  
#-------------------------------------------------------------------------------------------------------
  #functions for manage user page
  #-----------Enable/Disable Profile-----------------------------------------------------------------------------------------------    
  def change_login(self,args):
    args = eval(args)
    if cint(args['set_disabled'])==0:
      sql("update `tabProfile` set enabled=1 where name='%s'"%args['user'])
    else:
      sql("update `tabProfile` set enabled=0 where name='%s'"%args['user'])
    return 'ok'

#------------return role list -------------------------------------------------------------------------------------------------
  # All roles of Role Master
  def get_role(self):
    r_list=sql("select name from `tabRole` where name not in ('Administrator','All')")
    if r_list[0][0]:
      r_list = [x[0] for x in r_list]
    return r_list
    
  # Only user specific role
  def get_user_role(self,usr):
    r_list=sql("select role from `tabUserRole` where parent=%s and role!='Administrator' and role!='All'",usr)
    if r_list[0][0]:
      r_list = [x[0] for x in r_list]
    else:
      r_list=[]
    return r_list
  
  # adding new role
  def add_user_role(self,args):
    arg=eval(args)
    sql("delete from `tabUserRole` where parenttype='Profile' and parent ='%s'" % (cstr(arg['user'])))
    role_list = arg['role_list'].split(',')
    for r in role_list:
      pr=Document('UserRole')
      pr.parent = arg['user']
      pr.parenttype = 'Profile'
      pr.role = r
      pr.parentfield = 'userroles'
      pr.save(1)
      

  #add new member
  def add_profile(self,arg):
    arg=eval(arg)
    pr=Document('Profile')
    for d in arg.keys():
      if d!='role':
        pr.fields[d] = arg[d]
   
    pr.enabled=0
    pr.user_type='System User'
    pr.save(1)
    pr_obj = get_obj('Profile',pr.name)
    
    #ur= Document('UserRole')
    #ur.parent=pr.name
    #ur.parenttype= 'Profile'
    #ur.role= arg['role']
    #ur.parentfield= 'userroles' 
    #ur.save(1)
    
    pr_obj.on_update()
    
    if(pr.name):
      msg="New member is added"
    else:
      msg="Profile not created"
    
    return cstr(msg)

  # to find currently login user 
  def current_login(self):
    cl_list=sql("select distinct user from tabSessions")
    if cl_list:
      cl_list=[x[0] for x in cl_list]
    
    return cl_list