import {Directive, ElementRef, Input, OnInit} from '@angular/core';
import {Http, Response, Headers, RequestOptions } from "@angular/http";
import {Observable} from 'rxjs/Rx';
import 'rxjs/add/operator/map';

declare var google:any;
declare var googleLoaded:any;
@Directive({
  selector: '[GoogleChart]'
})

export class GoogleChartComponent implements OnInit {
  public _element:any;
  @Input('chartType') public chartType:string;
  @Input('chartOptions') public chartOptions: Object;
  @Input('chartData') public chartData: Object;

  public candlestickDataRefresh = [['Date', 'Trades', 'Open', 'Close', 'High']]; 

  constructor(
    public element: ElementRef,
    private http: Http) {
    this._element = this.element.nativeElement;
  }

  ngOnInit() {
    setInterval(() =>{
      google.charts.load('current', {'packages':['corechart']});
      this.fetchData();
      },1000
    );
  }

  drawGraph (chartOptions,chartType,chartData,ele) {
    google.charts.setOnLoadCallback(drawChart);
    function drawChart() {
      var wrapper;
      wrapper = new google.visualization.ChartWrapper({
        chartType: chartType,
        dataTable:chartData ,
        options:chartOptions || {},
        containerId: ele.id
      });
      console.log('elementtId:', ele.id);
      wrapper.draw();
    }
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
            this.candlestickDataRefresh = [['Date', 'Trades', 'Open', 'Close', 'High']]; 
            console.log('data:', data);
            for(var index in data){
              this.candlestickDataRefresh.push([data[index].endOfCurrentCandleTime, data[index].low, data[index].open, data[index].close, data[index].high]);
            }
            this.drawGraph(this.chartOptions,this.chartType,this.candlestickDataRefresh,this._element)
          }
        },
				err => { console.log('error:', err); }
			);
  }
}
