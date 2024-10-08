
const fs = require('fs');

function talkieConfig(roomName,serverIP) {
    roomName = roomName.replace(/\s/g,'');
    return `<?xml version="1.0" encoding="utf-8"?>
<VBAudioVBANReceptorSettings>
<VBANReceptorDeviceConfiguration>
	<OptionDev mme='1024' wdm='512' ks='512' asio='0' msA1='0' />
	<OutputDev index='1' type='1' name="Headphones (2- Sudio A1 Pro)" />
	<InputDev index='1' type='1' name="Headset (2- Sudio A1 Pro)" />
</VBANReceptorDeviceConfiguration>
<VBANReceptorParameters>
	<Strip index='1' mute='0' solo='0' mono='0' muc='0' busa='1' busb='1' dblevel='0.00'  audibility_c='0.00' audibility_g='0.00'/>
	<Strip index='1' EQGain1='8.70' EQGain2='3.10' EQGain3='3.30' />
	<Bus index='1' mute='0' mono='0' BusMode='0' EQon='0' dblevel='0.00' />
</VBANReceptorParameters>
<VBANConfiguration>
	<VBAN status='1' />
	<VBANStreamIn index='1' name='${roomName}Monitor' ip='${serverIP}' port='6980' NQ='1' />
	<VBANStreamOut index='1' name='${roomName}' ip='${serverIP}' port='6980' SR='44100' ch='1' NQ='0' format='2' />
</VBANConfiguration>
</VBAudioVBANReceptorSettings>`;
}

