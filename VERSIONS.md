# angular-core

## Next Version
### Features
### Fixes
### Deprecations

## Version 1.2.2
### Fixes
- fix false builded dist folder

## Version 1.2.1
### Features
- add Wildcard `QueueService` subscriptions
  => `new QueueId('ensAddress', 'dispatcher', 'id')` will trigger `queueService.onQueueFinish(new QueueId('ensAddress', '*', '*'), ...)`
- add `evan-dev-dapps-domain` to utils

### Fixes
- move explorer link while dev mode is enabled to a seperated icon (reload was broken)
- add timeout for history stack pushing (empty states will skipped, so goBack is working like expected)
- fix goBack history stacking for mailbox, queue and profile navigations
- fix push notification title / body on android

## Version 1.2.0
### Features
- file selector for display attached files
- add getNameForAccount to utils function
- add download function for mobile devices
- add ionic-file-opener support for file download
- ExecutorAgent support
- add qr-code display component

### Fixes
- fill empty members array within contract-members component as fallback
- add logic to handle duplicated go back route on the same hash
- fix preview img for addDAppAlertStyle (trimmed name must not contain a dot)
- remove ngxscanner interfaces, so angular-libs can include the umd duiled files
- fix file-selct mobile styling
- missing i18n keys for dispatcher runtime (the service was retrieved, after the dispatcher was loaded so resubmit i18n to all current translation services)
- support multiple instances of contract-member components at the same time
- contract-members touched property
- fix file select touched setting
- DAppLoaderComponent tried to load DApps that have not a valid DBCP description, component was adjusted to skip this entries
- fix file-select dropleave event

### Deprecations

## Version 1.1.0
### Features
- basic implementation of file-select component
- add devMode support for descriptionService; add subdonmain suppior
- add some options to contract-members
- add shortMonthNames to translateService

### Fixes
- correct installation documentation

### Deprecations

## Version 1.0.2
### Features
- register all languages from @angular/common/locales to handle all date formats, so angular data formatter don't die anymore 
- add AsyncComponent to handle correct async OnInit and OnDestroy methods
- add more parameters for split-pane (add overwritable header)
- add recursive hash param checking
- add object-keys pipe
- contract-listentries component gets onError function
- Fix splitpane small toggled bar hides dropdown button
- rename ui-angular-core

### Fixes
- add dapp.history for correct go back logic
- fix contract-members right side panel; fix dapp-wrapper queue right panel
- fix routing is navigating back when function is used
- correct mailbox update events
- logging ignore button
- fix goBack missing #/

### Deprecations

## Version 1.0.1
### Features
- use @evan.network for package name and dependencies scopes
- rename *contractus* variables to *evan*
- rename bcc-core bundle to bcc
  - rename BCCCore to CoreRuntime
  - rename BCCProfile to ProfileRuntime
  - rename BCCBC to BCRuntime
- add .npmignore
- add return values for queue and onFinish funcs
- possiblity to return a dbpc valid "clear" description from angular description service
- add code documentation
- remove angular-bc
- remove dev dependencies => uses angular-libs node_modules
- add rights and roles instance to bcc service
- add utils loggin function
- add contract-listentries / list-paging component
- add modal transitions
- frontend inline documentation
- add loggly, advanced logging service for bcc logLog and queue 
- add dapp-wrapper error display and toast to send errors quickly
- add loader component timeout to show "dapp is loading longer than expected" and provide back button

### Fixes
- Fix Description Service, rename getDefinitionFromEns to getDescriptionFromEns
- cross dapp toast service

## Version 1.0.0
- DBCP update
- Fix routing and QR Code scanner

## Version 0.9.0
- initial version