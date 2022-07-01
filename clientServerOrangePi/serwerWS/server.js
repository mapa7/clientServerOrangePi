const os=require('os');
const express=require('express');
const WebSocket=require('ws');
const myModules=require('./myModules/myModules');

const app=express();
const http=require('http');
const portPageServer=3000;
const portControlServer=2999;

const httpServer=http.createServer(app);
app.use(express.static(__dirname + '/View'));
app.use(express.static(__dirname + '/Script'));
app.use(express.static(__dirname + '/Images'));
const pageWss=new WebSocket.Server({'server':httpServer});
const controlWss=new WebSocket.Server({port:portControlServer});
//
const eventPath='Logs/event.txt';
const plannedPath='Logs/planned.txt';
//
var year;
var month;
var day;
var stringActDateDdMmYyyy="99.99.9999";


var hours;
var minutes;
var seconds;
var stringTimeHhMm="99:99";
var stringActTimeHhMmSs="99:99:99";


//data to page variables

var toPageDataJSON = {
	taskPlanned: "",
	eventLogged: "",
	connState:"false",
	rectColor: "red",//off=red,on=lime
};


//task planning
function PlannedTaskReading(callback)
{
myModules.TaskReading(plannedPath,function(timeArray,taskArray)
{
	for(i=0;i<timeArray.length;i++)
	{
		var tmpTask;
		if(taskArray[i]==="on")
		tmpTask="Załączenie";
		else if(taskArray[i]==="off")
		tmpTask="Wyłączenie";
		else
		tmpTask="";

		toPageDataJSON.taskPlanned+=timeArray[i]+" <=> "+tmpTask+os.EOL;
		callback();
	}
});
}


myModules.EventReading(eventPath,function(data){
	toPageDataJSON.eventLogged=data;
});

//myModules.TaskPlanning("12:00:00","on",plannedPath);
/*
myModules.TaskRemove("11:00:00","off",plannedPath);
*/

//data logging

//myModules.EventLogging("12:00:54","12.12.2018",1,0,eventPath);


//server
httpServer.listen(portPageServer, function () {
    console.log('Example app listening on port: '+portPageServer);
});

app.get('/',function(req,res){
    res.sendFile('index.html');
});


//page socket
//ws broadcast to all.
pageWss.broadcast = function broadcast(data) {
	pageWss.clients.forEach(function each(client) {
	  if (client.readyState === WebSocket.OPEN) {
		client.send(data);
	  }
	});
  };

//on connection
pageWss.on('connection',function connection(ws, req) {

const ip = req.connection.remoteAddress;
console.log('Podłączony nowy klient o adresie: '+ip);

PlannedTaskReading(function(){
	UpdatePageData();
});
//on message
ws.on('message',function (data) {
	var jsonData=JSON.parse(data);

	if(jsonData.plannedTime==="now"&&jsonData.plannedTask==="on")
	{
		console.log("ON");
		controlWss.broadcast("on");
	}
	else if(jsonData.plannedTime==="now"&&jsonData.plannedTask==="off")
	{
		console.log("OFF");
		controlWss.broadcast("off");
	}
	else
	{
		console.log("inna opcja");
		myModules.TaskPlanning(jsonData.plannedTime,jsonData.plannedTask,plannedPath);
		PlannedTaskReading(function(){
			UpdatePageData();
		});
	}

	});
//on close
ws.on('close',function(ws){
	console.log('Klient zakończył połączenie');
	});

ws.isAlive = true;
ws.on('pong', heartbeat);
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////
//control socket
//ws broadcast to all.
controlWss.broadcast = function broadcast(data) {
	controlWss.clients.forEach(function each(client) {
	  if (client.readyState === WebSocket.OPEN) {
		client.send(data);
	  }
	});
  };

//on connection
controlWss.on('connection',function (ws,req) {
const ip = req.connection.remoteAddress;
console.log('Orange Pi o adresie '+ip+' połączył się z serwerem');
toPageDataJSON.connState="true";
pageWss.broadcast(JSON.stringify(toPageDataJSON));

//on message
ws.on('message',function (data) {
	if(data==="on-ack"||data==="off-ack")
	{	
		var eventCode=99;
		if(data==="on-ack")
		{
		toPageDataJSON.rectColor="lime";
		eventCode=11;
		}
		else
		{
		toPageDataJSON.rectColor="red";
		eventCode=10;
		}
		myModules.EventLogging(stringActTimeHhMmSs,stringActDateDdMmYyyy,1,eventCode,eventPath,function()
			{
				myModules.EventReading(eventPath,function(data){
					toPageDataJSON.eventLogged=data;
					UpdatePageData();
						
				});
			}
		);
		console.log(data);
	}
	else
	{
		console.log("Nieznana wiadomość od Orange Pi: "+data);
	}
});

//on close
ws.on('close',function(ws){
	console.log('Orange Pi zakończył połączenie');
	toPageDataJSON.connState="false";
	UpdatePageData();
	});

	ws.isAlive = true;
	ws.on('pong', heartbeat);
});

//zamykanie nieaktywnych połączeń
function noop() {}

function heartbeat() {
this.isAlive = true;
}

const pageWssClientsInterval = setInterval(function ping() {
  pageWss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) 
	{
	return ws.terminate();
	}
    ws.isAlive = false;
    ws.ping(noop);
  });
}, 30000);

const controlWssClientsInterval = setInterval(function ping() {
	controlWss.clients.forEach(function each(ws) {
	  if (ws.isAlive === false) 
	  {
	   console.log("Zerwane połączenie z Orange Pi");
	   toPageDataJSON.connState=false;
	   UpdatePageData();
	  return ws.terminate();
	  }
	  ws.isAlive = false;
	  ws.ping(noop);
	});
  }, 30000);

DoActTasks();
function DoActTasks(){
	myModules.TaskReading(plannedPath,function(timeArray,taskArray)
	{
	for(i=0;i<timeArray.length;i++)
	{
		var result= myModules.CompareTwoTimeString(stringTimeHhMm,timeArray[i]);
		if(result===0)
		{
			console.log("Wysłano: "+taskArray[i]);
			controlWss.broadcast(taskArray[i]);
			myModules.TaskRemove(timeArray[i],taskArray[i],plannedPath);
		}
	}
	});

	setTimeout(function() {
		DoActTasks()}, 500);
}


//display number connected clients
setInterval(function () {
	var cnt=0;
	//console.log(pageWss.clients);
	 pageWss.clients.forEach(function each(ws) {
	 cnt++;
	 });
	console.log("Liczba podłączonych klientów: "+cnt);
},10000);


function UpdatePageData()
{
	pageWss.broadcast(JSON.stringify(toPageDataJSON));
}

//date time functions
UpdateTime();
function UpdateTime()
{
seconds=myModules.GetSeconds();
minutes=myModules.GetMinutes();
hours=myModules.GetHours();

year=myModules.GetYear();
month=myModules.GetMonth();
day=myModules.GetDay();

stringTimeHhMm=hours+":"+minutes;
stringActTimeHhMmSs=hours+":"+minutes+":"+seconds;

stringActDateDdMmYyyy=day+"."+month+"."+year;

    setTimeout(function() {
		UpdateTime()}, 1000);
}

ShowTime();
function ShowTime()
{
	console.log(stringActTimeHhMmSs);
	console.log(stringActDateDdMmYyyy);
	setTimeout(function() {
		ShowTime()}, 10000);
}
