import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {

  private apiUrl = 'http://localhost:3000/appointments';
  private apiUrl2 = 'http://localhost:3000';
  private queueApiUrl = 'http://localhost:3000';
  constructor(private http: HttpClient) {}

  getAppointments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/web`).pipe(
      catchError(error => {
        console.error('Error fetching appointments:', error);
        return throwError(error);
      })
    );
  }

  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getAppointmentDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/details/${id}`);
  }
  createAppointmentStatus(data: any): Observable<any> {
    return this.http.post<any>('http://localhost:3000/create-appointment-status', data);
  }
  getConfirmedAppointments(): Observable<any[]> {
    return this.http.get<any[]>('http://localhost:3000/appointments/web2');
  }
  getAppointmentDetails2(id: number): Observable<any> {
    return this.http.get<any>(`http://localhost:3000/appointments/details2/${id}`);
  }
  deleteAppointmentStatus(id: number): Observable<void> {
    return this.http.delete<void>(`http://localhost:3000/appointment-status/${id}`);
  }

  updateQueueLimit(programName: string, maxQueue: number): Observable<any> {
    return this.http.put(`${this.queueApiUrl}/queue-limit/${programName}`, { maxQueue });
  }

  getQueueLimits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.queueApiUrl}/queue-limits`);
  }


}
