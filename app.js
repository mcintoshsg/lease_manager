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
    accessKeyId: "AKIAIPGYAXNE3AT553CA",
    secretAccessKey: "DkTnf6L9pTJWO3x5As5B1owdduXTTQl1iOGTpZid"
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
const startStopDiv = document.getElementById("checkStartStop");
const startStopHr = document.getElementById("hrStartStop");
const checkAlwaysOn = document.getElementById("alwaysOnCheck");
const dateTimePicker = document.getElementById("dateTimePicker");
const selectServers = document.getElementById('selectServers');
const startSelect = document.getElementById('startTimeSelector');
const stopSelect = document.getElementById('stopTimeSelector');
const alertPlaceHolder = document.getElementById('alertPlaceHolder');

const buttonTest = document.getElementById("buttonTest");       


/*  ===========================================
               database functions
    =========================================== */ 

/* function scanData
   Outputs : reads the database table and stores all the servers that 
    macth the query expression i.e all servers that have a type of VDI 
*/   
function scanData() {
    document.getElementById('serversTextArea').innerHTML = "";
    document.getElementById('serversTextArea').innerHTML += "Scanning for all servers" + "\n";
  
    var params = {
        TableName: tableName,
        FilterExpression: "InstanceType = :val",
        ExpressionAttributeValues: {":val": "VDI"},
        ReturnConsumedCapacity: "TOTAL"
    };
        
    docClient.scan(params, onScan);

    function onScan(err, data) {
        let serverList = [];
        if (err) {
            console.log(err);
        } else {
            // Print all the servers
            document.getElementById('serversTextArea').innerHTML += "Scan succeeded: " + "\n";
            data.Items.forEach(function(server) {
            document.getElementById('serversTextArea').innerHTML += server.InstanceType + ": " + server.Name + "\n";
                serverList.push(server.Id + " : " + server.Name);
            });
        }
        populateServerSelect(serverList);
    }
}

/* function updateServer
   Inputs : server to update and the update expression whcih includes
   DateUntil (2 months from now),
   Always On (False or True)'
   StartUpTime (optional)'
   ShutDownTime (optional)'
*/   
function updateServer(serverId, alwaysOn, startTime, stopTime, dateUntil) {
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
            document.getElementById('serversTextArea').innerHTML = "Unable to update item: " + "\n" + JSON.stringify(err, undefined, 2);
        } else {
            document.getElementById('serversTextArea').innerHTML = "UpdateItem succeeded: " + "\n" + JSON.stringify(data, undefined, 2);
        }
    });
}

/* function readSingleServer
   Inputs : server to that has just been update
   Output: Update server
*/   
function readSingleServer(serverId) {
    document.getElementById('serversTextArea').innerHTML = "";
    document.getElementById('serversTextArea').innerHTML += "Scanning for single server" + "\n";
  
    var params = {
        TableName: tableName,
        Key:{
            "Id": serverId
        }
    };
        
    docClient.get(params, function(err, data) {
        if (err) {
            document.getElementById('serversTextArea').innerHTML = "Unable to read item: " + "\n" + JSON.stringify(err, undefined, 2);
        } else {
            document.getElementById('serversTextArea').innerHTML = "GetItem succeeded: " + "\n" + JSON.stringify(data, undefined, 2);
        }
    });
}


/*  ===========================================
                setup the form
    =========================================== */  

/* function: loadTimes
    Inputs :  list of string of times 
    Outputs : Updates the server select with the server names
    Note: this is a shit function - the Jquery time picker should be used, 
    however it is not avialbale across all browsers
 */    
function loadTimes(){
    timeList = [];
    let stringTime = '';
    for(let hours = 0; hours < 24; hours++){
        for(let mins = 0; mins < 60; mins += 15){
            if(hours < 10){
                stringHours= '0' + hours.toString(); 
            } else {
                stringHours = hours.toString();
            }
            if(mins === 0){
                stringMins= '0' + mins.toString(); 
            } else {
                stringMins = mins.toString();
            }
            timeList.push(stringHours + ':' + stringMins);
        }
    }
    return timeList;
}

/* function populateTimeSelectors
   Inputs :  list of string of times 
   Outputs : Updates the time selesctors with a 24 hours at 15 min increments
*/
function populateTimeSelectors(arr){
    for(i = 0; i < arr.length; i++){
        startSelect.options[startSelect.options.length] = new Option(arr[i], startSelect.options.length);
        stopSelect.options[stopSelect.options.length] = new Option(arr[i], stopSelect.options.length);
    }
}

/* function populateServerSelect
   Inputs : list of all server names 
   Outputs : Updates the server select with the server names
*/   
function populateServerSelect(dbData){
    for(i = 0; i < dbData.length; i++){
        selectServers.options[selectServers.options.length] = new Option(dbData[i], selectServers.options.length);
    }    
}	

/* function toggleDIVAndHR
   Outputs : toggle DIV and HR elements on the page
*/   
function toggleDiVAndHr(){
    if (startStopDiv.style.display === 'flex') {
        startStopDiv.style.display = 'none';
        startStopHr.style.display = 'none';
        document.getElementById('headingStartStop').innerHTML = '';
    } else {
        startStopDiv.style.display = 'flex';
        startStopHr.style.display = 'block';
        document.getElementById('headingStartStop').innerHTML = 'Start Stop Times';
    }                         
}

/* function formSetup
   Outputs : populates the form and toggles display items
*/   
function formSetUp(){
    startStopDiv.style.display = 'flex';
    startStopHr.style.display = 'flex';
    buttonTest.style.display = 'none';
    document.getElementById('headingStartStop').innerHTML = 'Start Stop Times';
    let timeList = loadTimes();
    populateTimeSelectors(timeList);
    scanData();
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
        alert('Please select a server!');
        return false;
    } else if(testTime() !== true){
        alert('Start Time cannot be the same as or before Stop Time!');
        return false;
    } else {
        return true;
    }
}    


/*  ===========================================
                document listeners
    =========================================== */    

buttonCommit.addEventListener('click', function() {
    let selectedServer = selectServers.options[selectServers.selectedIndex].text;
    let startTime = startSelect.options[startSelect.selectedIndex].text;
    let stopTime = stopSelect.options[stopSelect.selectedIndex].text;
    let alwaysOn = 'False';
   
    if (checkAlwaysOn.checked === true){
        alwaysOn = 'True';
    }

    let arr = splitString(selectedServer, ':');
    if(validateForm(selectedServer)){
        updateServer(arr[0], alwaysOn, startTime, stopTime, getDateUntil());
        buttonTest.style.display = 'block';
   }
});

checkAlwaysOn.addEventListener('click', function() {
    toggleDiVAndHr();
});

window.addEventListener('load', function(event) {
    formSetUp();
});


/*  ===========================================
                  test
    =========================================== */ 

buttonTest.addEventListener('click', function(){
    let selectedServer = selectServers.options[selectServers.selectedIndex].text
    let arr = splitString(selectedServer, ':');

    readSingleServer(arr[0]);
    buttonTest.style.display = 'none';
});

/*  ===========================================
                    utils 
    =========================================== */    
/* function splitString
    input : string, and delimiter of where to split 
    Output : an array of the split strinmg
*/
function splitString(str, del){
    let strArray = [];
    let num = str.indexOf(del);
    let a = str.slice(0, num - 1);
    let b = str.slice(num + 1, str.length);
  
    strArray.push(a);
    strArray.push(b);
   
    return strArray;
} 

/* function getDateUntil
    Output : string in the format 'YY-MM-DD' 2 months ahead of todays date
*/
function getDateUntil(){
    let today = new Date();
    today.setMonth(today.getMonth() + 2);

    let todayFmt = today.toISOString().slice(0, 10);
    return todayFmt
}

/* function testTime
    Output : checks that the startTime is < the stopTime
*/
function testTime(){
    let startIndex = startSelect.selectedIndex;
    let stopIndex = stopSelect.selectedIndex;
    if(checkAlwaysOn.checked === true){
        return true;
    } else if(startIndex >= stopIndex){
        return false;
    } else {
        return true;
    }
}