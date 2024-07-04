// sensitive info is stored in localStorage (as plain text)
// does not get saved online, must be entered by user first time the test page is loaded
loadCredentialsFromStorage()



function loadCredentialsFromStorage() {
    //also sets up save-on-edit callback 
   [
    "apiUserId",
    "apiUserKey",
    "apiUserSecret",
    "ungerboeckApiUrl",
    "EventID",
    "FunctionID"
   ].forEach(function(key){
       window[key].value = localStorage.getItem(key) || '';
       window[key].oninput = function(){
           localStorage.setItem(key,window[key].value);
       };
   });

   window.btnEvent.onclick = function (e) {
        apiCall("Events",[ window.EventID.value ]).then(console.log).catch(console.error); 
   }; 

   window.btnFunction.onclick = function (e) {
         apiCall("Functions",[  window.EventID.value, window.FunctionID.value ]).then(console.log).catch(console.error); 
   }; 
}

function TestJWTAuthorization() {
   return apiCall("Events",["113631"]); 
}


function urlFormatStr(base,endpoint,orgCode,args,search) {
    return `${base}/${endpoint}/${[orgCode].concat(args).join('/')}${
        search ?  "?search=" +  encodeURIComponent(Object.keys(search).map(function(key){
            return key + ' eq ' + search[key] ;
        }).join (' and ') ) : ''
    }`;
}

function apiCall(endpoint,args,search) {

    //Change these values
    /*
    var apiUserId = 'APIUSERID'; //You can find this on the API User window in Ungerboeck
    var apiUserKey = '4Fe7f631-2224-4098-82b9-38bb89c7247e';//You can find this in the apiUserKeys section in the API User window in Ungerboeck
    var apiUserSecret = '2fa24f34D-1b2c-4ecf-8645-44ba766d6b89'; //You can find this on the API User window in Ungerboeck
    var ungerboeckApiUrl = 'https://YourSite.ungerboeck.com/api/v1/Accounts/10/ACCTCODE'
    */
    var apiUserId = window.apiUserId .value;
    var apiUserKey = window.apiUserKey.value;
    var apiUserSecret = window.apiUserSecret.value;
    var ungerboeckApiUrl =  window.ungerboeckApiUrl.value;

    const OrgCode = '10';

    if (apiUserId && apiUserId.trim() != "" && apiUserKey && apiUserKey.trim() != "" && apiUserSecret && apiUserSecret.trim() != "") {
        
        return sendJWTTestRequest(apiUserId, apiUserKey, apiUserSecret,  urlFormatStr(ungerboeckApiUrl,endpoint,OrgCode,args,search) );

    } else  {
       return Promise.reject( new Error( 'User info is empty.  Check your input.' ));
        
    }
}

function sendJWTTestRequest(apiUserId, apiUserKey, apiUserSecret, ungerboeckApiUrl) {

    return fetch (
        ungerboeckApiUrl,
        {
            "method": "GET",
            "mode": 'cors',
            "headers": {
                "authorization":  'Bearer ' +  constructJWT(apiUserId, apiUserKey, apiUserSecret),
                "accept": "application/json"
            } 
        }
    );

/*
    fetch("https://mcec.ungerboeck.net/test/api/v1/Functions/10/113631/1", {
        "headers": {
          "accept": "application/json",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
          "authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJVU0lNQ0VDQVBJIiwia2V5IjoiM2EwYWZjYzItZGQ1YS00MzVhLTk4YjItYTFlZjIwYmI1MmMwIiwiZXhwIjoxNzIwMDU4NDY3LCJpYXQiOiIxNzIwMDU4NDA3Iiwic3ViIjoiIn0.xI_F4Zs3zQhNMCc5SEk5sSt-yA2N5w0SOMRPpUSwPxE",
          "priority": "u=1, i",
          "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"Windows\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin"
        },
        "referrer": "https://mcec.ungerboeck.net/test/api/help/index?urls.primaryName=swagger",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
      });*/

}

function constructJWT(apiUserId, apiUserKey, apiUserSecret) {
    const header = { "alg": "HS256", "typ": "JWT" };

    const claimSet =
    {
        "iss": apiUserId,
        "key": apiUserKey,
        "exp": (KJUR.jws.IntDate.get("now") + 60).toString(), //Adds 60 seconds expiration to the Unix Epoch time
        "iat": KJUR.jws.IntDate.get("now").toString()
    }

    console.log(`header: ${JSON.stringify(header)}`);
    console.log(`claim set: ${JSON.stringify(claimSet)}`);

    var jwt = KJUR.jws.JWS.sign(null, header, claimSet, apiUserSecret);

    console.log('jwt is ' + jwt);

    return jwt;

}
