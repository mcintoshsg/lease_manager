function showAlert(message, alertType) {
    const alert = document.getElementById("alertPlaceHolder");
    let alertHtml = '<div class="alert ' + alertType + ' alert-dismissible fade show" role="alert">';

    alertHtml += '<button type="button" class="close" data-dismiss="alert" aria-label="Close">';
    alertHtml += '<span aria-hidden="true">&times;</span>';
    alertHtml += '</button>';
    alertHtml += '<strong>' + message + '</strong></div>';
    alert.innerHTML = alertHtml;
    alert.style.display = 'flex';

    setTimeout(function() { // this will automatically close the alert and remove this if the users doesnt close it in 5 secs
        alert.style.display = 'none';
    }, 3000);
  }