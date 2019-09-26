/*
  Copyright (C) 2018-present evan GmbH.

  This program is free software: you can redistribute it and/or modify it
  under the terms of the GNU Affero General Public License, version 3,
  as published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  See the GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program. If not, see http://www.gnu.org/licenses/ or
  write to the Free Software Foundation, Inc., 51 Franklin Street,
  Fifth Floor, Boston, MA, 02110-1301 USA, or download the license from
  the following URL: https://evan.network/license/
*/

/* tslint:disable */
export const en = {
  "_angularcore": {
    "account-changed": "Account changed",
    "account-changed-description": "You changed or locked your current account.<br> The page / application needs to be <b>refreshed</b>.",
    "browser-not-supported": {
      "desc": "Please be sure to use one of the following browsers:<ul><li>Chrome</li><li>Edge</li><li>Firefox (no private mode!)</li><li>Opera</li><li>Safari</li></ul>",
      "title": "Your browser is not supported"
    },
    "camera": "Camera",
    "cancel": "Cancel",
    "contract-members": {
      "add-members": "Add members",
      "i": "My Account",
      "members": "Members",
      "new-members": "{{ count }} are newly added",
      "no-suggestions": "No members found or no more available",
      "search-text": "Search members to add...",
      "states": {
        "0": "Initial",
        "1": "Error",
        "2": "Draft",
        "3": "Rejected",
        "4": "Active",
        "5": "Finished",
        "loading": "Loading...",
        "undefined": "New"
      },
      "suggested-members": "Suggested members"
    },
    "copied": "Copied: \"{{ stringToCopy }}\"",
    "dapps": "DApps",
    "error-downloading": "Error occurred while downloading the file.",
    "evan-network": "evan.network",
    "file-select": "Select files",
    "finished-downloading": "The file {{ fileName }} was successfully saved in the downloads",
    "form-alert": {
      "cancel": "Cancel",
      "close": "Close",
      "from-alias": "Your Name that should be send to the new contact",
      "from-body": "Invitation message",
      "from-title": "Invitation Title",
      "submit": "Submit"
    },
    "invalid-password": "An incorrect password has been entered...",
    "load-more": "Load more...",
    "loaded-paging-entries": "Loaded",
    "loading": "Loading...",
    "logout": "Logout",
    "logout-desc": "Do you really want to log out?",
    "month-short-names": "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec",
    "my-profile": "My Profile",
    "new-mails": "New Mails received ({{ newMailCount }}).",
    "new-notification": "New Notification",
    "no-alias": "No Alias",
    "not-implemented": "Available soon...",
    "password": "Password",
    "qrcode": {
      "camera-select": "Camera Selection",
      "header": "Scan QR code",
      "no-camera-selected": "No camera selected"
    },
    "refresh": "Refresh...",
    "refreshing": "Refreshing...",
    "requests-permissions": "requests permissions to",
    "smart-agent": {
      "created-at": "Created at",
      "created-by": "Created from",
      "desc": "Description",
      "rights": {
        "key-exchange": "Key Exchange",
        "key-exchange-desc": "Enable Secure Communication",
        "mailbox-send": "Send Mailbox messages",
        "mailbox-send-desc": "Can send you Mailbox messages"
      },
      "trusted-at": "Verified At",
      "trusted-by": "Verified by"
    },
    "snapshot": {
      "header": "Take a Picture",
      "video_no_available": "Video stream not available"
    },
    "terms-of-use-accept": "agree",
    "terms-of-use-changed": "Changes to the Terms of Use",
    "terms-of-use-error": "An error occurred during terms of use confirmation. Please try again.",
    "use-password": "Unlock",
    "user-locked": "Profile locked",
    "verifications": {
      "accept": "accept",
      "all-issuers": "All verifications related to this verification path and user.",
      "cancel": "cancel",
      "close-details": "close",
      "contract": "Contract",
      "creation-date": "Creation date",
      "delete": "delete",
      "descName": {
        "desc": "Please enter a verification name.",
        "error": "You have to enter a name to save the description!",
        "title": "Verification name"
      },
      "details": "Verification detail",
      "details-desc": "Overview of verifications and their exact status information.",
      "disable-sub-verifications": "Disable subverifications",
      "disable-sub-verifications-desc": "Once this setting is enabled, any verifications created under it will be displayed as invalid.",
      "disabled-sub-verifications": "disabled",
      "dispatcher": {
        "acceptDispatcher": {
          "description": "Do you want to accept the verification \"<b>{{ topic }}</b>\" issued by the user <b>{{ from }}</b>?",
          "ok": "accept",
          "title": "Accept verification"
        },
        "cancel": "cancel",
        "deleteDispatcher": {
          "description": "Do you want to delete the verification \"<b>{{ topic }}</b>\" issued by the user <b>{{ from }}</b>?",
          "ok": "delete",
          "title": "Delete verification"
        },
        "descriptionDispatcher": {
          "description": "Would you like to save the metadata of this verification path?",
          "ok": "save",
          "title": "Verification path adjustments"
        },
        "rejectDispatcher": {
          "description": "Do you want to reject the verification \"<b>{{ topic }}</b>\" issued by the user <b>{{ from }}</b>?",
          "ok": "reject",
          "rejected-description": "The verification <b>{{ topic }}</b> by the user <b>{{ from }}</b> to <b>{{ to }}</b> was rejected by <b>{{ rejector }}</b>: ",
          "title": "Reject verification"
        }
      },
      "done": "ok",
      "enable-expiration-date": "Use expiration date",
      "expiration-date": "Expiration date",
      "interactions": "Editing",
      "issue": "issue",
      "issue-verification": "Issue Verification",
      "issue-verification-description": "Do you want to issue the verification \"<b>{{ topic }}</b>\" to the user <b>{{ to }}</b>?",
      "issued-by": "issued by",
      "issuer": "Issuer",
      "issuer-no-identity": "No verification administration has yet been created for this account, so you cannot issue verifications. Please visit the verification management application to set it up.",
      "not-set": "Not issued",
      "not-set-desc": "...",
      "okays": {
        "confirmed": "confirmed",
        "notExpired": "not expired",
        "valid": "valid",
        "validPath": "valid verification chain"
      },
      "reject": "reject",
      "reject-date": "Reject date",
      "reject-reason": "Reject reason",
      "reject-verification": "reject",
      "rejector": "Rejector",
      "select-desc-img": {
        "select": "Select image",
        "title": "Verification image"
      },
      "set-description": "Save verification description",
      "since": "expired",
      "status": "Status",
      "sub-verifications": "Subverifications",
      "subject": "Subject",
      "subject-no-identity": "No verification administration has been created for this account yet, so no verifications can be issued for this identity.",
      "topic": "Verification path",
      "trust-provider": "Trust provider",
      "trust-taker": "Trust taker",
      "until": "expires",
      "verification-description": "Verification description",
      "verification-hover": "Verification {{ displayName }} issued by {{ from }}",
      "warnings": {
        "disableSubVerifications": "Sub verifications disabled",
        "expired": "expired",
        "invalid": "manipulated",
        "invalidPath": "Invalid verification chain",
        "issued": "not accepted",
        "missing": "Verification does not exist.",
        "noIdentity": "Verification management missing",
        "notEnsRootOwner": "Invalid root verification",
        "parentMissing": "Path does not exist",
        "parentUntrusted": "path invalid",
        "rejected": "rejected",
        "selfIssued": "self created",
        "title": "Warnings",
        "undefined": "valid"
      }
    },
    "warnings": {
      "dont-show-again": "Don't show again",
      "eve-empty": {
        "body": "You have used up your complete contingent of EVEs ({{ value }} EVEs). It is no longer possible to create contracts or send transactions.",
        "title": "EVEs are used up"
      },
      "eve-low": {
        "body": "You have almost used up your complete contingent of EVEs ({{ value }} EVEs). It's possible that special actions (contract creation, storage transactions) will fail if the EVE value is too low.",
        "title": "EVEs are almost used up"
      },
      "indexdb-not-available": {
        "body": "The browser you are using does not support local caching of data, which can lead to runtime problems. Please use one of the following browsers: <b>Chrome, Firefox Safari, Edge</b>.<br><br><b>Hint</b>: Some browsers have limited memory in a private mode.",
        "title": "Local data memory not available"
      },
      "payment-channel": {
        "body": "In order to store data on the evan.network, a credit is required. Please set up a credit in the profile settings in order to be able to save data.",
        "navigate-to-profile": "Go to the profile settings",
        "title": "Storage payments"
      },
      "quota-exceeded": {
        "body": "The evan.network can no longer cache loaded data, which can lead to runtime problems.<br><br>Please clear the evan.network specific data.",
        "clear-ipfs-cache": "Clear Data",
        "title": "Browser memory full"
      },
      "quota-reload": {
        "cancel": "cancel",
        "description": "In order for these changes to take effect, please reload the application",
        "ok": "Reload",
        "title": "Data successfully emptied"
      }
    }
  },
  "_angularcorequeue": {
    "configuration": "Configuration",
    "detail-view": "Enable detail view",
    "empty-queue": "Empty Queue",
    "empty-queue-description": "The Queue is empty and nothing needs to be saved. You can go on with your work.",
    "enable-auto-sync": "Auto synchronization",
    "enable-auto-sync-desc": "Auto synchronization instantly synchronizes your local data to the world. <br><br> If you want to handle this process manually, you need to disable automated synchronization.",
    "error": "Error",
    "error-occured": "Error occurred while synchronizing data.",
    "go-back": "Go back",
    "hint": {
      "button": "Ok",
      "description": "A new entry to the <b>Evan Blockchain Queue</b> was added.<br><br>Each data within the queue is saved <b>locally</b> to ensure to work <ul>  <li>offline</li>  <li>fast</li>  <li>lightweight</li></ul><div class=\"evan-seperator\"></div>To persist your local queue data to the Blockchain, navigate to the queue overview by using<ul>  <li>the <b>lightblue button</b> in the <b>top right</b> corner of your screen</li>  <li>clicking the <b>\"show\"</b> button within the <b>toast notification</b> in the  <b>bottom</b> of your screen</li></ul>",
      "show": "Show",
      "show-again": "Never show again",
      "show-queue": "Show Queue",
      "title": "Blockchain Queue"
    },
    "new-entry-added": "Blockchain queue entry added...",
    "queue-hint": "Evan Queue",
    "queue-hint-description": "This overview shows all data that is saved for you locally. <br>By clicking \"start synchronization\" the specific data set will be saved permanently. <div class=\"evan-seperator\"></div> <b>Notice:</b><br><br> The synchronization can take several minutes.<br> Don\"t close this browser page / app while the synchronization is running.<br> You can visit each other page within the application.",
    "reload": "Reload",
    "reload-view-description": "Queue data was synchronized successfully. <br> You are currently using ui components that needs to refresh it\"s current data. <br><br> Please : <ul>   <li><b>reload</b> the current view by clicking \"reload\"</li>   <li>or finish your work and <b>navigate manually</b> to another view or reload the page.</li> </ul>",
    "reload-view-title": "Queue Data Changes",
    "remove": "Remove",
    "removeQueueEntry": "Remove queue Entry",
    "removeQueueEntryDescription": "Do you want to delete this queue entry? It will be deleted permanently from your local storage.",
    "report-error": "Report Error",
    "retry": "Retry...",
    "retry-description": " Synchronization problems are usually caused by network restrictions. Please try again.",
    "saving": "Saving",
    "show": "Show",
    "show-new-entry": "Show",
    "sidepanel-data-sets": "data set(s)",
    "sidepanel-empty-queue": "Already up to date",
    "sidepanel-header": "Synchronization",
    "slider": {
      "0": "Queue Status",
      "1": "Data to save",
      "2": "Data to save"
    },
    "startsync": "Start synchronization",
    "sync-all": "Synchronize all queue entries",
    "sync-finished": "Synchronization finished",
    "synchronising": "Synchronising",
    "synchronizing": "Synchronizing"
  },
  "_loading": {
    "go-back": "go to last DApp",
    "loaded-to-long": "The DApp loads longer than expected."
  },
  "_logging": {
    "ignore": "Ignore and clear logs",
    "log_close": "close",
    "log_detailed": "Send detailed analysis",
    "log_only_errors": "Send errors",
    "log_question_message": "Send bugs to the evan.network developers for analysis.<br> Use \"Send errors\" to send only the errors that have occurred. With the help of \"Send detailed analysis\" you can view the complete history of the application to evaluate, filter and report it.",
    "log_question_title": "Send errors",
    "logs-sent": "Thank you very much! Your logs have been forwarded to evan.network developers."
  },
  "cancel": "Cancel",
  "edit": "Edit",
  "error": {
    "not_implemented": "Not implemented"
  },
  "evan-reload": "Refreshing...",
  "go-to": "Go to",
  "go-to-dappdashboard": "Go to Dashboard",
  "go-to-evan": "Go to Evan",
  "go-to-mails": "Go to Mailbox",
  "go-to-queue": "Synchronization details",
  "loading-dapp": "Loading...",
  "metamask": "Metamask",
  "no-alias": "No alias",
  "open": "Open",
  "remove": "Remove",
  "submit": "Submit"
}
/* tslint:enable */

