import { Component } from '@angular/core';
import { AlertService, AuthenticationService } from '../_services/index';

@Component({
  selector: 'my-login-component',
  templateUrl: 'login.component.html'
})

export class LoginComponent {
  model: any = {};
  loading: boolean = false;

  constructor(
    private authenticationService: AuthenticationService,
    private alertService: AlertService
  ){}

  login() {
    console.log('login clicked');
    this.loading = true;
    this.authenticationService.login(this.model.username, this.model.password)
      .subscribe(
        data => {
          //this.router.navigate([this.returnUrl]);
          console.log('login result: ', data);
        },
        error => {
          this.alertService.error(error);
          this.loading = false;
        });
  }
}
