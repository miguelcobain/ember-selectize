var people = [
        {
            id:1,
            name:'Tom'
        },
        {
            id:2,
            name:'Yehuda'
        },
        {
            id:2,
            name:'Miguel'
        },
        {
            id:3,
            name:'David'
        },
        {
            id:4,
            name:'George'
        },
        {
            id:5,
            name:'Natalie'
        },
        {
            id:6,
            name:'Lily'
        },
        {
            id:7,
            name:'Mary'
        }
    ];

SingleApp = Ember.Application.create({rootElement: '#single-app'});
SingleApp.ApplicationController = Ember.ArrayController.extend({
    content: people
});
SingleApp.ApplicationView = Ember.View.extend({
  templateName:'single'
});

MultipleApp = Ember.Application.create({rootElement: '#multi-app'});
MultipleApp.ApplicationController = Ember.ArrayController.extend({
    content:people
});
MultipleApp.ApplicationView = Ember.View.extend({
  templateName:'multi'
});