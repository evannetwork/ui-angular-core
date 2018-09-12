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

import { getDomainName, importDApp } from 'dapp-browser';

import {
  Component,           // @angular/core
  Routes, Route,       // @angular/router
} from 'angular-libs';

import {
  EvanReloadComponent
} from '../components/reload-route/reload-route';

import {
  EvanLoadingComponent
} from '../components/evan-loading/evan-loading';

import {
  DAppLoaderComponent
} from '../components/dapp-loader/dapp-loader'

/**************************************************************************************************/

/**
 * default core dapp routes for mailbox, queue, profile, addressbok and
 * favorites
 */
const dashboardRoutes = [
  {
    path: `profile.${getDomainName()}`,
    data: { state: 'profile' },
    children: [ { path: '**', component: DAppLoaderComponent, data: { state: 'profile' }  }, ]
  },
  {
    path: `favorites.${getDomainName()}`,
    data: { state: 'favorites' },
    children: [ { path: '**', component: DAppLoaderComponent, data: { state: 'favorites' }  }, ]
  },
  {
    path: `addressbook.${getDomainName()}`,
    data: { state: 'addressbook' },
    children: [ { path: '**', component: DAppLoaderComponent, data: { state: 'addressbook' }  }, ]
  },
  {
    path: `mailbox.${getDomainName()}`,
    data: { state: 'mailbox' },
    children: [ { path: '**', component: DAppLoaderComponent, data: { state: 'mailbox' }  }, ]
  },
  {
    path: `queue.${getDomainName()}`,
    data: { state: 'queue' },
    children: [ { path: '**', component: DAppLoaderComponent, data: { state: 'queue' } }, ]
  },
  {
    path: `logging.${getDomainName()}`,
    data: { state: 'logging' },
    children: [ { path: '**', component: DAppLoaderComponent, data: { state: 'logging' } }, ]
  },
  {
    path: `evan-reload`,
    component: EvanReloadComponent,
    data: {
      navigateBack : true
    }
  },
];

/**
 * Merges input routes with the default dashboard routes.
 *
 * @param      {Routes}   routes      Angular routes of the module
 * @param      {boolean}  enableBack  enable go back button within dapp-wrapper
 *                                    for dashboard routes
 * @return     {Routes}   merged routes
 */
export function getDashboardRoutes(routes: Routes, enableBack?: boolean): Routes {
  const dashboardRoutesCopy = [ ].concat(dashboardRoutes);

  if (enableBack) {
    for (let i = 0; i < dashboardRoutesCopy.length; i++) {
      dashboardRoutesCopy[i].data.navigateBack = true;

      if (dashboardRoutesCopy[i].children) {
        dashboardRoutesCopy[i].children[0].data.navigateBack = true;
      }
    }
  }

  return [ ].concat(dashboardRoutesCopy, routes);
}


/**
 * Builds evan.network framework nested Angular DApp routes
 *   - including core dapps (like mailbox, queue)
 *   - multiple root route handling
 *     - #/dappEns/asdf
 *     - #/dashboard.evan/dappEns/asdf
 *     - #/dashboard.evan/dappEns/0x00...
 *     - #/dashboard.evan/0x00/...
 *  
 *  Routes can include the following properties, that enhance the route capabilities:
 *    data: {
 *      // used for routing transitions
 *      //   <dapp-wrapper *ngIf="!loading" #dappWrapper>
 *      //     <div evan-content [@routerTransition]="o?.activatedRouteData?.state">
 *      //       <router-outlet #o="outlet"></router-outlet>
 *      //     </div>
 *      //   </dapp-wrapper>
 *      state: 'task-detail',
 *      
 *      // enables navigates back for dapp-wrapper component
 *      navigateBack : true,
 *      
 *      // enables reload property within dapp-wrapper
 *      reload: [ 'contracts' ],
 *      
 *      // trigger route reset after DApp was loaded within the bootstrap-component
 *      evanDynamicRoutes: true
 *    }
 *
 * @param      {string}     dappEns        ens address of the dapp
 * @param      {Component}  CoreComponent  root routing component of the
 *                                         application
 * @param      {Routes}     routes         routing Tree
 * @param      {Routes}     disableDashboardRoutes disable dashboard routes
 * @return     {Routes}     full routing tree
 */
export function buildModuleRoutes(dappEns: string, CoreComponent: Component, routes: Routes, disableDashboardRoutes?: boolean): Routes {
  let enhancedRoutes;

  // only add dashboard routes, if its not disabled
  if (!disableDashboardRoutes) {
    enhancedRoutes = [ ].concat(getDashboardRoutes(routes, true));
  } else {
    enhancedRoutes = [ ].concat(routes);
  }

  for (let i = 0; i < routes.length; i++) {
    if (routes[i].path === '' && routes[i].component) {
      enhancedRoutes.unshift({
        path: dappEns,
        children: [ ].concat(enhancedRoutes)
      });

      break;
    }
  }

  let splittedHash = window.location.hash.replace(/\#\//g, '').split('?')[0].split('/');
  const indexOfDAppEns = splittedHash.indexOf(dappEns);

  if (indexOfDAppEns !== -1) {
    splittedHash = splittedHash.splice(0, indexOfDAppEns + 1);
  } else {
    splittedHash.splice(splittedHash.length - 1, 1);
  }

  const moduleRoutes: Routes = [
    {
      path: splittedHash.join('/'),
      component: CoreComponent,
      children: enhancedRoutes,
      // runGuardsAndResolvers: 'always',
      data: {
        evanDynamicRoutes: true,
        dynamicRoutesConfig: {
          dappEns: dappEns,
          CoreComponent: CoreComponent,
          routes: routes
        }
      }
    },
    {
      path: '**',
      component: EvanLoadingComponent,
      data: {
        state: 'Not found',
        navigateBack: true
      }
    }
  ];

  return moduleRoutes;
}
