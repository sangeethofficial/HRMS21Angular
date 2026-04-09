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
    console.log('Attempting login with:', credentials);
    return this.http.post(this.apiUrl, credentials).pipe(
      tap((response: any) => {
        console.log('Login response received:', response);
        // Try to find the token in common property names
        const token = response?.token || response?.accessToken || response?.data?.token || response?.data?.accessToken;
        
        if (token) {
          console.log('Token found, setting cookie...');
          CookieUtility.setCookie(this.COOKIE_NAME, token, 7);
        } else {
          console.warn('No token found in response! Response keys:', response ? Object.keys(response) : 'null');
        }
      })
    );
  }

  isLoggedIn(): boolean {
    const token = CookieUtility.getCookie(this.COOKIE_NAME);
    console.log('Checking login status. Token found:', !!token);
    return !!token;
  }

  logout() {
    CookieUtility.eraseCookie(this.COOKIE_NAME);
  }

  getToken(): string | null {
    return CookieUtility.getCookie(this.COOKIE_NAME);
  }
}
