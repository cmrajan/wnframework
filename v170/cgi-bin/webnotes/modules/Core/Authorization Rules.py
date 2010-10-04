class DocType:
  def __init__(self, d, dl):
    self.doc, self.doclist = d, dl

  def get_full_name(self,session_user):
    # get first name  and last name of current user
    approved_by = sql("select first_name, last_name from `tabProfile` where name = '%s'" % session_user)
    fst_nm = approved_by and approved_by[0][0] or ''
    lst_nm = approved_by and approved_by[0][1] or ''
    
    # concatenate first name and last name
    if fst_nm and lst_nm :
      approver_nm = fst_nm + " " + lst_nm
    elif fst_nm :
       approver_nm = fst_nm
    
    # return approver name
    return str(approver_nm)

  def get_approval_permissions(self,doctype,grand_total,session_user):
    flag = 0
    for d in getlist(self.doclist, 'approval_structure'):
      if d.doctype_name == doctype and flt(grand_total) >= flt(d.amount) :
        get_roles = sql("select t2.role from `tabProfile` t1, `tabUserRole` t2 where t2.parent = t1.name and t1.name = '%s' " % session_user)
        r_list = [x[0] for x in get_roles]
        if (d.approving_authority in r_list) :
          flag = 1
          break
        else :
          flag = 2
          
    if flag == 2:
      msgprint("You do not have an authority to Submit this document. Please contact your Admin.")
      raise Exception
    elif flag == 1:
      return self.get_full_name(session_user)
    else:
      # If No Authorization Rule then return Approved by as ""
      return ''