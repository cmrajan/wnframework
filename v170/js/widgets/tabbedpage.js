// Tabbed Page

var tab_cnt = 0;

function TabbedPage(parent, only_labels) { 
	this.tabs = {};
	this.tabs_by_idx = {};
	this.cur_tab = null;
	this.cnt = 0;
	var me = this;
	
	this.wrapper = $a(parent, 'div');
	$a(this.wrapper, 'ul');

	$tabs = $(this.wrapper).tabs({
		select: function(event, ui) {
			var sel_idx = $tabs.tabs('option', 'selected');
			if(me.tabs_by_idx[sel_idx].onshow)
				me.tabs_by_idx[sel_idx].onshow();
		} 
	});
}

TabbedPage.prototype.add_tab = function(n, onshow, body) { 
	tab_cnt++;
	
	var me = this;
	var tab = {};

	this.tabs[n] = tab;
	this.tabs_by_idx[this.cnt] = tab;
	
	// make the body
	if(!body) {
		body = $a(this.wrapper, 'div'); 
	} else {
		this.wrapper.appendChild(body);
	}
	body.setAttribute('id', 'tabs-' + tab_cnt);

	tab.tab_body = body;
	tab.idx = this.cnt;

	// add the tab
	$(this.wrapper).tabs('add', '#tabs-' + tab_cnt, n, this.cnt);
	this.cnt++;

	tab.show = function() {
		$(me.wrapper).tabs('option', 'selected', this.idx);
	}
	tab.hide = function() {
		// nothing	
	}

	tab.onshow = onshow;

	return tab;
}