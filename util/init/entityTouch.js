var fs = require('fs');


var mongoDriver = require('./../../build/server/mongoDriver.js');
var config = require('./../../build/server/config.js');

var universalDaoModule = require('./../../build/server/UniversalDao.js');
var schemaRegistryModule = require('./../../build/server/schemaRegistry.js');

var universalDaoControllerModule = require('./../../build/server/UniversalDaoController.js');
var eventSchedulerModule = require('./../../build/server/eventScheduler.js');

var path = require('path');
var async = require('async');


var util = require('util');
var stream = require('stream');


var schema=null;

process.argv.forEach(function(val, index, array) {
	console.log(index + ': ' + val);
});

console.log('file to process', process.argv[2]);

if (process.argv[2]) {
 	schema =  process.argv[2];
}

var itemsSaved=0;

mongoDriver.init(config.mongoDbURI, function(err) {
	if (err) {
		throw err;
	}

	var schemasListPaths = JSON.parse(
		fs.readFileSync(path.join(config.paths.schemas, '_index.json')))
		.map(function(item) {
			return path.join(config.paths.schemas, item);
	});

	var schemaRegistry = new schemaRegistryModule.SchemaRegistry({schemasList:schemasListPaths});

	var eventScheduler = new eventSchedulerModule.EventScheduler(mongoDriver,{});

	var eventSchedulerCalls = [];
	var udc = new universalDaoControllerModule.UniversalDaoController(mongoDriver, schemaRegistry,{emitEvent:function(eventType,eventData){
		eventSchedulerCalls.push(
			function (callback){
				var fireTime=new Date().getTime()+5000;
				console.log('s');
				eventScheduler.scheduleEvent(fireTime,eventType,eventData,null,callback);
			}
		)
	}});

	go(udc,schema,eventSchedulerCalls,function(err){ if(err){console.log(err)} mongoDriver.close(); console.log('Items saved',itemsSaved); });

});



function go(udc,schema,eventSchedulerCalls,callback) {

	var req={params:{schema:schema},body:{limit:1000000}};
	req.perm={'Registry - read':true};

	var res=function (){
		this.send=function (code ,data){
			console.log(code,data);
		};
		this.status=function (status){
			console.log(status);
			return this;
		};
		this.json=function(data){
			iterateData(data,udc,eventSchedulerCalls,callback);
		};
	};

	req.perm={"Registry - read": true};
	util.inherits(res, require('stream').Writable);
	res= new res();
	udc.searchBySchema(req,res);

}


function iterateData(data,udc,eventSchedulerCalls,callback){

	console.log('Data fully read',data.length);
	var toCall=data.map(function (item){

		return function(cb) {
			saveItem(item,udc,cb);
		};
	});

	async.parallelLimit(toCall,10, function(err){
		if (err){
			console.log(err);
		}
		async.parallelLimit(eventSchedulerCalls,10,callback);

	});

}

function saveItem(item,udc,callback){

		var req={currentUser:{id:-1},params:{schema:schema},body:item};
			var res=function (){

			this.send=function (code ,data){
			 console.log("save res",code,data);
			itemsSaved++;
			 callback();
			};

			this.status=function (status){
				console.log(status);
				return this;
			};

			this.json=function(data){
				console.log('.');
			  itemsSaved++;
			 callback();
			};

	};

	util.inherits(res, require('stream').Writable);
	res= new res();
	req.perm={"Registry - write": true};

	udc.saveBySchema(req,res,function (err){
		if (err) console.log(err);
	});


}
