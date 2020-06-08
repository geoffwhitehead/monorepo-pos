# Settled POS

## Todo

**Current**

-   ~App performance isnt great with realm. With around 1000 items in the db the UI is very unresponsive taking seconds to respond to user input~.
-   ~Using memo and callbacks is unpredicatable because react doesnt seem to work well with the realm objects~.
    -~Not sure where the problems lies as its even slightly laggy with 10s of items in the UI. Although that could be down to running in the sim not built for prod~


    fix typescript types


**Auth**

-   ~set token expiry to 1m~
-   ~update middleware to make sure expiry is being accounted for~
-   ~implement refresh tokens. - store in local storage - expire 7 days - create secret that uses auth data to make it unique - send token with every request - it will be used if the access token has expired - store access and refresh token after every request~
-   ~create refresh route that returns a new refresh and access token~ implemented but i think it can eb deleted
-   ~hit the refresh route on app load with the access and refresh tokens in local store. - if refresh has expired - redirect user to login and empty local store~
-   forgot password

**Server**

-   ~standard error response~ look into using typescrpt to enforce. Not sure at which layer to implement
-   logging - largely not implemented throughout - WIP
-   errors - define some error codes to pass to app for certain errors / reponses. - look into handling error cases for most of the db requests and handle appropriately - general error handling throughout
-   unit testing
-   no results / empty responses are not handling in most places
-   auth: add an auth service that will be able to: - lookup a users organization based on their email address. Not sure how to implement - might need to be untenanted so it has access to all organizations users. - this should allow multiple users per organization.
-   ~look into sessions~
-   ~invalidate jwt on logout~
-   add events system (RabbitMQ maybe)
-   batch job - upload data
-   add debug package
-   verification process for auth. quick CRA or just hit an endpoint from an email
-
-   **BUGS**
-   ~ids etc are not being created for subdocuments when using mongoose.insertMany
-   fix populate to work with the api refactor~

**App**

-   Check auth status on before trying populate etc. Determine status. Offline mode? Token valid etc
-   CRUD screens for everything to do with products.
-   feature: Tile layout for items (pictures?)
-   Price shift functionality: receipt formatting
-   Voids - add button to void - override delete to update deletedOn field - reports should include voids
-   send to kitchen functionality - add linked printers array on items - store record of sent bill items. Dont send twice. - kitchen printer receipt format
-   prevent ending bill period with active bill
-   **BUGS**
-   on change bill - reset screen
