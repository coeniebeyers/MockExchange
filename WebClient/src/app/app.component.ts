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

  public candlestickData = [['Date', 'Trades', 'Open', 'Close', 'High']]; 

  public candlestickOptions = {
      legend: 'none',
      height: 600,
      vAxis: { 
       title :'price (ZAR)'
      },
			hAxis: {
        title: "Time",
        slantedText: true,  /* Enable slantedText for horizontal axis */
        slantedTextAngle: 90
      }
    };

  constructor(
    private http: Http
    ) {
  }

  ngOnInit() {
    this.fetchData();
  }

  fetchData(){
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    this.http.get('http://localhost:3032/getCandleSticks', options)
      .map(response => response.json())
			.subscribe(
				data => {
          if(data["err"] && data["err"] != ''){
            console.log('An error occured: ', data["err"]);
          } else {
            this.candlestickData = [['Date', 'Trades', 'Open', 'Close', 'High']]; 
            console.log('data:', data);
            for(var index in data){
              this.candlestickData.push([data[index].endOfCurrentCandleTime, data[index].low, data[index].open, data[index].close, data[index].high]);
            }
          }
        },
				err => { console.log('error:', err); }
			);


  }

  title = 'Found<sup>e</sup>ry Crypto Exchange';
}

