# angular-core

## Next Version
### Features

### Fixes

### Deprecations


## Version 2.2.1
### Fixes
- use new `getSmartAgentAuthHeaders` to build `EvanAuth` header for smart-agent requests
- fix `takeSnapshot` for mobile native safari clients with Safari V11 and V13


## Version 2.2.0
### Features
- check for browser support and block not supported browsers

### Fixes
- add `loadForAccount` to favorite reloading
- fix profile verification endless loading


## Version 2.1.2
### Fixes
- fix `takeSnapshot` for mobile native safari clients 


## Version 2.1.1
### Features
### Fixes
- clear vue dapps located next to `dapp-loader`


## Version 2.1.0
### Features
- add `EvanTermsOfUseComponent` for accepting the user changed terms of use
- add `updateTermsOfUse` to `EvanBCCService` to check for missing verification holder and terms of use changes
- add `agentUrl` parameter to the `EvanCoreService`
- use `createDefaultRuntime` instead of bcc bundle
- scope angular and ionic styles to .evan-angular scopes
- wrap full scss into a `.evan-angular` class

### Fixes
- simplify `address-input`
- show correct name of contracts within the `verification detail`
- fix logout on direct reload of ui


## Version 2.0.0
### Features
- outsource deep verification check logic to `@evan.network/api-blockchain-core`
- support verifications for contracts
- add `AddressInputComponent` to retrieve an account id or contract address, with an autocompletion from known address from the addressbook
- `updateBCC` navigates to onboarding, if no user is logged in
- add modal warning if no payment storage was setup before
- add `EvanPaymentService` for requesting payment agent
- add `disableSubVerifications` flags to verifications

### Fixes
- fix initial routing of angular router
  - Router.prototype.originNavigateByUrl was overwritten with a custom one of the angular-core. if the angular-core gets initialzed multiple times, the function will be more and more nested. But the origin one, that is needed initially, is not present. So backuped the function directly to the router prototype.
- reverse verification detail order (from right evan to left specific)
- add `getNameForAccountSync` to `EvanAddressBookService`

### Deprecations
- rename claims to verifications
- rename `getComputedClaim` to `computeVerifications`


## Version 1.7.2
### Fixes
- fix cross version dispatcher loading
- fix onboarding check login to previously ensure coreInstance


## Version 1.7.1
### Fixes
- fix verification whitelisting
- remove `cssClass` from ngx-scanner


## Version 1.7.0
### Features
- add salting for encryptionKeys accountId + password
- add missing dbcpVersion to dbcp files
- add licenses to dbcp files

### Fixes
- Issue sub claim issued to selected account instead of receiver
- set claim description claims parent domains
- optimize claims performance

## Version 1.6.1
### Features
- use `dapp-browser` `routing.getQueryParameters` for extracting query params

## Version 1.6.0
### Features
- claims
  - Remove automated root evan claim checking, so it needs to be specified within the claim check
  - new claim tree styling using svg

### Fixes
- `evan-claim`: add checks if subject or issuer identity does not exists, display notification text if not
- `dashboard-top-buttons`: move the component everytime to the most top level ion-app to fix eventually appearing position containing bugs

### Deprecations

## Version 1.5.0
### Features
- add `includeActiveAccount` to `contract-members` component
- add `evan-claim` component for displaying claims using and topic and several display modes (icon, normal, detail)
- add `EvanVerificationsService` to handle `api-blockchain-core` claims api
- add `EvanProfileVerificationsComponent` for displaying profile activated claims easily
- handle profile activated claims within `EvanVerificationsService`
- add claims status display into `EvanContractMembersComponent`

## Version 1.4.0
### Features
- support light theme
- use correct routing service getContractAddress logic
- alerts for eve low warnings
- add warning for quota limit exceeded and for index db not available

### Fixes
- `DAppLoaderComponent`: wait for previous DApp to be started by another `DAppLoaderComponent` (they can kill each other, if they was started directly at the same time)
- `ionicAppElement`: if two DApps are started directly at the same time, only allow to initialize one AppModule.ngFactory at the same time, the second one will wait for finishing

## Version 1.3.0
### Features
- add maxMembers to `contract-members` component
- add `equalizeFileStructure` to `FileService` to be able to load and encrypt files and pictures using the same logic
- add hide / show loading functions in to the `EvanUtilService` for quick usage in components with detached ref
- add `sendMail` function to `EvanMailboxService`

### Fixes
- fix wildcard queue onFinish functions to handle all cases of wildcard queue id's
- add `decodeURI` to `getDAppNameFromRoutePath` to handle spaces and special characters
- reduce total count of mails that could not be decrypted

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