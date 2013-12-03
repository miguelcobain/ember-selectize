// SimpleMap
SelectizeApp = Ember.Application.create({rootElement: '#demo'});
SelectizeApp.ApplicationView = Ember.Selectize.extend({
  content : [1,2,3,4]
});
