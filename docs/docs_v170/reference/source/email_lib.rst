:mod:`email_lib` --- Email
==========================

.. automodule:: webnotes.utils.email_lib
   :synopsis: Email library

Email object
------------

.. autoclass:: EMail
   
      
   .. attribute:: sender
   
      sender's email
      
   .. attribute:: reply_to
   
      [Optional] if reply_to is not same as sender

   .. attribute:: recipients
   
      `list` of recipients or a string separated by comma (,) or semi-colon (;)
   
   .. attribute:: subject
   
      email subject

   .. attribute:: msg
   
      message object `email.mime.multipart.MIMEMultipart`

   .. attribute:: cc
   
      `list` of cc email ids

   .. automethod:: set_message
   
   .. automethod:: attach

   .. automethod:: validate
   
   .. automethod:: setup
   
   .. automethod:: send
   

.. method:: validate_email_add(email_id)
   
   Validate the email id
   
.. automethod:: webnotes.utils.email_lib.sendmail

Example
-------

Email with attachments::

	# get attachments
	al = sql('select file_list from `tab%s` where name="%s"' % (dt, dn))
	if al:
		al = al[0][0].split('\n')
		
	# create the object
	email = server.EMail('test@webnotestech.com', ['a@webnotestech.com', 'b@webnotestech.com'], 'this is a test')

	# add some intro
	email.set_message(replace_newlines('Hi\n\nYou are being sent %s %s\n\nThanks' % dt, dn))
		
	# add attachments
	for a in al:
		email.attach(a.split(',')[0])

	# send
	email.send()  
	
	
