import {Component, OnInit } from '@angular/core';
import {GoogleChartComponent} from './google-chart/google-chart.component';
import {Http, Response, Headers, RequestOptions } from "@angular/http";
import {Observable} from 'rxjs/Rx';
import 'rxjs/add/operator/map';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  private asks = [];
  private bids = [];

  constructor(
    private http: Http
    ) {
  }

  ngOnInit() {
    this.fetchData();
    setInterval(() =>{
      this.fetchData();
      },2500
    );
  }

  fetchData(){
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
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

  title = 'Found<sup>e</sup>ry Crypto Exchange';
}

