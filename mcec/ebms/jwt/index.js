// sensitive info is stored in local storage(as plain text)
// does not get saved online, must be entered by user first time the test page is loaded


function loadCredentialsFromStorage() {
   [
    "apiUserId",
    "apiUserKey",
    "apiUserSecret",
    "ungerboeckApiUrl",
   ].forEach(function(key){
       window[key].value = localStorage.getItem(key) || '';
       window[key].oninput = function(){
           localStorage.setItem(key,window[key].value);
       };
   });
}


function TestJWTAuthorization() {

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


    if (apiUserId && apiUserId.trim() != "" && apiUserKey && apiUserKey.trim() != "" && apiUserSecret && apiUserSecret.trim() != "") {
        window.demo.textContent = 'Running example call.  Please wait...';
        //$('#demo').text('Running example call.  Please wait...');

        sendJWTTestRequest(apiUserId, apiUserKey, apiUserSecret, ungerboeckApiUrl);

    } else  {
        window.demo = 'User info is empty.  Check your input.';
        //$('#demo').text('User info is empty.  Check your input.');
    }
}

function sendJWTTestRequest(apiUserId, apiUserKey, apiUserSecret, ungerboeckApiUrl) {
    var method = "GET";

    var jwt = constructJWT(apiUserId, apiUserKey, apiUserSecret);

    fetch (
        ungerboeckApiUrl,
        {
            headers: {
                'Authorization': 'Bearer ' + jwt,
                'Content-Type': 'application/json'
            }
        }
    ).then (function (data){
         window.demo.textContent = 'Success: Located ' + data.Name
    }).catch (function(error){
        console.log(error);
        window.demo.textContent = 'API call failed.  Please inspect for errors.';
    })

   /*
       $.ajax({
        type: method,
        url: ungerboeckApiUrl, //Make sure you pick an endpoint the API User is allowed to access
        headers: {
            'Authorization': 'Bearer ' + jwt,
            'Content-Type': 'application/json'
        },
        success: function (data) {
            $('#demo').text('Success: Located ' + data.Name);
        },
        error: function () {
            $('#demo').text('API call failed.  Please inspect for errors.');
        }
    });
   
   */
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
