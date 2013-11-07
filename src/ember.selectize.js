var get = Ember.get, set = Ember.set, isArray = Ember.isArray, typeOf = Ember.typeOf;

Ember.Selectize = Ember.View.extend({
  attributeBindings : ['multiple', 'placeholder','autocomplete'],
  autocomplete:'off',
  tagName : 'select',
  classNames : ['ember-selectize'],
  optionValuePath : 'content.value',
  optionLabelPath : 'content.label',
  plugins: ['remove_button'],
  
  _valuePath : Ember.computed('optionValuePath',function(){
    return get(this,'optionValuePath').replace(/^content\.?/, '');
  }),
  optionLabelPath : 'content.label',
  _labelPath : Ember.computed('optionLabelPath',function(){
    return get(this,'optionLabelPath').replace(/^content\.?/, '');
  }),
  
  didInsertElement : function() {
    set(this,'inDOM',true);
    this.$().selectize({
      plugins: this.plugins,
      labelField : 'label',
      valueField : 'value',
      searchField : 'label',
      onItemAdd : $.proxy(this._onItemAdd, this),
      onItemRemove : $.proxy(this._onItemRemove, this),
      onType : $.proxy(this._onType, this)
    });
    this.selectize = this.$()[0].selectize;
    this._disabledDidChange();
    this._contentDidChange();
    this._selectionDidChange();
  },
  willDestroyElement : function() {
    var content = get(this, 'content');
    var multiple = get(this, 'multiple');
    
    if (content) {
      content.removeArrayObserver(this, {
        willChange : 'contentArrayWillChange',
        didChange : 'contentArrayDidChange'
      });
      content.forEach(function(item){
        if(typeOf(item) === 'object' || typeOf(obj) === 'instance')
          Ember.removeObserver(item,get(this,'_labelPath'),this,'_labelDidChange');
      },this);
    }
    if(multiple){
      var selection = get(this, 'selection');
      if(selection) {
        selection.removeArrayObserver(this, {
          willChange : 'selectionArrayWillChange',
          didChange : 'selectionArrayDidChange'
        });
      }
    }
    this.selectize.destroy();
  },
  _onType:function(str){
    set(this,'filter',str);
  },
  _onItemAdd : function(value) {
    var content = get(this,'content');
    var selection = get(this,'selection');
    var multiple = get(this,'multiple');
    if(content){
      var obj = content.find(function(item){
        if(get(item,get(this,'_valuePath')) == value)
          return true;
      },this);
      if(multiple && isArray(selection) && obj){
        if(!selection.findBy(get(this,'_valuePath'),get(obj,get(this,'_valuePath'))))
          selection.addObject(obj);
      } else if(obj){
        if(!selection || (get(obj,get(this,'_valuePath')) !== get(selection,get(this,'_valuePath'))))
          set(this,'selection',obj);
      }
    }
    this.selectize.close();
  },
  _onItemRemove : function(value) {
    if(this.removing) return;
    var content = get(this,'content');
    var selection = get(this,'selection');
    var multiple = get(this,'multiple');
    if(content){
      var obj = content.find(function(item){
        if(get(item,get(this,'_valuePath')) == value)
          return true;
      },this);
      if(multiple && isArray(selection) && obj){
        selection.removeObject(obj);
      } else {
        this.set('selection',null);
      } 
    }
  },

  _selectionDidChange : Ember.observer(function() {
    var inDOM = get(this, 'inDOM');
    if(!inDOM) return;
    
    var multiple = get(this, 'multiple');
    var selection = get(this, 'selection');
    if (multiple) {
      if(selection) {
        if(!isArray(selection)){
          selection = Ember.A([selection]);
          set(this,'selection',selection);
          return;
        }
        selection.addArrayObserver(this, {
          willChange : 'selectionArrayWillChange',
          didChange : 'selectionArrayDidChange'
        });
      } else {
        set(this,'selection',[]);
        return;
      }
      this.selectize.clear();
      var len = selection ? get(selection, 'length') : 0;
      this.selectionArrayDidChange(selection, 0, null, len);
    } else {
      if(selection && this.selectize) {
        this.selectize.addItem(get(selection,get(this,'_valuePath')));
      } else {
        set(this,'selection',null);
        if(this.selectize){
          this.selectize.clear();
        }
      }
    }
  }, 'selection'),
  selectionArrayWillChange : function(array, idx, removedCount, addedCount) {
    this.removing = true;
    for (var i = idx; i < idx + removedCount; i++) {
      this.selectionObjectWasRemoved(array.objectAt(i));
    }
    this.removing = false;
  },
  selectionArrayDidChange : function(array, idx, removedCount, addedCount) {
    for (var i = idx; i < idx + addedCount; i++) {
      this.selectionObjectWasAdded(array.objectAt(i), i);
    }
  },
  selectionObjectWasAdded : function(obj, index) {
    //this.selectize.setCaret(index);
    if(this.selectize) this.selectize.addItem(get(obj,get(this,'_valuePath')));
  },
  selectionObjectWasRemoved : function(obj) {
    if(this.selectize) this.selectize.removeItem(get(obj,get(this,'_valuePath')));
  },
  _contentDidChange : Ember.observer(function() {
    var inDOM = get(this, 'inDOM');
    if(!inDOM) return;
    var content = get(this, 'content');
    if (content) {
      content.addArrayObserver(this, {
        willChange : 'contentArrayWillChange',
        didChange : 'contentArrayDidChange'
      });
    }
    var len = content ? get(content, 'length') : 0;
    this.contentArrayDidChange(content, 0, null, len);
  }, 'content'),
  contentArrayWillChange : function(array, idx, removedCount, addedCount) {
    for (var i = idx; i < idx + removedCount; i++) {
      this.objectWasRemoved(array.objectAt(i));
    }
  },
  contentArrayDidChange : function(array, idx, removedCount, addedCount) {
    for (var i = idx; i < idx + addedCount; i++) {
      this.objectWasAdded(array.objectAt(i), i);
    }
  },
  objectWasAdded : function(obj, index) {
    var data = {};
    if(typeOf(obj) === 'object' || typeOf(obj) === 'instance'){
      data = {
        label : get(obj, get(this,'_labelPath')),
        value : get(obj, get(this,'_valuePath')),
        data : obj
      };
      Ember.addObserver(obj,get(this,'_labelPath'),this,'_labelDidChange');
    } else {
      data = {
        label : obj,
        value : obj,
        data : obj
      };
    }

    if(this.selectize){
      this.selectize.addOption(data);
      this.selectize.refreshOptions(this.selectize.isFocused && !this.selectize.isInputHidden);
    }
    this._selectionDidChange();
  },
  objectWasRemoved : function(obj) {
    Ember.removeObserver(obj,get(this,'_labelPath'),this,'_labelDidChange');
    if(this.selectize){
      this.selectize.removeOption(get(obj, get(this,'_valuePath')));
      this.selectize.refreshOptions(this.selectize.isFocused && !this.selectize.isInputHidden);
    }
    this._selectionDidChange();
  },
  _labelDidChange: function(sender, key, value, rev) {
    var data = {
      label : get(sender, get(this,'_labelPath')),
      value : get(sender, get(this,'_valuePath')),
      data : sender
    };
    if(this.selectize)
      this.selectize.updateOption(data.value,data);
  },
  _disabledDidChange: Ember.observer(function(){
    if(!this.selectize) return;
    var disable = get(this,'disabled');
    if(disable) this.selectize.disable();
    else this.selectize.enable();
  },'disabled')
});