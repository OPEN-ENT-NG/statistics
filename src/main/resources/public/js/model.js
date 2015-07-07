// Get indicators and modules
model.getMetadata = function(callback){
	http().get('/statistics/indicators').done(function(result){
		if(typeof callback === 'function'){
			callback(result);
		}
	});
};


model.getData = function(query, callback, errorCallback){
	var url = '/statistics/data?' + query;
	http().get(url).done(function(result){
		if(typeof callback === 'function'){
			callback(result);
		}
	}).e400(function(e){
		var responseText = JSON.parse(e.responseText);
		notify.error(responseText.error);
		if(typeof errorCallback === 'function'){
			errorCallback();
		}
	});
};

model.getStructures = function(query, callback){
	var url = '/statistics/structures?' + query;
	http().get(url).done(function(result){
		if(typeof callback === 'function'){
			callback(result);
		}
	});
};

model.build = function() {
	// custom directives loading
	loader.loadFile('/statistics/public/js/additional.js');
};