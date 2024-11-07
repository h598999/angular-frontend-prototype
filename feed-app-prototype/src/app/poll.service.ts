import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PollService {

  private apiUrl = 'http://localhost:8080/api/polls';

  constructor(private http: HttpClient){}


  getPoll(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getPolls(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
