Concepts
========

Structure
---------

This page explains the basic architecture and concepts of the Framework

The Framework is in two parts

1. Server-side - in Python
2. Client-side - in Javascript

The server-side Framework contains all the logic for setting up the user session,
co-ordinating data between the user and managing roles and permissions.

The client-side renders all the widgets like menus, toolbars, forms, report builder etc and manages
data from the back end using AJAX

Developing an Application
-------------------------

Post installation, the application can be completely developed from the Browser. The Browser is the
in-built IDE for development. A usual development contains of the following steps

   #. Designing of the database & input forms - :term:`DocType`
   #. Designing of the reports - :term:`Report Builder`
   #. Designing of the navigation and other pages - :term:`Page`
   #. Creating and setting users and roles
   #. Writing custom logic, events