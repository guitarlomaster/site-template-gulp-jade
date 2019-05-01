## Requirements

 - **NodeJS** v5.0.0 at least
 - **gulp** v4.0.0 at least

Installed **gulp** packages:

    npm install -g gulp-cli

## Installation
Do following commands in your terminal in project dir:

    npm install
    bower install

## Configuration file
    `project-config.json`
* For deployment set `host` names for production and development;
* Add languages in `locales` array;

## Developing
Do the following commands in your terminal:

    gulp watch --locale ru (your locale)



## DEV building/deploing
Do the following commands in your terminal:

    gulp build --locale ru 
    gulp build_all 
    gulp deploy --locale de 
    gulp build_deploy --locale de 
    gulp deploy_all 
    gulp all 


## PROD building/deploing
Do the following commands in your terminal:

    gulp build --locale ru	--env prod
    gulp build_all --env prod
    gulp deploy --locale de --env prod
    gulp build_deploy --locale de --env prod
    gulp deploy_all --env prod
    gulp all --env prod
