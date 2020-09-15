# BDS Visualization Page
This library is to create bar, line, and map graphics from the BDS API. 

The project includes a landing page which can direct users to graphics of interest.

## Prerequisites
- The project is intended to be run through a browser
- The project is built with chromium in mind it should be functional with Chrome, Edge, Firefox, Opera, and Safari
  - The majority of testing has been in chrome I do not have a method for testing it in Safari
- The project can be run on internet explorer but there are scaling issues

## Dependants
- D3 the project currently uses static version 3.5.12 of D3 saved as d3.min.js
  - most recent version https://d3js.org/
- topojson the project currently uses static version 1.6.24 of topjson as topjson.v1.min.js
  - most recent version https://github.com/topojson/topojson
- excellentexport.min.js the project currently uses a static version 1.5 of excellentexport as excellentexport.min.js
  - used version is stored at https://github.com/jmaister/excellentexport/releases/tag/v1.5
  - most recent version https://github.com/jmaister/excellentexport

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
## Landing Page Link Function
To set up a link for a predefined graphics use the pushInput function defined on Landing.js
- function pushInput(xvar,cvar,regi,meas,sic,state,metro,year,fage,fchar,fsize,ifsize)
  - each of the inputs need to be in qoutes you can use the json in model.js to see valid options
  - The regi input sets what type of graphic to display
    - 0 : Bar Graph
    - 1 : Map
    - 2 : Line Graph
  - You can create invalid options using this method that are not accessible through the standard visualization tool (such as a line graph with sector as the x-axis)
## List of known issues
- MSA for all fsize does not seem to be returning expected data seems to be driven by both fage and fsize both being "ALL" may not have be calculated in API
- Excess Pushes into console.log: This is mostly for testing and will be parsed down before final version
- *Remove excess/commented out code* (In Progress look for #fordelection!! or #modulefordeletion!! main target is heatchart)
- Bar Chart does not allow for horizontal zooming (we may not have enough time to address this issue)
- ~~Some of the elements of the bar graph are not tied correctly to the clipping box and do not dissapear when draged off the graph: this has to due with the defined boundries of the clipping box as well as the redefining graph region when switching tick label rotations~~ (fixed)
- No data warning does not wrap correctly
- clicking quickly between buttons causes invalid graphics to temporarily appear
- selecting too many legends lists them outside the bounding box: nothing is set up to handle this at the moment
- ~~When updating a map after a zoom results in fill and border lines not lining up~~ (fixed)
- ~~Certain combinations will create invalid map option tied to having multiple cvars passed into the mapping options~~ (fixed)
- ~~Bar chart tick marks become unreadable with certain combinations~~ (fixed via elinination)
  - ~~MSA : no easy fix available at the moment may eliminate this option~~ (fixed via elimination)
  - ~~Year : plan to implement rotation for ticks much like state labels~~ (fixed)
- Tick marks for line graph should have more detail
- ~~Table view is too small and has inconsistent surrounding border rules~~ (fixed)
- Internet Explorer is not currently supported: this is due to internet explorer not being updated in recent years with new internet standards it technically runs but will not scale well
- Zooming on line graph occasionally creates an extra "x0-axis"
- some functions end up being run multiple times while not project breaking it is not efficient
- ~~When selecting map from pushinput x-axis lable does not get hidden~~ (fixed)
- ~~Text on map only references States not MSA~~ (fixed)
## Contributers
- Pavel Zhuravlev
- Timothy Beggs
- Jerome Davis
- Craig Corl
