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

 
function sendJWTTestRequest(apiUserId, apiUserKey, apiUserSecret, apiUrl) {

    return fetch (
        apiUrl,
        {
            method: "GET",
            mode: 'no-cors',
            headers: {
                "Authorization": 'Bearer ' + constructJWT(apiUserId, apiUserKey, apiUserSecret),
                "Accept": "application/json"
            },
            "credentials": "include"
        }
    );
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
