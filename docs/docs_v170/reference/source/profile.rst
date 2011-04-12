:mod:`profile` --- Profile
==========================

.. automodule::webnotes.profile
   :synopsis: Profile module

Profile object
--------------

.. autoclass:: webnotes.profile.Profile(self, name)
   :members:   

   .. attribute:: roles
   
      list of roles assigned including 'All' (for logged user) or 'Guest' for not logged user
      
   .. attribute:: can_create
   
      list of DocTypes the user can create

   .. attribute:: can_read

      list of DocTypes the user can read

   .. attribute:: can_write

      list of DocTypes the user can edit

