/* 
Script to insert dummy events in mongodb. 
Use the following command to execute it : mongo --shell databaseName insertDummyEvents.js
*/


// Returns a random integer between min (included) and max (excluded)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Return the next day. Parameter "time" must be in milliseconds since standard epoch of 1/1/1970
function getNextDay(time) {
  return time + 86400000; // + 1 day
}

var mongoCollection = "dummyEvents";
var bulkExecutionThreshold = 900; // Each group of operations can have at most 1000 operations. If a group exceeds this limit, MongoDB will divide the group into smaller groups of 1000 or less. (according to http://docs.mongodb.org/v2.6/core/bulk-write-operations/#bulk-execution-mechanics)
var bulk = db[mongoCollection].initializeUnorderedBulkOp();
var start = new Date();


// Dates of events to insert
var firstDay = 1427846400000; // Wed, 01 Apr 2015 00:00:00 GMT
var lastDay = 1430438400000; // Fri, 01 May 2015 00:00:00 GMT


var nbUsers = 175000;
var nbStructures = 100;
var maxNbStructuresPerUser = 3;
var maxNbLoginPerUser = 5;

var minNbAccessPerUser = 8;
var maxNbAccessPerUser = 12;


var profiles = ["Teacher", "Student", "Personnel"];

var structures = [];
for(var i=1; i<=nbStructures; i++) {
  structures.push("dummyStructure_"+i);
}

var modules = [
	"Blog",
	"Workspace",
	"Conversation",
	"Actualites",
	"Support",
	"Community",
	"Forum",
	"Wiki",
	"Rbs",
	"Mindmap",
	"TimelineGenerator",
	"CollaborativeWall",
	"Poll",
	"Calendar",
	"AdminConsole",
	"Pages",
	"Rack",
	"Annuaire",
	"Archive"
];


// Insert events
for(var i=1; i<=nbUsers; i++) {
  // Init user data : id, profile and structures
  var userProfile = profiles[getRandomInt(0, profiles.length)];
  var userId = "dummyUserId_" + i;

  var nbStructuresForCurrentUser = getRandomInt(1, maxNbStructuresPerUser+1);
  var userStructures = [];
  var firstStructureIndex = getRandomInt(0, structures.length);
  userStructures.push(structures[firstStructureIndex]);
  for(var s=1; s<nbStructuresForCurrentUser; s++) {
  	userStructures.push(structures[(firstStructureIndex+s) % structures.length]);
  }


  if(bulk.nInsertOps >= bulkExecutionThreshold) {
  	bulk.execute();
    bulk = db[mongoCollection].initializeUnorderedBulkOp();  	
  }


  var startDate = firstDay;
  var endDate = getNextDay(startDate);
  var eventDate = getRandomInt(startDate, endDate);

  while (endDate <= lastDay) {
	  if(startDate === firstDay) {
	  	  // Insert ACTIVATION events only on the first day
		  bulk.insert({
		    "_id" : new ObjectId().str,
			"event-type" : "ACTIVATION",
			"module" : "Auth",
			"date" : new NumberLong(eventDate),
			"userId" : userId,
			"profil" : userProfile,
			"structures" : userStructures,
			"classes" : [
				"2e60bead-ed18-44c0-8b99-8b346a04e1bb",
				"e1422c7d-669a-435a-99b2-33e01ba6d0fd",
				"60ec02de-09a7-48d7-ba76-bed42c8e541d"
			],
			"groups" : [
				"383-1423239768916",
				"470-1423239773761",
				"943-1423239774840",
				"1057-1423239774990"
			]
		  });
	  }

	  // Number of connections per user is random (between 1 and maxNbLoginPerUser)
	  var nbLogin = getRandomInt(1, maxNbLoginPerUser+1);
	  for(var j=0; j<nbLogin; j++) {
          eventDate = getRandomInt(startDate, endDate);
		  bulk.insert({
		    "_id" : new ObjectId().str,
			"event-type" : "LOGIN",
			"module" : "Auth",
			"date" :  new NumberLong(eventDate),
			"userId" : userId,
			"profil" : userProfile,
			"structures" : userStructures,
			"classes" : [
				"2e60bead-ed18-44c0-8b99-8b346a04e1bb",
				"e1422c7d-669a-435a-99b2-33e01ba6d0fd",
				"60ec02de-09a7-48d7-ba76-bed42c8e541d"
			],
			"groups" : [
				"383-1423239768916",
				"470-1423239773761",
				"943-1423239774840",
				"1057-1423239774990"
			]
		  });
	  }

	  // Number of ACCESS events per user is random (between 1 and maxNbAccessPerUser)
	  var nbAccessEventsPerUser = getRandomInt(minNbAccessPerUser, maxNbAccessPerUser+1);
	  for(var k=0; k<nbAccessEventsPerUser; k++) {
		  var module = modules[getRandomInt(0, modules.length)]; // Random module
		  eventDate = getRandomInt(startDate, endDate);
		  
		  bulk.insert({
		    "_id" : new ObjectId().str,
			"event-type" : "ACCESS",
			"module" : module,
			"date" : new NumberLong(eventDate),
			"userId" : userId,
			"profil" : userProfile,
			"structures" : userStructures,
			"classes" : [
				"2e60bead-ed18-44c0-8b99-8b346a04e1bb",
				"e1422c7d-669a-435a-99b2-33e01ba6d0fd",
				"60ec02de-09a7-48d7-ba76-bed42c8e541d"
			],
			"groups" : [
				"383-1423239768916",
				"470-1423239773761",
				"943-1423239774840",
				"1057-1423239774990"
			]
		  });
	  }

	  startDate = getNextDay(startDate);
	  endDate = getNextDay(startDate);
  }
}

bulk.execute();

var insertDuration = (new Date().getTime() - start.getTime())/1000;
print("Inserts took : " + insertDuration + "s");
