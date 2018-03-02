/*
    File : app.js
    Version : 0.1 (dev)
    Author ; Stuart McIntosh
    Date : 19/02/2018
    Descrition : simple web page to manage the VDI servers on AWS
 */


/*  ===========================================
              aws configurations
    =========================================== */ 

AWS.config.update({
    region: "ap-southeast-2",
    // The endpoint should point to the local or remote computer where DynamoDB (downloadable) is running.
    endpoint: 'https://dynamodb.ap-southeast-2.amazonaws.com',
    /*
      accessKeyId and secretAccessKey defaults can be used while using the downloadable version of DynamoDB. 
      For security reasons, do not store AWS Credentials in your files. Use Amazon Cognito instead.
    */
   
  });
  
    /* 
       Uncomment the following code to configure Amazon Cognito and make sure to 
       remove the endpoint, accessKeyId and secretAccessKey specified in the code above. 
       Make sure Cognito is available in the DynamoDB web service region (specified above).
       Finally, modify the IdentityPoolId and the RoleArn with your own.
    */
  /*
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: "us-west-2:12345678-1ab2-123a-1234-a12345ab12",
  RoleArn: "arn:aws:iam::123456789012:role/dynamocognito"
  });
  */

/*  ===========================================
                document + db constants
    =========================================== */  

const dynamodb = new AWS.DynamoDB(AWS.config);
const docClient = new AWS.DynamoDB.DocumentClient();
const tableName = "ServerStartupShutdownDev";

const buttonListTables = document.getElementById("buttonListTables");
const buttonCommit = document.getElementById("buttonCommit");
const checkAlwaysOn = document.getElementById("alwaysOnCheck");
const dateTimePicker = document.getElementById("dateTimePicker");
const selectServers = document.getElementById('selectServers');
const alertPlaceHolder = document.getElementById('alertPlaceHolder');

const SERVER_LIST = [];

/*  ===========================================
               database functions
    =========================================== */ 

/* function scanData
   Outputs : reads the database table and stores all the servers that 
    macth the query expression i.e all servers that have a type of VDI 
*/   
function scanData() {
    var params = {
        TableName: tableName,
        FilterExpression: "InstanceType = :val",
        ExpressionAttributeValues: {":val": "VDI"},
        ReturnConsumedCapacity: "TOTAL"
    };
        
    docClient.scan(params, onScan);

    function onScan(err, data) {
        namesArray = []
        if (err) {
            console.log("Unable to scan: " + "\n" + JSON.stringify(err, undefined, 2));
            showAlert('Error occured with scan', "alert-danger");
        } else {
            // Print all the servers
            data.Items.forEach(function(server) {
                SERVER_LIST.push({Id: server.Id, Name: server.Name});
                namesArray.push(server.Name);
            });
        }
        populateServerSelect(namesArray.sort());
    }
}

/* function updateServer
   Inputs : server to update and the update expression whcih includes
   DateUntil (2 months from now),
   Always On (False or True)'
   StartUpTime (optional)'
   ShutDownTime (optional)'
*/   
function updateServer(serverId, serverName, alwaysOn, startTime, stopTime, dateUntil) {
    var params = {
        TableName: tableName,
        Key:{
            "Id": serverId
        },
        UpdateExpression: "set AlwaysOn = :o, StartUpTime=:u, ShutDownTime=:d, DateUntil=:du",
        ExpressionAttributeValues:{
            ":o": alwaysOn,
            ":u": startTime,
            ":d": stopTime,
            ":du": dateUntil
            
        },
        ReturnValues:"UPDATED_NEW"
    };

    docClient.update(params, function(err, data) {
        if (err) {
            console.log(JSON.stringify(err, undefined, 2));
            showAlert('Update failed', "alert-danger");
        } else {
            console.log(serverId + " " + serverName + " have been successfully updated");
            console.log(JSON.stringify(data, undefined, 2));
            showAlert('Server ' + serverName + " has been updated", "alert-success");
        }

    });
}   

/* function readSingleServer - use this to test changes
   Inputs : server to that has just been update
   Output: Update server
*/   
function readSingleServer(serverId) {
    var params = {
        TableName: tableName,
        Key:{
            "Id": serverId
        }
    };
        
    docClient.get(params, function(err, data) {
        if (err) {
            console.log("Unable to read item: " + "\n" + JSON.stringify(err, undefined, 2));
        } else {
            console.log("GetItem succeeded: " + "\n" + JSON.stringify(data, undefined, 2));
        }
    });
}

/*  ===========================================
                setup the form
    =========================================== */  

/* function populateServerSelect
   Inputs : list of all server names 
   Outputs : Updates the server select with the server names
*/   
function populateServerSelect(arr){
    for(i=0; i < arr.length; i++){
        selectServers.options[selectServers.options.length] = new Option(arr[i], selectServers.options.length);
    }
}	

/*  ===========================================
                reset the form
    =========================================== */  

/* function resetForm
   Outputs : Uall widgets set back to defaul state
*/   
function resetForm(){
    //set the server index back to 0
    selectServers.options.selectedIndex = 0;
    $("#dateTimePicker").val('');
    checkAlwaysOn.checked = '';
}	

/*  ===========================================
                form validatiors
    =========================================== */  

/* function populateSelect
   Inputs : 
   Outputs : 1. checks that a server has been chosen
             2. checks that either always on has been selected or times have 
             been chosen
             3. checks that the times are valid start is not before stop time   
*/   

function validateForm(selectedServer){
    if (selectedServer === 'Choose...'){
        showAlert('Please select a server', "alert-warning");
        return false;
    } else if(testTime() !== true){
        showAlert('Start time cannot be the same or after Stop time', "alert-danger");
        return false;
    } else {
        return true;
    }
}    


/*  ===========================================
                document listeners
    =========================================== */    
buttonCommit.addEventListener('click', function() {
    let selectedServer = selectServers.options[selectServers.selectedIndex].text
    let startTime = $("#startTime").val()
    let stopTime = $("#stopTime").val()
    let alwaysOn = 'False';
   
    if (checkAlwaysOn.checked === true){
        alwaysOn = 'True';
        startTime = '00:00';
        stopTime = '00:00';
    }

    let id = lookUpID(selectedServer);
    if(validateForm(selectedServer)){
        updateServer(id, selectedServer, alwaysOn, startTime, stopTime, getDateUntil());
       }
  resetForm();
});

window.addEventListener('load', function(event) {
    showAlert("This works",'alert-success');
    scanData();
    fetchID();
});


/*  ===========================================
                    utils 
    =========================================== */    
/* function lookUpID
    input : selected server name
    Output : the ID asscoiated with the server
*/
function lookUpID(server){
    for(let i=0; i < SERVER_LIST.length; i++){
        if(SERVER_LIST[i].Name === server){
            return SERVER_LIST[i].Id;
      }
    }
}

/* function getDateUntil
    Output : string in the format 'YY-MM-DD' 2 months ahead of todays date
*/
function getDateUntil(){
    let selectedDate = $("#dateTimePicker").val()
    return selectedDate;
}

/* function testTime
    Output : checks that the startTime is < the stopTime
*/
function testTime(){
    let startTime = $('#startTime').val();
    let stopTime = $('#stopTime').val();

    if(checkAlwaysOn.checked === true){
        return true;
    } else if(startTime >= stopTime){
        return false;
    } else {
        return true;
    }
}

function fetchID(){

    $.ajax({

        url: "https://idpdev.santos.com/adfs/ls/IdpInitiatedSignOn.aspx?loginToRp=urn:santos:people",
        type: "GET",
        crossDomain: true,
        success: function(response){
          console.log(response);
        },
        error: function(xhr, status){
          console.log(status);
        }  
  
      });
 }   