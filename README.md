# BDS Visualization Page
This library is to create bar, line, and map graphics from the BDS API. 

The project includes a landing page which can direct users to graphics of interest.

## Prerequisites
- The project is intended to be run through a browser
- The project is built with chromium in mind it should be functional with Chrome, Edge, Firefox, Opera, and Safari
  - The majority of testing has been in chrome I do not have a method for testing it in Safari
- The project can be run on internet explorer but there are scaling issues

## Installing BDS Visualization Page
This will be dependent on how Census desires to host the project the current method used for testing is listed below.
### Running Locally:
For testing Purposes the website has been run locally using http-server for node.js on **Windows** 
- To install http-server node.js and npm are required
  - Node.js https://nodejs.org/en/
  - http-server https://www.npmjs.com/package/http-server
- After npm is setup navigate to where the project is stored and on the top level folder where index.html is stored run http-server from a command line this will provide access to the projects features locally
### Running over github.io
Additional for sharing a live version over the web we are currently using github's Pages feature to host the website
- Details on how to set up a github Page can be found at https://pages.github.com/
### Final Deployment
The final deployment will be based largely on how Census desires to host the project. This should probably through a provider.
## List of known issues
- Excess Pushes into console.log
- Bar Chart does not allow for horizontal zooming (we may not have enough time to address this issue)
- Some of the elements of the bar graph are not tied correctly to the clipping box and do not dissapear when draged off the graph
- There are some combinations of options that present broken graphics
- When updating a map after a zoom results in fill and border lines not lining up
- Bar chart tick marks become unreadable with certain combinations
  - MSA
  - Year
- Tick marks for line graph should have more detail
- Table view is too small and has inconsistent surrounding border rules
- Internet Explorer is not currently supported
##Contributers
