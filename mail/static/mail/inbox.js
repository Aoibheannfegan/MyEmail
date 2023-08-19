document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector('#compose-form').addEventListener('submit', send_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#individual-email').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#individual-email').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  //get current emails in current mailbox from API
  fetch('/emails/' + mailbox)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      //add email details to div
      emails.forEach(email => {
        const emailElement = document.createElement('div');
        emailElement.className = 'email-preview';
        emailElement.className = email.read ? 'read' : 'unread';
        emailElement.innerHTML = `
          <h8 class="email-sender">${email.sender}</h8>
          <h8 class="email-subject">${email.subject}</h8>
          <h8 class="email-timestamp">${email.timestamp}</h8>
          `
        ;
        //if an email in the view is clicked then load a view of email
        emailElement.addEventListener('click', () => email_view(email.id, mailbox));
        document.querySelector('#emails-view').append(emailElement);
      });
  });

}

function email_view(email_id, mailbox) {
  document.querySelector('#individual-email').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  //set individual email to empty
  document.querySelector('#individual-email').innerHTML = '';

  //get email details
  fetch('/emails/' + email_id)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      //generate content to add to individual email div 
      const element = document.createElement('div');
      element.innerHTML = `
        <h2>${email.subject}</h2>
        <div>From: ${email.sender}</div>
        <div>To: ${email.recipients}</div>
        <div>${email.timestamp}</div>
        <p class = "email-body">${email.body}</p>
      `
      ;
      //render an archive button if email has not been sent from current user
      if (mailbox !== 'sent') {
        const archiveButton = document.createElement('button')
        archiveButton.innerText = email.archived ? 'Unarchive' : 'Archive';
        archiveButton.addEventListener('click', () => archive_email(email.id, !email.archived));
        archiveButton.classList.add('btn', 'btn-outline-danger');
        element.appendChild(archiveButton);
      }

      //create a reply button
      const replyButton = document.createElement('button')
      replyButton.innerText = 'Reply';
      replyButton.addEventListener('click', () => reply(email.id));
      replyButton.classList.add('btn', 'btn-outline-success');
      element.appendChild(replyButton);

      //add remaining email details to view and ensure only view is visible
      document.querySelector('#individual-email').append(element);

      //if email is clicked change read to true
      fetch('/emails/' + email.id, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      });
  });
}


function archive_email(email_id, archive_status) {
  fetch('/emails/' + email_id, {
    method: 'PUT',
    body: JSON.stringify({
        archived: archive_status
    })
  })
  .then(response => {
    if (response.ok) {
      load_mailbox('inbox');
    } else {
      console.error('Error:', response.statusText);
    }
  });
}


function reply(email_id) {
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#individual-email').style.display = 'none';

  fetch('/emails/' + email_id)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);
      //pre-populate with original email details
      document.querySelector('#compose-recipients').value = email.sender
      document.querySelector('#compose-subject').value = `Re: ${email.subject}`
      document.querySelector('#compose-body').value = `\n On ${email.timestamp} ${email.sender} wrote: \n"${email.body}"`

  });

}


function send_email(event) {
  event.preventDefault();
  let recipients = document.querySelector('#compose-recipients').value
  let subject = document.querySelector('#compose-subject').value
  let body = document.querySelector('#compose-body').value
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      if (result.message === 'Email sent successfully.') {
        load_mailbox('sent')
      }
  });
}