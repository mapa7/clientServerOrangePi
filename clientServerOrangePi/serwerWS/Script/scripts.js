var actYear;
var actMonth;
var actDay;
var actHours;
var actMinutes;


//ws
var ws=new WebSocket('ws://127.0.0.1:3000');
//page input elements
var connState=document.getElementById("connState");
var txtPlanned=document.getElementById("txtPlanned");
var txtLogged=document.getElementById("txtLogged");
var rect=document.getElementById("rect");
//page output elements
var buttonOn=document.getElementById("buttonOn");
var buttonOff=document.getElementById("buttonOff");
var inputTime=document.getElementById("inputTime");
var buttonAdd=document.getElementById("buttonAdd");
var switchOnOff=document.getElementById("switchOnOff");


var toServerPageJSON={
plannedTime:"99:99",
plannedTask:""
};

//functions
function leadingZero(i) {
    return (i < 10)? '0'+i : i;
}

//update time and date on page every 1[s]
function updDateTime() {
    const currentDate = new Date();
	actYear=currentDate.getFullYear();
	actMonth=leadingZero((currentDate.getMonth()+1));
	actDay=leadingZero(currentDate.getDate());
	
	actHours=leadingZero(currentDate.getHours());
	actMinutes=leadingZero(currentDate.getMinutes());
	
    const textDate = actDay + "." + actMonth + "." + actYear;
    const textTime = actHours + ":" + actMinutes + ":" + leadingZero(currentDate.getSeconds());

    document.querySelector('#date').innerHTML = textDate;
    document.querySelector('#time').innerHTML = textTime;

    setTimeout(function() {
		updDateTime()}, 1000);
}

//set value of input field on act time
function updInputProperty() {

inputTime.value=actHours+":"+actMinutes;
}
//comparison two times in hh:mm format, when
//-if second time is ealier than first return 1   
//-if second time is equal than first return 0
//-if second time is later than first return 2
//-other return -1 
function CompareTwoTimes(firstTime, secondTime)
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


//calling functions
//update time and date on webpage
updDateTime();
updInputProperty();

//data exchange
ws.onmessage=function(event)
{
if(typeof event.data==="string"){
var jsonObject=JSON.parse(event.data);
UpdatePageData(jsonObject);
}
}

function UpdatePageData(jsonObject)
{
	
	txtPlanned.innerHTML=jsonObject.taskPlanned;
	txtLogged.innerHTML=jsonObject.eventLogged;
	rect.setAttribute("fill",jsonObject.rectColor);

	if(jsonObject.connState==="true")
	{
	connState.style.color="lime";
	connState.innerHTML="POŁĄCZENIE OK"
	}
	else
	{
		connState.style.color="red";
		connState.innerHTML="BRAK POŁĄCZENIA"
	}
}

buttonOn.onclick=function()
{
	toServerPageJSON.plannedTime="now";
	toServerPageJSON.plannedTask="on";
	const msg=JSON.stringify(toServerPageJSON)
	ws.send(msg);
}

buttonOff.onclick=function()
{		
	toServerPageJSON.plannedTime="now";
	toServerPageJSON.plannedTask="off";
	const msg=JSON.stringify(toServerPageJSON)
	ws.send(msg);
}

buttonAdd.onclick=function()
{
	var stringActTime=actHours+":"+actMinutes;
	var stringOnOff;
	if(switchOnOff.checked)
	stringOnOff="on";
	else
	stringOnOff="off";
	
	if(CompareTwoTimes(stringActTime,inputTime.value)===2)
{
	toServerPageJSON.plannedTime=inputTime.value;
	toServerPageJSON.plannedTask=stringOnOff;
	const msg=JSON.stringify(toServerPageJSON)
	ws.send(msg);
}
else
{
	alert("Zaplanowana godzina musi być późniejsza od aktualnej");
}
}