import {Component, Directive, ElementRef, Input, OnInit} from '@angular/core';
import {Observable} from 'rxjs/Rx';
import {GraphService} from '../_services/graph.service.ts';
import 'rxjs/add/operator/map';

declare var google:any;
declare var googleLoaded:any;

@Component({
  providers: [GraphService]
})

@Directive({
  selector: '[GoogleChart]'
})

export class GoogleChartComponent implements OnInit {
  public _element:any;
  @Input('chartType') public chartType:string;
  @Input('chartOptions') public chartOptions: Object;
  @Input('chartData') public chartData: Object;

  /*TODO: Need to move all reference to candlestick config out of the generic graph component */

  public candlestickDataRefresh = [['Date', 'Trades', 'Open', 'Close', 'High']]; 


	public candlestickOptions = {
		legend: 'none',
    chartArea: {'width': '85%', 'height': '75%'},
		height: 700,
    backgroundColor : '#101010',
		colors: ['#aaaaaa'],
		vAxis: { 
      title :'price (USD)',
      titleTextStyle: {
        color: 'white'
      },
      textStyle: {color: 'white'}
		},
		hAxis: {
      title: 'Time',
      titleTextStyle: {
        color: 'white'
      },
      textStyle: {color: 'white'},
      slantedText: true,  /* Enable slantedText for horizontal axis */
      slantedTextAngle: 90
		},
		candlestick: {
			fallingColor: { strokeWidth: 0, fill: '#a52714' }, // red
			risingColor: { strokeWidth: 0, fill: '#0f9d58' }   // green
		}
	};

  constructor(
    public element: ElementRef,
    private graphService: GraphService) {
      this._element = this.element.nativeElement;
  }

  ngOnInit() {
    google.charts.load('current', {'packages':['corechart']});
		this.graphService.timeIntervalUpdated.subscribe((timeInterval) => {
			this.fetchData();
		});
    this.fetchData();
    setInterval(() =>{
      this.fetchData();

			/*This is just to test out the updating of the service*/
			var config = this.graphService.getConfig();
				this.candlestickOptions.hAxis.title = config["timeInterval"];
      },2500
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
      wrapper.draw();
    }
  }

	fetchData(){
		this.graphService.fetchData(this.chartType)
			.subscribe(
				data => {
					if(data["err"] && data["err"] != ''){
						console.log('An error occured: ', data["err"]);
					} else {
						this.candlestickDataRefresh = [['Date', 'Trades', 'Open', 'Close', 'High']]; 
						for(var index in data){
							if(data[index].low > 0 || data[index].high > 0 || data[index].open > 0 ||  data[index].close > 0){
								this.candlestickDataRefresh.push([data[index].endOfCurrentCandleTime, data[index].low, data[index].open, data[index].close, data[index].high]);
							}
						}
						this.drawGraph(this.candlestickOptions,this.chartType,this.candlestickDataRefresh,this._element)
					}
				},
				err => { console.log('error:', err); }
			);
  }
}
