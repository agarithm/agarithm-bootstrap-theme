# Sampler Theme

This a fork of Bootstgrap 4 and we build and link in all JS anD CSS using this report.

## Instructions:

* ./buildit - this shell script will compile and minify our CSS and JS.  It will also install and setup the tools required to do this task.
* ./tryit - this shell script will copy the built js and css into the nearby project location of your specification

## Updating to Latest Bootstrap

After copying over the important files, we need to restore building of our CSS and JS addtions

* add our Bootstrap extensions to the .../build/build-plugins.js file
* add imports for our Bootstrap extensions after "Util" in the .../js/src/index.js file
* add import line for our "custom" scss to the top of .../scss/bootstrap.scss file

