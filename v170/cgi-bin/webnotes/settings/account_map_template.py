# Account/Domain Name to Database Mapping file
# --------------------------------------------
# last updated on: 2011-02-02 14:31:14

default_db_name = "erpnext"

db_name_map = {'erpnext':'erpnext'}
#{'main_acc_name';'db_name'}

# without www
domain_name_map = {'':''}
#domain {'domain':'db_name'}

#deleted status
deleted_map = {'':''}
#deleted {'ac_name':0/1}


#last backup time
last_backup_map = {'':''}
#last_backup {'ac_name':'last_backup_utctime_int'}


#allocated status
allocated_list = []
#alloc_list = [allocated dbs]

#trial_or_paid status
trial_or_paid_map = {'':''}
#trial_or_paid_map {'ac_name': trial/paid}

#expiry_date_status
expiry_date_map = {'':''}
#expiry_date_map {'ac_name':'expiry_date'}

#timezone map
time_zone_map = {'':''}
#time_zone_map {'ac_name':'time_zone'}
