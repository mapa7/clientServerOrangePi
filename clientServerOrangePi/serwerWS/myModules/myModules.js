const fs=require('fs');
const os=require('os');
//
exports.TaskPlanning=function(time,type,filename)
{
var task;
if(type==="on"||type==="off")
{ 
task=time+";"+type+os.EOL;
fs.appendFile(filename,task,function(err){
if(err) throw err;
console.log('Saved new task: '+time+' <=> '+type);
});
}
}
//
exports.TaskReading=function (filename,callback)
{
var timeArray=[];
var taskArray=[];	
fs.readFile(filename,'utf8',function(err,data){
    if(err) 
    {
    console.log("Odczyt pliku: Brak lub uszkodzony plik planowania zadań!");
    }
    else
    {
	var Rows=data.split(os.EOL);
	if(Rows.length>2)
	{
		for(i=0;i<Rows.length;i++)
		{
			var Cols=Rows[i].split(';');
			if(Cols.length==2&&Cols[0][2]===":"&&(Cols[1]==="on"||Cols[1]==="off"))
			{
			timeArray.push(Cols[0]);
			taskArray.push(Cols[1]);			
			}
		}
		callback(timeArray,taskArray);

	}
	}	
});
}
//
exports.TaskRemove=function(time,task,filename){
fs.readFile(filename,'utf8',function(err,data){
if(err) 
    {
    console.log("Odczyt pliku: Brak lub uszkodzony plik planowania zadań!");
    }
    else
	{	
	var oldData;
	var newDataArray=[];
	var newData="";
	var timeTask=[];
	oldData=data.split(os.EOL);
	for(i=0;i<oldData.length;i++)
	{
		if(oldData[i][2]===":"&&oldData[i][6]==="o")
		{
		timeTask=oldData[i].split(';');
			if(timeTask[0]==time&&timeTask[1]==task)
			{
			console.log("Removed task!");
			}
			else
			{	
			newDataArray.push(oldData[i]);
			}
		}
	}
	for(i=0;i<newDataArray.length;i++)
		{
			newData+=newDataArray[i]+os.EOL;
			if(i==newDataArray.length)
			{
				newData+=newDataArray[i];
			}
		}

			fs.writeFile(filename,newData, function (err) {
			if (err) throw err;
			console.log("File updated!");
		}); 
	}
});
}
//
exports.EventReading=function(filename,callback)
{
fs.readFile(filename,'utf8',function(err,data){
    if(err) 
    {
    console.log("Odczyt pliku: Brak lub uszkodzony plik logowania zdarzeń!");
    }
    else
    {
    //the newest event first
	var splitData=data.split(os.EOL);

	splitData.reverse();

	var eventData="";
	for(i=0;i<splitData.length;i++)
	{
		eventData+=splitData[i]+os.EOL;
	}
	callback(eventData);
    }	
});
}
//
exports.EventLogging=function(time,date,point,type,filename,callback)
{
var textEvent;
var eventPoint;
var textLog;

switch(type){
case 00:
textEvent="Wysłano żądanie wyłączenia";
break;
case 01:
textEvent="Wysłano żądanie załączenia";
break;
case 02:
break;
case 03:
break;
case 10:
textEvent="Potwierdzenie wyłączenia";
break;
case 11:
textEvent="Potwierdzenie załączenia";
break;
default:
}

if(point===0)
eventPoint="Serwer";
else if (point===1)
eventPoint="Klient";
else
eventPoint="Undefined";

textLog=os.EOL+time+" "+date+" <=> "+eventPoint+" <=> "+textEvent;
console.log(textLog);
fs.appendFile(filename,textLog,function(err){
if(err) throw err;
console.log('Saved new event!');
if(typeof callback==='function')
{
callback();
}
});
}
//
exports.GetSeconds=function(){
const currentDate = new Date();
return leadingZero(currentDate.getSeconds());
}
//
exports.GetMinutes=function(){
const currentDate = new Date();
return leadingZero(currentDate.getMinutes());
}
//
exports.GetHours=function(){
const currentDate = new Date();
return leadingZero(currentDate.getHours());
}
//
exports.GetYear=function(){
const currentDate = new Date();
return currentDate.getFullYear();
}
//
exports.GetMonth=function(){
const currentDate = new Date();
return leadingZero((currentDate.getMonth()+1));
}
//
exports.GetDay=function(){
const currentDate = new Date();
return leadingZero(currentDate.getDate());
}
//
function leadingZero(i) {
    return (i < 10)? '0'+i : i;
}

exports.CompareTwoTimeString=function(firstTime, secondTime)
{
	var arrayFirstTime=firstTime.split(":");
	var arraySecondTime=secondTime.split(":");
	
	var intFirstTimeHH=parseInt(arrayFirstTime[0]);
	var intFirstTimeMM=parseInt(arrayFirstTime[1]);
	
	var intSecondTimeHH=parseInt(arraySecondTime[0]);
	var intSecondTimeMM=parseInt(arraySecondTime[1]);

	if((intFirstTimeHH>intSecondTimeHH)||(intFirstTimeHH===intSecondTimeHH&&intFirstTimeMM>intSecondTimeMM))
	return 1;
	else if ((intFirstTimeHH<intSecondTimeHH)||(intFirstTimeHH===intSecondTimeHH&&intFirstTimeMM<intSecondTimeMM)) 
	return 2;
	else if(intFirstTimeHH===intSecondTimeHH&&intFirstTimeMM===intSecondTimeMM)
	return 0;
	else
	return -1;
}

