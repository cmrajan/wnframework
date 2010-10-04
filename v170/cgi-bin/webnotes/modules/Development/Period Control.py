class DocType:
  def __init__(self,d,dl):
    self.doc, self.doclist = d, dl

  # Generate Periods
  #------------------		
  def generate_periods(self, fy):    
    if not sql("select name from `tabPeriod` where fiscal_year = '%s'" % fy):
      #Starting and ending year
      self.year_starts = fy and fy.split('-')[0] or ''
      self.year_ends = fy and fy.split('-')[1] or ''      
      self.period_list = []

      self.make_year(fy)
      self.make_halfyear(fy)
      self.make_quarter(fy)
      self.make_month(fy)
      
      self.make_periods()


  def make_year(self, fy):
    d = {}
    d['period_name'] = cstr(fy)
    d['start_date'] = cstr(self.year_starts) + '-04-01'
    d['end_date'] = cstr(self.year_ends) + '-03-31'
    d['period_type'] = 'Year'
    d['fiscal_year'] = cstr(fy)

    self.period_list.append(d)
    
  def make_one_hf(self, hf, fy):
    hf_starts = ['-04-01', '-10-01']
    hf_ends = ['-09-30','-03-31']

    y1 = self.year_starts
    y2 = self.year_ends
    if hf == 1:
      y2 = self.year_starts

    d = {}
    d['period_name'] = 'HF' + cstr(hf)+ ' ' + cstr(fy)
    d['start_date'] = cstr(y1) + hf_starts[hf-1]
    d['end_date'] = cstr(y2) + hf_ends[hf-1]
    d['period_type'] = 'Halfyear'
    d['fiscal_year'] = cstr(fy)
    
    self.period_list.append(d)


  def make_one_q(self, q, fy):
    q_starts = ['-04-01','-07-01','-10-01','-01-01']
    q_ends = ['-06-30', '-09-30', '-12-31', '-03-31']

    y = self.year_starts
    if q == 4:
      y = self.year_ends

    d = {}
    d['period_name'] = 'Q' + cstr(q)+ ' ' + cstr(fy)
    d['start_date'] = cstr(y) + q_starts[q-1]
    d['end_date'] = cstr(y) + q_ends[q-1]
    d['period_type'] = 'Quarter'
    d['fiscal_year'] = cstr(fy)

    self.period_list.append(d)

  def make_one_m(self, m, fy):
    months = (
      ('Jan','-01-31'),
      ('Feb','-02-28'),
      ('Mar','-03-31'),
      ('Apr','-04-30'),
      ('May','-05-31'),
      ('Jun','-06-30'),
      ('Jul','-07-31'),
      ('Aug','-08-31'),
      ('Sep','-09-30'),
      ('Oct','-10-30'),
      ('Nov','-11-30'),
      ('Dec','-12-31')
    )

    y = cstr(self.year_starts)
    if m ==1 or m==2 or m==3:
      y = cstr(self.year_ends)

    d = {}
    d['period_name'] = months[m-1][0]+ ' ' + y
    d['start_date'] = y + '-' + ('%.2i' % m) + '-01'
    d['end_date'] = y + months[m-1][1]
    if not (cint(y) % 4) and m==2 and ((cint(y) % 100)!= 0 or (cint(y)%400) == 0): # leap year
      d['end_date'] = cstr(y) + '-02-29'
    d['period_type'] = 'Month'
    d['fiscal_year'] = cstr(fy)
    
    self.period_list.append(d)
    
  def make_halfyear(self, fy):
    for hf in range(1,3):
      self.make_one_hf(hf, fy)
	
  def make_quarter(self, fy):
    for q in range(1,5):
      self.make_one_q(q, fy)
	
  def make_month(self, fy):
    for m in range(1,13):
      self.make_one_m(m, fy)
	
  def make_periods(self):
    for d in self.period_list:
      p = Document('Period')
      p.period_name = d['period_name']
      p.start_date = cstr(d['start_date'])
      p.end_date = cstr(d['end_date'])
      p.period_type = d['period_type']
      p.fiscal_year = d['fiscal_year']
      p.save(1)
		
  def get_period_list(self, dt):
    pl = sql('SELECT name FROM tabPeriod WHERE start_date <="%s" AND end_date >="%s"' % (dt,dt))
    pl = [p[0] for p in pl]
    return pl