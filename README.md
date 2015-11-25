# About [![Build Status](https://travis-ci.org/rodrigouroz/sri4node-security-api.svg?branch=master)](https://travis-ci.org/rodrigouroz/sri4node-security-api)

A module that connects a sri4node backend to the sri security api (https://github.com/rodrigouroz/sri-security-api).

# Installing

Installation is simple using npm :

    $ cd [your_project]
    $ npm install --save sri4node-security-api

# Usage

The module exposes a function for each one of the after functions available in a resource in sri4node:

- `checkReadPermission`: an afterread function implementation (https://github.com/dimitrydhondt/sri4node#afterread)
- `checkInsertPermission`: an afterinsert function implementation (https://github.com/dimitrydhondt/sri4node#afterupdate--afterinsert)
- `checkUpdatePermission`: an afterupdate function implementation (https://github.com/dimitrydhondt/sri4node#afterupdate--afterinsert)
- `checkDeletePermission`: an afterdelete function implementation (https://github.com/dimitrydhondt/sri4node#afterdelete)

This modules connects to the sri security api and checks permissions on the actions performed. If there are no permissions the promise is
rejected.

CRUD rules must exist in the sri security api for the permissions to work.
