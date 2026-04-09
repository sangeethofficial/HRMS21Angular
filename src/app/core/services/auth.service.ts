import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CookieUtility } from '../utils/cookie.utility';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiBaseUrl}/auth/login`;
  private readonly COOKIE_NAME = 'auth_token';

  login(credentials: any): Observable<any> {
    return this.http.post(this.apiUrl, credentials).pipe(
      tap((response: any) => {
        if (response && response.token) {
          CookieUtility.setCookie(this.COOKIE_NAME, response.token, 7); // Store for 7 days
        }
      })
    );
  }

  isLoggedIn(): boolean {
    return !!CookieUtility.getCookie(this.COOKIE_NAME);
  }

  logout() {
    CookieUtility.eraseCookie(this.COOKIE_NAME);
  }

  getToken(): string | null {
    return CookieUtility.getCookie(this.COOKIE_NAME);
  }
}
