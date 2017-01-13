import { Component, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { GoogleChartComponent } from './google-chart/google-chart.component';
import { LoginComponent } from './login/login.component';
import { Http, Response, Headers, RequestOptions } from "@angular/http";
import { Observable } from 'rxjs/Rx';
import { GraphService } from './_services/graph.service.ts';
import { AuthenticationService } from './_services/authentication.service.ts';
import { ComponentsHelper } from 'ng2-bootstrap';
import 'rxjs/add/operator/map';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [GraphService, AuthenticationService]
})

export class AppComponent {
  private asks = [];
  private bids = [];
  private lastTradePrice = 0.00;
  private lastTradeAmount = 0.00;
  private timeInterval = '1 minute';
  private isLoggedIn = false;
  private isLoggedOut = true;
	private viewContainerRef: ViewContainerRef;

	@ViewChild('lgModal') lgModal;

  constructor(
    private http: Http,
    private graphService: GraphService,
    private authenticationService: AuthenticationService,
    private componentsHelper: ComponentsHelper, 
    private vcr: ViewContainerRef
    ) {
		componentsHelper.setRootViewContainerRef(vcr);
  }

  ngOnInit() {
		this.graphService.setConfigValue("timeInterval", this.timeInterval);
		this.authenticationService.userLoggedIn.subscribe((user) => {
      console.log('new user has just logged in', user);
      this.login();
		});
    this.fetchData();
    setInterval(() =>{
      this.fetchData();
      },500
    );
  }

  getLastTrade(headers, options){
    this.http.get('http://localhost:3033/getlasttrade')
      .map(response => response.json())
			.subscribe(
				data => {
          if(data["err"] && data["err"] != ''){
            console.log('An error occured: ', data["err"]);
          } else {
            this.lastTradePrice = data["price"];
            this.lastTradeAmount = data["amount"];
          }
        },
				err => { console.log('error:', err); }
			);
  }

  getBidsAndAsks(headers, options){
    this.http.get('http://localhost:3033/getbidsandasks')
      .map(response => response.json())
			.subscribe(
				data => {
          if(data["err"] && data["err"] != ''){
            console.log('An error occured: ', data["err"]);
          } else {
            var tmpAsks = data["asks"];
            tmpAsks.reverse();
            this.asks = tmpAsks;
            this.bids = data["bids"];
          }
        },
				err => { console.log('error:', err); }
			);
  }

  fetchData(){
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    this.getBidsAndAsks(headers, options);
    this.getLastTrade(headers, options);
  }

  updateTimeInterval(timeInterval){
		this.timeInterval = timeInterval;
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    let body = JSON.stringify({
      'timeInterval' : this.timeInterval
    });
    this.http.post('http://localhost:3032/updateTimeInterval', body, options)
      .map(response => response.json())
      .subscribe(
        data => {
					this.graphService.setConfigValue("timeInterval", this.timeInterval);
        },
        err => { 
          console.log(err.Message);
        }
      );

  }

  login(){
    this.isLoggedIn = true;
    this.isLoggedOut = false;
		this.lgModal.hide();
  }

  logOut(){
    this.isLoggedIn = false;
    this.isLoggedOut = true;
  }

  title = 'Found<sup>e</sup>ry Crypto Exchange';
}

