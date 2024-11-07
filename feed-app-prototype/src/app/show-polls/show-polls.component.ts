import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PollService } from '../poll.service';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-show-polls',
  templateUrl: './show-polls.component.html',
  standalone: true,
  imports: [CommonModule, HttpClientModule], // Import necessary modules
  styleUrls: ['./show-polls.component.css'] // Corrected styleUrls
})
export class ShowPollsComponent {
  polls: any[] = [];

  constructor(private pollService: PollService) {}

  ngOnInit(): void {
    this.loadPolls();
  }

  loadPolls(): void {
    this.pollService.getPolls().subscribe({
      next: (data) => {
        this.polls = data;
      },
      error: (error) => {
        console.error('Failed to load polls', error);
      }
    });
  }
}

