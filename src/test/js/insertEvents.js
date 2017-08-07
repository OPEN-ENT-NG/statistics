/* 
Script to insert events in mongodb.
You have to set ids structures table before launching this script
Use the following command to execute it : mongo --shell databaseName --eval 'var firstDay=1498860000000;lastDay=1501452000000;' insertEvents.js
firstDay and lastDay are in ms
*/

const usage = "MISSING PARAMETERS OR STRUCTURES LIST IS EMPTY : insertEvents.js script can't be executed." +
	"\nExample : mongo --shell databaseName --eval 'var firstDay=1498860000000;lastDay=1501452000000;nbUsers=10000;' insertEvents.js" +
	"\nWarning : You have to set ids Structures table before launching this script.";

// ids structure table
var structures = ["87251b48-62c8-4d33-988e-688632fa7dd9","267ff30c-633b-4ab3-8590-898339d270a9","7985d7c1-902e-403e-a17d-060503b58ed4","180a4ae3-6e21-44d9-9312-cd30ad424f99","4fa2f7d2-b8c6-4d1a-9f3f-a6fc49b9aba9","91104e22-5fab-4e1b-b400-2b05af13fd0e","0a40b372-5fa9-4200-8d56-d875be25f266","36ce5655-3a00-4fd0-8362-0fee68b31bed","db9ad72b-d95f-450c-82c6-e89ae3a56ccf","588c6839-67d4-4557-825a-78082b6feb7c","4e0fb4f6-d35b-49de-b75d-3ed054255472","dc296c05-353a-4466-a62a-ab1303104a5b","1b452581-35c0-40ca-bfe0-e7d6c131cd23","60c5a17e-bfaa-49b3-b8ae-e3195dd965bf","6a490b65-98ec-4811-9a49-dd4c9c51a7d2","adde3862-4426-4469-9bc2-b22489507dff","4db12bf5-102b-42a2-9011-bd4d211867f0","90eea656-7071-4b3c-8478-c0d6d93f4f42","ab4bfa2d-f66b-4153-878f-eb5936255b3d","54d5e499-88eb-4edc-a28a-510f62abd1a3","cf078461-c236-4311-bd28-607411bf9004","a1c29426-8294-4be6-a095-c41ab1e23a2c","14a11a05-7e03-43f1-86b0-177de62d0dc1","8ddc2f88-54be-4fee-adf5-9586d74f1a00","74e85be7-2325-4ce1-bd8d-645f046a32b1","e197bce3-67f2-4f92-a626-9099007399a1","6a7ed4f6-952a-4f09-9095-5995ce3ddec5","af85fab1-e8a8-44b8-a942-56e825403163","5afe67f8-81a5-44d8-b7db-e4c629891497","2ffb578f-a3e9-4e6a-b9b8-1ff21c9b223c","addf02a2-0de4-433c-aa61-c654321b7d52","7c097e05-a3bb-440c-8e1f-89631f634d49","f9513dc6-9f3f-4bc4-ba9f-091eb631d1ac","e0ba0e57-6cc2-42fe-a747-8856993d5547","7553fdeb-5ee9-4126-9e58-6d6bad2b320a","c8d74acc-38b4-4753-be3f-3cc58cfe7710","70ec0c5f-584f-43ee-8b34-06a83e1135dc","a1ca6bea-40af-4abe-b86d-61b312a338b2","ec5b342f-95b4-4bcb-991a-720f2bcde44f","2e1a96fb-f051-460f-beff-156ef4d90e08","07e4ee22-70de-4008-9fc2-425164259fa9","1b506ef6-4832-4ed1-9276-77dca2ef9b6a","5db0aaf7-f5a6-4700-a476-1bcbdf4f5b75","2bb2caa6-17af-4817-aec2-4dd08686d087","77f7c011-04c3-4b0a-aa02-9d2fd512cc44","e130fc55-d947-4789-9b32-5d276f995451","15b5901b-ecc4-42a0-9449-46dbfcef7e8f","34e4ff44-7a15-4efb-b70b-57ae4bc60a39","ad860938-bc43-4947-b1c4-5026639634f2","21823f44-079c-42b6-88a9-ab3216c87313","97387a0c-96e9-4c98-bda8-3f810ed5c471","02bcb34e-5562-4f79-a08c-4e3c702cc30f","758f49aa-c535-42f4-9457-8a791c392f88","99b4a119-8852-479a-8e82-1317cb8e9665","57bf7e50-f7c0-409f-ac6f-847139cea6c0","cdbc8273-93b2-41d6-ac7b-5fcde0e72eff","6f1f00c1-f0f4-4ced-b1d3-680f5bc40828","953c7c0d-7793-45d2-a5ca-9aa5f8fc6331","be2f6f2d-26dd-4930-be5d-496251d866e0","77f72367-3ad8-4fc4-ab53-a6077810246e","cf9becef-d5b7-4d9f-8f14-b605d0558f5c","95c227dd-85e3-4e3a-848b-462534c50196","64508617-bfe4-4695-8185-3dafb0de2a55","e923bc48-498e-4e6f-b2df-14909f39d968","2440d9d0-26a1-483c-b7c9-7234c70c19f0","387242f7-49b5-4e37-a1ab-ab64a9dbea55","3cc34a44-f184-4d72-b72d-8a958ad1d024","6fd11039-23d9-4aee-9d08-c5d4d95b42f1","e300db45-ae7b-4555-a389-fd99b76be6e6","49e90bc3-f4c7-45eb-90f2-4890a934634e","d8099d9d-2362-4f63-90cd-ed3a37c5b2eb","5ef13d10-bf33-46dd-a24c-ba1a0493ad8f","fc945ee0-f287-4c03-aaf4-bf3ee06351a4","8c941d99-eefa-46c6-83d8-22e25abfe5bf","3f96342a-0f70-49ee-9fd1-10daec8b94b8","4d691f7f-d567-4cdc-8ed5-1ae742bc5a68","96f8cb59-2105-42d8-8aa6-e390783500b5","61a53199-0777-48f4-9b4a-ab818c8397b4","44d75b1c-55f5-4d97-ac9b-3efc444b5584","83da2b6b-456d-4c4b-94d1-92b6ec5bda89","cad3db57-f506-4f6c-970f-f73514d57f56","20a42ce8-b270-478a-ad25-bf3e17540d88","61439f0d-2b38-488f-a433-f24ee41e54bb","43fecc1e-8759-4bc1-bdea-4d3845218b6e","c50c59bd-ca16-4b76-95ec-e73f6f2f018c","798e039c-3c2f-45e1-9bf6-cd301239dfaf","caaa567a-15a1-49cc-ba54-de3c98b750cc","23e72d3e-72d6-4e54-ab9d-bb79ddf9d219","8b02bd67-8f96-40f7-90cb-2c2098c9957e","f070ca1d-2b67-45fe-b583-7bec70426ce9","24525e84-6e3d-459c-ad4a-1f6f55d97fad","8dd83398-df78-4c1a-b298-d1d42669e5d2","d511f336-5d77-4480-b904-b89c8c9a8191","a0a4badb-fb52-44af-a34b-b2a2aa9cd2d0","f20775f7-0f0f-40e9-8257-43b5912a36f5","202aa809-183f-419b-ba3f-4902edee7fbc","40ec12fd-f3a1-4f6f-98ac-08632a08d8e2","763262eb-6108-4967-b3b6-1a8e487b3c86","87507c23-12cf-4a47-9a78-db141be5dcbc","e9964bd7-76aa-40ff-8fda-527c75713cc7","63b94526-1ee8-4f93-b01d-66b9ca122573","c3ba3a08-7cf7-47b6-94d0-91004f6598d5","ad968881-6b8f-4b8e-a2ad-bcef48af10d0","3e05b839-5159-4230-add2-12875c96a3ee","4c16ac9c-676c-4def-88e7-b230c2e4123b","ed8b6ab0-4d9f-499d-b9a5-074c8ec541d2","fc6831e4-4280-46bb-8b70-0840276c45f3","a73ec90a-f4b9-4485-ada1-b55a6704090a","b80e945a-8973-4943-bd35-c0a3c789a595","ac9e00ea-dad1-4b29-af5b-5a18f576ce4a","74c7bf31-9b0c-4672-82c1-1897fc33ab5a","e91fa91e-4a05-477a-aa2f-5f7ed0448ce0","21d50115-292f-4d1f-8c1d-f2f594449d65","722b5d32-5afb-43d9-9da6-cae97ce72400","86594756-ac1b-4552-acec-b96e195cb828","b74ed5cf-e362-4dd2-af32-a047f0a32fc4","577fbc3f-2a8d-43c5-bf26-b8ab4b474570","183055b8-7b6d-49c2-8e21-1016c37fc4f4","6d69e8c9-98bd-4dac-bdd0-36f4a7b6e025","096f4215-a05a-4ff6-89ce-9f782b578c8f","5218339d-4cc2-4811-9f02-3be8a798f0eb","40468c43-1aec-4ece-9871-addd3cce2f9f","3ff88dcc-9c04-4679-8b3c-6f958e7198d4","25a502fc-56c3-420b-b161-e0ffd81f9b97","d8e705d2-9857-4e50-88ab-90b2f215ba73","9e15bae5-8e5c-4c97-a79d-b589c4e9febe","060f21af-dc89-405d-854d-bd8f3169f075","927a149f-cce9-4232-a70f-aa409ee0e7ee","1d6d569c-cb6b-4df7-b19e-af8d0cf69005","306ce64c-5652-41cf-bc7c-2b8111be0b7d","b0f97762-0c9c-4cc2-bc2a-a6333ffccf2c","199fb3a3-e8df-4c23-b0cf-5f4ae4a9af71","124d911d-7260-4079-baf0-54d00b7d0c6b","5adbe4cb-5e42-483d-940b-3fd5db7cd343","7e7a2b59-fa63-4058-ab67-28bfedb1b0ee","4d06965d-2eb1-427e-9613-e1c954d60f0d","02e23cc9-7184-4e6f-a648-287cd7e054dc","4cf43171-368c-48d0-92ac-1e8964bfc71b","8b090bfe-954f-43a2-a2c1-7eeab190588b","e1fa56ac-5364-4a91-b31b-08c52a93de52","6e7b1c51-8442-438c-bc93-a7f2122825cb","3a017213-afaf-4a92-af74-d2f71e056f88","822cce33-d7e3-404d-bad0-8468217e890d","e94ab145-b09e-473d-b4fc-a78c04a7861d","78e6b3bb-9317-4949-ae8e-4bac6fa0a2cf","303962e5-5850-43f9-a00c-6e46c49e6be3","b2174059-fcbd-4be8-9b7b-2db93ed3c4c4","fd330b1c-b5c3-4b69-929a-f1ccefbc31fb","2b694d36-e6c0-461b-9a2c-4a63ca97b4e1","ef5b2be0-67b8-431e-9903-a14aadd252a2","ebf75677-df43-4c88-a835-4fbf3282d76e","648fbac5-b007-4504-806f-9a0b880eda21","27a76005-50d6-4fc5-ab28-476ab75e3253","5bfe59d5-b582-4edd-b2b0-0c1700fcf811","6ca7f89e-030e-4521-ae1b-790ba0e8ad4a","6a84ceb3-dfbd-41dd-8a40-d97396cfbc07","f846c4eb-00aa-4240-961f-17d3ad5403a5","4d19d524-0dcb-4e71-9d5c-7568542bdf5f","6951dbed-9168-4d16-8b25-aee94392b434","1168b583-ff88-4d02-b9a2-00b09769839e","437511c4-250f-4fe4-b562-301f84607d08","8ccd1d64-7aac-4176-be7e-440b44c40761","3ca9db74-2935-4181-bec4-5d3f76d468a2","6eb2210d-7edd-429e-85ab-9f6b03dc99d3","6b84cef5-e2b3-4f40-aa39-011191f672d3","8c438eec-637e-4547-801a-8ade1c8b7fd8","fad60539-fc55-458c-8273-768d89b17665","ceb2ffa2-ff94-44d8-bc45-60c3f6b54d5a","d0454654-6854-4724-82dd-f119da11f392","3a759842-a362-437e-a87f-e5e00510e125","481c2570-19ed-4c05-914c-281ee012242a","38b29754-7acd-46c8-a973-21d9413677cc","23f0f686-bde8-487d-8741-91a86a358591","84121086-4ffa-490a-a1f3-7b6c05910c8c","05e3bd89-1712-480a-9671-2cfceff470e8","7d683f39-1560-4d8b-aabb-01f3dd9d9abd","1fd971fe-1ceb-4b72-8b4d-dbbf6a93e7a0","7544011a-bbd7-4174-9ce6-ea4ef020f7bd","e288bb89-c9d0-4f23-8280-6af1c7fae795","0c76001d-90e7-4608-98f4-7e764f3016ac","3a3c85b8-9f62-430b-80e8-90c0b44d92eb","30571e19-71b9-48c2-9030-e53450303850","b0262750-a42f-45a2-b73e-80b68d861c81","5deb1d8b-83d5-458c-a556-4f4340ea2e4d","16c825ff-13b8-4736-b57b-87729e0a0d5b","31ab6052-6931-430e-9f11-c93db8ea406d","08cc7a51-3296-4924-b163-55a2d96749f9","dd8b4c91-3c68-4a26-96ac-d1698291857f","37fee0d5-fa81-4137-ad82-8b9abc84ffb9","54c4196c-1f67-4eb0-9fc7-06c71e859907","f5919cf5-7eac-438f-902b-7c705557e484","320834e4-3973-4e73-a3ce-06e4b8cca1f4","5a555de0-b1ff-48bf-8218-e21bc52437c5","44520bf0-3051-48fe-a41b-efc9eb0d7e0a","68173ba6-ed79-4b35-b8b1-fcd571698f6b","95f2997e-293e-4381-b06a-7722cfd56b38","06848880-f446-4674-957f-36dc33c0ec58","e21b5e96-21d5-4802-b53d-bc27a307fbad","eb99f538-f062-4019-a0a9-bc4deb3529cf","b8dbe734-8a44-4d9e-b62a-08c86ecf6352","fe4d3718-e0df-43fb-82f1-2bea85c6fdd6","aa46cfb6-e428-492e-9501-e86371722e2f","27801107-2bbe-4fe2-b41b-5124ba0d2b80","6e19154b-5be9-4ada-92fe-99f97b22a64e","19fff87c-fbfd-49d7-9826-a5984fcd783d","23eaeea7-e4a9-42c1-ba7f-6182d9b4356d","a2ba96b4-6f3b-4272-ba77-bbef2dea7c26","82b03b3f-7a36-40ea-a69b-07110dbd3b57","cffd8951-4a66-41e4-995a-b14398820565","f9bfad99-c101-42b5-b9e9-6082ea3447c2","3b4c8fd2-0ee7-43f3-a7ec-d3a4be2ab2cd","6b179125-222b-412b-9f93-ce758f5655dd","94eb928b-e722-47da-9ffe-b5015e7d7ba2","cffb454a-d62b-4509-bdac-f6144af79738","cbb81ddb-74ab-4d5b-87f3-fa9f50d27285","6ca84be9-f457-4a78-9b4e-90c8aa34e1fd","61fa6c59-c66f-47b3-a0ed-e57df88bd631","71a0478f-adda-4ae4-b5fb-40b609bcf9bb","bb5e05f8-7ff3-41dc-998b-767a53f3aa5c","bb102bd8-4ae2-4348-aec3-5d8a7ea679ee","d9667741-8e5e-4b21-976c-bf733d7633cf","b6e259b4-16a2-4b54-add2-5ea750bfcfdd","af84d1ac-53af-48dc-a0d5-fa3759c62361","25548b0c-12a2-4af1-872c-80f975fb5efc","a1df4e0a-3ebf-4bb2-8afa-f4d8625fe266","6c4f4351-2cde-41a1-a513-3c5cca74dfdc","aba146cf-4e35-40db-9863-7179cb3bfaa1","3f994252-ad80-4ed7-9431-6c21bc5d413c","6bfdb882-8f7e-4fce-b296-be786fc12143","eb1c5396-6f01-405f-8c69-955e63b82a07","9b967d3e-9290-413f-8180-f58fc1e80e85","b407d168-3987-4a1e-b17b-30bc9b1b4647","53253611-b421-4232-8209-6a8e1cf075c3","00413db9-141a-488b-8ae8-29b3802ad18f","3b9a3875-9c50-45af-81ca-885343729107","bbce869a-d4d0-45ee-b26d-2ec7afc39036","88a5a067-4914-4a24-95c0-98129527ba3d","f2ccd05a-d3a8-4142-b604-114ebfe40066","57bbdf6c-328b-488d-b958-2c612f74a2e4","a7d2a3f3-d5ea-4dfc-bfff-5915a2a4f4c1","8f09dd4e-e6d1-4065-8481-7c00a07f3bd2","a11bec31-d25f-4b55-a116-e46718a1905e","76dc532c-337b-43fb-9b2a-75ab906bacf8","1772cec4-6eca-4092-975f-8c3e942e2b17","757b81bb-1549-46ef-803f-d7e49fefbd70","003c3133-9470-409d-8564-a177d492209d","4abd82fe-9da1-4964-adcf-2a74345ee6d5","1a2707e9-f5cc-4eab-babf-03d82c956323","e57722e2-fef0-4a28-942d-6f9256a6b21f","b89b32f3-e9aa-4c2b-a617-77218c8d91e3"];


if ((typeof firstDay === 'undefined') || (typeof lastDay === 'undefined') || (typeof nbUsers === 'undefined') || (typeof structures === 'undefined') || (structures.length === 0)) {
    print(usage);
    quit(1);
}

// Returns a random integer between min (included) and max (excluded)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Return the next day. Parameter "time" must be in milliseconds since standard epoch of 1/1/1970
function getNextDay(time) {
  return time + 86400000; // + 1 day
}

var mongoCollection = "events";
var bulkExecutionThreshold = 900; // Each group of operations can have at most 1000 operations. If a group exceeds this limit, MongoDB will divide the group into smaller groups of 1000 or less. (according to http://docs.mongodb.org/v2.6/core/bulk-write-operations/#bulk-execution-mechanics)
var bulk = db[mongoCollection].initializeUnorderedBulkOp();
var start = new Date();


print(new Date() + " : BEGIN : Add events between (ms) : " + firstDay + " and : " +lastDay);

var maxNbStructuresPerUser = 3;
var maxNbLoginPerUser = 5;

var minNbAccessPerUser = 8;
var maxNbAccessPerUser = 12;


var profiles = ["Teacher", "Student", "Personnel", "Relative", "Guest"];


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
print(new Date() + " : END : Add events between (ms) : " + firstDay + " and : " +lastDay);