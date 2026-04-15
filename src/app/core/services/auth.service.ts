import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CookieUtility } from '../utils/cookie.utility';

export interface HrmsSession {
  userId: number;
  role: string;
  isSuperAdmin: boolean;
}

const SESSION_KEY = 'hrms_session';
const COOKIE_NAME = 'auth_token';

function apiBase(): string {
  const e = environment as { apiBaseUrl?: string; apiUrl?: string };
  return e.apiBaseUrl ?? e.apiUrl ?? '';
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function toNumberId(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return 0;
}

function userIdFromClaims(claims: Record<string, unknown>): number {
  const claimKeys = [
    'sub',
    'userId',
    'user_id',
    'nameid',
    'name_id',
    'id',
    'uid',
    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
  ];
  for (const key of claimKeys) {
    const id = toNumberId(claims[key]);
    if (id > 0) return id;
  }
  return 0;
}

function extractSessionFromLoginResponse(response: unknown, token: string | null): HrmsSession {
  const root = response && typeof response === 'object' ? (response as Record<string, unknown>) : {};
  const data =
    root['data'] && typeof root['data'] === 'object'
      ? (root['data'] as Record<string, unknown>)
      : root;

  let userId = pickUserId(data, root);
  let role = pickRole(data, root);

  if (token) {
    const claims = decodeJwtPayload(token);
    if (claims) {
      if (!userId) {
        userId = userIdFromClaims(claims);
      }
      if (!role) {
        const cr =
          claims['role'] ??
          claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
        if (typeof cr === 'string') role = cr;
        else if (Array.isArray(cr) && cr.length) role = String(cr[0]);
      }
    }
  }

  const isSuperAdmin =
    /super\s*admin/i.test(role) ||
    data['isSuperAdmin'] === true ||
    root['isSuperAdmin'] === true ||
    data['userType'] === 'SuperAdmin' ||
    data['userType'] === 'Superadmin';

  return {
    userId: userId || 0,
    role: role || 'User',
    isSuperAdmin,
  };
}

function pickUserId(data: Record<string, unknown>, root: Record<string, unknown>): number {
  const keys = [
    'userId',
    'userID',
    'id',
    'employeeId',
    'employeeID',
    'empId',
  ];
  for (const k of keys) {
    const v = data[k] ?? root[k];
    if (typeof v === 'number' && !Number.isNaN(v)) return v;
    if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  }
  const user = data['user'] ?? root['user'];
  if (user && typeof user === 'object') {
    const u = user as Record<string, unknown>;
    const id = u['id'] ?? u['userId'];
    if (typeof id === 'number' && !Number.isNaN(id)) return id;
    if (typeof id === 'string' && !Number.isNaN(Number(id))) return Number(id);
  }
  return 0;
}

function pickRole(data: Record<string, unknown>, root: Record<string, unknown>): string {
  const keys = ['role', 'userRole', 'roleName', 'roleType'];
  for (const k of keys) {
    const v = data[k] ?? root[k];
    if (typeof v === 'string' && v.length) return v;
  }
  return '';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${apiBase()}/auth/login`;

  login(credentials: unknown): Observable<unknown> {
    return this.http.post(this.apiUrl, credentials).pipe(
      tap((response: unknown) => {
        const token =
          (response as { token?: string })?.token ??
          (response as { accessToken?: string })?.accessToken ??
          (response as { data?: { token?: string } })?.data?.token ??
          (response as { data?: { accessToken?: string } })?.data?.accessToken;

        if (token) {
          CookieUtility.setCookie(COOKIE_NAME, token, 7);
        }

        const session = extractSessionFromLoginResponse(response, token ?? null);
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch {
          /* ignore */
        }
      }),
    );
  }

  isLoggedIn(): boolean {
    return !!CookieUtility.getCookie(COOKIE_NAME);
  }

  logout(): void {
    CookieUtility.eraseCookie(COOKIE_NAME);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }

  getToken(): string | null {
    return CookieUtility.getCookie(COOKIE_NAME);
  }

  /** If the user refreshed the page, restore role/userId from the JWT when sessionStorage is empty. */
  hydrateSessionFromToken(): void {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      return;
    }
    const token = this.getToken();
    if (!token) return;
    const claims = decodeJwtPayload(token);
    if (!claims) return;

    const userId = userIdFromClaims(claims);

    let role = '';
    const cr =
      claims['role'] ??
      claims['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    if (typeof cr === 'string') role = cr;
    else if (Array.isArray(cr) && cr.length) role = String(cr[0]);

    const isSuperAdmin =
      /super\s*admin/i.test(role) ||
      claims['isSuperAdmin'] === true ||
      claims['userType'] === 'SuperAdmin';

    try {
      sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ userId, role: role || 'User', isSuperAdmin }),
      );
    } catch {
      /* ignore */
    }
  }

  getSession(): HrmsSession | null {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as HrmsSession;
    } catch {
      return null;
    }
  }

  getCurrentUserId(): number | null {
    const id = this.getSession()?.userId ?? this.getUserIdFromToken();
    return id && id > 0 ? id : null;
  }

  private getUserIdFromToken(): number {
    const token = this.getToken();
    if (!token) return 0;
    const claims = decodeJwtPayload(token);
    if (!claims) return 0;
    return userIdFromClaims(claims);
  }

  isSuperAdmin(): boolean {
    return this.getSession()?.isSuperAdmin === true;
  }
}
