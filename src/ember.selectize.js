var get = Ember.get, set = Ember.set, isArray = Ember.isArray, typeOf = Ember.typeOf, getWithDefault = Ember.getWithDefault;

/**
 * Ember.Selectize is an Ember View that encapsulates a Selectize component.
 * The goal is to use this as a near dropin replacement for Ember.Select.
 */
Ember.Selectize = Ember.View.extend({
  attributeBindings : ['multiple', 'placeholder','autocomplete'],
  classNames : ['ember-selectize'],
  
  autocomplete:'off',
  // Allows to use prompt (like in Ember.Select) or placeholder property
  placeholder: Ember.computed.alias('prompt'),
  tagName : 'select',
  
  /**
   * overrideable object paths for value and label paths
   */
  optionValuePath : undefined,
  optionLabelPath : undefined,
  
  /**
   * The array of the default plugins to load into selectize
   */
  plugins: ['remove_button'],
  
  /**
   * Computed properties that hold the processed paths ('content.' replacement),
   * as it is done on Ember.Select
   */
  _valuePath : Ember.computed('optionValuePath',function(){
    return getWithDefault(this,'optionValuePath','content.value').replace(/^content\.?/, '');
  }),
  _labelPath : Ember.computed('optionLabelPath',function(){
    return getWithDefault(this,'optionLabelPath','content.label').replace(/^content\.?/, '');
  }),
  
  /**
   * This flag should be true when the element is present in the DOM and false when if isn't.
   * This helps to avoid triggering unecessary observers.
   */
  inDOM: false,
  
  /**
   * Pass true to 'create' property to enable tag creation mode.
   * When active, ember-selectize will send a 'create' action to its controller when a tag is created.
   * Alternatively, you can pass a string to 'createAction' property and 
   * ember-selectize will activite tag creation mode send an action with that name to its controller.
   */
  create:false,
  createAction:'create',
  
  didInsertElement : function() {
    var allowCreate = get(this, 'create');
    var createAction = get(this, 'createAction');
    //View is now in DOM
    this.inDOM = true;
    
    //Normalize create property if createAction was set
    if(createAction && (createAction !== 'create'))
      allowCreate = true;
    
    //Create Selectize's instance
    //We proxy callbacks through jQuery's 'proxy' to have the callbacks context set to 'this'
    this.$().selectize({
      plugins: this.plugins,
      labelField : 'label',
      valueField : 'value',
      searchField : 'label',
      create: allowCreate ? $.proxy(this._create, this) : false,
      onItemAdd : $.proxy(this._onItemAdd, this),
      onItemRemove : $.proxy(this._onItemRemove, this),
      onType : $.proxy(this._onType, this)
    });
    
    //Save the created selectize instance
    this.selectize = this.$()[0].selectize;
    
    //Some changes to content, selection and disabled could have happened before the View was inserted into the DOM.
    //We trigger all the observers manually to account for those changes.
    this._disabledDidChange();
    this._contentDidChange();
    this._selectionDidChange();
  },
  willDestroyElement : function() {

    //Unbind observers
    this._contentWillChange();
    this._selectionWillChange();
    
    //Invoke Selectize's destroy
    this.selectize.destroy();
    
    //We are no longer in DOM
    this.inDOM = false;
  },
  /**
   * Event callback that is triggered when user creates a tag
   */
  _create:function(input,callback){
    // Delete user entered text
    this.selectize.setTextboxValue('');
    // Send action to controller
    get(this,'controller').send(get(this,'createAction'),input);
    // We cancel the creation here, so it's up to you to include the created element
    // in the content and selection property
    callback(null);
  },
  /**
   * Event callback that is triggered when user types in the input element
   */
  _onType:function(str){
    set(this,'filter',str);
  },
  /**
   * Event callback triggered when an item is added (when something is selected)
   * Here we need to update our selection property (if single selection) or array (if multiple selection)
   */
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
  },
  /**
   * Event callback triggered when an item is removed (when something is deselected)
   * Here we need to update our selection property (if single selection, here set to null) or remove item from array (if multiple selection)
   */
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
      } else if(!multiple){
        this.set('selection',null);
      } 
    }
  },
    /**
   * Ember observer triggered before the selection property is changed
   * We need to unbind any array observers if we're in multiple selection
   */
  _selectionWillChange: Ember.beforeObserver(function() {
    var multiple = get(this, 'multiple');
    var selection = get(this, 'selection');
    if(selection && isArray(selection) && multiple) {
      selection.removeArrayObserver(this,  {
        willChange : 'selectionArrayWillChange',
        didChange : 'selectionArrayDidChange'
      });
      var len = selection ? get(selection, 'length') : 0;
      this.selectionArrayWillChange(selection, 0, len);
    }
  }, 'selection'),
  /**
   * Ember observer triggered when the selection property is changed
   * We need to bind an array observer when selection is multiple
   */
  _selectionDidChange : Ember.observer(function() {
    if(!this.inDOM) return;
    
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
      var len = selection ? get(selection, 'length') : 0;
      this.selectionArrayDidChange(selection, 0, null, len);
    } else {
      if(selection) {
        this.selectize.addItem(get(selection,get(this,'_valuePath')));
      } else {
        set(this,'selection',null);
        if(this.selectize){
          this.selectize.clear();
        }
      }
    }
  }, 'selection'),
  /*
   * Triggered before the selection array changes
   * Here we process the removed elements
   */
  selectionArrayWillChange : function(array, idx, removedCount, addedCount) {
    this.removing = true;
    for (var i = idx; i < idx + removedCount; i++) {
      this.selectionObjectWasRemoved(array.objectAt(i));
    }
    this.removing = false;
  },
  /*
   * Triggered after the selection array changes
   * Here we process the inserted elements
   */
  selectionArrayDidChange : function(array, idx, removedCount, addedCount) {
    for (var i = idx; i < idx + addedCount; i++) {
      this.selectionObjectWasAdded(array.objectAt(i), i);
    }
  },
  /*
   * Function that is responsible for Selectize's item inserting logic
   */
  selectionObjectWasAdded : function(obj, index) {
    if(this.selectize) this.selectize.addItem(get(obj,get(this,'_valuePath')));
  },
  /*
   * Function that is responsible for Selectize's item removing logic
   */
  selectionObjectWasRemoved : function(obj) {
    if(this.selectize) this.selectize.removeItem(get(obj,get(this,'_valuePath')));
  },
  /**
   * Ember observer triggered before the content property is changed
   * We need to unbind any array observers
   */
  _contentWillChange: Ember.beforeObserver(function() {
    if(!this.inDOM) return;
    var content = get(this, 'content');
    if(content) {
      content.removeArrayObserver(this, {
        willChange : 'contentArrayWillChange',
        didChange : 'contentArrayDidChange'
      });
    }
    //Trigger remove logic
    var len = content ? get(content, 'length') : 0;
    this.removing = true;
    this.contentArrayWillChange(content, 0, len);
    this.removing = false;
    this._selectionDidChange();
  }, 'content'),
  /**
   * Ember observer triggered when the content property is changed
   * We need to bind an array observer to become notified of its changes
   */
  _contentDidChange : Ember.observer(function() {
    if(!this.inDOM) return;
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
  /*
   * Triggered before the content array changes
   * Here we process the removed elements
   */
  contentArrayWillChange : function(array, idx, removedCount, addedCount) {
    for (var i = idx; i < idx + removedCount; i++) {
      this.objectWasRemoved(array.objectAt(i));
    }
    this._selectionDidChange();
  },
  /*
   * Triggered after the content array changes
   * Here we process the inserted elements
   */
  contentArrayDidChange : function(array, idx, removedCount, addedCount) {
    for (var i = idx; i < idx + addedCount; i++) {
      this.objectWasAdded(array.objectAt(i), i);
    }
    this._selectionDidChange();
  },
  /*
   * Function that is responsible for Selectize's option inserting logic
   * If the option is an object or Ember instance, we set an observer on the label value of it.
   * This way, we can later update the label of it.
   * Useful for dealing with objects that 'lazy load' some properties/relationships.
   */
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
    //this._selectionDidChange();
  },
  /*
   * Function that is responsible for Selectize's option removing logic
   */
  objectWasRemoved : function(obj) {
    if(typeOf(obj) === 'object' || typeOf(obj) === 'instance')
          Ember.removeObserver(obj,get(this,'_labelPath'),this,'_labelDidChange');
    if(this.selectize){
      this.selectize.removeOption(get(obj, get(this,'_valuePath')));
      this.selectize.refreshOptions(this.selectize.isFocused && !this.selectize.isInputHidden);
    }
    //Trigger a selection change, because the previously selected item might not be available anymore.
    //this._selectionDidChange();
  },
  /*
   * Ember Observer that triggers when an option's label changes.
   * Here we need to update its corresponding option with the new data
   */
  _labelDidChange: function(sender, key, value, rev) {
    if(!this.selectize) return;
    
    var data = {
      label : get(sender, get(this,'_labelPath')),
      value : get(sender, get(this,'_valuePath')),
      data : sender
    };
    this.selectize.updateOption(data.value,data);
  },
  /*
   * Observer on the disabled property that enables or disables selectize.
   */
  _disabledDidChange: Ember.observer(function(){
    if(!this.selectize) return;
    var disable = get(this,'disabled');
    if(disable) this.selectize.disable();
    else this.selectize.enable();
  },'disabled')
});
