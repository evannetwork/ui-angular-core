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

  You can be released from the requirements of the GNU Affero General Public
  License by purchasing a commercial license.
  Buying such a license is mandatory as soon as you use this software or parts
  of it on other blockchains than evan.network.

  For more information, please contact evan GmbH at this address:
  https://evan.network/license/
*/

export const en = {
  'error': {
    'not_implemented': 'Not implemented'
  },
  'edit': 'Edit',
  'metamask' : 'Metamask',
  'remove': 'Remove',
  'submit' : 'Submit',
  'cancel' : 'Cancel',
  'open' : 'Open',
  'loading-dapp' : 'Loading...',
  'go-to': 'Go to',
  'go-to-dappdashboard': 'Go to Dashboard',
  'go-to-evan': 'Go to Evan',
  'go-to-mails': 'Go to Mailbox',
  'go-to-queue': 'Synchronization details',
  'no-alias': 'No alias',
  'evan-reload': 'Refreshing...',
  '_angularcorequeue': {
    'new-entry-added': 'Blockchain queue entry added...',
    'show-new-entry': 'Show',
    'hint': {
      'button': 'Ok',
      'description': `
        A new entry to the <b>Evan Blockchain Queue</b> was added.
        <br><br>
        Each data within the queue is saved <b>locally</b> to ensure to work
         <ul>
          <li>offline</li>
          <li>fast</li>
          <li>lightweight</li>
        </ul>
        <div class="evan-seperator"></div>
        To persist your local queue data to the Blockchain, navigate to the queue overview by using
        <ul>
          <li>the <b>lightblue button</b> in the <b>top right</b> corner of your screen</li>
          <li>clicking the <b>"show"</b> button within the <b>toast notification</b> in the
          <b>bottom</b> of your screen</li>
        </ul>
      `,
      'show-again': 'Never show again',
      'show-queue': 'Show Queue',
      'title': 'Blockchain Queue',
      'show': 'Show',
    },
    'show': 'Show',
    'queue-hint': 'Evan Queue',
    'queue-hint-description': `
      This overview shows all data that is saved for you locally. <br>By clicking
      "start synchronization" the specific data set will be saved permanently.
      <div class="evan-seperator"></div>
      <b>Notice:</b><br><br> The synchronization can take several minutes.<br>
      Don't close this browser page / app while the synchronization is running.<br>
      You can visit each other page within the application.
    `,
    'sync-finished': 'Synchronization finished',
    'error-occured': 'Error occurred while synchronizing data.',
    'retry': 'Retry...',
    'retry-description': `
      Synchronization problems are usually caused by network restrictions. Please try again.
    `,
    'removeQueueEntry': 'Remove queue Entry',
    'remove': 'Remove',
    'removeQueueEntryDescription': `Do you want to delete this queue entry? It will be deleted
     permanently from your local storage.
    `,
    'slider': {
      '0': 'Queue Status',
      '1': 'Data to save',
      '2': 'Data to save'
    },
    'startsync': 'Start synchronization',
    'empty-queue': 'Empty Queue',
    'empty-queue-description': 'The Queue is empty and nothing needs to be saved. You can go on with your work.',
    'go-back': 'Go back',
    'sync-all': 'Synchronize all queue entries',
    'synchronizing': 'Synchronizing',
    'enable-auto-sync': 'Auto synchronization',
    'configuration': 'Configuration',
    'enable-auto-sync-desc': `
      Auto synchronization instantly synchronizes your local data to the world.
      <br><br>
      If you want to handle this process manually, you need to disable automated synchronization.
    `,
    'detail-view': 'Enable detail view',
    'reload': 'Reload',
    'reload-view-title': 'Queue Data Changes',
    'reload-view-description': `
      Queue data was synchronized successfully.
      <br>
      You are currently using ui components that needs to refresh it's current data.
      <br><br>
      Please :
      <ul>
        <li><b>reload</b> the current view by clicking "reload"</li>
        <li>or finish your work and <b>navigate manually</b> to another view or reload the page.</li>
      </ul>
    `,
    'sidepanel-header': 'Synchronization',
    'saving': 'Saving',
    'sidepanel-data-sets': 'data set(s)',
    'sidepanel-empty-queue': 'Already up to date',
    'error': 'Error',
    'report-error': 'Report Error',
    'synchronising': 'Synchronising'
  },
  '_angularcore': {
    'new-notification': 'New Notification',
    'load-more': 'Load more...',
    'loaded-paging-entries': 'Loaded',
    'camera': 'Camera',
    'refresh': 'Refresh...',
    'refreshing': 'Refreshing...',
    'dapps': 'DApps',
    'evan-network': 'evan.network',
    'account-changed': 'Account changed',
    'account-changed-description': `
      You changed or locked your current account.<br>
      The page / application needs to be <b>refreshed</b>.
    `,
    'loading': 'Loading...',
    'not-implemented': 'Available soon...',
    'no-alias': 'No Alias',
    'form-alert': {
      'from-alias': 'Your Name that should be send to the new contact',
      'from-title': 'Invitation Title',
      'from-body': 'Invitation message',
      'submit': 'Submit',
      'cancel': 'Cancel',
      'close': 'Close'
    },
    'new-mails': 'New Mails received ({{ newMailCount }}).',
    'copied': 'Copied: "{{ stringToCopy }}"',
    'password': 'Password',
    'use-password': 'Unlock',
    'logout': 'Logout',
    'logout-desc': 'Do you really want to log out?',
    'cancel': 'Cancel',
    'user-locked': 'Profile locked',
    'invalid-password': 'An incorrect password has been entered...',
    'requests-permissions': 'requests permissions to',
    'my-profile': 'My Profile',
    'smart-agent': {
      'desc': 'Description',
      'trusted-by': 'Verified by',
      'created-by': 'Created from',
      'created-at': 'Created at',
      'trusted-at': 'Verified At',
      'rights': {
        'key-exchange': 'Key Exchange',
        'key-exchange-desc': 'Enable Secure Communication',
        'mailbox-send': 'Send Mailbox messages',
        'mailbox-send-desc': 'Can send you Mailbox messages'
      }
    },
    'contract-members': {
      'search-text': 'Search members to add...',
      'i': 'My Account',
      'add-members': 'Add members',
      'no-suggestions': 'No members found or no more available',
      'members': 'Members',
      'new-members': '{{ count }} are newly added',
      'states': {
        'undefined': 'New',
        '0': 'Initial',
        '1': 'Error',
        '2': 'Draft',
        '3': 'Rejected',
        '4': 'Active',
        '5': 'Finished',
        'loading': 'Loading...'
      },
      'suggested-members': 'Suggested members'
    },
    'snapshot': {
      'header': 'Take a Picture',
      'video_no_available': 'Video stream not available'
    },
    'qrcode': {
      'header': 'Scan QR code',
      'camera-select': 'Camera Selection',
      'no-camera-selected': 'No camera selected'
    },
    "month-short-names": "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec",
    "file-select": "Select files"
  },
  '_logging': {
    'logs-sent': 'Thank you very much! Your logs have been forwarded to evan.network developers.',
    'log_question_title': 'Send errors',
    'log_question_message': `
      Send bugs to the evan.network developers for analysis.<br>
      Use "Send errors" to send only the errors that have occurred.
      With the help of "Send detailed analysis" you can view the complete history of the application to
      evaluate, filter and report it.
    `,
    'log_close': 'close',
    'ignore': 'Ignore and clear logs',
    'log_detailed': 'Send detailed analysis',
    'log_only_errors': 'Send errors',
  },
  '_loading': {
    'loaded-to-long': 'The DApp loads longer than expected.',
    'go-back': 'go to last DApp'
  }
}
