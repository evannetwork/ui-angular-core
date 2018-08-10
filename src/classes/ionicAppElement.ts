/*
  Copyright (C) 2018-present evan GmbH.

  This program is free software: you can redistribute it and/or modify it
  under the terms of the GNU Affero General Public License, version 3,
  as published by the Free Software Foundation.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
  See the GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License along with this program.
  If not, see http://www.gnu.org/licenses/ or write to the

  Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA, 02110-1301 USA,

  or download the license from the following URL: https://evan.network/license/

  You can be released from the requirements of the GNU Affero General Public License
  by purchasing a commercial license.
  Buying such a license is mandatory as soon as you use this software or parts of it
  on other blockchains than evan.network.

  For more information, please contact evan GmbH at this address: https://evan.network/license/
*/

import {
  platformBrowserDynamic,
  ApplicationRef,
  CompilerFactory, Router, Routes, provideRoutes
} from 'angular-libs';

import {
  EvanQueue
} from '../services/bcc/queue';

import {
  BootstrapComponent
} from '../components/bootstrap-component/bootstrap-component';

/**************************************************************************************************/

/**
 * window[runtimeString] for global angular runtime caches
 */
const runtimeString = '_evanAngularRuntimes';

/**
 * Angular compiler instance to handle a global ngFactory cache
 */
let compiler;

/**
 * platformBrowser instance used to initialize angular modules
 */
let platformBrowser: any = platformBrowserDynamic();

/**
 * Checks, if the current window gets reloaded. Clear old stuff to prevent memory leaks.
 */
window.addEventListener('beforeunload', function (event) {
  try {
    // destroy existing angular platform browser instances
    platformBrowser.destroy();
  } catch (ex) { }
  platformBrowser = null;

  // delete angular references from window
  delete (<any>window).webpackJsonp;
  delete (<any>window).frameworkStabilizers;
  delete (<any>window).getAngularTestability;
  delete (<any>window).getAllAngularTestabilities;
  delete (<any>window).getAllAngularRootElements;
  delete (<any>window).ng;

  // for stopping of all ionic angular applications within the dom
  const appElements = document.getElementsByTagName('ion-app');
  for (let i = 0; i < appElements.length; i++) {
    stopAngularApplication();
  }
});

/**
 * creates an ionic app container element, appends the dbcp name as id, add evan
 * class names and sets the 'angular-application-ref' property to know, whichs
 * runtime reference needs to deleted later
 *
 * @param      {Element}  container  container of the application that should be
 *                                   bootstrapped
 * @param      {string}   name       DBCP.public.name
 * @return     {Element}  returns the new ionic-app element
 */
export function createIonicAppElement(container: Element, name: string) {
  const ionApps = container.querySelectorAll('ion-app');

  for (let i = 0; i < ionApps.length; i++) {
    ionApps[i].parentElement.removeChild(ionApps[i]);
  }

  stopAngularApplication();

  // create a new container for the dapp to load
  const ionApp = document.createElement(`ion-app`);
  ionApp.id = name;
  ionApp.className += ' evan-dapp app-root app-root-md md platform-core enable-hover visible';
  ionApp.setAttribute('angular-application-ref', 'e-' + generateID() + '-e');

  if (container !== document.body) {
    ionApp.style.cssText = 'contain: unset !important;';
  }

  if (document.body.firstChild) {
    document.body.insertBefore(ionApp, document.body.firstChild);
  } else {
    document.body.appendChild(ionApp);
  }

  return ionApp;
}

/**
 * Is used to cache an angular application ref to global context, to be able to
 * clear everything correct. This is used in combination with the
 * BootstrapComponent of the angular-core.
 *
 * @param      {ApplicationRef}  applicationRef  Angular application ref
 * @param      {Element}         elementRef      element of the application to
 *                                               handle the applicationRefID
 */
export function referenceApplicationRef(applicationRef: ApplicationRef, elementRef: Element) {
  ensureAngularRuntimes();

  const applicationRefID = elementRef.getAttribute('angular-application-ref');

  window[runtimeString][applicationRefID] = applicationRef;
}


/**
 * generates a random id
 *
 * @return     {string}  random id
 */
function generateID(): string {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

/**
 * Ensures that the window[runtimeString] property is available
 */
function ensureAngularRuntimes() {
  window[runtimeString] = window[runtimeString] || { };
}

/**
 * Starts an angular module within a and applies root routes
 *
 * @param      {AngularModule}     AppModule  Angular module definition
 * @param      {Array<Array<*n>>}  routes     Angular 5 route definitions
 * @return     {any}            returns platformBrowser.bootstrapModuleFactory result
 */
export async function startAngularApplication(AppModule: any, routes: Routes): Promise<any> {
  let moduleFactory;

  if (AppModule.ngFactory) {
    moduleFactory = AppModule.ngFactory;
  } else {
    try {
      if (!compiler) {
        const compilerFactory = platformBrowser.injector.get(CompilerFactory);
        compiler = compilerFactory.createCompiler();

        compiler._metadataResolver._addTypeToModule = function(type, moduleType) {
          this._ngModuleOfTypes.set(type, moduleType);
        }
      }

      moduleFactory = AppModule.ngFactory = await compiler.compileModuleAsync(AppModule);

      compiler._metadataResolver.clearCacheFor(AppModule);
    } catch (ex) {
      console.error(ex);

      throw ex;
    }
  }

  return await platformBrowser.bootstrapModuleFactory(moduleFactory, [
    provideRoutes(routes)
  ]);
}

/**
 * Stops an angular application using the element reference that were created by
 * createIonicAppElement
 *
 * @param      {Element}  container  container of the application
 */
export function stopAngularApplication() {
  const openRuntimes = Object.keys(window[runtimeString] || { });

  for (let i = 0; i < openRuntimes.length; i++) {
    let isVisible = false;

    try {
      // try to load
      if (document.querySelectorAll(`[angular-application-ref=${ openRuntimes[i] }]`).length > 0) {
        continue;
      }
    } catch (ex) { }

    // stop angular components to trigger ngOnDestroy in all components
    const applicationRef = window[runtimeString][openRuntimes[i]];
    if (applicationRef) {
      // remove it from the runtimes so it will not be destroyed multiple times
      delete window[runtimeString][openRuntimes[i]];

      setTimeout(() => {
        const views = applicationRef._views || [ ];
        let ngModule;
        let providers = [ ];

        try {
          ngModule = applicationRef._componentFactoryResolver._ngModule;
          providers = ngModule._providers;
        } catch (ex) { }

        // destroy all views
        for (let i = 0; i < views.length; i++) {
          views[i].destroy();

          i--;
        }

        // stop all providers
        for (let i = 0; i < providers.length; i++) {
          if (providers[i] && providers[i].ngOnDestroy) {
            if (providers[i] instanceof EvanQueue && providers[i].isLoading()) {
              providers[i].destroyAfterSync = true;
            } else {
              providers[i].ngOnDestroy();
            }
          }
        }

        if (ngModule && !ngModule._destroyed) {
          try {
            ngModule.destroy();
          } catch (ex) { }
        }
      }, 100);
    }
  }
}
