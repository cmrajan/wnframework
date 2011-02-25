///// CALENDAR

Calendar=function() {
	this.views=[];
	this.events = {};
	this.has_event = {};
	this.weekdays = new Array("Sun","Mon","Tue","Wed","Thu","Fri","Sat");
}

Calendar.prototype.init=function (parent) {

	this.wrapper = $a(parent, 'div', 'cal_wrapper');
	this.page_head = new PageHeader(this.wrapper,'Calendar')
 	this.body = $a(this.wrapper, 'div', 'cal_body');

 	this.make_head_buttons();
 	this.make_header();
 	
	this.todays_date = new Date();
	this.selected_date = this.todays_date;
	this.selected_hour = 8;

	// Create views
	this.views['Month'] = new Calendar.MonthView(this);
	this.views['Week'] = new Calendar.WeekView(this);
	this.views['Day'] = new Calendar.DayView(this);

	// Month view as initial
	this.cur_view = this.views['Day'];
	this.views['Day'].show();

 	setTimeout(_c.set_height, 100);
 	set_resize_observer(_c.set_height);	
}

Calendar.prototype.rename_notify = function(dt, old_name, new_name) {
	// calendar
	if(dt = 'Event' && this.has_event[old_name])
		this.has_event[old_name] = false;	
}

_c.set_height = function() {
	// calculate heights
	var cal_body_h = get_window_height() - _c.calendar.page_head.wrapper.offsetHeight - 32;
	var cal_view_body_h = cal_body_h - _c.calendar.view_header.offsetHeight - 32;
	var header_h = _c.calendar.cur_view.head_wrapper ? _c.calendar.cur_view.head_wrapper.offsetHeight : 0;
	var cal_view_main_h = cal_view_body_h - header_h;
	
	// set heights
	$y(_c.calendar.body, {height:cal_body_h + 'px'})
	$y(_c.calendar.cur_view.body, {height:cal_view_body_h + 'px'})
	$y(_c.calendar.cur_view.main, {height:cal_view_main_h + 'px', overflow:'auto'})
}

//------------------------------------------------------

Calendar.prototype.make_header = function() {
	var me = this;
	
	this.view_header = $a(this.body, 'div', 'cal_month_head', {paddingTop:'8px'});
	var tab = make_table(this.view_header, 1, 3, '50%', ['100px', null, '100px'], {verticalAlign:'middle'});
	$y(tab, {margin:'auto'});
	
	var lbtn = $btn($td(tab, 0, 0),'&lt; Prev', function() { me.cur_view.prev() });
	var rbtn = $btn($td(tab, 0, 2),'Next &gt;', function() { me.cur_view.next() });
	
	$y($td(tab, 0, 1), {fontSize:'16px', textAlign:'center'})
	this.view_title = $td(tab, 0, 1);

}
//------------------------------------------------------

Calendar.prototype.make_head_buttons = function() {
	var me = this;

	this.page_head.add_button('New Event', function() { me.add_event(); }, 0, 'ui-icon-plus', 1);
 	this.page_head.add_button('Month View', function() { me.refresh('Month'); }, 0, 'ui-icon-calculator');
	this.page_head.add_button('Weekly View',function() { me.refresh('Week'); }, 0, 'ui-icon-note');
 	this.page_head.add_button('Daily View', function() { me.refresh('Day'); }, 0, 'ui-icon-calendar');

}
//------------------------------------------------------

Calendar.prototype.show_event = function(ev, cal_ev) {
	var me = this;
	if(!this.event_dialog) {
		var d = new Dialog(400, 400, 'Calendar Event');
		d.make_body([
			['HTML','Heading']
			,['Text','Description']
			,['Check', 'Public Event']
			,['Check', 'Cancel Event']
			,['HTML', 'Event Link']
			,['Button', 'Save']
		])
		
		// show the event when the dialog opens
		d.onshow = function() {
			// heading
			var c = me.selected_date;
			var tmp = time_to_ampm(this.ev.event_hour);
			tmp = tmp[0]+':'+tmp[1]+' '+tmp[2];
			
			this.widgets['Heading'].innerHTML = 
				'<div style="text-align: center; padding:4px; font-size: 14px">'
				+ _c.calendar.weekdays[c.getDay()] + ', ' + c.getDate() + ' ' + month_list_full[c.getMonth()] + ' ' + c.getFullYear() 
				+ ' - <b>'+tmp+'</b></div>';
			
			// set
			this.widgets['Description'].value = cstr(this.ev.description);
			
			this.widgets['Public Event'].checked = false;
			this.widgets['Cancel Event'].checked = false;

			if(this.ev.event_type=='Public')
				this.widgets['Public Event'].checked = true;
			
			this.widgets['Event Link'].innerHTML = '';

			// link
			var div = $a(this.widgets['Event Link'], 'div', 'link_type', {margin:'4px 0px'});
			div.onclick = function() { me.event_dialog.hide(); loaddoc('Event', me.event_dialog.ev.name); }
			div.innerHTML = 'View Event details, add or edit participants';
				
		}
		
		// event save
		d.widgets['Save'].onclick = function() {
			var d = me.event_dialog;
			
			// save values
			d.ev.description = d.widgets['Description'].value;
			if(d.widgets['Cancel Event'].checked) d.ev.event_type='Cancel';
			else if(d.widgets['Public Event'].checked) d.ev.event_type='Public';
			
			me.event_dialog.hide();
			
			// if new event
			if(d.cal_ev)
				var cal_ev = d.cal_ev;
			else 
				var cal_ev = me.set_event(d.ev);

			cal_ev.save();
			if(me.cur_view)me.cur_view.refresh();			
		}
		this.event_dialog = d;
	}
	this.event_dialog.ev = ev;
	this.event_dialog.cal_ev = cal_ev ? cal_ev : null;
	this.event_dialog.show();
	
}

//------------------------------------------------------

Calendar.prototype.add_event = function() {
		
	var ev = LocalDB.create('Event');
	ev = locals['Event'][ev];
	
	ev.event_date = dateutil.obj_to_str(this.selected_date);
	ev.event_hour = this.selected_hour+':00';
	ev.event_type = 'Private';

	this.show_event(ev);
}
//------------------------------------------------------

Calendar.prototype.get_month_events = function(call_back) {
	// ret fn
	var me = this;
	var f = function(r, rt) {
		var el = me.get_daily_event_list(new Date());
		if($i('today_events_td'))
			$i('today_events_td').innerHTML = "Today's Events ("+el.length+")";
		if(me.cur_view) me.cur_view.refresh();
		if(call_back)call_back();
	}

	//load
	var y=this.selected_date.getFullYear(); var m = this.selected_date.getMonth();
	if(!this.events[y] || !this.events[y][m]) {
		$c('webnotes.widgets.event.load_month_events', args = {
			'month': m + 1, 
			'year' : y},
			f);	
	}
}
//------------------------------------------------------

Calendar.prototype.get_daily_event_list=function(day) {
	var el = [];
	var d = day.getDate(); var m = day.getMonth(); var y = day.getFullYear()
	if(this.events[y] && this.events[y][m] &&
		this.events[y][m][d]) {
		var l = this.events[y][m][d]
		for(var i in l) {
			for(var j in l[i]) el[el.length] = l[i][j];
		}
		return el;
	}
	else return [];
}
//------------------------------------------------------

Calendar.prototype.set_event = function(ev) {
	var dt = dateutil.str_to_obj(ev.event_date);
	var m = dt.getMonth();
	var d = dt.getDate();
	var y = dt.getFullYear();
	
	if(!this.events[y]) this.events[y] = [];
	if(!this.events[y][m]) this.events[y][m] = [];
	if(!this.events[y][m][d]) this.events[y][m][d] = [];
	if(!this.events[y][m][d][cint(cint(ev.event_hour))]) this.events[y][m][d][cint(ev.event_hour)] = [];
	
	var l = this.events[y][m][d][cint(ev.event_hour)];
	
	var cal_ev = new Calendar.CalEvent(ev, this);
	l[l.length] = cal_ev;
	
	this.has_event[ev.name] = true;
	
	return cal_ev;
}
//------------------------------------------------------

Calendar.prototype.refresh = function(viewtype){//Sets the viewtype of the Calendar and Calls the View class based on the viewtype
 	if(viewtype)
 		this.viewtype = viewtype;
 	// switch view if reqd
 	if(this.cur_view.viewtype!=this.viewtype) {
 		this.cur_view.hide();
 		this.cur_view = this.views[this.viewtype];
 		this.cur_view.in_home = false; // for home page
 		this.cur_view.show();
 	}
 	else{
 		this.cur_view.refresh(this);
 	}
 	_c.set_height();
}

//------------------------------------------------------

Calendar.CalEvent= function(doc, cal) {
	this.body = document.createElement('div');
	var v = locals['Event'][doc.name].description;
	if(v==null)v='';
	this.body.innerHTML = v;

	this.doc = doc;
	var me = this;

	this.body.onclick = function() {
		if(me.doc.name) {
			cal.show_event(me.doc, me);
		}
	}
}

Calendar.CalEvent.prototype.show = function(vu) {

	var t = this.doc.event_type;
	this.my_class = 'cal_event cal_event_'+ t;
	
	if(this.body.parentNode)
		this.body.parentNode.removeChild(this.body);
	vu.body.appendChild(this.body);
	
	// refresh
	var v = this.doc.description;
	if(v==null)v='';
	this.body.innerHTML = v;
	this.body.className = this.my_class;
}

Calendar.CalEvent.prototype.save = function() {
	var me = this;
	save_doclist('Event', me.doc.name, 'Save', function(r) { 
		me.doc = locals['Event'][r.docname];
		_c.calendar.has_event[r.docname] = true;
	} );
}
// ----------

Calendar.View =function() { this.daystep = 0; this.monthstep = 0; }
Calendar.View.prototype.init=function(cal) {
 	this.cal = cal;
 	this.body = $a(cal.body, 'div', 'cal_view_body');
 	this.body.style.display = 'none';
 	this.create_table();
}


Calendar.View.prototype.show=function() { 
	this.get_events(); this.refresh(); this.body.style.display = 'block'; 
}

Calendar.View.prototype.hide=function() { this.body.style.display = 'none';}

Calendar.View.prototype.next = function() {
	var s = this.cal.selected_date;
	this.cal.selected_date = new Date(s.getFullYear(), s.getMonth() + this.monthstep, s.getDate() + this.daystep);
	this.get_events(); this.refresh();
}

Calendar.View.prototype.prev = function() {
	var s = this.cal.selected_date;
	this.cal.selected_date = new Date(s.getFullYear(), s.getMonth() - this.monthstep, s.getDate() - this.daystep);
	this.get_events(); this.refresh();
}

Calendar.View.prototype.get_events = function() { this.cal.get_month_events(); }
Calendar.View.prototype.add_unit = function(vu) { this.viewunits[this.viewunits.length] = vu; }
Calendar.View.prototype.refresh_units = function() { 
	if(isIE)_c.calendar.cur_view.refresh_units_main();
	else setTimeout('_c.calendar.cur_view.refresh_units_main()', 2); /* FF BUG */ 
}
Calendar.View.prototype.refresh_units_main = function() {
	for(var r in this.table.rows)
		for(var c in this.table.rows[r].cells)
			if(this.table.rows[r].cells[c].viewunit) this.table.rows[r].cells[c].viewunit.refresh();
}

// ................. Month View..........................
Calendar.MonthView = function(cal) { this.init(cal); this.monthstep = 1; this.rows = 5; this.cells = 7; }
Calendar.MonthView.prototype=new Calendar.View();
Calendar.MonthView.prototype.create_table = function() {

	// create head
	this.head_wrapper = $a(this.body, 'div', 'cal_month_head');

	// create headers
	this.headtable = $a(this.head_wrapper, 'table', 'cal_month_headtable');
	var r = this.headtable.insertRow(0);
	for(var j=0;j<7;j++) {
 		var cell = r.insertCell(j);
		cell.innerHTML = _c.calendar.weekdays[j]; $w(cell, (100 / 7) + '%');
 	}

	this.main = $a(this.body, 'div', 'cal_month_body');
	this.table = $a(this.main, 'table', 'cal_month_table');
	var me = this;

	// create body
 	for(var i=0;i<5;i++) {
 		var r = this.table.insertRow(i);
 		for(var j=0;j<7;j++) {
 			var cell = r.insertCell(j);
			cell.viewunit = new Calendar.MonthViewUnit(cell);
 		}
  	}  	
}

Calendar.MonthView.prototype.refresh = function() {
 	var c =this.cal.selected_date;
	var	me=this;
	// fill other days

	var cur_row = 0; 

 	var cur_month = c.getMonth();
 	var cur_year = c.getFullYear();

 	var d = new Date(cur_year, cur_month, 1);
	var day = 1 - d.getDay();
	

	// set day headers
 	var d = new Date(cur_year, cur_month, day);

	this.cal.view_title.innerHTML = month_list_full[cur_month] + ' ' + cur_year;

 	for(var i=0;i<6;i++) {
 		if((i<5) || cur_month==d.getMonth()) { // if this month
	 		for(var j=0;j<7;j++) {
				var cell = this.table.rows[cur_row].cells[j];

		 		if((i<5) || cur_month==d.getMonth()) {	// if this month
					cell.viewunit.day = d;
					cell.viewunit.hour = 8;
			 		if(cur_month == d.getMonth()) {
						cell.viewunit.is_disabled = false;
	
						if(same_day(this.cal.todays_date, d))
							cell.viewunit.is_today = true;
						else
							cell.viewunit.is_today = false;					
						
					} else {
						cell.viewunit.is_disabled = true;
					}
				}
				// new date
	 			day++;
		 		d = new Date(cur_year, cur_month, day);
	 		}
	 	}
		cur_row++;
 		if(cur_row == 5) {cur_row = 0;} // back to top
	}
	this.refresh_units();
	
}
 // ................. Daily View..........................
Calendar.DayView=function(cal){ this.init(cal); this.daystep = 1; }
Calendar.DayView.prototype=new Calendar.View();
Calendar.DayView.prototype.create_table = function() {

	// create body
	this.main = $a(this.body, 'div', 'cal_day_body');
	this.table = $a(this.main, 'table', 'cal_day_table');
	var me = this;
	
 	for(var i=0;i<12;i++) {
 		var r = this.table.insertRow(i);
 		for(var j=0;j<2;j++) {
 			var cell = r.insertCell(j);
			if(j==0) {
				var tmp = time_to_ampm((i*2)+':00');
				cell.innerHTML = tmp[0]+':'+tmp[1]+' '+tmp[2];
				$w(cell, '10%');
			} else {
				cell.viewunit = new Calendar.DayViewUnit(cell);
				cell.viewunit.hour = i*2;
				$w(cell, '90%');
				if((i>=4)&&(i<=10)) {
					cell.viewunit.is_daytime = true;
				}
			}
 		}
  	}
 }

Calendar.DayView.prototype.refresh = function() {
	var c =this.cal.selected_date;
			
	// fill other days
	var me=this;

	this.cal.view_title.innerHTML = _c.calendar.weekdays[c.getDay()] + ', ' + c.getDate() + ' ' + month_list_full[c.getMonth()] + ' ' + c.getFullYear();

	// headers
	var d = c;

	for(var i=0;i<12;i++) {
		var cell = this.table.rows[i].cells[1];
		if(same_day(this.cal.todays_date, d)) cell.viewunit.is_today = true;
		else cell.viewunit.is_today = false;

		cell.viewunit.day = d;
		//cell.viewunit.refresh();
	}
	 this.refresh_units();
}

// ................. Weekly View..........................
Calendar.WeekView=function(cal) { this.init(cal); this.daystep = 7; }
Calendar.WeekView.prototype=new Calendar.View();
Calendar.WeekView.prototype.create_table = function() {

	// create head
	this.head_wrapper = $a(this.body, 'div', 'cal_month_head');

	// day headers
	this.headtable = $a(this.head_wrapper, 'table', 'cal_month_headtable');
	var r = this.headtable.insertRow(0);
	for(var j=0;j<8;j++) {
 		var cell = r.insertCell(j);
		$w(cell, (100 / 8) + '%');
 	}
 	
 	// hour header

	// create body
	this.main = $a(this.body, 'div', 'cal_week_body');
	this.table = $a(this.main, 'table', 'cal_week_table');
	var me = this;
	
 	for(var i=0;i<12;i++) {
 		var r = this.table.insertRow(i);
 		for(var j=0;j<8;j++) {
 			var cell = r.insertCell(j);
			if(j==0) {
				var tmp = time_to_ampm((i*2)+':00');
				cell.innerHTML = tmp[0]+':'+tmp[1]+' '+tmp[2];

				$w(cell, '10%');
			} else {
				cell.viewunit = new Calendar.WeekViewUnit(cell);
				cell.viewunit.hour = i*2;
				if((i>=4)&&(i<=10)) {
					cell.viewunit.is_daytime = true;
				}
			}
 		}
  	}
}

Calendar.WeekView.prototype.refresh = function() {
	var c =this.cal.selected_date;
	// fill other days
	var me=this;

	this.cal.view_title.innerHTML = month_list_full[c.getMonth()] + ' ' + c.getFullYear();

	// headers
	var d = new Date(c.getFullYear(), c.getMonth(), c.getDate() - c.getDay());

	for (var k=1;k<8;k++) 	{
		this.headtable.rows[0].cells[k].innerHTML = _c.calendar.weekdays[d.getDay()] + ' ' + d.getDate();

		for(var i=0;i<12;i++) {
			var cell = this.table.rows[i].cells[k];
			if(same_day(this.cal.todays_date, d)) cell.viewunit.is_today = true;
			else cell.viewunit.is_today = false;

			cell.viewunit.day = d;
			//cell.viewunit.refresh();
		}
		d=new Date(d.getFullYear(),d.getMonth(),d.getDate() + 1);

	 }
	 
	 this.refresh_units();
}

//------------------------------------------------------.

Calendar.ViewUnit = function() {}
Calendar.ViewUnit.prototype.init = function(parent) {
	parent.style.border = "1px solid #CCC"	;
	this.body = $a(parent, 'div', this.default_class);
	this.parent = parent;

	var me = this;
	this.body.onclick = function() {
		_c.calendar.selected_date = me.day;
		_c.calendar.selected_hour = me.hour;
	
		if(_c.calendar.cur_vu && _c.calendar.cur_vu!=me){
			_c.calendar.cur_vu.deselect();
			me.select();
			_c.calendar.cur_vu = me;
		}
	}
	this.body.ondblclick = function() {
		_c.calendar.add_event();
	}
}

Calendar.ViewUnit.prototype.set_header=function(v) {
 	this.header.innerHTML = v;
}

Calendar.ViewUnit.prototype.set_today = function() {
	this.is_today = true;
	this.set_display();
}

Calendar.ViewUnit.prototype.clear = function() {
	if(this.header)this.header.innerHTML = '';

	// clear body
	while(this.body.childNodes.length)
		this.body.removeChild(this.body.childNodes[0]);
}

Calendar.ViewUnit.prototype.set_display = function() {
	var cn = '#FFF';

	// colors
	var col_tod_sel = '#EEE';
	var col_tod = '#FFF';
	var col_sel = '#EEF';

	if(this.is_today) {
		if(this.selected) cn = col_tod_sel;
		else cn = col_tod;
	} else 
		if(this.selected) cn = col_sel;
	
	if(this.header) {
		if(this.is_disabled) {
			this.body.className = this.default_class + ' cal_vu_disabled';
			this.header.style.color = '#BBB';
		} else {
			this.body.className = this.default_class;
			this.header.style.color = '#000';		
		}
		
		if(this.day&&this.day.getDay()==0)
			this.header.style.backgroundColor = '#FEE';
		else 
			this.header.style.backgroundColor = '';
	}
	this.parent.style.backgroundColor = cn;
}

Calendar.ViewUnit.prototype.is_selected = function() {
	return (same_day(this.day, _c.calendar.selected_date)&&this.hour==_c.calendar.selected_hour)
}

Calendar.ViewUnit.prototype.get_event_list = function() {
	var y = this.day.getFullYear();
	var m = this.day.getMonth();
	var d = this.day.getDate();
	if(_c.calendar.events[y] && _c.calendar.events[y][m] &&
		_c.calendar.events[y][m][d] &&
			_c.calendar.events[y][m][d][this.hour]) {
		return _c.calendar.events[y][m][d][this.hour];
	} else
		return [];
}

Calendar.ViewUnit.prototype.refresh = function() {
	this.clear();

	if(this.is_selected()) { 
		if(_c.calendar.cur_vu)_c.calendar.cur_vu.deselect();
		this.selected = true;
		_c.calendar.cur_vu = this;	
	}
	
	this.set_display();
	this.el = this.get_event_list();
	if(this.onrefresh)this.onrefresh();	

	for(var i in this.el) {
		this.el[i].show(this);
	}
		
	var me = this;
}

Calendar.ViewUnit.prototype.select=function() { this.selected = true; this.set_display(); }
Calendar.ViewUnit.prototype.deselect=function() { this.selected = false; this.set_display(); }
Calendar.ViewUnit.prototype.setevent=function() { }

Calendar.MonthViewUnit=function(parent) {
	this.header = $a(parent, 'div' , "cal_month_date");
	this.default_class = "cal_month_unit";
	
	this.init(parent);

	this.onrefresh = function() {
		this.header.innerHTML = this.day.getDate();
	} 
}
Calendar.MonthViewUnit.prototype = new Calendar.ViewUnit();
Calendar.MonthViewUnit.prototype.is_selected = function() {
	return same_day(this.day, _c.calendar.selected_date)
}

Calendar.MonthViewUnit.prototype.get_event_list = function() {
	return _c.calendar.get_daily_event_list(this.day);
}

Calendar.DayViewUnit= function(parent) { this.default_class = "cal_day_unit"; this.init(parent); }
Calendar.DayViewUnit.prototype = new Calendar.ViewUnit();
Calendar.DayViewUnit.prototype.onrefresh = function() {
	if(this.el.length<3) this.body.style.height = '30px';
	else this.body.style.height = '';
}

Calendar.WeekViewUnit=function(parent) { this.default_class = "cal_week_unit"; this.init(parent); }
Calendar.WeekViewUnit.prototype = new Calendar.ViewUnit();
Calendar.WeekViewUnit.prototype.onrefresh = function() {
	if(this.el.length<3) this.body.style.height = '30px';
	else this.body.style.height = '';
}
