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

import { System } from '@evan.network/ui-dapp-browser';

System.map['@evan.network/ui-angular-core'] = 'angularcore.evan!dapp-content';
System.map['angular-core'] = 'angularcore.evan!dapp-content';

// modules
export * from './modules/angular-core';

// services
export * from './i18n/registy';
export * from './services/bcc/address-book';
export * from './services/bcc/bc';
export * from './services/bcc/bcc';
export * from './services/bcc/bookmark';
export * from './services/bcc/verifications';
export * from './services/bcc/core';
export * from './services/bcc/description';
export * from './services/bcc/mailbox';
export * from './services/bcc/onboarding';
export * from './services/bcc/payment';
export * from './services/bcc/queue';
export * from './services/bcc/queue-utilities';
export * from './services/singleton-service';
export * from './services/ui/alert';
export * from './services/ui/exception-handler';
export * from './services/ui/files';
export * from './services/ui/inputs';
export * from './services/ui/logging';
export * from './services/ui/modal';
export * from './services/ui/picture';
export * from './services/ui/qr-code';
export * from './services/ui/routing';
export * from './services/ui/slides';
export * from './services/ui/toast';
export * from './services/ui/translate';
export * from './services/utils';

// components
export * from './components/dapp-loader/dapp-loader';
export * from './components/blockie/blockie';
export * from './components/evan-loading/evan-loading';
export * from './components/trust-dialog/trust-dialog';
export * from './components/bootstrap-component/bootstrap-component';
export * from './components/take-snapshot/take-snapshot';
export * from './components/qr-code-scanner/qr-code-scanner';
export * from './components/dapp-wrapper/dapp-wrapper';

// animations
export * from './animations/grow';
export * from './animations/opacity';
export * from './animations/router-transition';
export * from './animations/tabs';

// pipes
export * from './pipes/ObjectToArray';

// classes
export * from './classes/routesBuilder';
export * from './classes/ionicAppElement';
export * from './classes/AsyncComponent';

// directives
export * from './directives/oneTime';

