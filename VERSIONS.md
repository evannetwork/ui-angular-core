# angular-core

## Next Version
### Features
### Fixes
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