import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShowPollsComponent } from './show-polls/show-polls.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ShowPollsComponent], // Import ShowPollsComponent here
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'] // Corrected styleUrls
})
export class AppComponent {
  title = 'feed-app-prototype';
}

