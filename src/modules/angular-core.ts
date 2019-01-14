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

import {
  BrowserAnimationsModule,                  // @angular/platform-browser/animations'
  Camera,                                   // @ionic-native/camera
  CommonModule, registerLocaleData,         // @angular/common
  File,                                     // @ionic-native/file
  FileOpener,                               // @ionic-native/file-opener
  FormsModule,                              // @angular/forms
  IonicModule, IonicApp,                    // ionic-angular
  IonTagsInputModule,                       // ionic-tags-input
  languages,                                // everything from @angular/common/locales
  NgCircleProgressModule,                   // ng-circle-progress
  NgModule, ErrorHandler, enableProdMode,   // @angular/core
  QRScanner,                                // @ionic-native/qr-scanner
  RouterModule, Routes, RouteReuseStrategy, // @angular/router
  TranslateModule, TranslateService,        // @ngx-translate/core
  ZXingScannerModule,                       // qr-code-scanner module
  HttpModule,                               // @angular/http
} from 'angular-libs';

// services
import { AngularCoreTranslations } from '../i18n/registy';
import { EvanAddressBookService } from '../services/bcc/address-book';
import { EvanAlertService } from '../services/ui/alert';
import { EvanBCCService } from '../services/bcc/bcc';
import { EvanBcService } from '../services/bcc/bc';
import { EvanBookmarkService } from '../services/bcc/bookmark';
import { EvanClaimService } from '../services/bcc/claims';
import { EvanCoreService } from '../services/bcc/core';
import { EvanDescriptionService } from '../services/bcc/description';
import { EvanExceptionHandler } from '../services/ui/exception-handler';
import { EvanFileService } from '../services/ui/files';
import { EvanInputService } from '../services/ui/inputs';
import { EvanLoggingService } from '../services/ui/logging';
import { EvanMailboxService } from '../services/bcc/mailbox';
import { EvanModalService } from '../services/ui/modal';
import { EvanOnboardingService } from '../services/bcc/onboarding';
import { EvanPictureService } from '../services/ui/picture';
import { EvanQrCodeService } from '../services/ui/qr-code';
import { EvanQueue } from '../services/bcc/queue';
import { EvanRoutingService } from '../services/ui/routing';
import { EvanSlidesService } from '../services/ui/slides';
import { EvanToastService } from '../services/ui/toast';
import { EvanTranslationService } from '../services/ui/translate';
import { EvanUtilService } from '../services/utils';
import { SingletonService } from '../services/singleton-service';

// components
import { BigPictureDialog } from '../components/big-picture/big-picture';
import { BlockieComponent } from '../components/blockie/blockie';
import { ContractListEntriesComponent } from '../components/contract-listentries/contract-listentries';
import { ContractMembersComponent } from '../components/contract-members/contract-members';
import { DAppLoaderComponent } from '../components/dapp-loader/dapp-loader';
import { DashboardTopButtons } from '../components/dashboard-top-buttons/dashboard-top-buttons';
import { EmptyDAppDisplayComponent } from '../components/empty-dapp-display/empty-dapp-display';
import { EvanClaimComponent } from '../components/claim/claim';
import { EvanDAppWrapperComponent } from '../components/dapp-wrapper/dapp-wrapper';
import { EvanFileSelectComponent } from '../components/file-select/file-select';
import { EvanLoadingComponent } from '../components/evan-loading/evan-loading';
import { EvanProfileClaimsComponent } from '../components/profile-claims/profile-claims';
import { EvanReloadComponent } from '../components/reload-route/reload-route';
import { EvanSplitPaneComponent } from '../components/split-pane/split-pane';
import { GlobalPasswordComponent } from '../components/global-password/global-password';
import { ListPagingComponent } from '../components/list-paging/list-paging';
import { MailDialogComponent } from '../components/mail-dialog/mail-dialog';
import { NotImplementedComponent } from '../components/not-implemented/not-implemented';
import { QrCodeComponent } from '../components/qr-code/qr-code';
import { QRCodeScannerDialogComponent } from '../components/qr-code-scanner/qr-code-scanner';
import { SnapshotDialogComponent } from '../components/take-snapshot/take-snapshot';
import { TrustDialogComponent } from '../components/trust-dialog/trust-dialog';

// pipes
import { ObjectToArrayPipe } from '../pipes/ObjectToArray';
import { ObjectKeysPipe } from '../pipes/object-keys';
// directives
import { OneTimeDirective } from '../directives/oneTime';

/**************************************************************************************************/
try {
  enableProdMode();
} catch (ex) { }

/**
 * angular-core module configuration
 */
const moduleConfig = {
  imports: [
    IonicModule,
    TranslateModule.forRoot(),
    CommonModule,
    FormsModule,
    IonTagsInputModule,
    RouterModule,
    NgCircleProgressModule.forRoot({
      // set defaults here
      radius: 100,
      outerStrokeWidth: 16,
      innerStrokeWidth: 8,
      outerStrokeColor: '#004f7d',
      innerStrokeColor: '#0081c7',
      animationDuration: 300
    }),
    // ZXing scanner module
    ZXingScannerModule.forRoot(),
    HttpModule,
  ],
  declarations: [
    BigPictureDialog,
    BlockieComponent,
    ContractListEntriesComponent,
    ContractMembersComponent,
    DAppLoaderComponent,
    DashboardTopButtons,
    EmptyDAppDisplayComponent,
    EvanClaimComponent,
    EvanDAppWrapperComponent,
    EvanFileSelectComponent,
    EvanLoadingComponent,
    EvanProfileClaimsComponent,
    EvanReloadComponent,
    EvanSplitPaneComponent,
    GlobalPasswordComponent,
    ListPagingComponent,
    MailDialogComponent,
    NotImplementedComponent,
    ObjectKeysPipe,
    ObjectToArrayPipe,
    OneTimeDirective,
    QrCodeComponent,
    QRCodeScannerDialogComponent,
    SnapshotDialogComponent,
    TrustDialogComponent,
  ],
  providers : [
    AngularCoreTranslations,
    Camera,
    EvanAddressBookService,
    EvanAlertService,
    EvanBCCService,
    EvanBcService,
    EvanBookmarkService,
    EvanClaimService,
    EvanCoreService,
    EvanDescriptionService,
    EvanExceptionHandler,
    EvanFileService,
    EvanInputService,
    EvanLoggingService,
    EvanMailboxService,
    EvanModalService,
    EvanOnboardingService,
    EvanPictureService,
    EvanQrCodeService,
    EvanQueue,
    EvanRoutingService,
    EvanSlidesService,
    EvanToastService,
    EvanTranslationService,
    EvanUtilService,
    File,
    FileOpener,
    ObjectKeysPipe,
    ObjectToArrayPipe,
    QRScanner,
    SingletonService,
    TranslateService,
    { provide: ErrorHandler, useClass: EvanExceptionHandler },
  ],
  exports: [
    // angular exports
    RouterModule,
    TranslateModule,
    CommonModule,
    IonicModule,
    NgCircleProgressModule,
    IonTagsInputModule,

    // components
    BigPictureDialog,
    BlockieComponent,
    ContractListEntriesComponent,
    ContractMembersComponent,
    DAppLoaderComponent,
    DashboardTopButtons,
    EmptyDAppDisplayComponent,
    EvanClaimComponent,
    EvanDAppWrapperComponent,
    EvanFileSelectComponent,
    EvanLoadingComponent,
    EvanProfileClaimsComponent,
    EvanReloadComponent,
    EvanSplitPaneComponent,
    GlobalPasswordComponent,
    ListPagingComponent,
    MailDialogComponent,
    NotImplementedComponent,
    QrCodeComponent,
    QRCodeScannerDialogComponent,
    SnapshotDialogComponent,
    TrustDialogComponent,

    // pipes
    ObjectToArrayPipe,
    ObjectKeysPipe,

    // directives
    OneTimeDirective,
  ],
  entryComponents: [
    MailDialogComponent,
    GlobalPasswordComponent,
    TrustDialogComponent,
    SnapshotDialogComponent,
    QRCodeScannerDialogComponent,
    BigPictureDialog,
  ]
};

/**
 * Angular Core Module
 *
 * @class      NgModule AngularCore
 */
@NgModule(moduleConfig)
export class AngularCore {
  constructor(
    translations: AngularCoreTranslations,
    translate: EvanTranslationService,
  ) {
    translate.setLanguage();
  }
}

/**************************************************************************************************/

const languageKeys = Object.keys(languages);
for (let i = 0; i < languageKeys.length; i++) {
  registerLocaleData(languages[languageKeys[i]].default);
}
