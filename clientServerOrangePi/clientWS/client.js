const Gpio=require('onoff').Gpio;
const WebSocket=require('ws');

var ws=new WebSocket('ws://192.168.0.107:2999');

const pinRelay=new Gpio(2,'out');//definition pin which control relay
pinRelay.writeSync(0);

const connTimeout=3000;//time no reply pong message from server

switchOnAck="on-ack";
switchOffAck="off-ack";



ws.onopen=function(){
	console.log("Połączono z serwerem");
};


ws.onmessage=function(msg){
	if(msg.data==="on")
{   pinRelay.writeSync(1);
    if(pinRelay.readSync()===1)
    ws.send(switchOnAck);
}
else if(msg.data==="off")
{
    pinRelay.writeSync(0);
    if(pinRelay.readSync()===0)
    ws.send(switchOffAck);
}
else
{
    console.log("Nieznane polecenie z serwera");
}

};
	
ws.onclose=function(){
	console.log("Zakończono połączenie");
};

ws.onerror=function(error){
	console.log("Wystąpił błąd: "+error);
};
	
