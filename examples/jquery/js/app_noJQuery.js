/*global jQuery, Handlebars, Router */
//jQuery(function ($) {
(function (){
	'use strict';

	Handlebars.registerHelper('eq', function (a, b, options) {
		return a === b ? options.fn(this) : options.inverse(this);
	});

	var ENTER_KEY = 13;
	var ESCAPE_KEY = 27;

	var util = {
		uuid: function () {
			/*jshint bitwise:false */
			var i, random;
			var uuid = '';

			for (i = 0; i < 32; i++) {
				random = Math.random() * 16 | 0;
				if (i === 8 || i === 12 || i === 16 || i === 20) {
					uuid += '-';
				}
				uuid += (i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random)).toString(16);
			}

			return uuid;
		},
		pluralize: function (count, word) {
			return count === 1 ? word : word + 's';
		},
		store: function (namespace, data) {
			if (arguments.length > 1) {
				return localStorage.setItem(namespace, JSON.stringify(data));
			} else {
				var store = localStorage.getItem(namespace);
				return (store && JSON.parse(store)) || [];
			}
		}
	};

	var App = {
		init: function () {
			this.todos = util.store('todos-jquery');
			var todoTemplateHTML = document.getElementById('todo-template');
			var footerTemplateHTML = document.getElementById('footer-template');
			this.todoTemplate = Handlebars.compile(todoTemplateHTML.innerHTML);
			this.footerTemplate = Handlebars.compile(footerTemplateHTML.innerHTML);
			this.bindEvents();

			new Router({
				'/:filter': function (filter) {
					this.filter = filter;
					this.render();
				}.bind(this)
			}).init('/all');
		},

		bindEvents: function () {
			var newTodo = document.querySelector('.new-todo');
			var toggleAll = document.querySelector('.toggle-all');
			var footer = document.querySelector('.footer');
			var todoList = document.querySelector('.todo-list');
			var clearCompleted = document.querySelector('.clear-completed');
			var toggle = document.querySelector('.toggle');
			var label = document	.querySelector('label');
			var edit = document.querySelector('.edit');
			var destroy = document.querySelector('.destroy');

			newTodo.addEventListener('keyup', this.create.bind(App));
			toggleAll.addEventListener('change', this.toggleAll.bind(App));

			function footerBind(e){
				if(e.target.className === 'clear-completed'){
					App.destroyCompleted();
				}
			}

			function toggleBind(e){
				//debugger;
				if(e.target.className === 'toggle'){
					console.log('binded');
					App.toggle(e);
				}
			}

			function editingModeBind(e){
				if(e.target.className === 'toDoLabel'){
					App.editingMode(e);
				}
			}

			function editKeyupBind(e){
				if(e.target.className === 'edit'){
					App.editKeyup(e);
				}
			}

			function updateBind(e){
				if(e.target.className === 'edit'){
					App.update(e);
				}
			}

			function destroyBind(e){
				if(e.target.className === 'destroy'){
					App.destroy(e);
				}
			}

			footer.addEventListener('click', footerBind);
			todoList.addEventListener('change', toggleBind);
			todoList.addEventListener('dblclick', editingModeBind);
			todoList.addEventListener('keyup', editKeyupBind);
			todoList.addEventListener('focusout', updateBind);	
			todoList.addEventListener('click', destroyBind);	
		},

		render: function() {
			//debugger;
			var todos = this.getFilteredTodos();
			var todoList = document.querySelector('.todo-list');
			var main = document.querySelector('.main');
			var toggleAll = document.querySelector('.toggle-all');
			todoList.innerHTML = this.todoTemplate(todos);

			if(todos.length > 0) {
				main.style.display = '';
			}
			else {main.style.display = 'block';}

			if(this.getActiveTodos().length === 0){
				toggleAll.checked = true;
			}
			else {toggleAll.checked = false;
			}

			this.renderFooter();
			util.store('todos-jquery', this.todos);
			
		},

		renderFooter: function () {
			var todoCount = this.todos.length;
			var activeTodoCount = this.getActiveTodos().length;
			var template = this.footerTemplate({
				activeTodoCount: activeTodoCount,
				activeTodoWord: util.pluralize(activeTodoCount, 'item'),
				completedTodos: todoCount - activeTodoCount,
				filter: this.filter
			});

			var footer = document.querySelector('.footer');
			footer.innerHTML = template;
			if(todoCount > 0) {
				footer.style.display = "";
			}
			else {footer.style.display = "none";}
			},

		toggleAll: function(event) {
			// debugger;
			var toggleAllStatus = event.target.checked;
			this.todos.forEach(function(todo){
					todo.completed = toggleAllStatus;
			});
			this.render();
		},

		getActiveTodos: function () {
			return this.todos.filter(function (todo) {
				return !todo.completed;
			});
		},
		getCompletedTodos: function () {
			return this.todos.filter(function (todo) {
				return todo.completed;
			});
		},
		getFilteredTodos: function () {
			if (this.filter === 'active') {
				return this.getActiveTodos();
			}

			if (this.filter === 'completed') {
				return this.getCompletedTodos();
			}

			return this.todos;
		},
		destroyCompleted: function () {
			this.todos = this.getActiveTodos();
			this.render();
		},

		// accepts an element from inside the `.item` div and
		// returns the corresponding index in the `todos` array

	    getIndexFromEl: function (event) {
			var id = event.closest('li').getAttribute('data-id');
			var todos = this.todos;
			var i = todos.length;

			while (i--) {
				if (todos[i].id === id) {
					return i;
				}
			}
		},

		create: function (event) {
			var input = event.target;
			var val = input.value.trim();

			if (event.which !== ENTER_KEY || !val) {
				return;
			}

			this.todos.push({
				id: util.uuid(),
				title: val,
				completed: false
			});

			input.value = '';

			this.render();
		},

		toggle: function (event) {
			var i = this.getIndexFromEl(event.target);
			this.todos[i].completed = !this.todos[i].completed;
			this.render();
		},

		editingMode: function (event) {
			//debugger;
			var inputLi = event.target.closest('li');
			inputLi.className = ('editing');
			var input = inputLi.querySelector('.edit');
			var tmpStr = input.value;
			input.value = '';
			input.value = tmpStr;
			input.focus();
		},


		editKeyup: function (event) {
			//debugger;
			if (event.which === ENTER_KEY) {
				event.target.blur();
			}

			if (event.which === ESCAPE_KEY) {
				var temp = event.target;
				temp.setAttribute('abort',true);
				temp.blur();
			}
		},

		update: function (event) {
			var el = event.target;
			var val = el.value.trim();
			
			if (el.getAttribute('abort')){
				el.setAttribute('abort',false)
			}
			else if (!val) {
				this.destroy(event);
				return;
			} else {
				this.todos[this.getIndexFromEl(el)].title = val;
			}

			this.render();
		},

		destroy: function (e) {
			this.todos.splice(this.getIndexFromEl(e.target), 1);
			this.render();
		}
	};

	App.init();
})();
