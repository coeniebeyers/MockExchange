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
    this.loading = true;
    this.authenticationService.login(this.model.username, this.model.password)
      .subscribe(
        data => {
          console.log('currentUser: ', localStorage.getItem('currentUser'));
          //this.router.navigate([this.returnUrl]);
        },
        error => {
          this.alertService.error(error);
          this.loading = false;
        });
  }
}
