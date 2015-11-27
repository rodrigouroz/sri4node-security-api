# About [![Build Status](https://travis-ci.org/rodrigouroz/sri4node-security-api.svg?branch=master)](https://travis-ci.org/rodrigouroz/sri4node-security-api)

A module that connects a sri4node backend to the sri security api (https://github.com/rodrigouroz/sri-security-api).

# Installing

Installation is simple using npm :

    $ cd [your_project]
    $ npm install --save sri4node-security-api

# Usage

The module exposes a function for each one of the after functions available in a resource in sri4node:

- `checkReadPermission`: an afterread function implementation [(Check afterread in sri4node)](https://github.com/dimitrydhondt/sri4node#afterread)
- `checkInsertPermission`: an afterinsert function implementation [(Check afterinsert in sri4node)](https://github.com/dimitrydhondt/sri4node#afterupdate--afterinsert)
- `checkUpdatePermission`: an afterupdate function implementation [(Check afterupdate in sri4node)](https://github.com/dimitrydhondt/sri4node#afterupdate--afterinsert)
- `checkDeletePermission`: a secure function implementation that checks a DELETE method [(Check secure in sri4node)](https://github.com/dimitrydhondt/sri4node#secure)

This modules connects to the sri-security-api and checks permissions on the actions performed. If there are no permissions the promise is
rejected.

CRUD rules must exist in the sri-security-api for the permissions to work.

In order to use it in a sri4node backend, you need to import the module:

`var sri4nodeSecurity = require('sri4node-security-api');`

This returns a construction function that must be invoked with these parameters:

`var generalSecurity = sri4nodeSecurity(Config, sri4node.utils);`

Where the `Config` object must have the following properties:

- `USER` a valid username to connect to VSKO OAUTH
- `PASSWORD` a valid password to connect to VSKO OAUTH
- `VSKO_API_HOST` the host of the VSKO APIs

The second argument is the `utils` attribute of the sri4node backend [(Check General Utilities)](https://github.com/dimitrydhondt/sri4node#general-utilities)

This returns a constructor function that can be used to build one security module for each component.

For example, for the component persons-api:

`var securityForPersons = generalSecurity('/security/components/persons-api');`

Then it must be hooked to the resource, such as this:

```
return {
  type: '/content',
  public: false,
  secure: [security.checkDeletePermission],
  ...
  afterread: [security.checkReadPermission],
  afterupdate: [security.checkUpdatePermission],
  afterinsert: [security.checkInsertPermission],
  ...
};
```

It's important to note that the `checkDeletePermission` method is not an after function. It has the interface of a secure function because it must be checked *before*
the resource is deleted, unless with the other methods that must be checked *after* it's altered.
