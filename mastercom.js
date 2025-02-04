const axios = require('axios');
const oauth = require('mastercard-oauth1-signer');

const vaultID= "";      //Define your vault ID here.
const vaultURL= "";     //Define your vault URL here.

const { signingKey, consumerKey} = process.env;

// Don't change the function name. It needs to be skyflowmain.
exports.skyflowmain = async (event) => {
  // Use request to access the connection payload.
  const request = Buffer.from(event.BodyContent, "base64");
  const payload = JSON.parse(request.toString());

  // Use headers to access the connection headers.
  const headers = event.Headers;
  const authorizationHeaderValue = headers['X-Skyflow-Authorization'];
  const accessToken = authorizationHeaderValue[0];

  const uri = event.QueryParam.URI;
  const uri_method = headers['X-Request-Audit-Uri-Method'];
  const method = uri_method[0];
  //console.log("params: " + method + " " + uri);

    if (payload.primaryAccountNum){
    let response = await detokenize(accessToken, payload.primaryAccountNum);
    //console.log("resp value: " + response.data.records[0].value);
    payload.primaryAccountNum = response.data.records[0].value;}

  let data = JSON.stringify(payload);
  //console.log("Payload= ", data);

  const authHeader = oauth.getAuthorizationHeader(uri, method, data, consumerKey, signingKey);
  //console.log("OAuth Header= ", authHeader);

const response = await callMastercom(uri, method, data, authHeader);
//console.log("Before Exit: ", response);
return response;
}


async function callMastercom(uri, method, data, authHeader) {

let config = {
  method: method,
  maxBodyLength: Infinity,
  url: uri,
  headers: { 
    'Authorization': authHeader, 
    'Content-Type': 'application/json',
  },
  data : data
};

console.log("About to Call Axios");
return await axios.request(config)
.then((response) => {
  //console.log("Mastercom: ", JSON.stringify(response.data));
  return response.data;
})
.catch((error) => {
  console.log(error);
  return error;
});

}

async function detokenize(accessToken, tokenized_pan) {
    const url = vaultURL + "/v1/vaults/" + vaultID + "/detokenize";
    const headers = {
        'Authorization': 'Bearer ' + accessToken, // Replace with your actual token
        'Content-Type': 'application/json' // Specify the content type
    };
    const body = {
    "detokenizationParameters": [
        {
            "token": tokenized_pan,
            "redaction":"PLAIN_TEXT"
        }
    ]
};

    try {
        const resp = await axios.post(url, body, { headers });
        //console.log('Response:', resp.data);
        return resp;
        // Handle response data here
    } catch (error) {
        console.error('Error making the request:', error.message);
        // Handle error here
    }

}