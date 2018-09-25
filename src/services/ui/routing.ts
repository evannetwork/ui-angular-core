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
  getDomainName,
  importDApp,
  System,
  routing,
  utils
} from 'dapp-browser';

import {
  Router, RouterEvent, NavigationEnd, Route, ActivatedRoute, UrlTree, // '@angular/router';
  Injectable,                                                         // '@angular/core';
  Location,                                                           // '@angular/common
  Observable,                                                         // 'rxjs/Observable'
  TranslateService,                                                   // @ngx-translate/core
  Platform,
} from 'angular-libs';

import { SingletonService } from '../singleton-service';
import { EvanUtilService } from '../utils';
import { EvanCoreService } from '../bcc/core';

// should be deleted later
routing.history = routing.history || [ ];
/**
 * Takes the current navigation history and writes it to the sessionStorage if the user navigates to
 * another page and navigates back
 */
routing.updateHistory = routing.updateHistory || function() {
  window.sessionStorage['evan-route-history'] = JSON.stringify(history);
}

/********************************* Overwrites *****************************************************/
/**
 * Overwrite some original Router functions to replace the normale angular
 * "routing" call with an window.location.hash = "...", so each router change,
 * in each angular instance, gets triggered
 */
const originNavigateByUrl = Router.prototype.navigateByUrl;

/**
 * Used to handle one back button action for latest opened appication => navigate back
 */
let backbuttonAction;
let backbuttonTimeout;
let stackHistoryTimeout;

/**
 * Takes an routeUrl, removes #, /#, #/ and returns the original hash value
 * without query params
 *
 * @param      {string}  routeUrl  RouteUrl like the following :
 *                                 #/dapp/dapp1?param1=est
 * @return     {string}  transforms #/dapp/dapp1?param1=est to dapp/dapps
 */
const getRouteFromUrl = function(routeUrl: string) {
  return routeUrl
      .replace(/#\/|\/#/g, '')
      .split('?')[0];
}

/**
 * trigger navigation first time.
 */
Router.prototype.initialNavigation = function () {
  this.setUpLocationChangeListener();

  if (this.navigationId === 0) {
    originNavigateByUrl.call(this, this.location.path(true), { replaceUrl: true });
  }
};

/**
 * Replaced navigate by url.
 *
 * @param      {any}           url     url that should be navigated too
 * @param      {any}           extras  routing options
 * @return     {Promise<any>}  resolved directly
 */
Router.prototype.navigateByUrl = function(url: any, extras: any): Promise<any> {
  if (extras === void 0) { extras = { skipLocationChange: false }; }
  let urlTree = url instanceof UrlTree ? url : this.parseUrl(url);
  let mergedTree = this.urlHandlingStrategy.merge(urlTree, this.rawUrlTree);

  // history stack history timeout to prevent pushing of empty routes
  //   => Angular 5 router provides the functionality to 
  if (stackHistoryTimeout) {
    window.clearTimeout(stackHistoryTimeout);
  }
  
  // save latest location
  const locationHash = window.location.hash;
  stackHistoryTimeout = setTimeout(() => {
    routing.history.push(getRouteFromUrl(locationHash));
    routing.updateHistory();
  }, 100);

  // return this.scheduleNavigation(mergedTree, 'imperative', extras);
  // trigger navigation 
  window.location.hash = `#${ mergedTree.toString() }`;

  return Promise.resolve();
}

/**************************************************************************************************/

/**
 * Angular 5 routing wrapper service.
 *
 * @class      Injectable EvanRoutingService
 */
@Injectable()
export class EvanRoutingService {
  /**
   * loaded navigate back status (Route.data.navigateBack)
   */
  navigateBackStatus: any;

  /**
   * navigation subscriptions
   */
  subscriptions: any;

  /**
   * function used to handle android back button navigation
   */
  backButtonFunc: Function;

  /**
   * require dependencies & set routing subscriptions
   */
  constructor(
    public router: Router,
    public activeRoute: ActivatedRoute,
    public location: Location,
    private translate: TranslateService,
    private singleton: SingletonService,
    private utils: EvanUtilService,
    private platform: Platform
  ) {
    this.subscriptions = { };

    /**
     * subscribe for router events and trigger subscriptions
     */
    this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationEnd) {
        const ids = Object.keys(this.subscriptions);
        for (let i = 0; i < ids.length; i++) {
          this.subscriptions[ids[i]](event);
        }
      }
    });

    /**
     * wait for onhashchange event and update navigateBackStatus
     */
    window.onhashchange = () => {
      if (this.getActiveRoot()) {
        this.setNavigateBackStatus();
      }

      // much better logic for handling history stacking, but it will end in routing endless loops
      //   by using goback an history popping 
      // 
      // check for url navigation to handle correct back logic outside of router.navigate
      // const beforeUrl = getRouteFromUrl(event.oldURL.split('#/')[1]);
      // if (routing.history.length === 0 || routing.history[routing.history.length - 1] !== beforeUrl) {
      //   routing.history.push(beforeUrl);
      //   routing.updateHistory();
      // }
    }

    platform.registerBackButtonAction(() => {
      if (!backbuttonTimeout) {
        const isDashboard = this.getActiveRootEns() === `dashboard.${ getDomainName() }`;
        const isFavorites = this.getDAppNameFromRoutePath(this.getRouteFromUrl(window.location.hash)) === `favorites`;

        if (!(isDashboard && isFavorites)) {
          this.goBack();
          
          backbuttonTimeout = setTimeout(() => {
            backbuttonTimeout = undefined;
          }, 500);
        }
      }
    });
  }

  /**
   * Lookup the current route configuration or it's parent, to find an route
   * where the path exists.
   *
   * @param      {string}  path    Route path to find
   * @param      {any}     parent  A route configuration where the child should
   *                               be searched.
   * @return     {string}  The loaded route
   */
  getRoute(path: string, parent: any = { children : this.router.config }): any {
    // find existing module
    const found = parent.children.filter(existingRoute => existingRoute.path === path);

    if (found.length > 0) {
      return found[0];
    }
  }

  /**
   * Takes an routeUrl, removes #, /#, #/ and returns the original hash value
   * without query params
   *
   * @param      {string}  routeUrl  RouteUrl like the following :
   *                                 #/dapp/dapp1?param1=est
   * @return     {string}  transforms #/dapp/dapp1?param1=est to dapp/dapps
   */
  getRouteFromUrl(routeUrl: string): string {
    return getRouteFromUrl(routeUrl);
  }

  /**
   * Watches the current router url and splits out the last hash param that
   * represents the module id.
   *
   * @return     {Observable<string>}  an Observable that resolves url updates.
   */
  activeRouteName(): Observable<string> {
    return new Observable<string>(observer => {
      observer.next(this.getDAppNameFromRoutePath(this.getRouteFromUrl(this.router.url)));

      this.router.events.subscribe((event: RouterEvent) => {
        if (event instanceof NavigationEnd) {
          observer.next(this.getDAppNameFromRoutePath(this.getRouteFromUrl(this.router.url)));
        }
      });
    });
  }

  /**
   * Watches the current router url and splits out the last hash param that
   * represents the module id.
   *
   * @return     {Observable<string>}  an Observable that resolves url updates.
   */
  activeRootRouteName(): Observable<string> {
    return new Observable<string>(observer => {
      if (this.getActiveRoot()) {
        observer.next(this.getDAppNameFromRoutePath(this.getActiveRoot().routeConfig.path));
      }

      this.router.events.subscribe((event: RouterEvent) => {
        if (event instanceof NavigationEnd && this.getActiveRoot()) {
          observer.next(this.getDAppNameFromRoutePath(this.getActiveRoot().routeConfig.path));
        }
      });
    });
  }

  /**
   * Returns the deepest activedRoute of the current parent activatedRoute. This
   * one will be the active route. Used to consume route data.
   *
   * @param      {ActivatedRoute}  route      The activatedRoute or one of it's
   *                                          children
   * @param      {number}          deep       Recursion deep, cancel after 20
   *                                          recursion to prevent dead lock
   * @param      {string}          childPath  Check for an additional childPath
   *                                          to return innerst active route
   * @return     {ActivatedRoute}  deepest ActivatedRoute
   */
  getActiveChild(route: ActivatedRoute, deep = 0, childPath?: string): ActivatedRoute {
    if (deep > 20) {
      return route;
    }

    if (childPath) {
      // get last part of url => the active iteration one
      let dappName = route.firstChild.routeConfig.path.split('/').pop();
      // get first entry of ens path
      dappName = utils.getDAppName(dappName);

      // split out the first ens entry
      if (dappName.endsWith(childPath)) {
        return route.firstChild;
      }
    }

    if (route.firstChild) {
      if (route.firstChild.children.length === 0) {
        return route.firstChild;
      } else {
        return this.getActiveChild(route.firstChild, ++deep, childPath);
      }
    } else {
      return route;
    }
  }

  /**
   * Search for the current active route and set the current navigateBackStatus.
   * This is used by "canNavigateBack" and "goBack" function to handle display
   * of back button or to go to a specific route.
   */
  setNavigateBackStatus() {
    this.navigateBackStatus = this.getActiveChild(this.activeRoute)
      .data['value']['navigateBack'];
  }

  /**
   * Returns the current root component.
   *
   * @return     {any}  this.activeRoute.firstChild
   */
  getActiveRoot(): any {
    return this.activeRoute.firstChild;
  }

  /**
   * Get the DApp name from an route
   *
   * @param      {string}  routePath  route path to parse the dapp from
   * @return     {string}  dappName
   */
  getDAppNameFromRoutePath(routePath: string): string {
    return utils.getDAppName(routePath.split('/').pop());
  }

    /**
     * Get the DApp name from an route
     *
     * @return     {string}  dapp name from current route
     */
  getDAppNameFromCurrRoutePath(): string {
    const routePath = this.getRouteFromUrl(this.router.url);

    return this.getDAppNameFromRoutePath(routePath);
  }

  /**
   * Returns an Oberservable that updates triggers when a route was changed and
   * returns if a back navigation should be available.
   *
   * @return     {Observable<boolean>}  True if able to navigate back, False otherwise.
   */
  canNavigateBack(): Observable<boolean> {
    return new Observable<boolean>(observer => {
      this.setNavigateBackStatus();

      observer.next(this.navigateBackStatus);

      this.router.events.subscribe((event: RouterEvent) => {
        if (event instanceof NavigationEnd) {
          this.setNavigateBackStatus();

          observer.next(this.navigateBackStatus);
        }
      });
    });
  }

  /**
   * Uses an hash value and replaces the current hash with the new one. But it will use href = to
   * force parent dapp router handling, if we only set the hash, the navigation will stuck within
   * the current child DApp.
   * 
   *   e.g. dashboard/favorites goes back to dashboard with empty history stack
   *        but nothing will happen because the favorites capured the navigation event and
   *        stops bubbling
   *
   * @param      {string}  hash    new window.location.hash value
   */
  forceUrlNavigation(hash: string) {
    // HACKY HACKY HACKY
    //   by using goBack it could be possible that the logic navigates to dashboard.evan
    //   a strange behavior occures 
    //        dashboard.evan/XXX
    //     => dashboard.evan
    //     => dashboard.evan/favorites (everything is fine)
    //     => dashboard.evan (why this is happening?)
    if (hash === `dashboard.${ getDomainName() }`) {
      hash = `${ hash }/favorites.${ getDomainName() }`
    }

    window.location.href = window.location.href.replace(window.location.hash, `#/${ hash }`);
  }

  /**
   * Goes back. If this.navigateBackStatus contains an route string, navigate to
   * this route else trigger location.back().
   */
  async goBack(): Promise<void> {
    this.setNavigateBackStatus();

    if (this.navigateBackStatus) {
      if (typeof this.navigateBackStatus === 'string') {
        this.router.navigate([this.navigateBackStatus], {
          relativeTo: this.getActiveChild(this.activeRoute)
        });

        return;
      } else if (typeof this.navigateBackStatus === 'function') {
        this.navigateBackStatus();

        return;
      }
    }

    // navigate back
    //  => use 
    if (routing.history.length === 0) {
      const splitHash = this.getRouteFromUrl(window.location.hash).split('/');

      // remove last entry from hash
      splitHash.pop();

      // if we are on / route, navigate to default dashboard
      if (splitHash.length === 0) {
        this.forceUrlNavigation(routing.defaultDAppENS);
      } else {
        // if we can navigate upwards, join the current splitHAsh
        this.forceUrlNavigation(splitHash.join('/'));
      }
    } else {
      // use last value from history
      let goBackRoute = routing.history.pop();

      while (goBackRoute === this.getRouteFromUrl(window.location.hash) && routing.history.length > 1) {
        goBackRoute = routing.history.pop();
      }

      // use latest history
      this.forceUrlNavigation(goBackRoute);
    }
  }

  /**
   * Navigates to the dappprofile relative to the active dashboard
   */
  goToProfile() {
    window.location.hash = routing.getActiveRootENS() + `/profile.${ getDomainName() }`
  }

  /**
   * Navigates to the dapp queue relative to the active dashboard
   */
  goToQueue() {
    window.location.hash = routing.getActiveRootENS() + `/queue.${ getDomainName() }`
  }

  /**
   * Navigates to the dapp mailbox relative to the active dashboard
   */
  goToMails() {
    window.location.hash = routing.getActiveRootENS() + `/mailbox.${ getDomainName() }`
  }

  /**
   * Navigates to the dapp logging relative to the active dashboard
   */
  goToLogging() {
    window.location.hash = routing.getActiveRootENS() + `/logging.${ getDomainName() }`
  }

  /**
   * Navigates to the dapp dashboard relative to the active dashboard
   */
  goToDashboard() {
    this.router.navigate([ `/dashboard.${ getDomainName() }` ]);
  }

  /**
   * Use special "this.router.navigate" properties.
   *
   * @param      {string}   route           route name to navigate to
   * @param      {boolean}  relativeToRoot  navigate relative to current parent
   *                                        route or use only the route string
   * @param      {any}      queryParams     query params that should be applied
   *                                        to the navigated
   *                                        routes(?param1=...&param2=...)
   */
  navigate(route: string, relativeToRoot?: boolean, queryParams?: any) {
    const config: any = { };

    if (relativeToRoot) {
      config.relativeTo = this.getActiveRoot();
    } else {
      config.relativeTo = this.getActiveChild(this.activeRoute);
    }

    if (queryParams) {
      config.queryParams = queryParams;
    }

    // window.location.hash = `#${ this.router.createUrlTree([ route ], config) }`;
    this.router.navigate([ route ], config);
  }

  /**
   * Open an ENS path
   *
   * @param      {string}  ensAddress   ENS Address to open
   * @param      {string}  relativeTo   get the route with the specific name and
   *                                    use the ensAddress relative to the
   *                                    specified route
   * @param      {any}     queryParams  query params that should be applied to
   *                                    the navigated
   *                                    routes(?param1=...&param2=...)
   */
  openENS(ensAddress: string, relativeTo?: string, queryParams?: any) {
    const options: any = { };

    if (relativeTo) {
      options.relativeTo = this.getActiveChild(this.activeRoute, 0, relativeTo);
    }

    if (queryParams) {
      options.queryParams = queryParams;
    }

    this.router.navigate([
      `${ relativeTo ? '.' : '' }/${ensAddress}`
    ], options);
  }

  /**
   * Get a parameter value from the current active route.
   *
   * @param      {string}  param   Parameter to get from the current route
   *                               state.
   * @return     {any}     data parameter value
   */
  getDataParam(param: string): any {
    return (<any>this.getActiveChild(this.activeRoute).data)._value[param];
  }

  /**
   * Returns an parameter from the current route or it's children
   *
   * @param      {any}  param   param key
   * @return     {any}  hash parameter value
   */
  getHashParam(param: string): any {
    let activeChild = <any>this.getActiveChild(this.activeRoute);
    let turns = 10;
    let value;

    while (!value && turns > 0 && activeChild) {
      value = activeChild.params._value[param];

      activeChild = activeChild.parent;
      turns--;
    }

    return value;
  }

  /**
   * Return all query params as object.
   *
   * @return     {any}  deep copy of the current query params
   */
  getQueryparams(): any {
    return this.utils.deepCopy(
      (<any>this.activeRoute.queryParams)._value
    );
  }

  /**
   * Get a parameter value from the current active route.
   *
   * @param      {string}  param   Parameter to get from the current route
   *                               state.
   * @return     {any}     data parameter value
   */
  getRouteConfigParam(param: string): any {
    const config = this.getActiveChild(this.activeRoute).routeConfig;

    if (config && config.data) {
      return config.data[param];
    }
  }

  /**
   * Get a parameter value from the current root route.
   *
   * @param      {string}  param   Parameter to get from the current route state.
   * @return     {any}     The root route configuration parameter.
   */
  getRootRouteConfigParam(param: string): any {
    const config = this.getActiveRoot().routeConfig;

    if (config && config.data) {
      return config.data[param];
    }
  }

  /**
   * Triggers an loading of the current split pane content.
   */
  reloadCurrentContent() {
    this.router.navigate([
      'evan-reload'
    ], {
      relativeTo: this.getActiveRoot()
    });
  }

  /**
   * window.location.reload();
   */
  windowLocationReload() {
    window.location.reload();
  }

  /**
   * Register for an route change event.
   *
   * @param      {Function}  callback  Function to call if an route change ends
   * @return     {Function}  call to unscubscribe
   */
  subscribeRouteChange(callback): Function {
    let id = this.utils.generateID();

    this.subscriptions[id] = callback;

    return () => {
      delete this.subscriptions[id];
    };
  }

  /**
   * Watching one time for a route change.
   *
   * @return     {Observable}  called on after the first route change
   */
  onceNavigated(): Observable<void> {
    return new Observable<void>(observer => {
      const subscription = this.subscribeRouteChange(() => {
        subscription();

        observer.next();
      });
    });
  }

  /**
   * Return the current active route ENS
   * (https://.../dashboard.evan/dapp1.evan/dapp2.evan => dashboard.evan)
   *
   * @return     {<type>}  The active root ens.
   */
  getActiveRootEns(): string {
    const hash = this.getRouteFromUrl(window.location.hash);

    return hash.split('/')[0] || routing.defaultDAppENS;
  }

  /**
   * return this.getHashParam('address') or Split the current url hash and return the latest path.
   *
   * @return     {<type>}  The stand alone contract identifier.
   */
  getStandAloneContractId(): string {
    let roothash: any = window.location.hash.replace(/\#\//g, '').split('/');
    roothash = roothash[roothash.length - 1];

    return this.getHashParam('address') || roothash;
  }
}
