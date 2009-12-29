function SelectWidget(parent, options, width, editable, bg_color) {
	var me = this;
	this.bg_color = bg_color ? bg_color : '#FFF';

	this.custom_select = 1;
	this.setup = function() {
		this.options = options;
		if(!width) width = '120px';
		
		this.wrapper = $a(parent, 'div', '', {width: (cint(width)+2) + 'px', display: 'inline'});
		
		this.body_tab = make_table(this.wrapper, 1, 2, cint(width) + 'px', [(cint(width)-18) + 'px', '18px'],{border:'1px solid #AAA'});
	
		this.inp = $a_input($td(this.body_tab, 0, 0), 'text', {'readonly':(editable ? null : 'readonly')}, {width: (cint(width)-20) + 'px', border:'0px', padding:'2px'});
		
		this.btn = $a($td(this.body_tab, 0, 1), 'img', '', {cursor:'pointer', margin:'2px'});
		this.btn.src = 'images/ui/down-arrow.gif';
		this.btn.onclick = function() {
			if(me.as && me.as.body) {
				me.as.clearSuggestions();
				return;
			}
			me.inp.focus();
			me.as.createList(me.as.aSug);
		}

		if(!editable) {
			$y(this.inp, {cursor:'pointer'});
			this.inp.onclick = this.btn.onclick;
		}

		this.as = new AutoSuggest(this.inp, {fixed_options: true, xdelta: 8, ydelta: 8});
		this.as.aSug = me.create_options(me.options);
		this.set_background();
	}
	
	this.set_width = function(w) {
		w = cint(w);
		$y(this.inp, {width: (w-20) + 'px'});
		$y(this.body_tab, {width: w+'px'});
		$y($td(this.body_tab, 0, 0), {width: (w-18) + 'px'})
		$y($td(this.body_tab, 0, 1), {width: '18px'});
	}
	
	this.set_background = function(color) {
		if(color)this.bg_color = color;
		$y($td(this.body_tab, 0, 0),{backgroundColor: this.bg_color});		
		$y($td(this.body_tab, 0, 1),{backgroundColor:'#ECECDB'});		

	}
	this.create_options = function(l) {
		var o = [];
		for(var i=0; i<l.length; i++) {
			o.push({value:l[i]});
		}
		return o;
	}
	
	this.set_options = function(l) {
		this.as.init();
		this.as.aSug = me.create_options(l);
	}
	
	this.empty = function() {
		this.as.aSug = [];
	}
	this.append = function(label) {
		this.as.aSug.push({value:label});		
	}
	this.set = function(v) {
		this.inp.value = v;
	}
	this.get = function() {
		return this.inp.value;		
	}
	this.setup();
}