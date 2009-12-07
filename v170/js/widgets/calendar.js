// TO DO LIST

function ToDoList(parent) {
	this.col_widths = ['5%','5%','5%','55%','15%','15%'];

	this.body = $a(parent, 'div', 'todo_page');

	this.min_rows = 40;
	this.click_string = '<B>[Click to add]</B>';
	this.docs = {};
	
	this.make_head();
	this.make_body();
	this.make_inputs();
}

ToDoList.prototype.make_head = function() {
	this.head = $a(this.body, 'div', 'todo_head');
	this.title = $a(this.head, 'div', 'standard_title',{marginTop:'8px'});
	this.title.innerHTML = 'To Do';

	var link_area = $a(this.head, 'div', 'todo_links');

	var me = this;
	var c = $a(link_area, 'div', 'link_type');
	c.style.fontSize = '10px';
	c.innerHTML = 'Clear checked items'
	c.onclick = function() { me.clear_checked(); }
	
	var c = $a(link_area, 'div', 'link_type');
	c.style.fontSize = '10px';
	c.innerHTML = 'Refresh'
	c.onclick = function() { me.organize_by_priority(); }	
}

ToDoList.prototype.make_body = function() {

	this.table = $a(this.body, 'table', 'todo_items_table');
	
	for(var r=0; r<this.min_rows; r++) {
		var row = this.table.insertRow(r);
		for(var c=0; c<this.col_widths.length; c++) {
			var ce = row.insertCell(row.cells.length);
			if(c==1)
				ce.style.borderRight = '1px solid #88F';
			if(c==3)
				this.make_item_cell(ce);
			$w(ce, this.col_widths[c]);
		}
	}
}

ToDoList.prototype.sync = function(row) {
	var me = this;
	this.working = true;
	
	set_value('ToDo Item',row.docname,'description',row.cells[3].div1.innerHTML);
	set_value('ToDo Item',row.docname,'priority',row.cells[4].innerHTML);
	set_value('ToDo Item',row.docname,'date',dateutil.str_to_user(row.cells[5].innerHTML));

	if(row.cells[1].className == 'todo_checked')
		set_value('ToDo Item',row.docname,'checked',1);

	savedoc('ToDo Item', row.docname, 'Save', function(docname) { me.working = false; });
}

ToDoList.prototype.make_inputs = function() {
	var me = this;

	this.input = document.createElement('input');
	this.input.className = 'todo_input';
	this.input.onblur = function() {
		var pn = this.parentNode;
		if(!this.row.activated) {
			if(!this.value) {
				pn.removeChild(this);
				me.organize_by_priority();
				return;
			}
			me.activate_row(this.row);
		}
		if(pn)pn.removeChild(this);
		pn.innerHTML = this.value;
		me.sync(this.row);
		me.organize_by_priority();
		this.value = '';
	}
	
	this.pselect = document.createElement('select');
	this.pselect.className = 'todo_input';
	add_sel_options(this.pselect, ['Normal','Medium','High'], 'Normal');
	this.pselect.onblur = function() {		
		var pn = this.parentNode;
		pn.removeChild(this);
		pn.innerHTML = sel_val(this);
		me.sync(this.row);
		me.organize_by_priority();
	}
}

ToDoList.prototype.make_item_cell = function(ce) {
	var me = this;
	ce.div1 = $a(ce, 'div');
	ce.div2 = $a(ce, 'div');
	$dh(ce.div2);
	ce.div1.onclick = function() {
		if(me.input.parentNode==this)return;
		var v = this.innerHTML;
		if(!this.parentNode.parentNode.docname)v='';
		this.innerHTML='';
		this.appendChild(me.input);
		me.input.row = this.parentNode.parentNode;
		me.input.value = v?v:'';
		me.input.cell = this.parentNode;
		me.input.focus();
	}
}

ToDoList.prototype.activate_row = function(r, docname) {
	if(r.activated)return;
	var me = this;
	r.cells[1].onclick = function() {
		if(me.working) return;
		if(this.className=='todo_checked') {
			this.className = 'todo_unchecked';
			me.sync(this.parentNode);
		} else {
			this.className = 'todo_checked';
			me.sync(this.parentNode);
		}
	}
	if(!r.cells[1].className)r.cells[1].className = 'todo_unchecked';
	if(!r.cells[4].innerHTML)r.cells[4].innerHTML = 'Normal';
	
	var img = $a(r.cells[2],'img');
	img.src = 'images/icons/arrow_right.gif';
	img.setAttribute('title', 'Edit');
	
	r.cells[2].style.cursor = 'pointer';
	r.cells[2].onclick = function() {
		loaddoc('ToDo Item', this.parentNode.docname);
	}
	
	r.cells[4].onclick = function() {
		if(me.working) return;	
		if(me.pselect.parentNode==this)return;
		var v = this.innerHTML;
		this.innerHTML = '';
		this.appendChild(me.pselect);
		me.pselect.value = v?v:'';
		me.pselect.row = this.parentNode;
		me.pselect.focus();
	}
	
	r.cells[5].innerHTML = dateutil.obj_to_user(new Date());
	
	if(!docname)
		docname = LocalDB.create('ToDo Item');
	else {
		var doc = locals['ToDo Item'][docname];
		r.cells[3].div1.innerHTML = doc.description;
		r.cells[4].innerHTML = doc.priority;
		r.cells[5].innerHTML = dateutil.str_to_user(doc.date);
		if(doc.checked)r.cells[1].className = 'todo_checked';
		if(doc.reference_type && doc.reference_name) {
			new DocLink(r.cells[3],doc.reference_type,doc.reference_name);
			$ds(r.cells[3].div2);
		}
	}


	r.docname = docname;
	this.docs[docname] = r;
	r.activated = true;
}

ToDoList.prototype.clear = function() {
	for(var r=0; r<this.min_rows; r++) {
		var row = this.table.rows[r];
		row.cells[1].className = '';
		for(var c=0; c<this.col_widths.length; c++) {
			if(c==3) {
				row.cells[c].div1.innerHTML = '';
				row.cells[c].div2.innerHTML = '';
			} else {
				row.cells[c].innerHTML = '';
			}
			row.docname = null;
			row.activated = false;
		}
	}
	this.docs = {};
}

ToDoList.prototype.clear_checked = function() {
	var cl = [];
	for(var i=0;i<this.table.rows.length;i++) {
		if(this.table.rows[i].cells[1].className == 'todo_checked'){
			cl[cl.length] = this.table.rows[i].docname;
		};
	}
	
	var me = this;
	$c('todo_clear_checked', args = { 'cl':cl.join('\1') },
		function(r, rt) {
			for(var i=0;i<cl.length;i++) {
				locals['ToDo Item'][cl[i]] = null;
				me.docs[cl[i]] = null;
			}
			me.organize_by_priority();
		}
	);

}

ToDoList.prototype.organize_by_priority = function() {
	this.clear();
	
	var il = [];
	var values = {'High':1, 'Medium':2, 'Low':3, 'Normal':3}
	for(var i in locals['ToDo Item']) {
		var d = locals['ToDo Item'][i];
		if(d && !d.__deleted)
			il[il.length] = d;
	}
	il = il.sort( function(b,a) { 
			var pa = values[a.priority];
			var pb = values[b.priority]
			if(pb?pb:3 == pa?pa:3) {
				if(a.date && b.date)
					return dateutil.str_to_obj(b.date) - dateutil.str_to_obj(a.date);
				else
					return 0;
			} else {
				return values[b.priority] - values[a.priority];
			} 
		} 
	)
	var max_il=il.length;
	if(il.length>=40)max_il=40;
	for(var i=0;i<max_il;i++) {
		this.activate_row(this.table.rows[i], il[i].name);
	}
	if(this.table.rows[il.length])
		this.table.rows[il.length].cells[3].div1.innerHTML = this.click_string;
	
	if($i('today_todo_td'))
		$i('today_todo_td').innerHTML = 'To Do Items (' + il.length + ')';
}


///// CALENDAR

Calendar=function() {
	this.views=[];
	this.events = {};
	this.has_event = {};
	this.weekdays = new Array("Sun","Mon","Tue","Wed","Thu","Fri","Sat");
}

Calendar.prototype.init=function (parent) {
 	var tmp = $a(parent, 'div', 'standard_title');
	tmp.innerHTML = 'Calendar';
	tmp.style.margin = '8px 0px 0px 16px';

	this.wrapper = $a(parent, 'div', 'cal_wrapper');
 	this.body = $a(this.wrapper, 'div', 'cal_body');

 	this.createheader();
 	
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
}

Calendar.prototype.make_btn = function(text, w, onclick, left) {
	var me = this;
	var b = $a(this.body, 'div', 'cal_button');
	b.style.top = '90%';
	if(left)b.style.left = left + 'px';
	if(w)$w(b, w + 'px');
	b.innerHTML = text;
	b.onclick = function(){
		onclick();
		if(isIE) { $dh(calendar.wrapper); setTimeout('$ds(calendar.wrapper);',100); } 
	}
	b.onmouseover = function() { this.className = 'cal_button cal_button_hover'; }
	b.onmouseout = function() { this.className = 'cal_button'; }
	return b;
}

Calendar.prototype.createheader = function() {
	var me = this;

	this.make_btn('&larr;', 40, function() { me.cur_view.prev(); }, 20 );
 	this.make_btn('Month', 60, function() { me.refresh('Month'); }, 60);
	this.make_btn('Week', 60, function() { me.refresh('Week'); }, 120);
 	this.make_btn('Day', 60, function() { me.refresh('Day'); }, 180);
	this.make_btn('&rarr;', 40, function() { me.cur_view.next(); }, 240 );
	var evb = this.make_btn('+ Add Event', 80, function() { me.add_event(); } );
	evb.style.right = '5%';

}

Calendar.prototype.add_event = function() {
	var tx = prompt('New Event:', '');
	
	if(!tx)return;
	
	var ev = LocalDB.create('Event');
	ev = locals['Event'][ev];
	
	ev.description = tx;
	ev.event_date = dateutil.obj_to_str(this.selected_date);
	ev.event_hour = this.selected_hour+':00';
	ev.event_type = 'Private';
	
	var cal_ev = this.set_event(ev);
	cal_ev.save();
	if(this.cur_view)this.cur_view.refresh();
}

Calendar.prototype.get_month_events = function(call_back) {
	// ret fn
	var me = this;
	var f = function() {
		var el = me.get_daily_event_list(new Date());
		if($i('today_events_td'))
			$i('today_events_td').innerHTML = "Today's Events ("+el.length+")";
		if(me.cur_view) me.cur_view.refresh();
		if(call_back)call_back();
	}

	//load
	var y=this.selected_date.getFullYear(); var m = this.selected_date.getMonth();
	if(!this.events[y] || !this.events[y][m]) {
		$c('load_month_events', args = {
			'month': m + 1, 
			'year' : y},
			f);	
	}r
}

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
	
	var cal_ev = new Calendar.CalEvent(ev);
	l[l.length] = cal_ev;
	
	this.has_event[ev.name] = true;
	
	return cal_ev;
}

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
}

//.......................................................................

Calendar.CalEvent= function(doc) {
	this.body = document.createElement('div');
	var v = locals['Event'][doc.name].description;
	if(v==null)v='';
	this.body.innerHTML = v;

	this.docname = doc.name;
	var me = this;

	//this.body.onmouseover = function() {this.className = me.my_class + ' cal_event_hover';}
	//this.body.onmouseout = function() {this.className = me.my_class;}
	this.body.onclick = function() {
		if(me.docname) {
			loaddoc('Event', me.docname);
		}
	}
}

Calendar.CalEvent.prototype.show = function(vu) {

	var t = locals['Event'][this.docname].event_type;
	this.my_class = 'cal_event cal_event_'+ t;
	
	if(this.body.parentNode)
		this.body.parentNode.removeChild(this.body);
	vu.body.appendChild(this.body);
	
	// refresh
	var v = locals['Event'][this.docname].description;
	if(v==null)v='';
	this.body.innerHTML = v;
	this.body.className = this.my_class;
}

Calendar.CalEvent.prototype.save = function() {
	var me = this;
	savedoc('Event', me.docname, 'Save', function(dn) { 
		me.docname = dn; 
		calendar.has_event[dn] = true;
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
	if(isIE)calendar.cur_view.refresh_units_main();
	else setTimeout('calendar.cur_view.refresh_units_main()', 2); /* FF BUG */ 
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

	var hw = $a(this.body, 'div', 'cal_month_head');

	this.month_name= $a(hw, 'div', 'cal_month_name');

	// create headers
	this.headtable = $a(hw, 'table', 'cal_month_headtable');
	var r = this.headtable.insertRow(0);
	for(var j=0;j<7;j++) {
 		var cell = r.insertCell(j);
		cell.innerHTML = calendar.weekdays[j]; $w(cell, (100 / 7) + '%');
 	}

	var bw = $a(this.body, 'div', 'cal_month_body');
	this.table = $a(bw, 'table', 'cal_month_table');
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

	this.month_name.innerHTML = month_list_full[cur_month] + ' ' + cur_year;

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
	// create head
	this.head = $a(this.body, 'div', 'cal_month_head');
	
	this.month_name= $a(this.head, 'div', 'cal_month_name');

	// create body
	var bw = $a(this.body, 'div', 'cal_day_body');
	this.table = $a(bw, 'table', 'cal_day_table');
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

	this.month_name.innerHTML = calendar.weekdays[c.getDay()] + ', ' + c.getDate() + ' ' + month_list_full[c.getMonth()] + ' ' + c.getFullYear();

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
	var hw = $a(this.body, 'div', 'cal_month_head');

	this.month_name= $a(hw, 'div', 'cal_month_name');

	// day headers
	this.headtable = $a(hw, 'table', 'cal_month_headtable');
	var r = this.headtable.insertRow(0);
	for(var j=0;j<8;j++) {
 		var cell = r.insertCell(j);
		$w(cell, (100 / 8) + '%');
 	}
 	
 	// hour header

	// create body
	var bw = $a(this.body, 'div', 'cal_week_body');
	this.table = $a(bw, 'table', 'cal_week_table');
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

	this.month_name.innerHTML = month_list_full[c.getMonth()] + ' ' + c.getFullYear();

	// headers
	var d = new Date(c.getFullYear(), c.getMonth(), c.getDate() - c.getDay());

	for (var k=1;k<8;k++) 	{
		this.headtable.rows[0].cells[k].innerHTML = calendar.weekdays[d.getDay()] + ' ' + d.getDate();

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

//........................................................................

Calendar.ViewUnit = function() {}
Calendar.ViewUnit.prototype.init = function(parent) {
	parent.style.border = "1px solid #CCC"	;
	this.body = $a(parent, 'div', this.default_class);
	this.parent = parent;

	var me = this;
	this.body.onclick = function() {
		calendar.selected_date = me.day;
		calendar.selected_hour = me.hour;
	
		if(calendar.cur_vu && calendar.cur_vu!=me){
			calendar.cur_vu.deselect();
			me.select();
			calendar.cur_vu = me;
		}
	}
	this.body.ondblclick = function() {
		calendar.add_event();
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
	return (same_day(this.day, calendar.selected_date)&&this.hour==calendar.selected_hour)
}

Calendar.ViewUnit.prototype.get_event_list = function() {
	var y = this.day.getFullYear();
	var m = this.day.getMonth();
	var d = this.day.getDate();
	if(calendar.events[y] && calendar.events[y][m] &&
		calendar.events[y][m][d] &&
			calendar.events[y][m][d][this.hour]) {
		return calendar.events[y][m][d][this.hour];
	} else
		return [];
}

Calendar.ViewUnit.prototype.refresh = function() {
	this.clear();

	if(this.is_selected()) { 
		if(calendar.cur_vu)calendar.cur_vu.deselect();
		this.selected = true;
		calendar.cur_vu = this;	
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
	return same_day(this.day, calendar.selected_date)
}

Calendar.MonthViewUnit.prototype.get_event_list = function() {
	return calendar.get_daily_event_list(this.day);
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
