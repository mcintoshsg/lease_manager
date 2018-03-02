

$(document).ready(function(){
    var date_input=$('input[name="date"]'); //our date input has the name "date"
    var container=$('.bootstrap-iso form').length>0 ? $('.bootstrap-iso form').parent() : "body";
    let start = new Date();
    let end = new Date(); 
    
    end.setMonth(end.getMonth() + 2);
// bootstrap datetime picker
    date_input.datepicker({
        format: 'dd-mm-yyyy',
        container: container,
        todayHighlight: true,
        autoclose: true,
        startDate: start,
        endDate: end
   
    })
// setup the start time and stop time widgets
    $('#startTime').timepicker({
        timeFormat: 'HH:mm',
        interval: 15,
        minTime: '0',
        maxTime: '23:45',
        defaultTime: '8',
        startTime: '00:00',
        dynamic: false,
        dropdown: true,
        scrollbar: true
    })

    $('#stopTime').timepicker({
        timeFormat: 'HH:mm',
        interval: 15,
        minTime: '0',
        maxTime: '23:45',
        defaultTime: '18',
        startTime: '00:00',
        dynamic: false,
        dropdown: true,
        scrollbar: true
    })
});