// Get indicators and modules
model.getMetadata = function(callback){
	http().get('/statistics/indicators').done(function(result){
		if(typeof callback === 'function'){
			callback(result);
		}
	});
};

model.generation = function(query, callback, errorCallback) {
		http().postJson('/statistics/generation', query).done(function(result){
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

model.getData = function(query, callback, errorCallback){
	http().postJson('/statistics/data', query).done(function(result){
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

// getting all the structures and related structures from current user
model.getSubstructures = function(callback) {
	var url = '/statistics/substructures';
	http().get(url).done(function(result){
		if(typeof callback === 'function'){
			callback(result);
		}
	});
}

model.build = function() {
	// custom directives loading
	loader.loadFile('/statistics/public/js/additional.js');
};