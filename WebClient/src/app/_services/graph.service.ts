import {Injectable, EventEmitter} from '@angular/core';
import {Http, Response, Headers, RequestOptions } from "@angular/http";

@Injectable()
export class GraphService {
  public timeIntervalUpdated = new EventEmitter();

	private config = {};
  private chartTypeToUrlMapping = [];

  constructor(private http: Http){
		this.chartTypeToUrlMapping['CandlestickChart'] = 'http://localhost:3032/getCandleSticks';
  }

	setConfigValue(name, value) {
			this.config[name] = value;
		if(name=='timeInterval'){
			this.timeIntervalUpdated.emit(value);
		}
	}

	getConfig() {
			return this.config;
	}

  fetchData(chartType){
    let headers = new Headers({ 'Content-Type': 'application/json' });
    let options = new RequestOptions({ headers: headers });
    return this.http.get(this.chartTypeToUrlMapping[chartType], options)
      .map(response => response.json());
  }

}
