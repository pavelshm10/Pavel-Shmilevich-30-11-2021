import { catchError, of, switchMap } from "rxjs";
import { GetHome, GetCurrentWeather, GetHomeSuccess, GetCurrentWeatherSuccess, HomeActionTypes, GetWeekWeather, GetWeekWeatherSuccess, GetHomeFailure, GetCurrentLocation, GetCurrentLocationSuccess, GetCurrentLocationFailure } from "./home.actions";
import { HttpClient } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { Actions,Effect, ofType } from "@ngrx/effects";
import { map } from "rxjs/operators";
import { Injectable } from "@angular/core";
import { SharedService } from "src/app/shared/services/shared.service";

@Injectable({
    providedIn: 'root',
  })

export class HomeEffects {
    errorMsg: string='';
    isCelsius: boolean=true;
    constructor(
        private actions$: Actions,
        private httpClient: HttpClient,
        private sharedService: SharedService
      ) {}
    
    @Effect()
    getHome$ = this.actions$.pipe(
      ofType(HomeActionTypes.GetHome),
      map((action) => (action as GetHome).payload),
      switchMap((payload) => {
        return this.httpClient
        .get(
          `${environment.baseServerUrl}/locations/v1/cities/autocomplete?apikey=${environment.apikey}&q=${payload.searchText}&languge=en-us`,
        )
        .pipe(
          map((response: any) => {
              if(response.length>0){
                return new GetHomeSuccess({
                    key:response[0].Key,
                    cityName: response[0].AdministrativeArea.LocalizedName
                });
              } else{
                return new GetHomeFailure();
              }
          }),
          catchError(error => {
            console.log("error ",error)
            if (error.error instanceof ErrorEvent) {
                this.errorMsg = `Error: ${error.error.message}`;
            } else {
                this.errorMsg = `Error: ${error.message}`;
            }
            return of([]);
        })
        );
      }),
    );    

    @Effect()
    getCurrentWeather$ = this.actions$.pipe(
      ofType(HomeActionTypes.GetCurrentWeather),
      map((action) => (action as GetCurrentWeather).payload),
      switchMap((payload) => {
        return this.httpClient
        .get(
          `${environment.baseServerUrl}/currentconditions/v1/${payload.key}?apikey=${environment.apikey}&languge=en-us&details=false`,
        )
        .pipe(
          map((response: any) => {
            this.isCelsius=this.sharedService.getTempratureType();
            return new GetCurrentWeatherSuccess({
              celsiusWeather: response[0].Temperature.Metric.Value,
              fahrenheitWeather: response[0].Temperature.Imperial.Value,
              weatherText: response[0].WeatherText
            });
          }),
          catchError(error => {
            console.log("error ",error)
            if (error.error instanceof ErrorEvent) {
                this.errorMsg = `Error: ${error.error.message}`;
            } else {
                this.errorMsg = `Error: ${error.message}`;
            }
            return of([]);
        })
        );
      }),
    );

    @Effect()
    getWeekWeather$ = this.actions$.pipe(
      ofType(HomeActionTypes.GetWeekWeather),
      map((action) => (action as GetWeekWeather).payload),
      switchMap((payload) => {
        this.isCelsius=this.sharedService.getTempratureType();
        return this.httpClient
        .get(
          `${environment.baseServerUrl}/forecasts/v1/daily/5day/${payload.key}?apikey=${environment.apikey}&languge=en-us&details=false&metric=${this.isCelsius}`,
        )
        .pipe(
          map((response: any) => {
            return new GetWeekWeatherSuccess({
              weekWeather: response.DailyForecasts
            });
          }),
          catchError(error => {
            console.log("error ",error)
            if (error.error instanceof ErrorEvent) {
                this.errorMsg = `Error: ${error.error.message}`;
            } else {
                this.errorMsg = `Error: ${error.message}`;
            }
            return of([]);
        })
        );
      }),
    );

    @Effect()
    getCuurentLocation$ = this.actions$.pipe(
      ofType(HomeActionTypes.GetCurrentLocation),
      map((action) => (action as GetCurrentLocation).payload),
      switchMap((payload) => {
        return this.httpClient
        .get(
          `${environment.baseServerUrl}/locations/v1/cities/geoposition/search?apikey=${environment.apikey}&q=${payload.lat}%2C${payload.lon}&languge=en-us&details=false&toplevel=false`,
        )
        .pipe(
          map((response: any) => {
              if(response){
                return new GetCurrentLocationSuccess({
                    key:response.Key,
                    cityName: response.LocalizedName
                });
              } else{
                return new GetCurrentLocationFailure();
              }
          }),
          catchError(error => {
            console.log("error ",error)
            if (error.error instanceof ErrorEvent) {
                this.errorMsg = `Error: ${error.error.message}`;
            } else {
                this.errorMsg = `Error: ${error.message}`;
            }
            return of([]);
        })
        );
      }),
    ); 
}

