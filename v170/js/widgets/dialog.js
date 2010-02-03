//
// Dialog
//

var cur_dialog;
var top_index=91;

function Dialog(w, h, title, content) {
	this.wrapper = $a('dialogs', 'div', 'dialog_wrapper');
	this.w = w;
	this.h = h;

	if(!$.browser.msie)$(this.wrapper).corner();

	$w(this.wrapper,w + 'px');
	//$h(this.wrapper,h + 'px');
	
	this.head = $a(this.wrapper, 'div', 'dialog_head');
	$(this.head).corner('tr tl 5px');

	this.body = $a(this.wrapper, 'div', 'dialog_body');
	
	this.make_head(title);
	if(content)this.make_body(content);

	this.onshow = '';
	this.oncancel = '';
	this.no_cancel_flag = 0; // allow to cancel
	this.display = false;
	var me = this;
}

Dialog.prototype.make_head = function(title) {
	var t = make_table(this.head,1,2,'100%',['100%','16px'],{padding:'2px'});
	
	//$y(t,{borderBottom:'1px solid #DDD'});
	$y($td(t,0,0),{paddingLeft:'16px',fontWeight:'bold',fontSize:'14px',textAlign:'center'});
	$y($td(t,0,1),{textAlign:'right'});	

	var img = $a($td(t,0,01),'img','',{cursor:'pointer'});
	img.src='images/icons/close.gif';
	this.title_text = $td(t,0,0);
	if(!title)title='';
	this.title_text.innerHTML = title;

	var me = this;
	img.onclick = function() {
		if(me.oncancel)me.oncancel();
		me.hide();
	}
	this.cancel_img = img;
}

Dialog.prototype.no_cancel = function() {
	$dh(this.cancel_img);
	this.no_cancel_flag = 1;	
}

Dialog.prototype.show = function() {
	freeze();
	var d = get_screen_dims();
	
	this.wrapper.style.left  = ((d.w - this.w)/2) + 'px';
	this.wrapper.style.top = (get_scroll_top() + ((d.h - this.h)/2)) + 'px';

	top_index++;
	$y(this.wrapper,{zIndex:top_index});

	$ds(this.wrapper);
	//this.my_border.render(this.wrapper);

	this.display = true;
	cur_dialog = this;

	if(this.onshow)this.onshow();	
}

Dialog.prototype.hide = function() {
	var me = this;
	unfreeze();
	if(this.onhide)this.onhide();
	$dh(this.wrapper);
	
	if(cur_autosug) cur_autosug.clearSuggestions();
	
	this.display = false;
	cur_dialog = null;
}

Dialog.prototype.set_title = function(title) { if(!title)title=''; this.title_text.innerHTML = title.bold(); }

Dialog.prototype.make_body = function(content) {
	this.rows = {}; this.widgets = {};
	for(var i in content) this.make_row(content[i]);
}

Dialog.prototype.make_row = function(d) {
	var me = this;
	
	this.rows[d[1]] = $a(this.body, 'div', 'dialog_row');
	var row = this.rows[d[1]];

	if(d[0]!='HTML') {
		var t = make_table(row,1,2,'100%',['30%','70%']);
		row.tab = t;
		var c1 = $td(t,0,0);
		var c2 = $td(t,0,1);
		if(d[0]!='Check' && d[0]!='Button')
			$t(c1, d[1]);
	}
	
	if(d[0]=='HTML') {
		if(d[2])row.innerHTML = d[2];
		this.widgets[d[1]]=row;
	} 
	else if(d[0]=='Check') {
		var i = $a_input(c2, 'checkbox','',{width:'20px'});
		c1.innerHTML = d[1];
		this.widgets[d[1]] = i;
	} 
	else if(d[0]=='Data') {
		c1.innerHTML = d[1];
		c2.style.overflow = 'auto';
		this.widgets[d[1]] = $a(c2, 'input');
		if(d[2])$a(c2, 'div', 'comment').innerHTML = d[2];
	} 
	else if(d[0]=='Password') {
		c1.innerHTML = d[1];
		c2.style.overflow = 'auto';
		this.widgets[d[1]] = $a_input(c2, 'password');
		if(d[3])$a(c2, 'div', 'comment').innerHTML = d[3];
		
	} 
	else if(d[0]=='Select') {
		c1.innerHTML = d[1];
		this.widgets[d[1]] = new SelectWidget(c2, [], '200px');
		if(d[2])$a(c2, 'div', 'comment').innerHTML = d[2];
	} 
	else if(d[0]=='Text') {
		c1.innerHTML = d[1];
		c2.style.overflow = 'auto';
		this.widgets[d[1]] = $a(c2, 'textarea');		
		if(d[2])$a(c2, 'div', 'comment').innerHTML = d[2];
	} 
	else if(d[0]=='Button') {
		c2.style.height = '32px';
		c2.style.textAlign = 'right';
		var b = $a(c2, 'button');
		b.innerHTML = d[1];
		b.dialog = me;
		if(d[2]){
			b._onclick = d[2];
			b.onclick = function() { this._onclick(me); }
		}
		this.widgets[d[1]] = b;
	}
}

// Close dialog on Escape
keypress_observers.push(new function() {
	this.notify_keypress = function(e, kc) {
		if(cur_dialog && kc==27 && !cur_dialog.no_cancel_flag) 
			cur_dialog.hide();
	}
});
