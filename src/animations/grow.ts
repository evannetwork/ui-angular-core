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
  animate,
  AnimationEntryMetadata,
  style,
  transition,
  trigger,
} from 'angular-libs';

/**
 * Creates an new grow transition Angular 5 trigger animation
 * Can be used within the component creation
 * @Component({
 *   ...
 *   animations: [
 *     createGrowTransition(),
 *   ]
 * })
 * 
 * <div *ngIf="**" [@growTransition]></div>
 *
 * @return     {AnimationEntryMetadata}  returns the grow transition
 */
const createGrowTransition: AnimationEntryMetadata = function() {
  return trigger('growTransition', [
    transition(':enter', [
      style({ height: 0, 'min-height': 0 }),
      animate('200ms', style({ height: '{{height}}' }))
    ]),
    transition(':leave', [
      style({ }),
      animate('200ms', style({ height: 0, 'min-height': 0 }))
    ])
  ])
}

export {
  createGrowTransition
}
