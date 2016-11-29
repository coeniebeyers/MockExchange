import {Component, OnInit } from '@angular/core';
import {GoogleChartComponent} from './google-chart/google-chart.component';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public candlestickData = [ 
      ['Day', 'Trades', 'Open', 'Close', 'High'],
      ['1', 20, 28, 38, 45],
      ['2', 31, 38, 55, 66],
      ['3', 50, 55, 77, 80],
      ['4', 77, 77, 66, 50],
      ['5', 31, 38, 55, 66],
      ['6', 50, 55, 77, 80],
      ['7', 31, 38, 55, 66],
      ['8', 50, 55, 77, 80],
      ['9', 77, 79, 86, 90],
      ['10', 67, 87, 88, 99],
      ['11', 77, 89, 94, 102],
      ['12', 60, 93, 70, 99],
      ['13', 50, 55, 77, 80],
      ['14', 77, 77, 66, 50],
      ['15', 31, 38, 55, 66],
      ['16', 50, 55, 77, 80],
      ['17', 31, 38, 55, 66],
      ['18', 50, 55, 77, 80],
      ['19', 77, 77, 66, 50],
      ['20', 77, 77, 66, 50],
      ['21', 68, 66, 22, 15]];

  public candlestickOptions = {
      legend:'none',
      height:600,
      vAxis: { 
         title :'price (ZAR)',
         gridlines: { count: 7 } 
              },
    };


  constructor() {
  }

  ngOnInit() {

  }
  title = 'app works!';
}

