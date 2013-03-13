# TV Schedule editor plug-in for Sysmaster's Content servers

The plugin is designed to work with the content service web application, but can be also used as stand alone application as it depends on the web service only for authentication. Should other means be provided to authenticate the user it can be exported and used as stand alone web app.

## How to use?

The application is written with closure tools and as such requres those tools as well as the [pstj-closure](https://github.com/pstjvn/pstj-closure "Link to GitHub page of the project") library to compile correctly. The included Makefile could make that easy should the correct directory structure is used (or by tweaking the variables in the makefile itself).

Once compiled only the assets directory and 3 other files are needed for the proper functioning of the application: ```index.html, app.build.js and app.css``` (the later two could be found in the ```build``` directory).

Additionally the help is provided (in the ```help``` directory).

The project is constructed to be easily translated and localized, only English and Bulgarian languages are provided by default. Using the XLIFF format the project can be translated to any language and compiled with the corresponding locale.

To build the project use:

```make compile```
