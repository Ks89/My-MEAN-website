import {EventEmitter, Injectable} from '@angular/core';
import { Http } from '@angular/http';
import { Headers, RequestOptions } from '@angular/http';

import {Observable} from 'rxjs/Observable';
import {forkJoin} from 'rxjs/observable/forkJoin';
import {of} from 'rxjs/observable/of';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/reduce';

import {LocalStorage, SessionStorage} from "h5webstorage";

@Injectable()
export class AuthService {
  private headers = new Headers({ 'Content-Type': 'application/json' });
  private options = new RequestOptions({ headers: this.headers });

  loginEvent: EventEmitter<any> = new EventEmitter();

  constructor(private http: Http,
    private localStorage: LocalStorage,
    private sessionStorage: SessionStorage) {}

  //----------------------------------------------------------
  //------------------ local authentication ------------------
  //----------------------------------------------------------

  login(user: any): Observable<any> {
    return this.http.post('/api/login', user, this.options)
    .map(response => {
      this.sessionStorage.setItem('auth', response.json().token);
      return response.json();
    }).map(res => {
      // this.loginStatus = res;
      console.log('Result is: ' + res);
      return res;
    }); //on error removeToken('auth');
  }

  register(user: any): Observable<any> {
    return this.http.post('/api/register', user, this.options)
    .map(response => {
      // saveToken('auth', data.token);
      this.sessionStorage.setItem('auth', response.json().token);
      return response.json();
    }); //on error removeToken('auth');
  }

  reset(emailToken: any, newPassword: any): Observable<any> {
    let data = {
      newPassword : newPassword,
      emailToken : emailToken
    };
    return this.http.post('/api/resetNewPassword', data, this.options)
    .map(response => {
      // saveToken('auth', data.token);
      this.sessionStorage.setItem('auth', response.json().token);
      return response.json();
    });
  }

  forgot(email: any): Observable<any> {
    return this.http.post('/api/reset', { email : email}, this.options)
    .map(response => response.json());
  }

  activate(emailToken: string, userName: string): Observable<any> {
    let data = {
      emailToken : emailToken,
      userName : userName
    };
    return this.http.post('/api/activateAccount', data, this.options)
    .map(response => response.json());
  }

  unlink(serviceName: string): Observable<any> {
    console.log("Called unlink " + serviceName);
    return this.http.get(`/api/unlink/${serviceName}`)
    .map(response => response.json());
  };

  isAuthLocalLoggedIn(): Observable<any> {
    console.log("isAuthLocalLoggedIn - reading token: ");
    return this.getUserFromSessionStorage('auth');
  }

  //-----------------------------
  //--- 3dauth authentication ---
  //-----------------------------
  isAuth3dLoggedIn(): Observable<any> {
    console.log("isAuth3dLoggedIn - reading token: ");
    return this.getUserFromSessionStorage('auth');
  }



  //---------------------------------------
  //--- local and 3dauth authentication ---
  //---------------------------------------
  //function to call the /users/:id REST API
  getUserById(id: string): Observable<any> {
    return this.http.get(`/api/users/${id}`)
    .map(response => response.json());
  };

  logout(): Observable<any> {
    console.log("Called authentication logout");
    this.sessionStorage.removeItem('auth');

    //call REST service to remove session data from redis
    return this.http.get('/api/logout')
    .map(response => response.json());
  }

  isLoggedIn(): Observable<any> {
    // return Observable.forkJoin(
    //   [this.isAuthLocalLoggedIn(),
    //     this.isAuth3dLoggedIn()]
    // ).reduce((acc, x: boolean) => acc || x, false)
    //TODO FIXME remove isAuth3dLoggedIn and rename isAuthLocalLoggedIn to isAuthLoggedIn
    return this.isAuthLocalLoggedIn()
    .map(res => {
      // this.loginStatus = res;
      console.log('Result is: ');
      console.log(res);
      return res;
    });
  }

  getTokenRedis(): Observable<any> {
    return this.http.get('/api/sessionToken')
    .map(response => response.json());
  }

  decodeJwtToken(jwtToken: string): Observable<any> {
    //TODO add an if(jwtToken) or something like that
    return this.http.get(`/api/decodeToken/${jwtToken}`)
    .map(response => response.json());
  }

  //-----------------------------------
  //--- others functions - not exposed
  //-----------------------------------
  //it uses the sessionStorage's jwt token as parameter of decodeJwtToken rest service
  //to be able to return the decoded json user
  getUserFromSessionStorage(key: string): Observable<any> {
    console.log("getUserByToken called method");
    console.log("sessionStorage: ");
    console.log(this.sessionStorage.getItem(key));
    var sessionToken = this.sessionStorage.getItem(key);
    if(sessionToken) {
      console.log("getUserByToken sessionToken " + sessionToken);
      return this.decodeJwtToken(sessionToken);
    } else {
      console.log("getUserByToken sessionToken null or empty");
      return Observable.create(observer => observer.complete());
    }
  }

  getLoggedUser(): Observable<any> {
    return this.getUserFromSessionStorage('auth')
    .map(res => {
      if(res == null || res === 'invalid-data') {
        this.sessionStorage.removeItem('auth');
        //TODO remove session data with logout
        console.log('INVALID DATA !!!!');
        // return Observable.throw(new Error('Invalid data!'));
        return "INVALID DATA";
      } else {
        var userData = JSON.parse(res);
        console.log(userData);
        var user = userData.user;
        console.log(user);
        return user;
      }
    });
  }

  // getLoggedUser(): Observable<any>|void {
  //
  //   this.getUserFromSessionStorage('auth').subscribe(
  //     result => {
  //       console.log(result);
  //
  //       this.decodeJwtToken(result).map(
  //         value => {
  //           if(value !== null && value === 'invalid-data') {
  //             this.sessionStorage.removeItem('auth');
  //             //TODO remove session data with logout
  //             console.log('INVALID DATA !!!!');
  //             return null;
  //           }
  //           if(value) {
  //             var userData = JSON.parse(value);
  //             console.log(userData);
  //             var user = userData.user;
  //             console.log(user);
  //             return value;
  //           } else {
  //             this.sessionStorage.removeItem('auth');
  //             //TODO remove session data with logout
  //             console.log('INVALID DATA !!!!');
  //             return null;
  //           }
  //         }
  //       )
  //     },err => {
  //       console.error(err);
  //       return err;
  //     },() => {
  //       console.log("done");
  //     }
  //   );
  // }
}
