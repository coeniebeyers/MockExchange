import { BrowserModule } from '@angular/platform-browser';
import { NgModule} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { GoogleChartComponent } from './google-chart/google-chart.component';

@NgModule({
  declarations: [
    AppComponent,
    GoogleChartComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  providers: [ 
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
