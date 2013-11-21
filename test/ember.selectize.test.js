var map = Ember.EnumerableUtils.map,
    trim = Ember.$.trim;

var dispatcher, selectizeView;

module("Ember.Selectize", {
  setup: function() {
    dispatcher = Ember.EventDispatcher.create();
    dispatcher.setup();
    selectizeView = Ember.Selectize.create();
  },

  teardown: function() {
    Ember.run(function() {
      dispatcher.destroy();
      selectizeView.destroy();
    });
  }
});

function append() {
  Ember.run(function() {
    selectizeView.appendTo('#qunit-fixture');
  });
}

function countProperties(object){
  var count = 0;
  var i;
  
  for (i in object) {
      if (object.hasOwnProperty(i)) {
          count++;
      }
  }
  
  return count;
}

function asArray(object){
  var i, arr =[];
  for (i in object) {
      if (object.hasOwnProperty(i)) {
          arr.push(object[i]);
      }
  }
  
  return arr;
}

test("has 'ember-view' and 'ember-selectize' CSS classes", function() {
  deepEqual(selectizeView.get('classNames'), ['ember-view', 'ember-selectize']);
});

test("should render", function() {
  append();

  ok(selectizeView.$().length, "Selectize renders");
});

test("should begin disabled if the disabled attribute is true", function() {
  selectizeView.set('disabled', true);
  append();
  ok(selectizeView.selectize.isDisabled);
});

test("should become disabled if the disabled attribute is changed", function() {
  append();
  ok(!selectizeView.selectize.isDisabled);

  Ember.run(function() { selectizeView.set('disabled', true); });
  ok(selectizeView.selectize.isDisabled);

  Ember.run(function() { selectizeView.set('disabled', false); });
  ok(!selectizeView.selectize.isDisabled);
});

test("can have options", function() {
  selectizeView.set('content', Ember.A([1, 2, 3]));

  append();

  equal(asArray(selectizeView.selectize.options).length, 3, "Should have three options");
  // IE 8 adds whitespace
  deepEqual(map(selectizeView.get('content'), function(o) {
    return selectizeView.selectize.options[o][selectizeView.selectize.settings.labelField];
  }), [1, 2, 3], "Options should have content");
  
  deepEqual(map(selectizeView.get('content'), function(o) {
    return selectizeView.selectize.options[o][selectizeView.selectize.settings.valueField];
  }), [1, 2, 3], "Options should have values");
});

test("can specify the property path for an option's label and value", function() {
  selectizeView.set('content', Ember.A([
    { id: 1, firstName: 'Yehuda' },
    { id: 2, firstName: 'Tom' }
  ]));

  selectizeView.set('optionLabelPath', 'content.firstName');
  selectizeView.set('optionValuePath', 'content.id');

  append();
  
  equal(asArray(selectizeView.selectize.options).length, 2, "Should have two options");
  
  deepEqual(map(selectizeView.get('content'),function(o){
    return selectizeView.selectize.options[o.id][selectizeView.selectize.settings.labelField];
  }), ["Yehuda","Tom"], "Options should have content");
  
  deepEqual(map(selectizeView.get('content'), function(o) {
    return selectizeView.selectize.options[o.id][selectizeView.selectize.settings.valueField];
  }), [1, 2], "Options should have values");
});

test("can retrieve the current selected option when multiple=false", function() {
  var yehuda = { id: 1, firstName: 'Yehuda' },
      tom = { id: 2, firstName: 'Tom' };
  selectizeView.set('content', Ember.A([yehuda, tom]));
  
  selectizeView.set('optionLabelPath', 'content.firstName');
  selectizeView.set('optionValuePath', 'content.id');
  
  append();
  
  equal(selectizeView.get('selection'), null, "By default, nothing is selected");

  selectizeView.selectize.addItem(2); // select Tom

  equal(selectizeView.get('selection'), tom, "On change, the new option should be selected");
});

test("can retrieve the current selected options when multiple=true", function() {
  var yehuda = { id: 1, firstName: 'Yehuda' },
      tom = { id: 2, firstName: 'Tom' },
      david = { id: 3, firstName: 'David' },
      brennain = { id: 4, firstName: 'Brennain' };

  selectizeView.set('content', Ember.A([yehuda, tom, david, brennain]));
  selectizeView.set('multiple', true);
  selectizeView.set('optionLabelPath', 'content.firstName');
  selectizeView.set('optionValuePath', 'content.id');

  append();

  deepEqual(selectizeView.get('selection'), [], "By default, nothing is selected");

  selectizeView.selectize.addItem(2); // select Tom
  selectizeView.selectize.addItem(3); // select David

  deepEqual(selectizeView.get('selection'), [tom, david], "On change, the new options should be selected");
});

test("selection can be set when multiple=false", function() {
  var yehuda = { id: 1, firstName: 'Yehuda' },
      tom = { id: 2, firstName: 'Tom' };

  Ember.run(function() {
    selectizeView.set('optionLabelPath', 'content.firstName');
    selectizeView.set('optionValuePath', 'content.id');
  
    selectizeView.set('content', Ember.A([yehuda, tom]));
    selectizeView.set('multiple', false);
    selectizeView.set('selection', tom);
  });

  append();
  
  deepEqual(selectizeView.selectize.items, [tom.id+""], "Initial selection should be correct");

  Ember.run(function() { selectizeView.set('selection', yehuda); });
  
  deepEqual(selectizeView.selectize.items, [yehuda.id+""], "After changing it, selection should be correct");
});

test("selection can be set when multiple=true", function() {
  var yehuda = { id: 1, firstName: 'Yehuda' },
      tom = { id: 2, firstName: 'Tom' },
      david = { id: 3, firstName: 'David' },
      brennain = { id: 4, firstName: 'Brennain' };

  Ember.run(function() {
    selectizeView.set('optionLabelPath', 'content.firstName');
    selectizeView.set('optionValuePath', 'content.id');
    
    selectizeView.set('content', Ember.A([yehuda, tom, david, brennain]));
    selectizeView.set('multiple', true);
    selectizeView.set('selection', tom);
  });

  append();

  deepEqual(selectizeView.selectize.items, [tom.id+""], "Initial selection should be correct");

  Ember.run(function() { selectizeView.set('selection', yehuda); });
  
  deepEqual(selectizeView.selectize.items, [yehuda.id+""], "After changing it, selection should be correct");
});

test("multiple selections can be set when multiple=true", function() {
  var yehuda = { id: 1, firstName: 'Yehuda' },
      tom = { id: 2, firstName: 'Tom' },
      david = { id: 3, firstName: 'David' },
      brennain = { id: 4, firstName: 'Brennain' };

  Ember.run(function() {
    selectizeView.set('optionLabelPath', 'content.firstName');
    selectizeView.set('optionValuePath', 'content.id');
    
    selectizeView.set('content', Ember.A([yehuda, tom, david, brennain]));
    selectizeView.set('multiple', true);

    selectizeView.set('selection', Ember.A([yehuda, david]));
  });

  append();
  
  deepEqual(selectizeView.selectize.items, [yehuda.id+"",david.id+""], "Initial selection should be correct");

  Ember.run(function() { selectizeView.set('selection', Ember.A([tom, brennain])); });

  deepEqual(selectizeView.selectize.items, [tom.id+"",brennain.id+""], "After changing it, selection should be correct");

});

test("multiple selections can be set by changing in place the selection array when multiple=true", function() {
  var yehuda = { id: 1, firstName: 'Yehuda' },
      tom = { id: 2, firstName: 'Tom' },
      david = { id: 3, firstName: 'David' },
      brennain = { id: 4, firstName: 'Brennain' },
      selection = Ember.A([yehuda, tom]);

  Ember.run(function() {
    selectizeView.set('optionLabelPath', 'content.firstName');
    selectizeView.set('optionValuePath', 'content.id');
    
    selectizeView.set('content', Ember.A([yehuda, tom, david, brennain]));
    selectizeView.set('multiple', true);
    selectizeView.set('selection', selection);
  });

  append();

  deepEqual(selectizeView.selectize.items, [yehuda.id+"",tom.id+""], "Initial selection should be correct");

  Ember.run(function() {
    selection.replace(0, selection.get('length'), Ember.A([david, brennain]));
  });

  deepEqual(selectizeView.selectize.items, [david.id+"",brennain.id+""], "After updating the selection array in-place, selection should be correct");
});


test("multiple selections can be set indirectly via bindings and in-place when multiple=true (issue #1058)", function() {
  var indirectContent = Ember.Object.create();

  var yehuda = { id: 1, firstName: 'Yehuda' },
      tom = { id: 2, firstName: 'Tom' },
      david = { id: 3, firstName: 'David' },
      brennain = { id: 4, firstName: 'Brennain' },
      cyril = { id: 5, firstName: 'Cyril' };

  Ember.run(function() {
    selectizeView.destroy(); // Destroy the existing select

    Ember.run(function() {
      selectizeView = Ember.Selectize.extend({
        indirectContent: indirectContent,
        contentBinding: 'indirectContent.controller.content',
        selectionBinding: 'indirectContent.controller.selection',
        multiple: true,
        optionLabelPath: 'content.firstName',
        optionValuePath: 'content.id'
      }).create();

      indirectContent.set('controller', Ember.Object.create({
        content: Ember.A([tom, david, brennain]),
        selection: Ember.A([david])
      }));
    });

    append();
  });

  deepEqual(selectizeView.get('content'), [tom, david, brennain], "Initial content should be correct");
  deepEqual(selectizeView.get('selection'), [david], "Initial selection should be correct");

  Ember.run(function() {
    indirectContent.set('controller.content', Ember.A([david, cyril]));
    indirectContent.set('controller.selection', Ember.A([cyril]));
  });

  deepEqual(selectizeView.get('content'), [david, cyril], "After updating bound content, content should be correct");
  deepEqual(selectizeView.get('selection'), [cyril], "After updating bound selection, selection should be correct");
});

/*
test("select with group can group options", function() {
  var content = Ember.A([
    { firstName: 'Yehuda', organization: 'Tilde' },
    { firstName: 'Tom', organization: 'Tilde' },
    { firstName: 'Keith', organization: 'Envato' }
  ]);

  Ember.run(function() {
    select.set('content', content),
    select.set('optionGroupPath', 'organization');
    select.set('optionLabelPath', 'content.firstName');
  });

  append();

  equal(select.$('optgroup').length, 2);

  var labels = [];
  select.$('optgroup').each(function() {
    labels.push(this.label);
  });
  equal(labels.join(''), ['TildeEnvato']);

  equal(select.$('optgroup').first().text().replace(/\s+/g,''), 'YehudaTom');
  equal(select.$('optgroup').last().text().replace(/\s+/g,''), 'Keith');
});

test("select with group doesn't break options", function() {
  var content = Ember.A([
    { id: 1, firstName: 'Yehuda', organization: 'Tilde' },
    { id: 2, firstName: 'Tom', organization: 'Tilde' },
    { id: 3, firstName: 'Keith', organization: 'Envato' }
  ]);

  Ember.run(function() {
    select.set('content', content),
    select.set('optionGroupPath', 'organization');
    select.set('optionLabelPath', 'content.firstName');
    select.set('optionValuePath', 'content.id');
  });

  append();

  equal(select.$('option').length, 3);
  equal(select.$().text().replace(/\s+/g,''), 'YehudaTomKeith');

  Ember.run(function() {
    content.set('firstObject.firstName', 'Peter');
  });
  equal(select.$().text(), 'PeterTomKeith');

  select.$('option').get(0).selected = true;
  select.$().trigger('change');
  deepEqual(select.get('selection'), content.get('firstObject'));
});

test("select with group observes its content", function() {
  var wycats = { firstName: 'Yehuda', organization: 'Tilde' };
  var content = Ember.A([
    wycats
  ]);

  Ember.run(function() {
    select.set('content', content),
    select.set('optionGroupPath', 'organization');
    select.set('optionLabelPath', 'content.firstName');
  });

  append();

  Ember.run(function() {
    content.pushObject({ firstName: 'Keith', organization: 'Envato' });
  });

  equal(select.$('optgroup').length, 2);
  equal(select.$('optgroup[label=Envato]').length, 1);

  Ember.run(function() {
    select.set('optionGroupPath', 'firstName');
  });
  var labels = [];
  select.$('optgroup').each(function() {
    labels.push(this.label);
  });
  equal(labels.join(''), 'YehudaKeith');
});
test("select with group whose content is undefined doesn't breaks", function() {

    var content;
  Ember.run(function() {
    select.set('content', content),
    select.set('optionGroupPath', 'organization');
    select.set('optionLabelPath', 'content.firstName');
  });

  append();

  equal(select.$('optgroup').length, 0);
});*/

test("selection uses the same array when multiple=true", function() {
  var yehuda = { id: 1, firstName: 'Yehuda' },
      tom = { id: 2, firstName: 'Tom' },
      david = { id: 3, firstName: 'David' },
      brennain = { id: 4, firstName: 'Brennain' },
      selection = Ember.A([yehuda, david]);

  Ember.run(function() {
    selectizeView.set('optionLabelPath', 'content.firstName');
    selectizeView.set('optionValuePath', 'content.id');
    
    selectizeView.set('content', Ember.A([yehuda, tom, david, brennain]));
    selectizeView.set('multiple', true);
    selectizeView.set('selection', selection);
  });

  append();

  deepEqual(selectizeView.get('selection'), [yehuda, david], "Initial selection should be correct");

  //Clear
  selectizeView.selectize.removeItem(selectizeView.selectize.items[0]);
  selectizeView.selectize.removeItem(selectizeView.selectize.items[0]);
  selectizeView.selectize.addItem(2); //select Tom
  selectizeView.selectize.addItem(3); //select David

  deepEqual(selectizeView.get('selection'), [tom,david], "On change the selection is updated");
  deepEqual(selection, [tom,david], "On change the original selection array is updated");
});

test("upon content change, selectize should reflect the changes (options)", function() {
  var yehuda = { id: 1, firstName: 'Yehuda' },
    tom = { id: 2, firstName: 'Tom' },
    david = { id: 3, firstName: 'David' },
    brennain = { id: 4, firstName: 'Brennain' },
    selection = Ember.A([yehuda, david]);
      
  Ember.run(function() {
    selectizeView.set('optionLabelPath', 'content.firstName');
    selectizeView.set('optionValuePath', 'content.id');
    
    selectizeView.set('multiple', true);
    selectizeView.set('content', Ember.A([yehuda, tom, david, brennain]));
  });
  
  append();
  
  deepEqual(selectizeView.get('content'), [yehuda, tom, david, brennain], "Initial content should be correct");
  
  Ember.run(function() {
    selectizeView.set('content',[]);
  });
  
  equal(asArray(selectizeView.selectize.options).length, 0, "Should have no options");
});

/*
test("Ember.SelectedOption knows when it is selected when multiple=false", function() {
  var yehuda = { id: 1, firstName: 'Yehuda' },
      tom = { id: 2, firstName: 'Tom' },
      david = { id: 3, firstName: 'David' },
      brennain = { id: 4, firstName: 'Brennain' };

  Ember.run(function() {
    select.set('content', Ember.A([yehuda, tom, david, brennain]));
    select.set('multiple', false);

    select.set('selection', david);
  });

  append();

  deepEqual(selectedOptions(), [false, false, true, false], "Initial selection should be correct");

  Ember.run(function() { select.set('selection', brennain); });

  deepEqual(selectedOptions(), [false, false, false, true], "After changing it, selection should be correct");
});

test("Ember.SelectedOption knows when it is selected when multiple=true", function() {
  var yehuda = { id: 1, firstName: 'Yehuda' },
      tom = { id: 2, firstName: 'Tom' },
      david = { id: 3, firstName: 'David' },
      brennain = { id: 4, firstName: 'Brennain' };

  Ember.run(function() {
    select.set('content', Ember.A([yehuda, tom, david, brennain]));
    select.set('multiple', true);

    select.set('selection', [yehuda, david]);
  });

  append();

  deepEqual(selectedOptions(), [true, false, true, false], "Initial selection should be correct");

  Ember.run(function() {
    select.set('selection', [tom, david]);
  });

  deepEqual(selectedOptions(), [false, true, true, false], "After changing it, selection should be correct");
});

test("Ember.SelectedOption knows when it is selected when multiple=true and options are primatives", function() {
  Ember.run(function() {
    select.set('content', Ember.A([1, 2, 3, 4]));
    select.set('multiple', true);
    select.set('selection', [1, 3]);
  });

  append();

  deepEqual(selectedOptions(), [true, false, true, false], "Initial selection should be correct");

  Ember.run(function() { select.set('selection', [2, 3]); });

  deepEqual(selectedOptions(), [false, true, true, false], "After changing it, selection should be correct");
});*/

/*test("a prompt can be specified", function() {
  var yehuda = { id: 1, firstName: 'Yehuda' },
      tom = { id: 2, firstName: 'Tom' };
  
  Ember.run(function() {
  
    selectizeView.set('optionValuePath', 'content.id');
    selectizeView.set('content', Ember.A([yehuda, tom]));
    selectizeView.set('prompt', 'Pick a person');
    selectizeView.set('optionLabelPath', 'content.firstName');
  });

  append();

  equal(select.$('option').length, 3, "There should be three options");
  equal(select.$()[0].selectedIndex, 0, "By default, the prompt is selected in the DOM");
  equal(trim(select.$('option:selected').text()), 'Pick a person', "By default, the prompt is selected in the DOM");
  equal(select.$().val(), '', "By default, the prompt has no value");

  equal(select.get('selection'), null, "When the prompt is selected, the selection should be null");

  Ember.run(function() { select.set('selection', tom); });

  equal(select.$()[0].selectedIndex, 2, "The selectedIndex accounts for the prompt");

  select.$()[0].selectedIndex = 0;
  select.$().trigger('change');

  equal(select.get('selection'), null, "When the prompt is selected again after another option, the selection should be null");

  select.$()[0].selectedIndex = 2;
  select.$().trigger('change');
  equal(select.get('selection'), tom, "Properly accounts for the prompt when DOM change occurs");
});*/

test("handles null content", function() {
  append();

  Ember.run(function() {
    selectizeView.set('content', null);
    selectizeView.set('selection', 'invalid');
    selectizeView.set('value', 'also_invalid');
  });
  
  equal(selectizeView.get('selection'), null, "should have no selection");

  Ember.run(function() {
    selectizeView.set('multiple', true);
    selectizeView.set('selection', [{ content: 'invalid' }]);
  });

  equal(selectizeView.get('element').selectedIndex, -1, "should have no selection");
});

test("valueBinding handles 0 as initiated value (issue #2763)", function() {
  var indirectData = Ember.Object.create({
    value: 0
  });

  Ember.run(function() {
    select.destroy(); // Destroy the existing select

    select = Ember.Select.extend({
      content: Ember.A([1,0]),
      indirectData: indirectData,
      valueBinding: 'indirectData.value'
    }).create();

    append();
  });

  equal(select.get('value'), 0, "Value property should equal 0");
});

test("should be able to select an option and then reselect the prompt", function() {
  Ember.run(function() {
    select.set('content', Ember.A(['one', 'two', 'three']));
    select.set('prompt', 'Select something');
  });

  append();

  select.$()[0].selectedIndex = 2;
  select.$().trigger('change');
  equal(select.get('selection'), 'two');

  select.$()[0].selectedIndex = 0;
  select.$().trigger('change');
  equal(select.get('selection'), null);
  equal(select.$()[0].selectedIndex, 0);
});

test("should be able to get the current selection's value", function() {
  Ember.run(function() {
    select.set('content', Ember.A([
      {label: 'Yehuda Katz', value: 'wycats'},
      {label: 'Tom Dale', value: 'tomdale'},
      {label: 'Peter Wagenet', value: 'wagenet'},
      {label: 'Erik Bryn', value: 'ebryn'}
    ]));
    select.set('optionLabelPath', 'content.label');
    select.set('optionValuePath', 'content.value');
  });

  append();

  equal(select.get('value'), 'wycats');
});

test("should be able to set the current selection by value", function() {
  var ebryn = {label: 'Erik Bryn', value: 'ebryn'};

  Ember.run(function() {
    select.set('content', Ember.A([
      {label: 'Yehuda Katz', value: 'wycats'},
      {label: 'Tom Dale', value: 'tomdale'},
      {label: 'Peter Wagenet', value: 'wagenet'},
      ebryn
    ]));
    select.set('optionLabelPath', 'content.label');
    select.set('optionValuePath', 'content.value');
    select.set('value', 'ebryn');
  });

  append();

  equal(select.get('value'), 'ebryn');
  equal(select.get('selection'), ebryn);
});

module("Ember.Selectize - usage inside templates", {
  setup: function() {
    dispatcher = Ember.EventDispatcher.create();
    dispatcher.setup();
  },

  teardown: function() {
    Ember.run(function() {
      dispatcher.destroy();
      if (view) { view.destroy(); }
    });
  }
});

test("works from a template with bindings", function() {
  var Person = Ember.Object.extend({
    id: null,
    firstName: null,
    lastName: null,

    fullName: Ember.computed(function() {
      return this.get('firstName') + " " + this.get('lastName');
    }).property('firstName', 'lastName')
  });

  var erik = Person.create({id: 4, firstName: 'Erik', lastName: 'Bryn'});

  var application = Ember.Namespace.create();

  application.peopleController = Ember.ArrayController.create({
    content: Ember.A([
      Person.create({id: 1, firstName: 'Yehuda', lastName: 'Katz'}),
      Person.create({id: 2, firstName: 'Tom', lastName: 'Dale'}),
      Person.create({id: 3, firstName: 'Peter', lastName: 'Wagenet'}),
      erik
    ])
  });

  application.selectedPersonController = Ember.Object.create({
    person: null
  });

  view = Ember.View.create({
    app: application,
    template: Ember.Handlebars.compile(
      '{{view Ember.Select viewName="select"' +
      '                    contentBinding="view.app.peopleController"' +
      '                    optionLabelPath="content.fullName"' +
      '                    optionValuePath="content.id"' +
      '                    prompt="Pick a person:"' +
      '                    selectionBinding="view.app.selectedPersonController.person"}}'
    )
  });

  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });

  var select = view.get('select');
  ok(select.$().length, "Select was rendered");
  equal(select.$('option').length, 5, "Options were rendered");
  equal(select.$().text(), "Pick a person:Yehuda KatzTom DalePeter WagenetErik Bryn", "Option values were rendered");
  equal(select.get('selection'), null, "Nothing has been selected");

  Ember.run(function() {
    application.selectedPersonController.set('person', erik);
  });

  equal(select.get('selection'), erik, "Selection was updated through binding");
  Ember.run(function() {
    application.peopleController.pushObject(Person.create({id: 5, firstName: "James", lastName: "Rosen"}));
  });

  equal(select.$('option').length, 6, "New option was added");
  equal(select.get('selection'), erik, "Selection was maintained after new option was added");
});

test("upon content change, the DOM should reflect the selection (#481)", function() {
  var userOne = {name: 'Mike', options: Ember.A(['a', 'b']), selectedOption: 'a'},
      userTwo = {name: 'John', options: Ember.A(['c', 'd']), selectedOption: 'd'};

  view = Ember.View.create({
    user: userOne,
    template: Ember.Handlebars.compile(
      '{{view Ember.Select viewName="select"' +
      '    contentBinding="view.user.options"' +
      '    selectionBinding="view.user.selectedOption"}}'
    )
  });

  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });

  var select = view.get('select'),
      selectEl = select.$()[0];

  equal(select.get('selection'), 'a', "Precond: Initial selection is correct");
  equal(selectEl.selectedIndex, 0, "Precond: The DOM reflects the correct selection");

  Ember.run(function() {
    view.set('user', userTwo);
  });

  equal(select.get('selection'), 'd', "Selection was properly set after content change");
  equal(selectEl.selectedIndex, 1, "The DOM reflects the correct selection");
});


function testValueBinding(templateString) {
  view = Ember.View.create({
    collection: Ember.A([{name: 'Wes', value: 'w'}, {name: 'Gordon', value: 'g'}]),
    val: 'g',
    template: Ember.Handlebars.compile(templateString)
  });

  Ember.run(function() {
    view.appendTo('#qunit-fixture');
  });

  var select = view.get('select'),
      selectEl = select.$()[0];

  equal(view.get('val'), 'g', "Precond: Initial bound property is correct");
  equal(select.get('value'), 'g', "Precond: Initial selection is correct");
  equal(selectEl.selectedIndex, 2, "Precond: The DOM reflects the correct selection");

  select.$('option:eq(2)').removeAttr('selected');
  select.$('option:eq(1)').prop('selected', true);
  select.$().trigger('change');

  equal(view.get('val'), 'w', "Updated bound property is correct");
  equal(select.get('value'), 'w', "Updated selection is correct");
  equal(selectEl.selectedIndex, 1, "The DOM is updated to reflect the new selection");
}

test("select element should correctly initialize and update selectedIndex and bound properties when using valueBinding (old xBinding='' syntax)", function() {
  testValueBinding(
    '{{view Ember.Select viewName="select"' +
    '    contentBinding="view.collection"' +
    '    optionLabelPath="content.name"' +
    '    optionValuePath="content.value"' +
    '    prompt="Please wait..."' +
    '    valueBinding="view.val"}}'
  );
});

test("select element should correctly initialize and update selectedIndex and bound properties when using valueBinding (new quoteless binding shorthand)", function() {
  testValueBinding(
    '{{view Ember.Select viewName="select"' +
    '    content=view.collection' +
    '    optionLabelPath="content.name"' +
    '    optionValuePath="content.value"' +
    '    prompt="Please wait..."' +
    '    value=view.val}}'
  );
});