import { Component } from '@angular/core';
import { ShowAllPollsComponent } from './show-all-polls/show-all-polls.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShowAllPollsComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'feed-app-prototype';
}
