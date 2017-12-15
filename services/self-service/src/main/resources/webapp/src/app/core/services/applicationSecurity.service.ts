/***************************************************************************

Copyright (c) 2016, EPAM SYSTEMS INC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

****************************************************************************/

import { Injectable, EventEmitter } from '@angular/core';
import { Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';

import { LoginModel } from '../../login/login.model';
import { ApplicationServiceFacade, AppRoutingService } from './';
import { HTTP_STATUS_CODES } from '../util';
import { DICTIONARY } from '../../../dictionary/global.dictionary';

@Injectable()
export class ApplicationSecurityService {
  private accessTokenKey: string = 'access_token';
  private userNameKey: string = 'user_name';
  readonly DICTIONARY = DICTIONARY;

  emitter: BehaviorSubject<any> = new BehaviorSubject<any>('');
  emitter$ = this.emitter.asObservable();

  constructor(
    private serviceFacade: ApplicationServiceFacade,
    private appRoutingService: AppRoutingService
  ) { this.emitter.subscribe(el => console.log(el)) }

  public login(loginModel: LoginModel): Observable<boolean> {
    return this.serviceFacade
      .buildLoginRequest(loginModel.toJsonString())
      .map((response: Response) => {
        if (response.status === HTTP_STATUS_CODES.OK) {
          if (DICTIONARY.cloud_provider === 'azure') {
            this.setAuthToken(response.json().access_token);
            this.setUserName(response.json().username);
          } else {
            this.setAuthToken(response.text());
            this.setUserName(loginModel.username);
          }
          return true;
        }
        return false;
      }, this);
  }

  public logout(): Observable<boolean> {
    const authToken = this.getAuthToken();

    if (!!authToken) {
      return this.serviceFacade
        .buildLogoutRequest()
        .map((response: Response) => {
          this.clearAuthToken();

          return response.status === HTTP_STATUS_CODES.OK;
        }, this);
    }

    return Observable.of(false);
  }

  public getCurrentUserName(): string {
    return localStorage.getItem(this.userNameKey);
  }

  public getAuthToken(): string {
    return localStorage.getItem(this.accessTokenKey);
  }

  public isLoggedIn(): Observable<boolean> {
    const authToken = this.getAuthToken();
    const currentUser = this.getCurrentUserName();

    if (authToken && currentUser) {
      return this.serviceFacade
        .buildAuthorizeRequest(currentUser)
        .map((response: Response) => {
          if (response.status === HTTP_STATUS_CODES.OK)
            return true;

          this.clearAuthToken();
          this.appRoutingService.redirectToLoginPage();
          return false;
        })
        .catch((error: any) => {
          this.handleError(error);
          this.clearAuthToken();

          return Observable.of(false);
        });
    }

    this.appRoutingService.redirectToLoginPage();
    return Observable.of(false);
  }

  public redirectParams(params): Observable<boolean> {

    return this.serviceFacade
      .buildGetAuthToken(params)
      .map((response: any) => {
        const data = response.json();
        if (response.status === HTTP_STATUS_CODES.OK && data.access_token) {
          this.setAuthToken(data.access_token);
          this.setUserName(data.username);

          this.appRoutingService.redirectToHomePage();
          return true;
        }

        if (response.status !== 200) {
          this.handleError(response);
        }
        return false;

      }).catch((error: any) => {

        if (error && error.status === HTTP_STATUS_CODES.FORBIDDEN) {
          window.location.href = error.headers.get('Location');
        }

        this.handleError(error);
        return Observable.of(false);
      });
  }

  private handleError(error: any) {
    let errMsg: string;
    if (typeof error === 'object' && error._body && this.isJson(error._body)) {
      if (error.json().error_message)
        errMsg = error.json().error_message;
    } else if (this.isJson(error._body)) {
      const body = error.json() || '';
      const err = body.error || JSON.stringify(body);
      errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
    } else {
      errMsg = error._body ? error._body : error.toString();
    }

    this.emmitMessage(errMsg);
  }

  private isJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  private emmitMessage(message): void {
    this.appRoutingService.redirectToLoginPage();
    this.emitter.next(message);
  }

  private setUserName(userName): void {
    localStorage.setItem(this.userNameKey, userName);
  }

  private setAuthToken(accessToken): void {
    const encodedToken = accessToken;
    localStorage.setItem(this.accessTokenKey, encodedToken);
  }

  private clearAuthToken(): void {
    localStorage.removeItem(this.accessTokenKey);
  }
}
