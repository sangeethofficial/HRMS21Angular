import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-ums-page',
  standalone: true,
  imports: [CommonModule],
  template: `<section class="subpage"><h1>UMS</h1><p>This is the UMS page component.</p></section>`,
  styles: [
    `.subpage{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:1.25rem}h1{margin:0 0 .5rem;font-size:1.2rem}p{margin:0;color:#6b7280}`,
  ],
})
export class UmsPageComponent {}
