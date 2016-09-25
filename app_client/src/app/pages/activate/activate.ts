import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

import { AuthService } from '../../common/services/auth';

@Component({
  selector: 'mmw-activate-page',
  templateUrl: 'activate.html'
})
export default class ActivateComponent implements OnInit {
  public pageHeader: Object;
  public emailToken: string;
  public userName: string;
  public activateAlert: Object = { visible: false }; // hidden by default

  constructor(private _authService: AuthService,
              private _route: ActivatedRoute,
              private _router: Router) {
    this.emailToken = _route.snapshot.params['emailToken'];
    this.userName = _route.snapshot.params['userName'];

    this.pageHeader = {
      title: 'Activate',
      strapline: ''
    };
  }

  ngOnInit() {
    this.onActivate();
  }

  onActivate() {
    console.log('Calling activate...');

    this._authService.activate(this.emailToken, this.userName)
    .subscribe(response => {
        console.log('Response');
        console.log(response);
        this.activateAlert = {
          visible: true,
          status: 'success',
          strong : 'Success',
          message: response.message
        };
      },
      err => {
        console.error(err);
        this.activateAlert = {
          visible: true,
          status: 'danger',
          strong : 'Danger',
          message: JSON.parse(err._body).message
        };
      },
      () => console.log('Done')
    );
  }
}
