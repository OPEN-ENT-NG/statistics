// Get indicators and module
model.getMetadata = function(callback){
	http().get('/statistics/indicators').done(function(result){
		if(typeof callback === 'function'){
			callback(result);
		}
	}.bind(this));
};

// Get data to display chart
model.getData = function(query, callback){
	var url = '/statistics/data?' + query;
	http().get(url).done(function(result){
		if(typeof callback === 'function'){
			callback(result);
		}
	}.bind(this));
};


model.build = function() {
	// custom directives loading
	loader.loadFile('/statistics/public/js/additional.js');
};